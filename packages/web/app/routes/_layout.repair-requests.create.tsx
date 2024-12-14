import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { useRepairRequest } from "~/utils/blockchain/hooks/useRepairRequest";
import { ArrowLeft, Building2, AlertTriangle, FileText, X } from 'lucide-react';
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";

type ActionData = {
  success?: boolean;
  error?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const propertyId = formData.get("propertyId") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string;
  const initiatorAddress = formData.get("initiatorAddress") as string;
  const blockchainId = formData.get("blockchainId") as string;
  const blockchainHash = formData.get("blockchainHash") as string;

  if (!propertyId || !description || !urgency || !initiatorAddress || !blockchainId || !blockchainHash) {
    return json<ActionData>(
      { success: false, error: "All fields are required" },
      { status: 400 }
    );
  }

  try {
    const initiator = await db.user.findUnique({
      where: { address: initiatorAddress },
      select: { id: true },
    });

    if (!initiator) {
      return json<ActionData>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await db.repairRequest.create({
      data: {
        id: blockchainId,
        description,
        urgency,
        status: "PENDING",
        propertyId,
        initiatorId: initiator.id,
        attachments: "",
        hash: blockchainHash,
      },
    });

    return json<ActionData>({ success: true });
  } catch (error) {
    console.error("Create repair request error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to create repair request" },
      { status: 500 }
    );
  }
}

export default function CreateRepairRequest() {
  const { address } = useAccount();
  const actionData = useActionData<typeof action>();
  const { createRepairRequest, isPending } = useRepairRequest();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const propertyId = formData.get("propertyId") as string;
      const description = formData.get("description") as string;
      const result = await createRepairRequest(propertyId, description);

      formData.append("blockchainId", result.id.toString());
      formData.append("blockchainHash", result.hash);

      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create repair request in database');

      navigate('/repair-requests');
    } catch (error) {
      console.error('Error creating repair request:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => navigate('/repair-requests')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-purple-300">
            Create Repair Request
          </h1>
          <p className="mt-1 text-purple-300/70">Submit a new repair request for your property</p>
        </div>
      </div>

      {!address ? (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <p className="text-purple-300/70">Please connect your wallet to create repair requests.</p>
        </div>
      ) : (
        <Form method="post" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Property
                </div>
              </label>
              <select
                name="propertyId"
                required
                className="w-full rounded-xl bg-white/[0.02] border border-white/[0.04] text-purple-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Select a property</option>
                {/* Property options will be added later */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </div>
              </label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full rounded-xl bg-white/[0.02] border border-white/[0.04] text-purple-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Describe the repair needed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Urgency
                </div>
              </label>
              <select
                name="urgency"
                required
                className="w-full rounded-xl bg-white/[0.02] border border-white/[0.04] text-purple-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Select urgency level</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <input type="hidden" name="initiatorAddress" value={address} />

            {actionData?.error && (
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 flex items-center gap-2">
                <X className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{actionData.error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/repair-requests')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
              >
                {isPending ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}
