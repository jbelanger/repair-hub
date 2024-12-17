import { useState, useEffect, type ReactNode } from "react";
import { useActionData, useNavigation, Form } from "@remix-run/react";
import { RepairRequestWorkDetails } from "./RepairRequestWorkDetails";
import { RepairRequestDescription } from "./RepairRequestDescription";
import { Button } from "~/components/ui/Button";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { LoaderData } from "~/types/repair-request";
import type { ContractRepairRequest } from "~/utils/blockchain/types/repair-request";
import { statusMap } from "~/utils/repair-request";

type LandlordViewProps = {
  repairRequest: LoaderData['repairRequest'];
  blockchainRequest: ContractRepairRequest;
  availableStatusUpdates?: RepairRequestStatusType[];
  isPending: boolean;
  addToast: (message: string, type?: "success" | "error", title?: string) => void;
  children?: ReactNode;
};

export function LandlordView({
  repairRequest,
  blockchainRequest,
  availableStatusUpdates = [],
  isPending,
  addToast,
  children,
}: LandlordViewProps) {
  const [workDetailsInput, setWorkDetailsInput] = useState(repairRequest.workDetails || "");
  const [hasShownToast, setHasShownToast] = useState(false);
  const actionData = useActionData<{ success?: boolean; error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Reset toast flag when form is submitted
  useEffect(() => {
    if (isSubmitting) {
      setHasShownToast(false);
    }
  }, [isSubmitting]);

  // Show toast when action completes
  useEffect(() => {
    if (!hasShownToast && !isSubmitting && actionData) {
      if (actionData.success) {
        addToast(
          "Work details updated successfully",
          "success",
          "Update Successful"
        );
      } else if (actionData.error) {
        addToast(
          actionData.error,
          "error",
          "Update Failed"
        );
      }
      setHasShownToast(true);
    }
  }, [actionData, isSubmitting, hasShownToast, addToast]);

  // Generate status update buttons based on available transitions
  const statusButtons = availableStatusUpdates.map(status => {
    let label = "";
    let variant: "primary" | "danger" | "default" = "default";

    switch (status) {
      case RepairRequestStatusType.IN_PROGRESS:
        label = "Start Work";
        variant = "primary";
        break;
      case RepairRequestStatusType.COMPLETED:
        label = "Mark as Completed";
        variant = "primary";
        break;
      case RepairRequestStatusType.REJECTED:
        label = "Reject Request";
        variant = "danger";
        break;
      default:
        return null;
    }

    if (!label) return null;

    return (
      <Form method="post" key={status} className="inline">
        <input type="hidden" name="_action" value="updateStatus" />
        <input type="hidden" name="status" value={status} />
        <Button
          type="submit"
          variant={variant}
          disabled={isPending || isSubmitting}
        >
          {label}
        </Button>
      </Form>
    );
  });

  return (
    <>
      <RepairRequestDescription
        description={repairRequest.description}
        urgency={repairRequest.urgency}
        status={statusMap[blockchainRequest.status as keyof typeof statusMap]}
        availableStatusUpdates={availableStatusUpdates}
        isTenant={false}
        isPending={isPending}
      >
        {statusButtons}
      </RepairRequestDescription>

      <RepairRequestWorkDetails
        workDetails={workDetailsInput}
        isPending={isPending || isSubmitting}
        isEditable={true}
        onWorkDetailsChange={setWorkDetailsInput}
      />
    </>
  );
}
