import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const repairRequest = await db.repairRequest.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          landlord: true,
        },
      },
      initiator: true,
    },
  });

  if (!repairRequest) {
    throw new Response("Not Found", { status: 404 });
  }

  // Check if user is the tenant
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();
  if (!isTenant) {
    throw new Response("Only the tenant can withdraw the request", { status: 403 });
  }

  // Verify request is in PENDING status
  if (repairRequest.status !== "PENDING") {
    return json(
      { error: "Can only withdraw pending requests" },
      { status: 400 }
    );
  }

  try {
    // Return success without updating the database
    // The database will be updated after blockchain confirmation
    return json({ success: true });
  } catch (error) {
    console.error('Error withdrawing repair request:', error);
    return json(
      { error: "Failed to withdraw repair request" },
      { status: 500 }
    );
  }
}
