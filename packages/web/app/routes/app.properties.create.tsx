import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { db, createProperty } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { PlacesAutocomplete } from "~/components/PlacesAutocomplete";
import { Button } from "~/components/ui/Button";
import { ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";

type ActionData = {
  success?: boolean;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Only landlords can access this page
  if (user.role !== "LANDLORD") {
    return redirect("/app");
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

  if (!address || !placeId) {
    return json<ActionData>(
      { success: false, error: "Property address is required" },
      { status: 400 }
    );
  }

  try {
    await createProperty(user.id, address, placeId);

    // Redirect to properties list
    return redirect("/app/properties");
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
  const [selectedPlace, setSelectedPlace] = useState<{
    address: string;
    placeId: string;
  } | null>(null);

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
            Add Your Property
          </h1>
          <p className="mt-2 text-lg text-white/70">
            Enter your property details to start managing repairs
          </p>
        </div>
      </div>

      <Form method="post" className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-white/70">
              Property Address
            </label>
            <PlacesAutocomplete
              onPlaceSelect={(place) => {
                setSelectedPlace({
                  address: place.description,
                  placeId: place.place_id
                });
              }}
              leftIcon={<Building2 className="h-5 w-5" />}
              placeholder="Enter property address"
            />
            <input 
              type="hidden" 
              name="address" 
              value={selectedPlace?.address || ''} 
            />
            <input 
              type="hidden" 
              name="placeId" 
              value={selectedPlace?.placeId || ''} 
            />
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
            disabled={!selectedPlace}
          >
            Add Property
          </Button>
        </div>
      </Form>
    </div>
  );
}
