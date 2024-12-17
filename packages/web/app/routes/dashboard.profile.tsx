import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { ProfileSettings } from "~/components/ProfileSettings";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { useState, useEffect } from "react";

type ActionData = {
  success?: boolean;
  error?: string;
  fields?: {
    name: string;
    email: string;
    phone: string;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const userWithDetails = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!userWithDetails) {
    throw new Response("User not found", { status: 404 });
  }

  // Convert dates to ISO strings for JSON serialization
  return json({
    user: {
      ...userWithDetails,
      createdAt: userWithDetails.createdAt.toISOString(),
      updatedAt: userWithDetails.updatedAt.toISOString(),
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  // Validate required fields
  const fields = { name, email, phone };
  const fieldErrors = {
    name: name ? null : "Name is required",
    email: email ? null : "Email is required",
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return json<ActionData>(
      { 
        success: false, 
        error: "Please fill in all required fields",
        fields,
      },
      { status: 400 }
    );
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        phone: phone || null,
      },
    });

    return json<ActionData>({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export default function DashboardProfile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { toasts, addToast, removeToast } = useToast();
  const [hasShownToast, setHasShownToast] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  // Reset toast flag when form is submitted
  useEffect(() => {
    if (isSubmitting) {
      setHasShownToast(false);
    }
  }, [isSubmitting]);

  // Show toast when action completes
  useEffect(() => {
    if (!hasShownToast && !isSubmitting && actionData) {
      if (actionData.success) {
        addToast(
          "Your profile has been successfully updated",
          "success",
          "Profile Updated"
        );
      } else if (actionData.error) {
        addToast(
          actionData.error,
          "error",
          "Update Failed"
        );
      }
      setHasShownToast(true);
    }
  }, [actionData, isSubmitting, hasShownToast, addToast]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">
          Profile Settings
        </h2>
        <p className="mt-1 text-white/70">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <ProfileSettings 
          user={user} 
          isSubmitting={isSubmitting}
          error={actionData?.error}
        />
      </div>

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
