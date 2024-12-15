import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigate, useNavigation, useLoaderData, useSubmit } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { useRepairRequest, useWatchRepairRequestEvents } from "~/utils/blockchain/hooks/useRepairRequest";
import { ArrowLeft, Building2, AlertTriangle, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from "~/components/ui/Button";
import { Select } from "~/components/ui/Select";
import { TextArea } from "~/components/ui/TextArea";
import { useState, useEffect } from "react";
import { requireUser } from "~/utils/session.server";
import { cn } from "~/utils/cn";

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
  }[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const properties = await db.property.findMany({
    where: {
      OR: [
        { landlordId: user.id },
        { tenants: { some: { id: user.id } } }
      ]
    },
    select: {
      id: true,
      address: true,
    }
  });

  return json<LoaderData>({ user, properties });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const stage = formData.get("_stage") as 'validate' | 'create';
  const propertyId = formData.get("propertyId") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string;
  const blockchainId = formData.get("blockchainId") as string;
  const transactionHash = formData.get("transactionHash") as string;

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
    // Verify property exists and user has access
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { landlordId: user.id },
          { tenants: { some: { id: user.id } } }
        ]
      }
    });

    if (!property) {
      return json<ActionData>(
        { 
          success: false, 
          error: "Property not found or access denied",
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
      if (!blockchainId || !transactionHash) {
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

      await db.repairRequest.create({
        data: {
          id: blockchainId,
          description,
          urgency,
          status: "PENDING",
          propertyId: property.id,
          initiatorId: user.id,
          attachments: "",
          hash: transactionHash,
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
  const [selectedProperty, setSelectedProperty] = useState(actionData?.fields?.propertyId || "");
  const [selectedUrgency, setSelectedUrgency] = useState(actionData?.fields?.urgency || "");
  const [blockchainError, setBlockchainError] = useState<string>();
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isSubmitting = navigation.state === "submitting";
  const [transactionHash, setTransactionHash] = useState<string>();

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
          formData.append("transactionHash", transactionHash || "");
          
          submit(formData, { method: "post" });
          setIsWaitingForEvent(false);
        } catch (error) {
          console.error("Database error:", error);
          setBlockchainError(
            error instanceof Error ? error.message : "Failed to save repair request to database"
          );
          setIsWaitingForEvent(false);
        }
      }
    },
  });

  // Handle successful form validation
  const handleCreateOnChain = async () => {
    if (actionData?.success && actionData.fields) {
      try {
        setBlockchainError(undefined);
        setIsWaitingForEvent(true);
        const { propertyId, description } = actionData.fields;
        const result = await createRepairRequest(propertyId, description);
        setTransactionHash(result.hash);
      } catch (error) {
        console.error("Blockchain error:", error);
        setBlockchainError(
          error instanceof Error ? error.message : "Failed to create repair request on blockchain"
        );
        setIsWaitingForEvent(false);
      }
    }
  };

  // Handle successful creation
  useEffect(() => {
    if (actionData?.success && actionData.stage === 'create') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          navigate("/repair-requests");
        }, 500); // Wait for exit animation
      }, 2000); // Show success for 2 seconds
      return () => clearTimeout(timer);
    }
  }, [actionData?.success, actionData?.stage, navigate]);

  // Show success screen
  if (showSuccess) {
    return (
      <div className={cn(
        "fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-500",
        isExiting ? "opacity-0" : "opacity-100"
      )}>
        <div className={cn(
          "text-center space-y-6 animate-success-appear",
          isExiting ? "scale-95 opacity-0 transition-all duration-500" : ""
        )}>
          <div className="animate-success-bounce">
            <CheckCircle2 className="mx-auto h-24 w-24 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Success!
            </h2>
            <p className="text-lg text-white/70">
              Your repair request has been created
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure wallet address matches authenticated user
  if (address?.toLowerCase() !== user.address.toLowerCase()) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-200">
        Please connect with the wallet address associated with your account: {user.address}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/repair-requests')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Create Repair Request
          </h1>
          <p className="mt-2 text-lg text-white/70">
            Submit a new repair request for your property
          </p>
        </div>
      </div>

      {!address ? (
        <div className="rounded-lg border border-purple-600/20 bg-purple-600/5 p-4 text-purple-200">
          Please connect your wallet first to create repair requests.
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-yellow-200">
          You don't have any properties associated with your account. Please contact your landlord or administrator.
        </div>
      ) : (
        <Form method="post" className="space-y-6">
          <input type="hidden" name="_stage" value="validate" />
          
          <div className="space-y-6">
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

            <TextArea
              name="description"
              required
              placeholder="Describe the repair needed..."
              leftIcon={<FileText className="h-5 w-5" />}
              defaultValue={actionData?.fields?.description}
            />

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

            {(actionData?.error || blockchainError) && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-2">
                <X className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400">{actionData?.error || blockchainError}</p>
              </div>
            )}

            {actionData?.success && actionData.stage === 'validate' && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-green-200">
                Form validated successfully. {isWaitingForEvent ? "Waiting for blockchain confirmation..." : "Ready to create on blockchain."}
              </div>
            )}

            {isWaitingForEvent && (
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Waiting for blockchain confirmation...</span>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/repair-requests')}
                size="lg"
                className="flex-1"
              >
                Cancel
              </Button>
              {actionData?.success && actionData.stage === 'validate' ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateOnChain}
                  disabled={isWaitingForEvent}
                  size="lg"
                  className="flex-1"
                >
                  {isWaitingForEvent ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Confirming...</span>
                    </div>
                  ) : (
                    "Confirm on Blockchain"
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  size="lg"
                  className="flex-1"
                >
                  {isSubmitting ? "Validating..." : "Create Request"}
                </Button>
              )}
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}
