import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { cn } from "~/utils/cn";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";

interface Prediction {
  place_id: string;
  description: string;
}

interface PlacesResponse {
  predictions: Prediction[];
  status: string;
}

interface PlacesAutocompleteProps {
  onPlaceSelect?: (place: Prediction) => void;
  leftIcon?: ReactNode;
  placeholder?: string;
  "aria-describedby"?: string;
}

export function PlacesAutocomplete({ 
  onPlaceSelect, 
  leftIcon = <MapPin className="h-5 w-5" />,
  placeholder = "Search for a place...",
  "aria-describedby": ariaDescribedby
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Prediction | null>(null);
  const fetcher = useFetcher<PlacesResponse>();
  
  const predictions = fetcher.data?.predictions || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedPlace(null); // Clear selected place when input changes
    
    if (value.length > 2) {
      fetcher.load(`/api/places-autocomplete?query=${encodeURIComponent(value)}`);
    }
  };

  const handlePlaceSelect = (prediction: Prediction) => {
    setQuery(prediction.description);
    setSelectedPlace(prediction);
    onPlaceSelect?.(prediction);
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
          {leftIcon}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={inputStyles}
          aria-describedby={ariaDescribedby}
        />
        {/* Hidden inputs for form submission */}
        <input 
          type="hidden" 
          name="address" 
          value={selectedPlace?.description || query} 
        />
        <input 
          type="hidden" 
          name="placeId" 
          value={selectedPlace?.place_id || ""} 
        />
      </div>
      
      {predictions.length > 0 && (
        <div className={cn(
          "absolute z-50 w-full",
          "top-[calc(100%+0.5rem)]",
          "rounded-xl overflow-hidden",
          "border border-purple-600/50",
          "bg-[#0F0F0F]",
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
                  "hover:bg-purple-600/10",
                  "transition-colors",
                )}
                onClick={() => handlePlaceSelect(prediction)}
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
