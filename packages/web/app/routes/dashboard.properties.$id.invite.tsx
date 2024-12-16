import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Mail, Calendar } from "lucide-react";
import { Input } from "~/components/ui/Input";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/ui/PageHeader";
import { FormField, FormSection, FormActions, FormError, FormGrid } from "~/components/ui/Form";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { NoAccess } from "~/components/ui/EmptyState";
import { addDays } from "date-fns";

type LoaderData = {
  property: {
    id: string;
    address: string;
  };
};

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
  
  const property = await db.property.findUnique({
    where: {
      id: params.id,
      landlordId: user.id // Ensure the property belongs to this landlord
    },
    select: {
      id: true,
      address: true,
    }
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  return json<LoaderData>({ property });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  
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

    return redirect(`/dashboard/properties/${property.id}`, {
      headers: {
        "X-Toast": "Invitation sent successfully"
      }
    });
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
  const { toasts, addToast, removeToast } = useToast();

  return (
    <div className="p-6">
      <PageHeader
        title="Invite Tenant"
        subtitle={property.address}
        backTo={`/dashboard/properties/${property.id}`}
      />

      <div className="max-w-2xl">
        <Card
          accent="purple"
          header={{
            title: "Tenant Invitation",
            subtitle: "Send an invitation to a new tenant",
            icon: <Mail className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <Form method="post">
            <FormSection>
              <FormField
                label="Tenant Email"
                error={actionData?.fieldErrors?.email}
              >
                <Input
                  name="email"
                  type="email"
                  placeholder="tenant@example.com"
                  leftIcon={<Mail className="h-5 w-5" />}
                />
              </FormField>

              <FormGrid>
                <FormField
                  label="Lease Start Date"
                  error={actionData?.fieldErrors?.startDate}
                >
                  <Input
                    name="startDate"
                    type="date"
                    leftIcon={<Calendar className="h-5 w-5" />}
                  />
                </FormField>

                <FormField
                  label="Lease End Date"
                  error={actionData?.fieldErrors?.endDate}
                >
                  <Input
                    name="endDate"
                    type="date"
                    leftIcon={<Calendar className="h-5 w-5" />}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormError error={actionData?.error} />

            <FormActions
              cancelHref={`/dashboard/properties/${property.id}`}
              submitLabel="Send Invitation"
            />
          </Form>
        </Card>
      </div>

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
