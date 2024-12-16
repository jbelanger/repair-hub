import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const invitation = await db.tenantInvitation.findUnique({
    where: {
      id: params.id,
      email: user.email,
      status: "PENDING"
    },
    include: {
      property: {
        include: {
          landlord: true
        }
      }
    }
  });

  if (!invitation) {
    throw new Response("Invitation not found", { status: 404 });
  }

  try {
    await db.$transaction(async (tx) => {
      // Update invitation status
      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: "DECLINED" }
      });

      // Create notification for landlord
      await tx.notification.create({
        data: {
          userId: invitation.property.landlordId,
          type: "INVITATION_DECLINED",
          title: "Invitation Declined",
          message: `${user.name} has declined your invitation to ${invitation.property.address}`,
          data: JSON.stringify({
            propertyId: invitation.propertyId,
            tenantName: user.name,
            tenantEmail: user.email
          })
        }
      });
    });

    return redirect("/dashboard", {
      headers: {
        "X-Toast": "Invitation declined"
      }
    });
  } catch (error) {
    console.error("Decline invitation error:", error);
    throw new Response("Failed to decline invitation", { status: 500 });
  }
}
