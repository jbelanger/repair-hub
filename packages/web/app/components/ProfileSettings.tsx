import { Form } from "@remix-run/react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";
import { User } from "@prisma/client";
import { User as UserIcon } from "lucide-react";
import { FormField, FormSection, FormActions, FormError } from "./ui/Form";

interface ProfileSettingsProps {
  user: Omit<User, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  };
  isSubmitting?: boolean;
  error?: string;
}

export function ProfileSettings({ user, isSubmitting, error }: ProfileSettingsProps) {
  return (
    <Card
      variant="default"
      accent="purple"
      header={{
        title: "Personal Information",
        subtitle: "Update your profile details",
        icon: <UserIcon className="h-5 w-5" />,
        iconBackground: true
      }}
    >
      <Form method="post" className="space-y-6">
        <FormSection className="space-y-4">
          <FormField label="Full Name">
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              placeholder="Your full name"
              required
            />
          </FormField>

          <FormField label="Email Address">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              placeholder="you@example.com"
              required
            />
          </FormField>

          <FormField label="Phone Number">
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone || ""}
              placeholder="Your phone number"
            />
          </FormField>

          <FormField label="Ethereum Address">
            <div className="text-sm font-mono bg-white/5 rounded-lg p-3 break-all">
              {user.address}
            </div>
            <p className="text-sm text-white/50 mt-1">
              Your Ethereum address is used for blockchain operations and cannot be changed
            </p>
          </FormField>

          <FormField label="Account Type">
            <div className="text-sm bg-white/5 rounded-lg p-3">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </div>
          </FormField>
        </FormSection>

        <FormError error={error} />

        <FormActions
          submitLabel={isSubmitting ? "Saving..." : "Save Changes"}
          isSubmitting={isSubmitting}
        />
      </Form>
    </Card>
  );
}
