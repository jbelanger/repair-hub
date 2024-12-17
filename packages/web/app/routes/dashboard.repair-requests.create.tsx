import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigate, useNavigation, useLoaderData, useSubmit } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { useRepairRequest, useWatchRepairRequestEvents } from "~/utils/blockchain/hooks/useRepairRequest";
import { Building2, AlertTriangle, FileText } from 'lucide-react';
import { Select } from "~/components/ui/Select";
import { TextArea } from "~/components/ui/TextArea";
import { useState, useEffect } from "react";
import { requireUser } from "~/utils/session.server";
import { cn } from "~/utils/cn";
import { PageHeader } from "~/components/ui/PageHeader";
import { Card } from "~/components/ui/Card";
import { FormField, FormSection, FormActions, FormError } from "~/components/ui/Form";
import { EmptyState } from "~/components/ui/EmptyState";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { Skeleton } from "~/components/ui/LoadingState";
import { type Address, type HexString, toHexString, hashToHex } from "~/utils/blockchain/types";
import { hashToHexSync } from "~/utils/blockchain/hash.server";

type ActionData = {
  success?: boolean;
  error?: string;
  fields?: {
    propertyId: string;
    description: string;
    urgency: string;
  };
  stage?: 'validate' | 'create';
};

type LoaderData = {
  user: {
    id: string;
    address: string;
    role: string;
    name: string;
  };
  properties: {
    id: string;
    address: string;
    leaseId: string;
    landlordAddress: Address;
  }[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Only tenants can create repair requests
  if (user.role !== "TENANT") {
    return redirect("..");
  }

  // Get properties where user is a tenant
  const properties = await db.property.findMany({
    where: {
      tenantLeases: {
        some: {
          tenantId: user.id,
          status: "ACTIVE"
        }
      }
    },
    select: {
      id: true,
      address: true,
      landlord: {
        select: {
          address: true
        }
      },
      tenantLeases: {
        where: {
          tenantId: user.id,
          status: "ACTIVE"
        },
        select: {
          id: true
        }
      }
    }
  });

  // Transform the data to include leaseId and landlordAddress
  const transformedProperties = properties.map(property => ({
    id: property.id,
    address: property.address,
    leaseId: property.tenantLeases[0].id,
    landlordAddress: toHexString(property.landlord.address) as Address
  }));

  return json<LoaderData>({ user, properties: transformedProperties });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  // Only tenants can create repair requests
  if (user.role !== "TENANT") {
    return json<ActionData>(
      { success: false, error: "Only tenants can create repair requests" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const stage = formData.get("_stage") as 'validate' | 'create';
  const propertyId = formData.get("propertyId") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string;
  const blockchainId = formData.get("blockchainId") as string;

  // Validate required fields
  const fields = { propertyId, description, urgency };
  const fieldErrors = {
    propertyId: propertyId ? null : "Property is required",
    description: description ? null : "Description is required",
    urgency: urgency ? null : "Urgency level is required",
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return json<ActionData>(
      { 
        success: false, 
        error: "Please fill in all required fields",
        fields,
        stage
      },
      { status: 400 }
    );
  }

  try {
    // Verify property exists and user is an active tenant
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        tenantLeases: {
          some: {
            tenantId: user.id,
            status: "ACTIVE"
          }
        }
      },
      include: {
        tenantLeases: {
          where: {
            tenantId: user.id,
            status: "ACTIVE"
          }
        }
      }
    });

    if (!property || !property.tenantLeases[0]) {
      return json<ActionData>(
        { 
          success: false, 
          error: "Property not found or you are not an active tenant",
          fields,
          stage
        },
        { status: 404 }
      );
    }

    if (stage === 'validate') {
      // Just validate the form data
      return json<ActionData>({ 
        success: true,
        fields,
        stage
      });
    } else if (stage === 'create') {
      // Create the repair request in the database
      if (!blockchainId) {
        return json<ActionData>(
          { 
            success: false, 
            error: "Missing blockchain data",
            fields,
            stage
          },
          { status: 400 }
        );
      }

      // Create description hash for blockchain verification using server-side function
      const descriptionHash = hashToHexSync(description);

      await db.repairRequest.create({
        data: {
          id: blockchainId,
          description,
          descriptionHash,
          urgency,
          status: "PENDING",
          propertyId: property.id,
          initiatorId: user.id,
          leaseId: property.tenantLeases[0].id,
          attachments: "",
        },
      });

      return json<ActionData>({ success: true, stage });
    }
  } catch (error) {
    console.error("Create repair request error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to create repair request", stage },
      { status: 500 }
    );
  }
}

export default function CreateRepairRequest() {
  const { user, properties } = useLoaderData<typeof loader>();
  const { address } = useAccount();
  const actionData = useActionData<typeof action>();
  const { createRepairRequest } = useRepairRequest();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();
  const { toasts, addToast, removeToast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState(actionData?.fields?.propertyId || "");
  const [selectedUrgency, setSelectedUrgency] = useState(actionData?.fields?.urgency || "");
  const [blockchainError, setBlockchainError] = useState<string>();
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  // Watch for blockchain events
  useWatchRepairRequestEvents({
    onCreated: async (id, initiator, propertyId, descriptionHash, createdAt) => {
      if (isWaitingForEvent && initiator.toLowerCase() === user.address.toLowerCase()) {
        try {
          const formData = new FormData();
          formData.append("_stage", "create");
          formData.append("propertyId", actionData?.fields?.propertyId || "");
          formData.append("description", actionData?.fields?.description || "");
          formData.append("urgency", actionData?.fields?.urgency || "");
          formData.append("blockchainId", id.toString());
          
          submit(formData, { method: "post" });
          setIsWaitingForEvent(false);
          addToast(
            "Your repair request has been successfully created on the blockchain",
            "success",
            "Blockchain Transaction Confirmed"
          );
        } catch (error) {
          console.error("Database error:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to save repair request to database";
          setBlockchainError(errorMessage);
          setIsWaitingForEvent(false);
          addToast(
            errorMessage,
            "error",
            "Database Error"
          );
        }
      }
    },
  });

  // Handle blockchain creation
  const handleCreateOnChain = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (actionData?.success && actionData.fields) {
      e.preventDefault();
      try {
        setBlockchainError(undefined);
        setIsWaitingForEvent(true);
        addToast(
          "Please confirm the transaction in your wallet",
          "info",
          "Creating Repair Request"
        );
        
        const { propertyId, description } = actionData.fields;
        const selectedProperty = properties.find(p => p.id === propertyId);
        if (!selectedProperty) {
          throw new Error("Selected property not found");
        }
        // Use the async browser-side hash function for client-side operations
        const descriptionHash = await hashToHex(description);
        const blockchainPropertyId = toHexString(propertyId);
        await createRepairRequest(blockchainPropertyId, descriptionHash, selectedProperty.landlordAddress);
      } catch (error) {
        console.error("Blockchain error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create repair request on blockchain";
        setBlockchainError(errorMessage);
        setIsWaitingForEvent(false);
        addToast(
          errorMessage,
          "error",
          "Blockchain Error"
        );
      }
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Create Repair Request"
        subtitle="Submit a new repair request for your property"
        backTo="/dashboard/repair-requests"
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Properties Found"
          description="You are not currently an active tenant of any properties. Please contact your landlord."
        />
      ) : (
        <div className="max-w-2xl">
          <Card
            accent="purple"
            header={{
              title: "Repair Request Details",
              subtitle: "Fill in the details of your repair request",
              icon: <FileText className="h-5 w-5" />,
              iconBackground: true
            }}
          >
            <Form method="post">
              <input type="hidden" name="_stage" value="validate" />
              
              <FormSection className="mb-6">
                <FormField label="Property">
                  <Select
                    name="propertyId"
                    required
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    leftIcon={<Building2 className="h-5 w-5" />}
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.address}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Description">
                  <TextArea
                    name="description"
                    required
                    placeholder="Describe the repair needed..."
                    leftIcon={<FileText className="h-5 w-5" />}
                    defaultValue={actionData?.fields?.description}
                  />
                </FormField>

                <FormField label="Urgency Level">
                  <Select
                    name="urgency"
                    required
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    leftIcon={<AlertTriangle className="h-5 w-5" />}
                  >
                    <option value="">Select urgency level</option>
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </Select>
                </FormField>
              </FormSection>

              <FormError error={actionData?.error || blockchainError} />

              {actionData?.success && actionData.stage === 'validate' && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-green-200 mb-6">
                  Form validated successfully. {isWaitingForEvent ? "Waiting for blockchain confirmation..." : "Ready to create on blockchain."}
                </div>
              )}

              <FormActions
                cancelHref=".."
                submitLabel={
                  actionData?.success && actionData.stage === 'validate'
                    ? isWaitingForEvent
                      ? "Confirming..."
                      : "Confirm on Blockchain"
                    : isSubmitting
                    ? "Validating..."
                    : "Create Request"
                }
                isSubmitting={isSubmitting || isWaitingForEvent}
                onSubmit={
                  actionData?.success && actionData.stage === 'validate'
                    ? handleCreateOnChain
                    : undefined
                }
              />
            </Form>
          </Card>
        </div>
      )}

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
