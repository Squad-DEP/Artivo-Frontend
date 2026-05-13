"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Search, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";

export default function CustomerCompletePage() {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
  }, []);

  const nextSteps = [
    {
      icon: <Search className="w-5 h-5" />,
      title: "Find artisans",
      description: "Browse verified workers in your area",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Post a job",
      description: "Describe what you need and get quotes",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: "Pay securely",
      description: "Use our secure payment system",
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
            Welcome to {BRAND.name}!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You&apos;re ready to find skilled artisans for any job.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 text-left">
            <h3 className="font-semibold text-lg mb-4">What you can do</h3>
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/marketplace")}
              variant="outline"
              className="h-14 px-8 text-lg border-[var(--orange)] text-[var(--orange)] rounded-xl hover:bg-[var(--orange)]/5"
            >
              Browse Artisans
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="h-14 px-8 text-lg bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white rounded-xl"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
