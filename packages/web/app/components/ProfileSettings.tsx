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
            <div className="flex items-center gap-4">
              <select
                name="role"
                defaultValue={user.role}
                className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="TENANT">Tenant</option>
                <option value="LANDLORD">Landlord</option>
              </select>
              <p className="text-sm text-white/50">
                Switch between tenant and landlord roles
              </p>
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
