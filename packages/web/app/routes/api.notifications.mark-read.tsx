import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Ensure user is authenticated
    const user = await requireUser(request);

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    const formData = await request.formData();
    const ids = formData.get("ids")?.toString().split(",") || [];

    if (ids.length === 0) {
      return json({ error: "No notification IDs provided" }, { status: 400 });
    }

    // Mark notifications as read, but only if they belong to the current user
    await db.notification.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return json({ success: true });
  } catch (error: any) {
    console.error("Error marking notifications as read:", error);
    return json(
      { error: error.message || "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
