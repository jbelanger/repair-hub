import { Wrench } from "lucide-react";
import { Form } from "@remix-run/react";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { TextArea } from "~/components/ui/TextArea";
import { FormField, FormSection } from "~/components/ui/Form";

interface Props {
  workDetails: string;
  isPending: boolean;
  onWorkDetailsChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function RepairRequestWorkDetails({
  workDetails,
  isPending,
  onWorkDetailsChange,
  onSubmit,
}: Props) {
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
        <Form method="post" onSubmit={onSubmit}>
          <input type="hidden" name="_action" value="updateWorkDetails" />
          <FormSection>
            <FormField label="Work Details">
              <TextArea
                name="workDetails"
                value={workDetails}
                onChange={(e) => onWorkDetailsChange(e.target.value)}
                placeholder="Enter work details..."
                disabled={isPending}
              />
            </FormField>
            <Button
              type="submit"
              disabled={isPending || !workDetails}
              leftIcon={<Wrench className="h-5 w-5" />}
            >
              Update Work Details
            </Button>
          </FormSection>
        </Form>
      </div>
    </Card>
  );
}
