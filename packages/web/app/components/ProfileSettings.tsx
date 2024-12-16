import { Form } from "@remix-run/react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { User } from "@prisma/client";

interface ProfileSettingsProps {
  user: User;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  return (
    <Form method="post" action="/api/update-profile" className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-white/70">
            Full Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name}
            placeholder="Your full name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white/70">
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-white/70">
            Phone Number
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={user.phone || ""}
            placeholder="Your phone number"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">
            Ethereum Address
          </label>
          <div className="text-sm font-mono bg-white/5 rounded-lg p-3 break-all">
            {user.address}
          </div>
          <p className="text-sm text-white/50 mt-1">
            Your Ethereum address is used for blockchain operations and cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">
            Account Type
          </label>
          <div className="text-sm bg-white/5 rounded-lg p-3">
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </div>
    </Form>
  );
}
