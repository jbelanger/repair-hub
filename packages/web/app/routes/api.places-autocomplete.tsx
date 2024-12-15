import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  
  if (!query) {
    return json({ predictions: [] });
  }

  const VITE_GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!VITE_GOOGLE_MAPS_API_KEY) {
    throw new Error("VITE_GOOGLE_MAPS_API_KEY is not configured");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${VITE_GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Places API error:", error);
    return json({ error: "Failed to fetch places" }, { status: 500 });
  }
}
