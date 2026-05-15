"use client";

import { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return <DashboardShell noPaddding={true}>{children}</DashboardShell>;
}
