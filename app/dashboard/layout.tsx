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
} from "lucide-react";
import { useState, useRef, useEffect, ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { AuthGuard } from "./_components/AuthGuard";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { BRAND } from "@/lib/constants";

interface NavLink {
  icon: ReactElement;
  label: string;
  path: string;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const { signOut, getUserType } = useAuthStore();
  const userType = getUserType();

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    closed: {
      y: "-100%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      y: "0%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const isLinkActive = (linkPath: string, currentPath: string) => {
    if (linkPath === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(linkPath);
  };

  // Worker navigation
  const workerLinks: NavLink[] = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Home",
      path: "/dashboard",
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      label: "My Jobs",
      path: "/dashboard/jobs",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      label: "Payments",
      path: "/dashboard/payments",
    },
  ];

  // Customer navigation
  const customerLinks: NavLink[] = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Home",
      path: "/dashboard",
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      label: "My Jobs",
      path: "/dashboard/jobs",
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: "Find Artisans",
      path: "/marketplace",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      label: "Payments",
      path: "/dashboard/payments",
    },
  ];

  const links = userType === "worker" ? workerLinks : customerLinks;
  const ctaLabel = userType === "worker" ? "Find Jobs" : "+ Post a Job";

  return (
    <AuthGuard>
      <div className="flex flex-col md:flex-row min-h-screen bg-background">
        {/* Sidebar for desktop */}
        <aside className="fixed top-0 left-0 hidden md:flex flex-col h-full w-64 bg-white border-r border-[var(--sidebar-border)] px-4 py-6">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="w-max flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--orange)] flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-[var(--sidebar-foreground)]">
                {BRAND.name}
              </span>
            </Link>

            {/* User type badge */}
            <div className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 w-max capitalize">
              {userType || "User"}
            </div>
          </div>

          <hr className="my-6 border-[#EBEBEB]" />

          {userType === "worker" && (
            <Button
              onClick={handleNewJob}
              className="bg-[var(--orange)] hover:bg-[var(--orange-hover)] text-white w-full mb-8 rounded-lg py-3 font-semibold text-base cursor-pointer"
            >
              Find Jobs
            </Button>
          )}

          <nav className="p-2 flex flex-col gap-1 text-[var(--sidebar-foreground)] border rounded-[20px]">
            {links.map((link, index) => (
              <SidebarItem
                key={index}
                icon={link.icon}
                label={link.label}
                path={link.path}
                active={isLinkActive(link.path, pathname)}
              />
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--orange)]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[var(--orange)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">My Profile</p>
                <p className="text-xs text-gray-500 truncate">View & edit</p>
              </div>
            </Link>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full rounded-lg py-3 font-medium text-sm border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </aside>

        {/* Mobile navbar with overlay */}
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
                {userType === "worker" && (
                  <Button
                    onClick={handleNewJob}
                    className="bg-[var(--orange)] hover:bg-[var(--orange-hover)] text-white w-full mb-6 rounded-lg py-3 font-semibold text-base"
                  >
                    Find Jobs
                  </Button>
                )}
                <nav className="p-2 flex flex-col gap-1 text-[var(--sidebar-foreground)] border rounded-[20px]">
                  {links.map((link) => (
                    <SidebarItem
                      key={link.path}
                      icon={link.icon}
                      label={link.label}
                      path={link.path}
                      active={isLinkActive(link.path, pathname)}
                      onClick={() => setIsSidebarOpen(false)}
                    />
                  ))}
                </nav>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="mt-6 w-full rounded-lg py-3 font-medium text-sm"
                >
                  <LogOutIcon className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Topbar for mobile */}
        <div className="z-50 fixed top-0 left-0 w-full flex md:hidden items-center justify-between px-4 py-3 bg-[var(--sidebar)] border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2">
            <button
              ref={toggleButtonRef}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 cursor-pointer"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--orange)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-bold text-[var(--sidebar-foreground)]">
                {BRAND.name}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {userType === "worker" && (
              <Button
                onClick={handleNewJob}
                size="sm"
                className="bg-[var(--orange)] hover:bg-[var(--orange-hover)] text-white rounded-lg px-3 py-1 text-xs font-semibold"
              >
                Jobs
              </Button>
            )}
            <Link href="/dashboard/profile">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--orange)] bg-[var(--orange)]/20 flex items-center justify-center">
                <User className="w-4 h-4 text-[var(--orange)]" />
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <main className="md:ml-64 max-md:pt-20 pb-10 flex-1 flex flex-col bg-background px-2 sm:px-4 md:px-6 py-4 md:py-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  path,
  onClick,
}: {
  icon: ReactElement;
  label: string;
  active?: boolean;
  path: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer font-medium text-sm transition-colors",
        active
          ? "bg-[var(--orange)]/10 text-[var(--orange)]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <div className={cn("w-5 h-5", active && "text-[var(--orange)]")}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
}
