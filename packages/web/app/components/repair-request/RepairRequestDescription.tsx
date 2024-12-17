import { AlertTriangle, FileText, User2 } from "lucide-react";
import { Form } from "@remix-run/react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import type { ReactNode } from "react";

type Props = {
  description: string;
  urgency: string;
  status: string;
  availableStatusUpdates?: RepairRequestStatusType[];
  isTenant: boolean;  // This should be true only if the user is the actual initiator
  isPending: boolean;
  children?: ReactNode;
};

export function RepairRequestDescription({
  description,
  urgency,
  status,
  isTenant,
  isPending,
  availableStatusUpdates = [],
  children,
}: Props) {
  const showLandlordActions = !isTenant && children;
  const showTenantActions = isTenant;
  // A tenant can withdraw if they are the initiator and the status is pending
  const canWithdraw = isTenant && status === "PENDING";
  const canApproveWork = status === "COMPLETED";

  // Only show the actions section if there are actually actions to show
  const showActionsSection = (showLandlordActions) || 
                           (showTenantActions && (canWithdraw || canApproveWork));

  return (
    <Card
      accent="primary"
      header={{
        title: "Request Details",
        icon: <FileText className="h-5 w-5" />,
        iconBackground: true
      }}
    >
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-white/70">Description</p>
                <p className="text-white font-medium">{description}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-white/70">Urgency</p>
                <div className="text-white">
                  <Badge>{urgency}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User2 className="h-5 w-5 text-primary-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-white/70">Status</p>
                <div className="text-white">
                  <Badge variant={status === "PENDING" ? "warning" : status === "COMPLETED" ? "success" : "default"}>
                    {status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showActionsSection && (
        <div className="px-6 py-4 border-t border-purple-600/10">
          {showLandlordActions && (
            <div className="flex flex-wrap gap-2">
              {children}
            </div>
          )}

          {showTenantActions && (
            <div className="space-y-2">
              {canWithdraw && (
                <Form method="post">
                  <input type="hidden" name="_action" value="withdrawRequest" />
                  <Button
                    type="submit"
                    variant="danger"
                    disabled={isPending}
                  >
                    Withdraw Request
                  </Button>
                </Form>
              )}
              {canApproveWork && (
                <div className="space-y-2">
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
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
