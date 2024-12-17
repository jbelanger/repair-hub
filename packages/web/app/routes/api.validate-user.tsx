import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { createUserSession } from "~/utils/session.server";
import { toChecksumAddress } from "~/utils/blockchain/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return json({ exists: false, role: null });
  }

  const checksumAddress = toChecksumAddress(address);
  const user = await db.user.findUnique({
    where: { address: checksumAddress },
    select: { role: true }
  });

  return json({
    exists: !!user,
    role: user?.role || null
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const address = formData.get("address") as string;
  const redirectTo = formData.get("redirectTo") as string || "/dashboard";

  if (!address) {
    return json({ success: false, error: "Address is required" });
  }

  const checksumAddress = toChecksumAddress(address);
  const user = await db.user.findUnique({
    where: { address: checksumAddress },
    select: { id: true, role: true }
  });

  if (!user) {
    return json({ success: false, error: "User not found" });
  }

  // Create a session using our simplified session management
  return createUserSession(user.id, redirectTo);
}
