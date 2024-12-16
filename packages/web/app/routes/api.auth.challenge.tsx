import { json, type ActionFunctionArgs } from "@remix-run/node";
import { generateChallengeMessage } from "~/utils/session.server";
import { toChecksumAddress, type Address } from "~/utils/blockchain/types";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { address } = await request.json();
    if (!address) {
      return json({ error: "Address is required" }, { status: 400 });
    }

    const checksumAddress = toChecksumAddress(address);
    const message = await generateChallengeMessage(checksumAddress);

    return json({ message });
  } catch (error) {
    console.error("Challenge generation error:", error);
    return json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
