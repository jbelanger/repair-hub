import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary-300">Register</h1>

      {!address ? (
        <div className="bg-tertiary-900 border-l-4 border-tertiary-500 text-tertiary-300 p-4 mb-4">
          Please connect your wallet first to register.
        </div>
      ) : (
        <Form method="post" className="max-w-md space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-white">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="mt-1 block w-full rounded-md border-primary-700 bg-primary-900 text-neutral-white shadow-sm focus:border-primary-400 focus:ring-primary-400"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-white">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-1 block w-full rounded-md border-primary-700 bg-primary-900 text-neutral-white shadow-sm focus:border-primary-400 focus:ring-primary-400"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-neutral-white">
              Role
            </label>
            <select
              name="role"
              id="role"
              required
              className="mt-1 block w-full rounded-md border-primary-700 bg-primary-900 text-neutral-white shadow-sm focus:border-primary-400 focus:ring-primary-400"
            >
              <option value="">Select a role</option>
              <option value="TENANT">Tenant</option>
              <option value="LANDLORD">Landlord</option>
            </select>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-white">
              Phone (optional)
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              className="mt-1 block w-full rounded-md border-primary-700 bg-primary-900 text-neutral-white shadow-sm focus:border-primary-400 focus:ring-primary-400"
            />
          </div>

          <input type="hidden" name="address" value={address} />

          {actionData?.error && (
            <div className="bg-secondary-900 border-l-4 border-secondary-500 text-secondary-300 p-4">
              {actionData.error}
            </div>
          )}

          {actionData?.success && (
            <div className="bg-primary-900 border-l-4 border-primary-500 text-primary-300 p-4">
              Registration successful!
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 transition-colors"
          >
            Register
          </button>
        </Form>
      )}
    </div>
  );
}
