import { useState, useEffect, type ReactNode } from "react";
import { useActionData, useNavigation } from "@remix-run/react";
import { RepairRequestWorkDetails } from "./RepairRequestWorkDetails";
import { RepairRequestDescription } from "./RepairRequestDescription";
import type { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { LoaderData } from "~/types/repair-request";

type LandlordViewProps = {
  repairRequest: LoaderData['repairRequest'];
  availableStatusUpdates?: RepairRequestStatusType[];
  isPending: boolean;
  addToast: (message: string, type?: "success" | "error", title?: string) => void;
  children?: ReactNode;
};

export function LandlordView({
  repairRequest,
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

  return (
    <>
      <RepairRequestDescription
        description={repairRequest.description}
        urgency={repairRequest.urgency}
        status={repairRequest.status}
        availableStatusUpdates={availableStatusUpdates}
        isTenant={false}
        isPending={isPending}
      >
        {children}
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
