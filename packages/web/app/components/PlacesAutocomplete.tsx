import { useState, useRef, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher<PlacesResponse>();
  
  const predictions = fetcher.data?.predictions || [];

  useEffect(() => {
    if (predictions.length > 0) {
      setIsOpen(true);
    }
  }, [predictions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedPlace(null);
    setActiveIndex(-1);
    
    if (value.length > 2) {
      fetcher.load(`/api/places-autocomplete?query=${encodeURIComponent(value)}`);
    } else {
      setIsOpen(false);
    }
  };

  const handlePlaceSelect = (prediction: Prediction) => {
    setQuery(prediction.description);
    setSelectedPlace(prediction);
    setIsOpen(false);
    onPlaceSelect?.(prediction);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && predictions[activeIndex]) {
          handlePlaceSelect(predictions[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  const baseStyles = "w-full transition-all duration-200";
  const containerStyles = cn(
    "relative flex items-center rounded-full overflow-hidden",
    "bg-[#0F0F0F]",
    "border border-purple-600",
    "focus-within:border-purple-500",
    "hover:border-purple-500"
  );

  return (
    <div className="relative w-full">
      <div className={containerStyles}>
        <div className="absolute inset-y-0 flex items-center text-purple-500 left-4">
          {leftIcon}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            baseStyles,
            "bg-transparent pl-11 pr-10 py-2.5 outline-none",
            !query && "text-white/50",
            query && "text-white",
            "focus:ring-0"
          )}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="places-listbox"
          aria-activedescendant={activeIndex >= 0 ? `place-${predictions[activeIndex]?.place_id}` : undefined}
          aria-describedby={ariaDescribedby}
        />
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
      
      {isOpen && predictions.length > 0 && (
        <ul
          ref={listRef}
          id="places-listbox"
          role="listbox"
          aria-label="Places suggestions"
          className={cn(
            "absolute z-50 w-full",
            "top-[calc(100%+0.5rem)]",
            "rounded-xl overflow-hidden",
            "border border-purple-600/50",
            "bg-[#0F0F0F]",
            "shadow-md animate-in fade-in-0 zoom-in-95",
            "max-h-[280px] overflow-y-auto",
            "py-1",
            "divide-y divide-purple-600/20"
          )}
        >
          {predictions.map((prediction, index) => (
            <li
              key={prediction.place_id}
              id={`place-${prediction.place_id}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "relative flex cursor-pointer select-none items-center",
                "px-4 py-3",
                "text-sm text-white/90",
                "hover:bg-purple-600/10",
                "transition-colors",
                index === activeIndex && "bg-purple-600/20 text-white"
              )}
              onClick={() => handlePlaceSelect(prediction)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {prediction.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
