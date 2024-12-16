import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Building2 } from "lucide-react";
import { PlacesAutocomplete } from "~/components/PlacesAutocomplete";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/ui/PageHeader";
import { FormField, FormSection, FormActions, FormError } from "~/components/ui/Form";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { NoAccess } from "~/components/ui/EmptyState";

type ActionData = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    address?: string;
    placeId?: string;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Only landlords can create properties
  if (user.role !== "LANDLORD") {
    return json({ user });
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  
  // Double check role
  if (user.role !== "LANDLORD") {
    return json<ActionData>(
      { success: false, error: "Only landlords can create properties" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const address = formData.get("address") as string;
  const placeId = formData.get("placeId") as string;

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!address) {
    fieldErrors.address = "Address is required";
  }
  if (!placeId) {
    fieldErrors.placeId = "Valid address selection is required";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  try {
    const property = await db.property.create({
      data: {
        address,
        placeId,
        landlordId: user.id
      }
    });

    return redirect(`/dashboard/properties/${property.id}`);
  } catch (error) {
    console.error("Create property error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to create property" },
      { status: 500 }
    );
  }
}

export default function CreateProperty() {
  const actionData = useActionData<typeof action>();
  const { toasts, addToast, removeToast } = useToast();

  // Show access denied for non-landlords
  if (actionData?.error === "Only landlords can create properties") {
    return (
      <NoAccess message="Only landlords can create properties" />
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Add Property"
        subtitle="Enter the property address to get started"
        backTo="/dashboard/properties"
      />

      <div className="max-w-2xl">
        <Card
          accent="purple"
          header={{
            title: "Property Details",
            subtitle: "Add a new property to your portfolio",
            icon: <Building2 className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <FormSection>
            <FormField
              label="Property Address"
              error={actionData?.fieldErrors?.address}
            >
              <PlacesAutocomplete
                placeholder="Start typing the address..."
                aria-describedby="address-error"
              />
            </FormField>
          </FormSection>

          <FormError error={actionData?.error} />

          <FormActions
            cancelHref="/dashboard/properties"
            submitLabel="Create Property"
          />
        </Card>
      </div>

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
