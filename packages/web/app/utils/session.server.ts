import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "./db.server";

// This would normally come from environment variables
const sessionSecret = "your-secret-key";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function createUserSession(
  userId: string,
  redirectTo: string
) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserFromSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const userId = session.get("userId");
  if (!userId) return null;

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

  return user;
}

export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);
  
  if (!user) {
    // Instead of redirecting with a query parameter, redirect to register
    throw redirect("/register");
  }
  
  return user;
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
