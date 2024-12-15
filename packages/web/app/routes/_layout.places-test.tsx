import { PlacesAutocomplete } from "~/components/PlacesAutocomplete";

export default function PlacesTest() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-white">Google Places API Test</h1>
        <p className="text-white/60">Test the places autocomplete functionality</p>
      </div>
      
      <div className="w-full max-w-xl space-y-4">
        <PlacesAutocomplete />
        <p className="text-sm text-white/60">
          Start typing an address to see suggestions
        </p>
      </div>
    </div>
  );
}
