import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { useRepairRequest } from "~/utils/blockchain/hooks/useRepairRequest";

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
    // Get the initiator's ID from their address
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

    // Create the repair request in the database with the blockchain ID
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
      // First create on blockchain to get the ID
      const propertyId = formData.get("propertyId") as string;
      const description = formData.get("description") as string;
      const result = await createRepairRequest(propertyId, description);

      // Add blockchain data to form
      formData.append("blockchainId", result.id.toString());
      formData.append("blockchainHash", result.hash);

      // Then submit to Remix action to create in database
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create repair request in database');

      // Navigate back to repair requests list on success
      navigate('/repair-requests');
    } catch (error) {
      console.error('Error creating repair request:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create Repair Request</h1>

      {!address ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          Please connect your wallet to create repair requests.
        </div>
      ) : (
        <Form method="post" onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
              Property
            </label>
            <select
              name="propertyId"
              id="propertyId"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select a property</option>
              {/* We'll add property options later */}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
              Urgency
            </label>
            <select
              name="urgency"
              id="urgency"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select urgency level</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <input type="hidden" name="initiatorAddress" value={address} />

          {actionData?.error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              {actionData.error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/repair-requests')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </Form>
      )}
    </div>
  );
}
