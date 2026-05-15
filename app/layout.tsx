 import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artivo - AI-Powered Marketplace for Gig Workers",
  description:
    "Build your digital identity, get matched to jobs with AI, access financial services. Artivo empowers artisans and gig workers across Africa with trust scores, payments, and alternative credit.",
  keywords: ["gig economy", "artisans", "workers", "Africa", "fintech", "marketplace", "AI matching", "credit score"],
  openGraph: {
    title: "Artivo - Your Skills Deserve Recognition",
    description: "AI-powered marketplace connecting skilled workers with opportunities. Build your reputation, access financial services.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased tracking-tight flex w-full h-full justify-center`}
      >
        <AuthProvider>
          <main className="flex flex-col h-screen w-full max-w-[120rem] mx-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
