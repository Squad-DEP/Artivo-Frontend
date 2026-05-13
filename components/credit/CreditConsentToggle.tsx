"use client";

import { useState } from "react";
import { Shield, ExternalLink } from "lucide-react";
import { useCreditStore } from "@/store/creditStore";

/**
 * Toggle for external credit score sharing consent.
 * When enabled, third-party companies can query the worker's credit score via the Credit API.
 * Requirement 8.8: Worker must grant consent for external credit score sharing.
 */
export function CreditConsentToggle() {
  const { consentEnabled, toggleConsent } = useCreditStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    await toggleConsent(!consentEnabled);
    setIsUpdating(false);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">
                External Credit Sharing
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Allow third-party companies to access your credit score via API
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={consentEnabled}
              aria-label="Toggle external credit score sharing"
              disabled={isUpdating}
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                consentEnabled ? "bg-green-500" : "bg-gray-300"
              } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  consentEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <ExternalLink className="w-3 h-3" />
            <span>
              {consentEnabled
                ? "Your score is visible to authorized partners"
                : "Your score is private — partners cannot access it"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
