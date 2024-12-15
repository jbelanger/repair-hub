import { useState, useEffect } from "react";
import { Form, useActionData, useNavigate, useNavigation, useLoaderData } from "@remix-run/react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card } from "~/components/ui/Card";
import { X, User, Mail, Phone, Check } from "lucide-react";
import { db } from "~/utils/db.server";
import { getUserFromSession } from "~/utils/session.server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

type ActionData = { success: true } | { error: string };
type LoaderData = {
  user: {
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const userData = await db.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!userData) {
    throw new Response("User not found", { status: 404 });
  }

  return json<LoaderData>({ user: userData });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  // Validate required fields
  if (!name?.trim()) {
    return json<ActionData>({ error: "Name is required" }, { status: 400 });
  }
  if (!email?.trim()) {
    return json<ActionData>({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Check if email is already taken by another user
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    
    if (existingUser && existingUser.id !== user.id) {
      return json<ActionData>(
        { error: "This email is already registered. Please use a different email" },
        { status: 400 }
      );
    }

    // Update user profile
    await db.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
      },
    });

    return json<ActionData>({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('email')) {
        return json<ActionData>(
          { error: "This email is already registered. Please use a different email" },
          { status: 400 }
        );
      }
    }

    return json<ActionData>(
      { error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}

function isErrorResponse(data: ActionData | undefined): data is { error: string } {
  return data !== undefined && 'error' in data;
}

function isSuccessResponse(data: ActionData | undefined): data is { success: true } {
  return data !== undefined && 'success' in data;
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const { user } = useLoaderData<typeof loader>();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (isSuccessResponse(actionData)) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        navigate(-1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [actionData, navigate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <Card className="relative w-full max-w-md border border-white/[0.08] bg-background/95 p-6 shadow-xl">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="rounded-full bg-green-500/10 p-3">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-lg font-medium text-white">Profile Updated Successfully</p>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 hover:bg-white/[0.04]"
              onClick={() => navigate(-1)}
              type="button"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>

            <h2 className="mb-6 text-xl font-semibold">Profile Settings</h2>

            <Form method="post" className="space-y-4">              
              <div>
                <label htmlFor="name" className="mb-2 block text-sm">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user.name}
                  required
                  className="bg-white/[0.04] focus:bg-white/[0.08]"
                  leftIcon={<User className="h-5 w-5" />}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  className="bg-white/[0.04] focus:bg-white/[0.08]"
                  leftIcon={<Mail className="h-5 w-5" />}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm">
                  Phone Number (Optional)
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ""}
                  className="bg-white/[0.04] focus:bg-white/[0.08]"
                  leftIcon={<Phone className="h-5 w-5" />}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="role" className="mb-2 block text-sm">
                  Role
                </label>
                <Input
                  id="role"
                  value={user.role}
                  disabled
                  className="bg-white/[0.02] text-white/70"
                />
              </div>

              {isErrorResponse(actionData) && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-200">
                  {actionData.error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(-1)}
                  type="button"
                  className="hover:bg-white/[0.04]"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}
