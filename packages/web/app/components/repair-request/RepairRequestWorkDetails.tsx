import { Wrench } from "lucide-react";
import { Form } from "@remix-run/react";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { TextArea } from "~/components/ui/TextArea";
import { FormField } from "~/components/ui/Form";
import type { ReactNode } from "react";

interface Props {
  workDetails: string;
  isPending?: boolean;
  isEditable?: boolean;
  onWorkDetailsChange?: (value: string) => void;
  originalWorkDetails?: string;
  children?: ReactNode;
}

export function RepairRequestWorkDetails({
  workDetails,
  isPending,
  isEditable = false,
  onWorkDetailsChange,
  originalWorkDetails,
  children,
}: Props) {
  if (!isEditable) {
    return (
      <Card
        accent="purple"
        header={{
          title: "Work Details",
          icon: <Wrench className="h-5 w-5" />,
          iconBackground: true
        }}
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-white/70">Details</p>
              <div className="text-white text-base font-medium whitespace-pre-wrap leading-relaxed">
                {workDetails || "No work details provided yet."}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const hasChanges = workDetails !== originalWorkDetails;

  return (
    <Card
      accent="purple"
      header={{
        title: "Work Details",
        icon: <Wrench className="h-5 w-5" />,
        iconBackground: true
      }}
    >
      <div className="p-6">
        <Form method="post">
          <input type="hidden" name="_action" value="updateWorkDetails" />
          <div className="space-y-4">
            <FormField label="Work Details">
              <TextArea
                name="workDetails"
                value={workDetails}
                onChange={(e) => onWorkDetailsChange?.(e.target.value)}
                placeholder="Enter work details..."
                disabled={isPending}
              />
            </FormField>
            {hasChanges && (
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !workDetails.trim()}
                leftIcon={<Wrench className="h-5 w-5" />}
              >
                Update Work Details
              </Button>
            )}
            {children}
          </div>
        </Form>
      </div>
    </Card>
  );
}
