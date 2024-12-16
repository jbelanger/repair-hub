import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { PlacesAutocomplete } from "~/components/PlacesAutocomplete";

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
    return redirect("/dashboard");
  }

  return json({});
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

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard/properties">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">
            Add Property
          </h2>
          <p className="mt-1 text-white/70">
            Enter the property address to get started
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Form method="post" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-white/70">
                Property Address
              </label>
              <PlacesAutocomplete
                placeholder="Start typing the address..."
                aria-describedby="address-error"
              />
              {actionData?.fieldErrors?.address && (
                <p className="text-sm text-red-500" id="address-error">
                  {actionData.fieldErrors.address}
                </p>
              )}
            </div>
          </div>

          {actionData?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-200">
              {actionData.error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Link to="/dashboard/properties" className="flex-1">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1"
            >
              Create Property
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
