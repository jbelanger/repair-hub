import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { Input } from "~/components/ui/Input";
import { addDays } from "date-fns";

type ActionData = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    email?: string;
    startDate?: string;
    endDate?: string;
  };
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Only landlords can access this page
  if (user.role !== "LANDLORD") {
    return redirect("/app");
  }

  const property = await db.property.findUnique({
    where: {
      id: params.id,
      landlordId: user.id // Ensure the property belongs to this landlord
    }
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  return json({ property });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  
  // Double check role
  if (user.role !== "LANDLORD") {
    return json<ActionData>(
      { success: false, error: "Only landlords can invite tenants" },
      { status: 403 }
    );
  }

  const property = await db.property.findUnique({
    where: {
      id: params.id,
      landlordId: user.id
    }
  });

  if (!property) {
    return json<ActionData>(
      { success: false, error: "Property not found" },
      { status: 404 }
    );
  }

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!email || !email.includes("@")) {
    fieldErrors.email = "Valid email is required";
  }
  if (!startDate) {
    fieldErrors.startDate = "Start date is required";
  }
  if (!endDate) {
    fieldErrors.endDate = "End date is required";
  }
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    fieldErrors.endDate = "End date must be after start date";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  try {
    // Create invitation that expires in 7 days
    await db.tenantInvitation.create({
      data: {
        propertyId: property.id,
        email,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PENDING",
        expiresAt: addDays(new Date(), 7)
      }
    });

    return redirect(`/app/properties/${property.id}`);
  } catch (error) {
    console.error("Create invitation error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

export default function InviteTenant() {
  const { property } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Invite Tenant
          </h1>
          <p className="mt-2 text-lg text-white/70">
            {property.address}
          </p>
        </div>
      </div>

      <Form method="post" className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white/70">
              Tenant Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tenant@example.com"
              aria-describedby="email-error"
            />
            {actionData?.fieldErrors?.email && (
              <p className="text-sm text-red-500" id="email-error">
                {actionData.fieldErrors.email}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="block text-sm font-medium text-white/70">
                Lease Start Date
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                aria-describedby="startDate-error"
              />
              {actionData?.fieldErrors?.startDate && (
                <p className="text-sm text-red-500" id="startDate-error">
                  {actionData.fieldErrors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="block text-sm font-medium text-white/70">
                Lease End Date
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                aria-describedby="endDate-error"
              />
              {actionData?.fieldErrors?.endDate && (
                <p className="text-sm text-red-500" id="endDate-error">
                  {actionData.fieldErrors.endDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {actionData?.error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-200">
            {actionData.error}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
            size="lg"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
          >
            Send Invitation
          </Button>
        </div>
      </Form>
    </div>
  );
}
