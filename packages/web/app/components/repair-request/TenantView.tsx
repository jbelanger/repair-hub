import { RepairRequestDescription } from "./RepairRequestDescription";
import { RepairRequestWorkDetails } from "./RepairRequestWorkDetails";
import type { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { LoaderData } from "~/types/repair-request";

type TenantViewProps = {
  repairRequest: LoaderData['repairRequest'];
  availableStatusUpdates?: RepairRequestStatusType[];
  isPending: boolean;
  isTenant: boolean;
};

export function TenantView({
  repairRequest,
  availableStatusUpdates = [],
  isPending,
  isTenant,
}: TenantViewProps) {
  return (
    <>
      <RepairRequestDescription
        description={repairRequest.description}
        urgency={repairRequest.urgency}
        status={repairRequest.status}
        availableStatusUpdates={availableStatusUpdates}
        isTenant={isTenant}
        isPending={isPending}
      />

      {repairRequest.workDetails && (
        <RepairRequestWorkDetails
          workDetails={repairRequest.workDetails}
          isEditable={false}
        />
      )}
    </>
  );
}
