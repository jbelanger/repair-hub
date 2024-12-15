import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { sessionStorage } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address")?.toLowerCase();

  if (!address) {
    return json({ exists: false, role: null });
  }

  const user = await db.user.findUnique({
    where: { address },
    select: { role: true }
  });

  return json({
    exists: !!user,
    role: user?.role || null
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const address = (formData.get("address") as string)?.toLowerCase();

  if (!address) {
    return json({ success: false, error: "Address is required" });
  }

  const user = await db.user.findUnique({
    where: { address },
    select: { id: true, role: true }
  });

  if (!user) {
    return json({ success: false, error: "User not found" });
  }

  // Create a session for the existing user
  const session = await sessionStorage.getSession();
  session.set("userId", user.id);

  return json(
    { success: true, role: user.role },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    }
  );
}
