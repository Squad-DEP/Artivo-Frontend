"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Location } from "@/api/types/worker";

interface LocationInputProps {
  value: Partial<Location>;
  onChange: (location: Partial<Location>) => void;
  requireCountry?: boolean;
  disabled?: boolean;
}

// Common Nigerian cities/states for autocomplete suggestions
const NIGERIAN_LOCATIONS = {
  cities: [
    "Lagos",
    "Abuja",
    "Port Harcourt",
    "Ibadan",
    "Kano",
    "Kaduna",
    "Benin City",
    "Enugu",
    "Warri",
    "Aba",
    "Abeokuta",
    "Ilorin",
    "Onitsha",
    "Jos",
    "Calabar",
    "Uyo",
    "Owerri",
    "Akure",
    "Asaba",
    "Maiduguri",
  ],
  states: [
    "Lagos",
    "FCT",
    "Rivers",
    "Oyo",
    "Kano",
    "Kaduna",
    "Edo",
    "Enugu",
    "Delta",
    "Abia",
    "Ogun",
    "Kwara",
    "Anambra",
    "Plateau",
    "Cross River",
    "Akwa Ibom",
    "Imo",
    "Ondo",
    "Borno",
    "Bayelsa",
    "Osun",
    "Ekiti",
    "Kogi",
    "Niger",
    "Benue",
    "Nasarawa",
    "Taraba",
    "Adamawa",
    "Gombe",
    "Bauchi",
    "Jigawa",
    "Zamfara",
    "Sokoto",
    "Kebbi",
    "Yobe",
    "Ebonyi",
  ],
  countries: ["Nigeria", "Ghana", "Kenya", "South Africa", "Cameroon", "Tanzania", "Uganda"],
};

type FieldName = "city" | "state" | "country";

export function LocationInput({
  value,
  onChange,
  requireCountry = true,
  disabled = false,
}: LocationInputProps) {
  const [activeField, setActiveField] = useState<FieldName | null>(null);
  const [cityQuery, setCityQuery] = useState(value.city ?? "");
  const [stateQuery, setStateQuery] = useState(value.state ?? "");
  const [countryQuery, setCountryQuery] = useState(value.country ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const citySuggestions = useMemo(() => {
    if (!cityQuery.trim()) return NIGERIAN_LOCATIONS.cities.slice(0, 8);
    const query = cityQuery.toLowerCase();
    return NIGERIAN_LOCATIONS.cities.filter((city) =>
      city.toLowerCase().includes(query)
    );
  }, [cityQuery]);

  const stateSuggestions = useMemo(() => {
    if (!stateQuery.trim()) return NIGERIAN_LOCATIONS.states.slice(0, 8);
    const query = stateQuery.toLowerCase();
    return NIGERIAN_LOCATIONS.states.filter((state) =>
      state.toLowerCase().includes(query)
    );
  }, [stateQuery]);

  const countrySuggestions = useMemo(() => {
    if (!countryQuery.trim()) return NIGERIAN_LOCATIONS.countries;
    const query = countryQuery.toLowerCase();
    return NIGERIAN_LOCATIONS.countries.filter((country) =>
      country.toLowerCase().includes(query)
    );
  }, [countryQuery]);

  const handleFieldChange = useCallback(
    (field: FieldName, fieldValue: string) => {
      switch (field) {
        case "city":
          setCityQuery(fieldValue);
          onChange({ ...value, city: fieldValue });
          break;
        case "state":
          setStateQuery(fieldValue);
          onChange({ ...value, state: fieldValue });
          break;
        case "country":
          setCountryQuery(fieldValue);
          onChange({ ...value, country: fieldValue });
          break;
      }
    },
    [value, onChange]
  );

  const handleSuggestionSelect = useCallback(
    (field: FieldName, suggestion: string) => {
      handleFieldChange(field, suggestion);
      setActiveField(null);
    },
    [handleFieldChange]
  );

  return (
    <div ref={containerRef} className="w-full space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin className="size-4" />
        <span>Enter your location</span>
      </div>

      {/* City input */}
      <div className="relative">
        <label htmlFor="location-city" className="mb-1 block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          id="location-city"
          type="text"
          value={cityQuery}
          onChange={(e) => handleFieldChange("city", e.target.value)}
          onFocus={() => setActiveField("city")}
          placeholder="e.g. Lagos"
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "w-full rounded-xl border border-[#E4E4E4] bg-[#FBFBFB] px-4 py-3 text-sm placeholder:text-[#B4B4B4] outline-none transition-all",
            "focus:border-[#FF6200] focus:ring-[3px] focus:ring-[#FF6200]/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {activeField === "city" && citySuggestions.length > 0 && (
          <SuggestionDropdown
            suggestions={citySuggestions}
            onSelect={(s) => handleSuggestionSelect("city", s)}
          />
        )}
      </div>

      {/* State input */}
      <div className="relative">
        <label htmlFor="location-state" className="mb-1 block text-sm font-medium text-gray-700">
          State
        </label>
        <input
          id="location-state"
          type="text"
          value={stateQuery}
          onChange={(e) => handleFieldChange("state", e.target.value)}
          onFocus={() => setActiveField("state")}
          placeholder="e.g. Lagos"
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "w-full rounded-xl border border-[#E4E4E4] bg-[#FBFBFB] px-4 py-3 text-sm placeholder:text-[#B4B4B4] outline-none transition-all",
            "focus:border-[#FF6200] focus:ring-[3px] focus:ring-[#FF6200]/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {activeField === "state" && stateSuggestions.length > 0 && (
          <SuggestionDropdown
            suggestions={stateSuggestions}
            onSelect={(s) => handleSuggestionSelect("state", s)}
          />
        )}
      </div>

      {/* Country input */}
      {requireCountry && (
        <div className="relative">
          <label htmlFor="location-country" className="mb-1 block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            id="location-country"
            type="text"
            value={countryQuery}
            onChange={(e) => handleFieldChange("country", e.target.value)}
            onFocus={() => setActiveField("country")}
            placeholder="e.g. Nigeria"
            disabled={disabled}
            autoComplete="off"
            className={cn(
              "w-full rounded-xl border border-[#E4E4E4] bg-[#FBFBFB] px-4 py-3 text-sm placeholder:text-[#B4B4B4] outline-none transition-all",
              "focus:border-[#FF6200] focus:ring-[3px] focus:ring-[#FF6200]/30",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          {activeField === "country" && countrySuggestions.length > 0 && (
            <SuggestionDropdown
              suggestions={countrySuggestions}
              onSelect={(s) => handleSuggestionSelect("country", s)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// --- Suggestion Dropdown ---

interface SuggestionDropdownProps {
  suggestions: string[];
  onSelect: (value: string) => void;
}

function SuggestionDropdown({ suggestions, onSelect }: SuggestionDropdownProps) {
  return (
    <ul
      role="listbox"
      className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[#E4E4E4] bg-white shadow-lg"
    >
      {suggestions.map((suggestion) => (
        <li
          key={suggestion}
          role="option"
          aria-selected={false}
          className="cursor-pointer px-4 py-2.5 text-sm text-gray-700 hover:bg-[#FF6200]/5 hover:text-[#FF6200] transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(suggestion);
          }}
        >
          {suggestion}
        </li>
      ))}
    </ul>
  );
}
