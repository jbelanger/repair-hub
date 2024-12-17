import { RepairRequestWorkDetails } from "./RepairRequestWorkDetails";
import { RepairRequestDescription } from "./RepairRequestDescription";
import type { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { LoaderData } from "~/types/repair-request";

type LandlordViewProps = {
  repairRequest: LoaderData['repairRequest'];
  availableStatusUpdates: RepairRequestStatusType[];
  isPending: boolean;
  workDetails: string;
  onWorkDetailsChange: (value: string) => void;
  onWorkDetailsSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onStatusUpdate: (status: RepairRequestStatusType) => void;
};

export function LandlordView({
  repairRequest,
  availableStatusUpdates,
  isPending,
  workDetails,
  onWorkDetailsChange,
  onWorkDetailsSubmit,
  onStatusUpdate,
}: LandlordViewProps) {
  // Landlords don't need withdraw or approve functionality
  const noOp = () => {};

  return (
    <>
      <RepairRequestDescription
        description={repairRequest.description}
        urgency={repairRequest.urgency}
        status={repairRequest.status}
        availableStatusUpdates={availableStatusUpdates}
        isTenant={false}
        isPending={isPending}
        onStatusUpdate={onStatusUpdate}
        onWithdrawRequest={noOp}
        onApproveWork={noOp}
      />

      <RepairRequestWorkDetails
        workDetails={workDetails}
        isPending={isPending}
        onWorkDetailsChange={onWorkDetailsChange}
        onSubmit={onWorkDetailsSubmit}
      />
    </>
  );
}
