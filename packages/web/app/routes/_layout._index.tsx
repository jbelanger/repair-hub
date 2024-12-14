import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async () => {
  return json({
    message: "Welcome to RepairHub",
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">{data.message}</h1>
      <p className="text-lg">
        A decentralized platform for managing property repairs and maintenance.
      </p>
    </div>
  );
}
