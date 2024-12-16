import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
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

  // Check if invitation has expired
  if (new Date() > invitation.expiresAt) {
    throw new Response("Invitation has expired", { status: 400 });
  }

  try {
    // Start a transaction to ensure all operations succeed or fail together
    await db.$transaction(async (tx) => {
      // Create tenant lease
      await tx.propertyTenant.create({
        data: {
          propertyId: invitation.propertyId,
          tenantId: user.id,
          startDate: invitation.startDate,
          endDate: invitation.endDate,
          status: "ACTIVE"
        }
      });

      // Update invitation status
      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      });

      // Create notification for landlord
      await tx.notification.create({
        data: {
          userId: invitation.property.landlordId,
          type: "INVITATION_ACCEPTED",
          title: "Invitation Accepted",
          message: `${user.name} has accepted your invitation to ${invitation.property.address}`,
          data: JSON.stringify({
            propertyId: invitation.propertyId,
            tenantId: user.id,
            tenantName: user.name,
            tenantEmail: user.email
          })
        }
      });
    });

    return redirect("/dashboard", {
      headers: {
        "X-Toast": `You are now a tenant of ${invitation.property.address}`
      }
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    throw new Response("Failed to accept invitation", { status: 500 });
  }
}
