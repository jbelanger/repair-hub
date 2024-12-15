import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { cn } from "~/utils/cn";
import { MapPin } from "lucide-react";

interface Prediction {
  place_id: string;
  description: string;
}

interface PlacesResponse {
  predictions: Prediction[];
  status: string;
}

export function PlacesAutocomplete() {
  const [query, setQuery] = useState("");
  const fetcher = useFetcher<PlacesResponse>();
  
  const predictions = fetcher.data?.predictions || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      fetcher.load(`/api/places-autocomplete?query=${encodeURIComponent(value)}`);
    }
  };

  const baseStyles = "w-full transition-all duration-200";
  const containerStyles = cn(
    "relative flex items-center rounded-full overflow-hidden",
    "bg-[#0F0F0F]",
    "border border-purple-600",
    "focus-within:border-purple-500",
    "hover:border-purple-500"
  );

  const inputStyles = cn(
    baseStyles,
    "bg-transparent pl-11 pr-10 py-2.5 outline-none",
    !query && "text-white/50",
    query && "text-white",
    "focus:ring-0"
  );

  const iconStyles = "absolute inset-y-0 flex items-center text-purple-500 left-4";

  return (
    <div className="relative w-full">
      <div className={containerStyles}>
        <div className={iconStyles}>
          <MapPin className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for a place..."
          className={inputStyles}
        />
      </div>
      
      {predictions.length > 0 && (
        <div className={cn(
          "absolute z-50 w-full",
          "top-[calc(100%+0.5rem)]",
          "rounded-xl overflow-hidden",
          "border border-purple-600/50",

          "shadow-md animate-in fade-in-0 zoom-in-95"
        )}>
          <ul className={cn(
            "max-h-[280px] overflow-y-auto",
            "py-1",
            "divide-y divide-purple-600/20"
          )}>
            {predictions.map((prediction: Prediction) => (
              <li
                key={prediction.place_id}
                className={cn(
                  "relative flex cursor-pointer select-none items-center",
                  "px-4 py-3",
                  "text-sm text-white/90",
                  
                  "transition-colors",
                  
                )}
                onClick={() => {
                  setQuery(prediction.description);
                }}
              >
                {prediction.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
