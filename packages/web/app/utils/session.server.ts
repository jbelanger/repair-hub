import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "./db.server";
import { type Address, toChecksumAddress } from "./blockchain/types";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
});

export async function findOrCreateUser(address: Address) {
  const checksumAddress = toChecksumAddress(address);
  const user = await db.user.findUnique({
    where: { address: checksumAddress },
  });
  
  if (!user) {
    // Return null if user doesn't exist - they'll need to register
    return null;
  }
  
  return user;
}

export async function createUserSession(
  userId: string,
  redirectTo: string,
  remember: boolean = false
) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  
  const maxAge = remember 
    ? 60 * 60 * 24 * 7 // 1 week
    : 60 * 60 * 24; // 1 day

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge
      }),
    },
  });
}

export async function getUserFromSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const userId = session.get("userId");
  if (!userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        address: true,
        role: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (user) {
      // Ensure address is in checksum format
      user.address = toChecksumAddress(user.address);
    }

    return user;
  } catch (error) {
    // If there's a database error, destroy the session
    await sessionStorage.destroySession(session);
    return null;
  }
}

export async function requireUser(request: Request, options: { 
  roles?: string[]
} = {}) {
  const user = await getUserFromSession(request);
  
  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  // Check if user has required role
  if (options.roles && !options.roles.includes(user.role)) {
    throw redirect('/unauthorized');
  }
  
  return user;
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
