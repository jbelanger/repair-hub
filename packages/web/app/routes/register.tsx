import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { createUserSession } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Building2, User } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/ui/PageHeader";
import { useAccount } from 'wagmi';
import { useEffect, useState } from "react";


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

type LoaderData = {
  address: string;
  plans: Awaited<ReturnType<typeof db.plan.findMany>>;
  existingUser: Awaited<ReturnType<typeof db.user.findUnique>>;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return redirect("/");
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { address: address.toLowerCase() }
    });

    // Get available plans
    const plans = await db.plan.findMany({
      orderBy: { price: 'asc' }
    });

    return json<LoaderData>({ 
      address, 
      plans, 
      existingUser 
    });
  } catch (error) {
    console.error("Database error:", error);
    // Return empty plans array if database is not accessible
    return json<LoaderData>({ 
      address, 
      plans: [], 
      existingUser: null,
      error: "Failed to load user data"
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const address = formData.get("address") as string;
  const plan = formData.get("plan") as string;

  if (!address) {
    return json<ActionData>(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  const fieldErrors: ActionData["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Name is required";
  if (!email || !email.includes("@")) fieldErrors.email = "Valid email is required";
  if (!role) fieldErrors.role = "Role is required";
  if (role === "LANDLORD" && !plan) fieldErrors.plan = "Plan is required";

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (existingUser) {
      return json<ActionData>(
        { error: "An account with this wallet already exists" },
        { status: 400 }
      );
    }

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

    return createUserSession(user.id, "/dashboard");
  } catch (error) {
    console.error("Registration error:", error);
    return json<ActionData>(
      { success: false, error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}

export default function Register() {
  const { address, plans, existingUser, error } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Redirect to home if wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      navigate('/', { replace: true });
    }
  }, [isConnected, navigate]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-500">
            Error Loading Data
          </h2>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {error}
          </p>
          <Link to="/">
            <Button variant="primary" size="lg">
              Return Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (existingUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Welcome Back!
          </h2>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            It looks like you already have an account. Please proceed to the dashboard to manage your properties and repair requests.
          </p>
          <Link to="/dashboard">
            <Button variant="primary" size="lg">
              Go to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    if (role === "TENANT") {
      setSelectedPlanId(""); // Reset plan when switching to tenant
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Create your account"
        subtitle="Get started with your property management journey"
        backTo="/"
      />

      <Form method="post" className="space-y-8">
        <input type="hidden" name="address" value={address} />

        {/* Role Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Select your role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => handleRoleSelect("TENANT")}>
              <Card
                className="relative flex flex-col items-center p-6 cursor-pointer transition-colors hover:bg-purple-500/5 border-2 border-transparent data-[checked]:border-purple-500"
                data-checked={selectedRole === "TENANT"}
              >
                <input
                  type="radio"
                  name="role"
                  value="TENANT"
                  className="sr-only"
                  checked={selectedRole === "TENANT"}
                  onChange={() => {}} // Empty onChange to avoid React warning
                />
                <User className="h-8 w-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tenant</h3>
                <p className="text-sm text-center mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Find and rent properties, submit repair requests
                </p>
              </Card>
            </div>

            <div onClick={() => handleRoleSelect("LANDLORD")}>
              <Card
                className="relative flex flex-col items-center p-6 cursor-pointer transition-colors hover:bg-purple-500/5 border-2 border-transparent data-[checked]:border-purple-500"
                data-checked={selectedRole === "LANDLORD"}
              >
                <input
                  type="radio"
                  name="role"
                  value="LANDLORD"
                  className="sr-only"
                  checked={selectedRole === "LANDLORD"}
                  onChange={() => {}} // Empty onChange to avoid React warning
                />
                <Building2 className="h-8 w-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Landlord</h3>
                <p className="text-sm text-center mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Manage properties and tenants
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Plan Selection (only for landlords) */}
        {selectedRole === "LANDLORD" && plans.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Select a Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} onClick={() => handlePlanSelect(plan.id)}>
                  <Card
                    className="relative flex flex-col p-6 cursor-pointer transition-colors hover:bg-purple-500/5 border-2 border-transparent data-[checked]:border-purple-500"
                    data-checked={selectedPlanId === plan.id}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      className="sr-only"
                      checked={selectedPlanId === plan.id}
                      onChange={() => {}} // Empty onChange to avoid React warning
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{plan.name}</h4>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          Up to {plan.maxProperties} {plan.maxProperties === 1 ? 'property' : 'properties'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-500">${plan.price}</div>
                        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>/month</div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Information */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Personal Information
          </h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Phone Number (Optional)
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Ethereum Address
            </label>
            <div className="text-sm font-mono bg-purple-500/5 rounded-lg p-3 break-all" style={{ color: 'var(--color-text-primary)' }}>
              {address}
            </div>
          </div>
        </Card>

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
