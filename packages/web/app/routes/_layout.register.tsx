import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { User, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

type ActionData = {
  success?: boolean;
  error?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;

  if (!name || !email || !role || !address) {
    return json<ActionData>(
      { success: false, error: "All fields except phone are required" },
      { status: 400 }
    );
  }

  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        role,
        phone: phone || null,
        address,
      },
    });

    return json<ActionData>({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to register user" },
      { status: 500 }
    );
  }
}

export default function Register() {
  const { address } = useAccount();
  const actionData = useActionData<typeof action>();
  const [selectedRole, setSelectedRole] = useState("");

  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-6 text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Create Account</h1>
        <p className="text-lg text-white/70">
          Join RepairHub to start managing your property repairs and maintenance
        </p>
      </div>

      {!address ? (
        <div className="rounded-lg border border-purple-600/20 bg-purple-600/5 p-4 text-purple-200">
          Please connect your wallet first to register.
        </div>
      ) : (
        <Form method="post" className="space-y-6">
          <div className="space-y-4">
            <Input
              type="text"
              name="name"
              id="name"
              placeholder="Full Name"
              required
              leftIcon={<User className="h-5 w-5" />}
            />

            <Input
              type="email"
              name="email"
              id="email"
              placeholder="Email Address"
              required
              leftIcon={<Mail className="h-5 w-5" />}
            />

            <Select
              name="role"
              id="role"
              required
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Select your role</option>
              <option value="TENANT">Tenant</option>
              <option value="LANDLORD">Landlord</option>
            </Select>

            <Input
              type="tel"
              name="phone"
              id="phone"
              placeholder="Phone Number (Optional)"
              leftIcon={<Phone className="h-5 w-5" />}
            />

            <Input
              type="text"
              name="address"
              id="address"
              placeholder="Property Address"
              required
              leftIcon={<MapPin className="h-5 w-5" />}
            />

            <input type="hidden" name="address" value={address} />
          </div>

          {actionData?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-200">
              {actionData.error}
            </div>
          )}

          {actionData?.success && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-green-200">
              Registration successful!
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
          >
            Create Account
          </Button>

          <p className="text-center text-sm text-white/50">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Privacy Policy
            </a>
          </p>
        </Form>
      )}
    </div>
  );
}
