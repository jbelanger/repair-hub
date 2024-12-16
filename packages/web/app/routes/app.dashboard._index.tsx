import { redirect } from "@remix-run/node";

export async function loader() {
  // Redirect to the profile tab by default
  return redirect("/app/dashboard/profile");
}
