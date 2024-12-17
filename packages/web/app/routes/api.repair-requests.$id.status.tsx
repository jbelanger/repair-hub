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

  // Check if user has access to this repair request
  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

  if (!isLandlord && !isTenant) {
    throw new Response("Unauthorized", { status: 403 });
  }

  // Only allow status updates from landlord
  if (!isLandlord) {
    throw new Response("Only the landlord can update the status", { status: 403 });
  }

  const { status } = await request.json();
  if (!status) {
    return json({ error: "Status is required" }, { status: 400 });
  }

  try {
    // Update the repair request status
    const updatedRequest = await db.repairRequest.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return json({ success: true, repairRequest: updatedRequest });
  } catch (error) {
    console.error('Error updating repair request status:', error);
    return json(
      { error: "Failed to update repair request status" },
      { status: 500 }
    );
  }
}
