import { AlertTriangle, Hash } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Select } from "~/components/ui/Select";
import { FormField } from "~/components/ui/Form";
import { RepairStatus, RepairUrgency } from "~/components/ui/StatusBadge";
import { RepairRequestStatusType } from "~/utils/blockchain/config";

interface Props {
  description: string;
  urgency: string;
  status: string;
  availableStatusUpdates: RepairRequestStatusType[];
  isTenant: boolean;
  isPending: boolean;
  onStatusUpdate: (status: RepairRequestStatusType) => void;
  onWithdrawRequest: () => void;
  onApproveWork: (isAccepted: boolean) => void;
}

export function RepairRequestDescription({
  description,
  urgency,
  status,
  availableStatusUpdates,
  isTenant,
  isPending,
  onStatusUpdate,
  onWithdrawRequest,
  onApproveWork,
}: Props) {
  return (
    <Card
      accent="purple"
      header={{
        title: "Description",
        icon: <Hash className="h-5 w-5" />,
        iconBackground: true,
        extra: <RepairUrgency urgency={urgency} />
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <RepairStatus status={status} />
        </div>
        <p className="text-white/70">{description}</p>
        {availableStatusUpdates.length > 0 && (
          <div className="mt-6 pt-6 border-t border-purple-600/10">
            <FormField label="Update Status">
              <div className="flex gap-4">
                <Select
                  value=""
                  onChange={(e) => onStatusUpdate(Number(e.target.value))}
                  disabled={isPending}
                >
                  <option value="">Select new status...</option>
                  {availableStatusUpdates.map((status) => (
                    <option key={status} value={status}>
                      {RepairRequestStatusType[status].replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
                {status === 'PENDING' && isTenant && (
                  <Button
                    variant="danger"
                    onClick={onWithdrawRequest}
                    disabled={isPending}
                    leftIcon={<AlertTriangle className="h-5 w-5" />}
                  >
                    Withdraw Request
                  </Button>
                )}
                {status === 'COMPLETED' && isTenant && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => onApproveWork(true)}
                      disabled={isPending}
                    >
                      Approve Work
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => onApproveWork(false)}
                      disabled={isPending}
                    >
                      Refuse Work
                    </Button>
                  </div>
                )}
              </div>
            </FormField>
          </div>
        )}
      </div>
    </Card>
  );
}
