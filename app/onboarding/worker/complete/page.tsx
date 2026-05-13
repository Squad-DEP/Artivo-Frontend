"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Star, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import confetti from "canvas-confetti";

export default function WorkerCompletePage() {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    const colors = ["#D97706", "#F59E0B", "#FBBF24", "#059669"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Show content after a short delay
    setTimeout(() => setShowContent(true), 500);
  }, []);

  const nextSteps = [
    {
      icon: <Star className="w-5 h-5" />,
      title: "Complete your profile",
      description: "Add a photo and portfolio to attract more customers",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Get verified",
      description: "Upload your ID to earn a verification badge",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: "Set up payments",
      description: "Link your bank or mobile money account",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-8"
      >
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </motion.div>

      {showContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1D1D1D] mb-4">
            You&apos;re all set!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Welcome to {BRAND.name}. Your profile is ready and you can start
            receiving job matches.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 text-left">
            <h3 className="font-semibold text-lg mb-4">
              Recommended next steps
            </h3>
            <div className="space-y-4">
              {nextSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--orange)]/10 flex items-center justify-center text-[var(--orange)] flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto h-14 px-12 text-lg bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white rounded-xl"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
