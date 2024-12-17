import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "PUT") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireUser(request);
  const { id } = params;

  if (!id) {
    return json({ error: "Repair request ID is required" }, { status: 400 });
  }

  const repairRequest = await db.repairRequest.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          landlord: true,
        },
      },
    },
  });

  if (!repairRequest) {
    return json({ error: "Repair request not found" }, { status: 404 });
  }

  // Verify that the user is the landlord
  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  if (!isLandlord) {
    return json({ error: "Only the landlord can update work details" }, { status: 403 });
  }

  try {
    const { workDetails } = await request.json();
    
    if (!workDetails) {
      return json({ error: "Work details are required" }, { status: 400 });
    }

    const updatedRepairRequest = await db.repairRequest.update({
      where: { id },
      data: {
        workDetails,
        updatedAt: new Date(),
      },
    });

    return json(updatedRepairRequest);
  } catch (error) {
    console.error("Error updating repair request work details:", error);
    return json(
      { error: "Failed to update repair request work details" },
      { status: 500 }
    );
  }
}
