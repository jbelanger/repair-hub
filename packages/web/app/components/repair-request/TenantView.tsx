import { RepairRequestDescription } from "./RepairRequestDescription";
import { RepairRequestWorkDetails } from "./RepairRequestWorkDetails";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { LoaderData } from "~/types/repair-request";
import type { SerializedContractRepairRequest } from "~/utils/blockchain/types/repair-request";
import { statusMap } from "~/utils/repair-request";

type TenantViewProps = {
  repairRequest: LoaderData['repairRequest'];
  blockchainRequest: SerializedContractRepairRequest;
  availableStatusUpdates?: RepairRequestStatusType[];
  isPending: boolean;
  isTenant: boolean;
};

export function TenantView({
  repairRequest,
  blockchainRequest,
  availableStatusUpdates = [],
  isPending,
  isTenant,
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
          Withdraw Request
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
              Accept
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
              Refuse
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
