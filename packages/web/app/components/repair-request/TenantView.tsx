import { RepairRequestDescription } from "./RepairRequestDescription";
import { RepairRequestWorkDetails } from "./RepairRequestWorkDetails";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { LoaderData } from "~/types/repair-request";
import type { SerializedContractRepairRequest } from "~/utils/blockchain/types/repair-request";
import { statusMap } from "~/utils/repair-request";
import { Spinner } from "~/components/ui/Spinner";

type PendingAction = {
  type: 'withdraw' | 'status' | 'workDetails';
  expectedValue?: string | number;
  transactionId?: string;
  description?: string;
};

type TenantViewProps = {
  repairRequest: LoaderData['repairRequest'];
  blockchainRequest: SerializedContractRepairRequest;
  availableStatusUpdates?: RepairRequestStatusType[];
  isPending: boolean;
  isTenant: boolean;
  pendingAction: PendingAction | null;
};

export function TenantView({
  repairRequest,
  blockchainRequest,
  availableStatusUpdates = [],
  isPending,
  isTenant,
  pendingAction,
}: TenantViewProps) {
  // Generate tenant action buttons based on blockchain status
  const tenantButtons = [];

  // Add withdraw button only if blockchain status is PENDING
  if (blockchainRequest.status === RepairRequestStatusType.PENDING) {
    tenantButtons.push(
      <Form method="post" key="withdraw">
        <input type="hidden" name="_action" value="withdrawRequest" />
        <Button
          type="submit"
          variant="danger"
          disabled={isPending}
        >
          {pendingAction?.type === 'withdraw' ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span>{pendingAction.description || 'Withdrawing...'}</span>
            </div>
          ) : (
            'Withdraw Request'
          )}
        </Button>
      </Form>
    );
  }

  // Add approve/refuse buttons if blockchain status is COMPLETED
  if (blockchainRequest.status === RepairRequestStatusType.COMPLETED) {
    tenantButtons.push(
      <div key="approve" className="space-y-2">
        <p className="text-white/70">Approve Work</p>
        <div className="flex gap-2">
          <Form method="post">
            <input type="hidden" name="_action" value="approveWork" />
            <input type="hidden" name="isAccepted" value="true" />
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
            >
              {pendingAction?.type === 'status' && pendingAction.expectedValue === RepairRequestStatusType.ACCEPTED ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>{pendingAction.description || 'Accepting...'}</span>
                </div>
              ) : (
                'Accept'
              )}
            </Button>
          </Form>
          <Form method="post">
            <input type="hidden" name="_action" value="approveWork" />
            <input type="hidden" name="isAccepted" value="false" />
            <Button
              type="submit"
              variant="danger"
              disabled={isPending}
            >
              {pendingAction?.type === 'status' && pendingAction.expectedValue === RepairRequestStatusType.REFUSED ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>{pendingAction.description || 'Refusing...'}</span>
                </div>
              ) : (
                'Refuse'
              )}
            </Button>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <>
      <RepairRequestDescription
        description={repairRequest.description}
        urgency={repairRequest.urgency}
        status={statusMap[blockchainRequest.status as keyof typeof statusMap]}
        availableStatusUpdates={availableStatusUpdates}
        isTenant={isTenant}
        isPending={isPending}
      >
        {tenantButtons}
      </RepairRequestDescription>

      {repairRequest.workDetails && (
        <RepairRequestWorkDetails
          workDetails={repairRequest.workDetails}
          isEditable={false}
          isPending={isPending}
        />
      )}
    </>
  );
}
