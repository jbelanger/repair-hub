import { RepairRequestDescription } from "./RepairRequestDescription";
import { RepairRequestWorkDetails } from "./RepairRequestWorkDetails";
import type { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { LoaderData } from "~/types/repair-request";

type TenantViewProps = {
  repairRequest: LoaderData['repairRequest'];
  availableStatusUpdates: RepairRequestStatusType[];
  isPending: boolean;
  onStatusUpdate: (status: RepairRequestStatusType) => void;
  onWithdrawRequest: () => void;
  onApproveWork: (isAccepted: boolean) => void;
};

export function TenantView({
  repairRequest,
  availableStatusUpdates,
  isPending,
  onStatusUpdate,
  onWithdrawRequest,
  onApproveWork,
}: TenantViewProps) {
  const noOp = () => {};

  return (
    <>
      <RepairRequestDescription
        description={repairRequest.description}
        urgency={repairRequest.urgency}
        status={repairRequest.status}
        availableStatusUpdates={availableStatusUpdates}
        isTenant={true}
        isPending={isPending}
        onStatusUpdate={onStatusUpdate}
        onWithdrawRequest={onWithdrawRequest}
        onApproveWork={onApproveWork}
      />

      {repairRequest.workDetails && (
        <RepairRequestWorkDetails
          workDetails={repairRequest.workDetails}
          isPending={isPending}
          onWorkDetailsChange={noOp}
          onSubmit={noOp}
          isReadOnly={true}
        />
      )}
    </>
  );
}
