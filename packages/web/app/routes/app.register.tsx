import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { createUserSession } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Building2, User } from "lucide-react";
import { Card } from "~/components/ui/Card";

type ActionData = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    plan?: string;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address")?.toLowerCase();
  const plan = url.searchParams.get("plan");

  if (!address) {
    return redirect("/app");
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { address }
  });

  if (existingUser) {
    throw await createUserSession(existingUser.id, "/");
  }

  // Get available plans
  const plans = await db.plan.findMany({
    orderBy: { price: 'asc' }
  });

  return json({ address, plans });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const address = formData.get("address") as string;
  const plan = formData.get("plan") as string;

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Name is required";
  if (!email || !email.includes("@")) fieldErrors.email = "Valid email is required";
  if (!role) fieldErrors.role = "Role is required";
  if (role === "LANDLORD" && !plan) fieldErrors.plan = "Plan is required";

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  try {
    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        address: address.toLowerCase(),
      },
    });

    // If landlord, create subscription
    if (role === "LANDLORD" && plan) {
      await db.subscription.create({
        data: {
          userId: user.id,
          planId: plan,
          status: "ACTIVE",
          interval: "MONTHLY",
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });
    }

    return createUserSession(user.id, "/");
  } catch (error) {
    console.error("Registration error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}

export default function Register() {
  const { address, plans } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Create your account
        </h1>
        <p className="mt-2 text-lg text-white/70">
          Get started with your property management journey
        </p>
      </div>

      <Form method="post" className="space-y-8">
        <input type="hidden" name="address" value={address} />

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            as="label"
            className="relative flex flex-col items-center p-6 cursor-pointer hover:bg-white/5"
          >
            <input
              type="radio"
              name="role"
              value="TENANT"
              className="sr-only"
              defaultChecked={selectedPlan === null}
            />
            <User className="h-8 w-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold">Tenant</h3>
            <p className="text-sm text-white/70 text-center mt-2">
              Find and rent properties, submit repair requests
            </p>
          </Card>

          <Card
            as="label"
            className="relative flex flex-col items-center p-6 cursor-pointer hover:bg-white/5"
          >
            <input
              type="radio"
              name="role"
              value="LANDLORD"
              className="sr-only"
              defaultChecked={selectedPlan !== null}
            />
            <Building2 className="h-8 w-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold">Landlord</h3>
            <p className="text-sm text-white/70 text-center mt-2">
              Manage properties and tenants
            </p>
          </Card>
        </div>

        {/* Plan Selection (only for landlords) */}
        {plans.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Select a Plan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  as="label"
                  className="relative flex flex-col p-6 cursor-pointer hover:bg-white/5"
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    className="sr-only"
                    defaultChecked={selectedPlan === plan.name.toLowerCase()}
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold">{plan.name}</h4>
                      <p className="text-sm text-white/70 mt-1">
                        Up to {plan.maxProperties} {plan.maxProperties === 1 ? 'property' : 'properties'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${plan.price}</div>
                      <div className="text-sm text-white/70">/month</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* User Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/70">
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/70">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/70">
              Phone Number (Optional)
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Your phone number"
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70">
              Ethereum Address
            </label>
            <div className="mt-1 text-sm font-mono bg-white/5 rounded-lg p-3 break-all">
              {address}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/" className="flex-1">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
          >
            Create Account
          </Button>
        </div>
      </Form>
    </div>
  );
}
