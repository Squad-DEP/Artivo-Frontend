"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { BRAND } from "@/lib/constants";
import { SERVICE_CATEGORIES, POPULAR_SKILLS } from "@/lib/constants/categories";

interface ProfileData {
  displayName: string;
  bio: string;
  phone: string;
  city: string;
  state: string;
  selectedCategories: string[];
  selectedSkills: string[];
  hourlyRate: string;
}

export default function WorkerProfilePage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: "",
    bio: "",
    phone: "",
    city: "",
    state: "",
    selectedCategories: [],
    selectedSkills: [],
    hourlyRate: "",
  });

  const router = useRouter();
  const { user, completeOnboarding } = useAuthStore();

  const updateProfile = (field: keyof ProfileData, value: string | string[]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setProfileData((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((id) => id !== categoryId)
        : [...prev.selectedCategories, categoryId],
    }));
  };

  const toggleSkill = (skill: string) => {
    setProfileData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter((s) => s !== skill)
        : [...prev.selectedSkills, skill],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profileData.displayName.length >= 2;
      case 2:
        return profileData.selectedCategories.length > 0;
      case 3:
        return profileData.city && profileData.state;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 4) {
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

    // In a real app, you would save the profile to the backend here
    // For now, we just complete onboarding
    const success = await completeOnboarding();

    if (success) {
      router.push("/onboarding/worker/complete");
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
            {[1, 2, 3, 4].map((s) => (
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
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1D] mb-2">
                Let&apos;s set up your profile
              </h2>
              <p className="text-gray-600 mb-8">
                This helps customers find and trust you
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => updateProfile("displayName", e.target.value)}
                    placeholder="How should customers call you?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About You
                  </label>
                  <div className="relative">
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => updateProfile("bio", e.target.value)}
                      placeholder="Tell customers about your experience and what makes you great at what you do..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all resize-none"
                    />
                    <button
                      type="button"
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--orange)] bg-[var(--orange)]/10 rounded-lg hover:bg-[var(--orange)]/20 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Help
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => updateProfile("phone", e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Categories & Skills */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1D] mb-2">
                What services do you offer?
              </h2>
              <p className="text-gray-600 mb-8">
                Select categories that match your skills
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Service Categories
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICE_CATEGORIES.slice(0, 8).map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          profileData.selectedCategories.includes(category.id)
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Specific Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-full text-sm transition-all ${
                          profileData.selectedSkills.includes(skill)
                            ? "bg-[var(--orange)] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1D] mb-2">
                Where are you located?
              </h2>
              <p className="text-gray-600 mb-8">
                Customers will find you based on your location
              </p>

              <div className="space-y-6">
                <div className="p-4 bg-[var(--orange)]/5 rounded-xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--orange)] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">
                      Your exact address won&apos;t be shown publicly. Only your
                      city and state will be visible.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => updateProfile("city", e.target.value)}
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
                      value={profileData.state}
                      onChange={(e) => updateProfile("state", e.target.value)}
                      placeholder="e.g. Lagos State"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1D] mb-2">
                Set your rates
              </h2>
              <p className="text-gray-600 mb-8">
                You can always adjust this later
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={profileData.hourlyRate}
                      onChange={(e) => updateProfile("hourlyRate", e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-16 py-3 rounded-xl border border-gray-200 focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/20 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                      /hour
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Leave blank if you prefer to quote per job
                  </p>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold mb-4">Profile Preview</h3>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--orange)]/20 flex items-center justify-center text-[var(--orange)] font-bold text-xl">
                      {profileData.displayName.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        {profileData.displayName || "Your Name"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {profileData.city && profileData.state
                          ? `${profileData.city}, ${profileData.state}`
                          : "Location"}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profileData.selectedSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 bg-gray-200 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

            {step < 4 ? (
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
                {isLoading ? "Creating profile..." : "Complete Setup"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
