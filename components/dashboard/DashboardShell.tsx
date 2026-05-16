"use client";

import { Button } from "@/components/ui/button";
import {
  LogOutIcon,
  Menu,
  X,
  Home,
  Briefcase,
  Search,
  User,
  Wallet,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect, ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { AuthGuard } from "@/app/dashboard/_components/AuthGuard";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { BRAND } from "@/lib/constants";

interface NavLink {
  icon: ReactElement;
  label: string;
  path: string;
}

export function DashboardShell({ children, noPaddding }: { children: ReactNode, noPaddding?: boolean }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const { signOut, getUserType, isGuest, guestCredentials } = useAuthStore();
  const [showGuestPassword, setShowGuestPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const userType = getUserType();

  const copyToClipboard = (text: string, field: "email" | "password") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  const handleNewJob = () => {
    if (userType === "worker") {
      router.push("/marketplace");
    } else {
      router.push("/dashboard/jobs/new");
    }
  };

  const handleLogout = () => {
    signOut();
    router.push("/login");
  };

  const sidebarVariants = {
    closed: { y: "-100%", transition: { type: "tween", duration: 0.3, ease: "easeInOut" } },
    open: { y: "0%", transition: { type: "tween", duration: 0.3, ease: "easeInOut" } },
  };

  const isLinkActive = (linkPath: string, currentPath: string) => {
    if (linkPath === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(linkPath);
  };

  const workerLinks: NavLink[] = [
    { icon: <Home className="w-5 h-5" />, label: "Home", path: "/dashboard" },
    { icon: <Briefcase className="w-5 h-5" />, label: "My Jobs", path: "/dashboard/jobs" },
    { icon: <Wallet className="w-5 h-5" />, label: "Payments", path: "/dashboard/payments" },
  ];

  const customerLinks: NavLink[] = [
    { icon: <Home className="w-5 h-5" />, label: "Home", path: "/dashboard" },
    { icon: <Briefcase className="w-5 h-5" />, label: "My Jobs", path: "/dashboard/jobs" },
    { icon: <Search className="w-5 h-5" />, label: "Find Artisans", path: "/marketplace" },
    { icon: <Wallet className="w-5 h-5" />, label: "Payments", path: "/dashboard/payments" },
  ];

  const links = userType === "worker" ? workerLinks : customerLinks;
  const ctaLabel = userType === "worker" ? "Find Jobs" : "+ Post a Job";

  return (
    <AuthGuard>
      <div className="flex flex-col md:flex-row min-h-screen bg-background">
        <aside className="fixed top-0 left-0 hidden md:flex flex-col h-full w-64 bg-white border-r border-[var(--sidebar-border)] px-4 py-6">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="w-max flex items-center gap-3">
              <Image src="/logo_primary.svg" alt={BRAND.name} width={40} height={40} />
              <span className="text-2xl font-bold text-[var(--sidebar-foreground)]">{BRAND.name}</span>
            </Link>
            <div className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 w-max capitalize">
              {userType || "User"}
            </div>
          </div>

          <hr className="my-6 border-[#EBEBEB]" />

          <Button
            onClick={handleNewJob}
            className="bg-[var(--orange)] hover:bg-[var(--orange-hover)] text-white w-full mb-8 rounded-lg py-3 font-semibold text-base cursor-pointer"
          >
            {ctaLabel}
          </Button>

          <nav className="p-2 flex flex-col gap-1 text-[var(--sidebar-foreground)] border rounded-[20px]">
            {links.map((link, index) => (
              <SidebarItem key={index} icon={link.icon} label={link.label} path={link.path} active={isLinkActive(link.path, pathname)} />
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-[var(--orange)]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[var(--orange)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">My Profile</p>
                <p className="text-xs text-gray-500 truncate">View & edit</p>
              </div>
            </Link>
            <Button onClick={handleLogout} variant="outline" className="w-full rounded-lg py-3 font-medium text-sm border-gray-200 hover:bg-gray-50 hover:border-gray-300">
              <LogOutIcon className="w-4 h-4 mr-2" />Log out
            </Button>
          </div>
        </aside>

        <AnimatePresence>
          {isSidebarOpen && (
            <div className="md:hidden fixed top-[61px] left-0 w-full h-full bg-black/50 z-40">
              <motion.aside
                ref={sidebarRef}
                initial="closed"
                animate="open"
                exit="closed"
                variants={sidebarVariants}
                className="fixed top-[61px] left-0 flex md:hidden flex-col h-max w-full bg-white border-r border-[var(--sidebar-border)] px-4 py-6"
              >
                <Button onClick={handleNewJob} className="bg-[var(--orange)] hover:bg-[var(--orange-hover)] text-white w-full mb-6 rounded-lg py-3 font-semibold text-base">
                  {ctaLabel}
                </Button>
                <nav className="p-2 flex flex-col gap-1 text-[var(--sidebar-foreground)] border rounded-[20px]">
                  {links.map((link) => (
                    <SidebarItem key={link.path} icon={link.icon} label={link.label} path={link.path} active={isLinkActive(link.path, pathname)} onClick={() => setIsSidebarOpen(false)} />
                  ))}
                </nav>
                <Button onClick={handleLogout} variant="outline" className="mt-6 w-full rounded-lg py-3 font-medium text-sm">
                  <LogOutIcon className="w-4 h-4 mr-2" />Log out
                </Button>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="z-50 fixed top-0 left-0 w-full flex md:hidden items-center justify-between px-4 py-3 bg-[var(--sidebar)] border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2">
            <button ref={toggleButtonRef} onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 cursor-pointer">
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo_primary.svg" alt={BRAND.name} width={32} height={32} />
              <span className="text-lg font-bold text-[var(--sidebar-foreground)]">{BRAND.name}</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNewJob} size="sm" className="bg-[var(--orange)] hover:bg-[var(--orange-hover)] text-white rounded-lg px-3 py-1 text-xs font-semibold">
              {userType === "worker" ? "Jobs" : "+ Post"}
            </Button>
            <Link href="/dashboard/profile">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--orange)] bg-[var(--orange)]/20 flex items-center justify-center">
                <User className="w-4 h-4 text-[var(--orange)]" />
              </div>
            </Link>
          </div>
        </div>

        <main 
          className={cn (
            "md:ml-64 flex-1 flex flex-col bg-background",
            noPaddding ? "" : "max-md:pt-20 pb-10 px-4 md:px-6 py-4 md:py-6"
          )}
        >
          <Breadcrumbs />
          {isGuest && guestCredentials && (
            <div className="mb-5 rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Save your info so you don&apos;t lose your progress</p>
                  <p className="text-xs text-foreground/40 mt-0.5">These are your auto-generated login details. Note them down or set permanent ones.</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-lg bg-[var(--orange)] text-white hover:bg-[var(--orange-hover)] transition-colors whitespace-nowrap"
                >
                  Set permanent
                </Link>
              </div>

              {/* Credential pills */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Email */}
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 shrink-0">Email</span>
                  <span className="flex-1 text-xs font-mono text-foreground/70 truncate">{guestCredentials.email}</span>
                  <button
                    onClick={() => copyToClipboard(guestCredentials.email, "email")}
                    className="shrink-0 text-foreground/30 hover:text-[var(--orange)] transition-colors"
                    aria-label="Copy email"
                  >
                    {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password */}
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 shrink-0">Pass</span>
                  <span className="flex-1 text-xs font-mono text-foreground/70 truncate">
                    {showGuestPassword ? guestCredentials.password : "••••••••••"}
                  </span>
                  <button
                    onClick={() => setShowGuestPassword((v) => !v)}
                    className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showGuestPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(guestCredentials.password, "password")}
                    className="shrink-0 text-foreground/30 hover:text-[var(--orange)] transition-colors"
                    aria-label="Copy password"
                  >
                    {copiedField === "password" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

function SidebarItem({ icon, label, active, path, onClick }: { icon: ReactElement; label: string; active?: boolean; path: string; onClick?: () => void }) {
  return (
    <Link href={path} onClick={onClick} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer font-medium text-sm transition-colors", active ? "bg-[var(--orange)]/10 text-[var(--orange)]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
      <div className={cn("w-5 h-5", active && "text-[var(--orange)]")}>{icon}</div>
      <span>{label}</span>
    </Link>
  );
}
