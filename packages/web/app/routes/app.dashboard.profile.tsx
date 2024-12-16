import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { ProfileSettings } from "~/components/ProfileSettings";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const userWithDetails = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!userWithDetails) {
    throw new Response("User not found", { status: 404 });
  }

  return json({ user: userWithDetails });
}

export default function DashboardProfile() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">
          Profile Settings
        </h2>
        <p className="mt-1 text-white/70">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <ProfileSettings user={user} />
      </div>
    </div>
  );
}
