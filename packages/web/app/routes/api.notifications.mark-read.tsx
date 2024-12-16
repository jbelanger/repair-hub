import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const notificationIds = (formData.get("ids") as string).split(",");

  try {
    await db.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        userId: user.id // Ensure user can only mark their own notifications as read
      },
      data: {
        read: true
      }
    });

    return json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return json({ success: false }, { status: 500 });
  }
}
