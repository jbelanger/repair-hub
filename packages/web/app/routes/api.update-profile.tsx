import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

type ActionData = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!name) {
    fieldErrors.name = "Name is required";
  }
  if (!email || !email.includes("@")) {
    fieldErrors.email = "Valid email is required";
  }
  if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
    fieldErrors.phone = "Invalid phone number format";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  try {
    // Check if email is already taken by another user
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.id !== user.id) {
      return json<ActionData>(
        { error: "Email is already taken" },
        { status: 400 }
      );
    }

    // Update user profile
    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        phone: phone || null // Convert empty string to null
      }
    });

    return json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
