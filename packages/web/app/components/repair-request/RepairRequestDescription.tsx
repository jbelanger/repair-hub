import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { RepairRequestStatusType } from "~/utils/blockchain/config";

type Props = {
  description: string;
  urgency: string;
  status: string;
  availableStatusUpdates: RepairRequestStatusType[];
  isTenant: boolean;
  isPending: boolean;
  onStatusUpdate: (status: RepairRequestStatusType) => void;
  onWithdrawRequest: () => void;
  onApproveWork: (isAccepted: boolean) => void;
};

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
    <Card>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
          </div>
          <Badge>{urgency}</Badge>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Status</h4>
            <Badge variant={status === "PENDING" ? "warning" : status === "COMPLETED" ? "success" : "default"}>
              {status}
            </Badge>
          </div>

          {availableStatusUpdates.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Update Status</h4>
              <div className="flex gap-2 flex-wrap">
                {availableStatusUpdates.map((newStatus) => (
                  <Button
                    key={newStatus}
                    variant="secondary"
                    size="sm"
                    onClick={() => onStatusUpdate(newStatus)}
                    disabled={isPending}
                  >
                    {RepairRequestStatusType[newStatus]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isTenant && status === "PENDING" && (
            <div>
              <Button
                variant="danger"
                onClick={onWithdrawRequest}
                disabled={isPending}
              >
                Withdraw Request
              </Button>
            </div>
          )}

          {isTenant && status === "COMPLETED" && (
            <div className="space-y-2">
              <h4 className="font-medium">Approve Work</h4>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => onApproveWork(true)}
                  disabled={isPending}
                >
                  Accept
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onApproveWork(false)}
                  disabled={isPending}
                >
                  Refuse
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
