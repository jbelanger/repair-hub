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
      <h1 className="text-3xl font-bold mb-8">Register</h1>

      {!address ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          Please connect your wallet first to register.
        </div>
      ) : (
        <Form method="post" className="max-w-md space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              name="role"
              id="role"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select a role</option>
              <option value="TENANT">Tenant</option>
              <option value="LANDLORD">Landlord</option>
            </select>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone (optional)
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <input type="hidden" name="address" value={address} />

          {actionData?.error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              {actionData.error}
            </div>
          )}

          {actionData?.success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
              Registration successful!
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Register
          </button>
        </Form>
      )}
    </div>
  );
}
