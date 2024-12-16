import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { toChecksumAddress } from "~/utils/blockchain/types";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    let address: string | null = null;
    const contentType = request.headers.get("content-type");

    // Handle both JSON and form data
    if (contentType?.includes("application/json")) {
      const body = await request.json();
      address = body.address;
    } else {
      const formData = await request.formData();
      address = formData.get("address") as string;
    }

    if (!address) {
      return json({ error: "Address is required" }, { status: 400 });
    }

    // Format address to match database format (lowercase)
    const formattedAddress = toChecksumAddress(address).toLowerCase();
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { address: formattedAddress },
      select: { id: true }
    });

    return json({ exists: !!user });
  } catch (error) {
    console.error("Error checking user:", error);
    return json(
      { error: "Failed to check user" },
      { status: 500 }
    );
  }
}
