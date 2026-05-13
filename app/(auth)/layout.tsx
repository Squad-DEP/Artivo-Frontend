import OnboardingLayout from "@/components/ui/onboarding-layout";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <OnboardingLayout>{children}</OnboardingLayout>;
}
