"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { BRAND } from "@/lib/constants";
import { SERVICE_CATEGORIES } from "@/lib/constants/categories";

interface PreferencesData {
  displayName: string;
  city: string;
  state: string;
  selectedCategories: string[];
}

export default function CustomerPreferencesPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesData>({
    displayName: "",
    city: "",
    state: "",
    selectedCategories: [],
  });

  const router = useRouter();
  const { completeOnboarding } = useAuthStore();

  const updatePreferences = (
    field: keyof PreferencesData,
    value: string | string[]
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setPreferences((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((id) => id !== categoryId)
        : [...prev.selectedCategories, categoryId],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return preferences.displayName.length >= 2;
      case 2:
        return preferences.city && preferences.state;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push("/onboarding/select-type");
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    const success = await completeOnboarding();

    if (success) {
      router.push("/onboarding/customer/complete");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo_primary.svg" alt={BRAND.name} width={40} height={40} />
            <span className="text-2xl font-semibold text-[#444] tracking-tight">
              {BRAND.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-1.5 rounded-full transition-colors ${
                  s <= step ? "bg-[var(--orange)]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-xl">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1D] mb-2">
                Tell us about yourself
              </h2>
              <p className="text-gray-600 mb-8">
                This helps artisans know who they&apos;re working with
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={preferences.displayName}
                    onChange={(e) =>
                      updatePreferences("displayName", e.target.value)
                    }
                    placeholder="How should artisans address you?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1D] mb-2">
                Where are you located?
              </h2>
              <p className="text-gray-600 mb-8">
                We&apos;ll show you artisans near you
              </p>

              <div className="space-y-6">
                <div className="p-4 bg-[var(--orange)]/5 rounded-xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--orange)] mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Your location helps us recommend nearby artisans for faster
                    service.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={preferences.city}
                      onChange={(e) => updatePreferences("city", e.target.value)}
                      placeholder="e.g. Lagos"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={preferences.state}
                      onChange={(e) => updatePreferences("state", e.target.value)}
                      placeholder="e.g. Lagos State"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Service Interests */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1D] mb-2">
                What services interest you?
              </h2>
              <p className="text-gray-600 mb-8">
                Select any that apply (optional)
              </p>

              <div className="grid grid-cols-2 gap-3">
                {SERVICE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      preferences.selectedCategories.includes(category.id)
                        ? "border-[var(--orange)] bg-[var(--orange)]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="block text-xs text-gray-500 mt-1">
                      {category.subcategories.slice(0, 2).join(", ")}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm text-gray-500 text-center">
                You can skip this step and browse all services later
              </p>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="h-12 px-8 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white rounded-xl disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="h-12 px-8 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white rounded-xl disabled:opacity-50"
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
