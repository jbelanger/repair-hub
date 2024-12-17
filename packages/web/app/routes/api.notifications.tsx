import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Ensure user is authenticated
    await requireUser(request);

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    const { userId, type, title, message, data } = await request.json();

    if (!userId || !type || !title || !message) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create notification in database
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return json({ success: true, notification });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return json(
      { error: error.message || "Failed to create notification" },
      { status: 500 }
    );
  }
}
