import { type ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  
  return logout(request);
}
