"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Wrench, User, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { USER_TYPES, type UserType } from "@/lib/constants/user-types";
import { BRAND } from "@/lib/constants";

export default function SelectTypePage() {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUserType, user } = useAuthStore();

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    const success = await setUserType(selectedType);

    if (success) {
      if (selectedType === "worker") {
        router.push("/onboarding/worker/profile");
      } else if (selectedType === "customer") {
        router.push("/onboarding/customer/preferences");
      } else {
        router.push("/dashboard");
      }
    }
    setIsLoading(false);
  };

  const getIcon = (type: UserType) => {
    switch (type) {
      case "worker":
        return <Wrench className="w-8 h-8" />;
      case "customer":
        return <User className="w-8 h-8" />;
      case "business":
        return <Building2 className="w-8 h-8" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Image src="/logo_primary.svg" alt={BRAND.name} width={40} height={40} />
          <span className="text-2xl font-semibold text-[#444] tracking-tight">
            {BRAND.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1D1D1D] mb-4">
            Welcome to {BRAND.name}!
          </h1>
          <p className="text-lg text-gray-600 mb-12">
            Tell us how you want to use the platform
          </p>

          <div className="grid gap-4 sm:gap-6">
            {(["worker", "customer"] as UserType[]).map((type) => {
              const config = USER_TYPES[type];
              const isSelected = selectedType === type;

              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType(type)}
                  className={`w-full p-6 sm:p-8 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-[var(--orange)] bg-[var(--orange)]/5 shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "bg-[var(--orange)] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getIcon(type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-semibold mb-2">
                        {config.label}
                      </h3>
                      <p className="text-gray-600 mb-4">{config.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {config.features.slice(0, 3).map((feature, index) => (
                          <span
                            key={index}
                            className={`text-xs px-3 py-1 rounded-full ${
                              isSelected
                                ? "bg-[var(--orange)]/10 text-[var(--orange)]"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        isSelected
                          ? "border-[var(--orange)] bg-[var(--orange)]"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2.5 h-2.5 rounded-full bg-white"
                        />
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedType || isLoading}
            className="mt-8 w-full sm:w-auto h-14 px-12 text-lg bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white rounded-xl disabled:opacity-50"
          >
            {isLoading ? (
              "Please wait..."
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500">
        <p>You can always change this later in your settings</p>
      </footer>
    </div>
  );
}
