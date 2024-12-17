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
  availableStatusUpdates: RepairRequestStatusType[];
  isTenant: boolean;
  isPending: boolean;
  children?: ReactNode;
};

export function RepairRequestDescription({
  description,
  urgency,
  status,
  isTenant,
  isPending,
  availableStatusUpdates,
  children,
}: Props) {
  const showActions = !isTenant && availableStatusUpdates.length > 0;

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
                <div className="space-y-3">
                  <div className="text-white">
                    <Badge variant={status === "PENDING" ? "warning" : status === "COMPLETED" ? "success" : "default"}>
                      {status}
                    </Badge>
                  </div>
                  {showActions && (
                    <div className="flex flex-wrap gap-2">
                      {children}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isTenant && (
            <div className="pt-4 border-t border-primary-600/10">
              {status === "PENDING" ? (
                <div className="space-y-2">
                  <p className="text-white/70">Actions</p>
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
                </div>
              ) : status === "COMPLETED" && (
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
      </div>
    </Card>
  );
}
