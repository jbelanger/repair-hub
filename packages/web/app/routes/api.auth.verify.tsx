import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { checkLoginRateLimit, createUserSession } from "~/utils/session.server";
import { toChecksumAddress, toHexString, type Address } from "~/utils/blockchain/types";
import { recoverMessageAddress } from "viem";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const address = formData.get("address") as string;
  const message = formData.get("message") as string;
  const signature = formData.get("signature") as string;

  if (!address || !message || !signature) {
    return json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const checksumAddress = toChecksumAddress(address);

  // Check rate limiting
  if (!checkLoginRateLimit(checksumAddress)) {
    return json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    // Convert signature to hex string and verify
    const hexSignature = toHexString(signature);
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: hexSignature,
    });

    if (recoveredAddress.toLowerCase() !== checksumAddress.toLowerCase()) {
      return json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Find or create user
    const user = await db.user.findUnique({
      where: { address: checksumAddress.toLowerCase() }
    });

    if (!user) {
      return json(
        { error: "No account found. Please sign up first." },
        { status: 404 }
      );
    }

    // Create session
    return createUserSession(user.id, "/dashboard");
  } catch (error) {
    console.error("Verification error:", error);
    return json(
      { error: "Failed to verify signature" },
      { status: 500 }
    );
  }
}
