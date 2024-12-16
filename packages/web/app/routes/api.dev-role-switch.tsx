import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { getUserFromSession, createUserSession } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    throw new Response("Not Found", { status: 404 });
  }

  const user = await getUserFromSession(request);
  if (!user) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const role = formData.get("role") as "LANDLORD" | "TENANT";

  if (!role || !["LANDLORD", "TENANT"].includes(role)) {
    return json({ error: "Invalid role" }, { status: 400 });
  }

  // Update user role
  await db.user.update({
    where: { id: user.id },
    data: { role }
  });

  // Get the redirect URL and append the roleSwitched parameter
  const redirectTo = request.headers.get("Referer") || "/";
  const url = new URL(redirectTo);
  url.searchParams.set("roleSwitched", "true");

  // Create a new session with updated user data and redirect back
  return createUserSession(user.id, url.toString());
}
