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
    throw new Response("Only the tenant can approve/refuse work", { status: 403 });
  }

  // Verify request is in COMPLETED status
  if (repairRequest.status !== "COMPLETED") {
    return json(
      { error: "Can only approve/refuse completed work" },
      { status: 400 }
    );
  }

  const { isAccepted } = await request.json();
  if (typeof isAccepted !== 'boolean') {
    return json({ error: "isAccepted is required" }, { status: 400 });
  }

  try {
    // Update the repair request status to ACCEPTED or REFUSED
    const updatedRequest = await db.repairRequest.update({
      where: { id },
      data: {
        status: isAccepted ? "ACCEPTED" : "REFUSED",
        updatedAt: new Date(),
      },
    });

    return json({ success: true, repairRequest: updatedRequest });
  } catch (error) {
    console.error('Error approving/refusing repair request:', error);
    return json(
      { error: "Failed to approve/refuse repair request" },
      { status: 500 }
    );
  }
}
