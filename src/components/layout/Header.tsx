"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Clock, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Users, 
  Activity,
  Cpu,
  Sun,
  Moon,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { logoutAction } from "@/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload & Analyze", icon: Upload },
  { href: "/history", label: "Analysis History", icon: Clock },
  { href: "/reports", label: "Reports", icon: FileText },
];

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/models", label: "ML Model Management", icon: Cpu },
];

export function Header() {
  const pathname = usePathname();
  const { user, isLoaded, isAdmin } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClickOutside = (event: MouseEvent) => {
      const userDropdownEl = document.getElementById("user-dropdown-container");

      if (userDropdownEl && !userDropdownEl.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const items = isAdmin ? adminItems : navItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary transition-opacity hover:opacity-90">
            <img src="/logo.svg" alt="FraudWatch" className="h-7 w-7" />
            <span className="text-lg tracking-tight">FraudWatch</span>
          </Link>

          {isLoaded && user && (
            <nav className="hidden md:flex items-center gap-1">
              {items.map((item) => {
                const isActive = item.href === "/admin" || item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 focus:outline-none"
              aria-label="Toggle Theme"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>
          )}

          {isLoaded && !user && (
            <div className="flex gap-2">
              <Link href="/sign-in" className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign Up
              </Link>
            </div>
          )}

          {isLoaded && user && (
            <div id="user-dropdown-container" className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <UserIcon className="h-4 w-4" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      Settings
                    </Link>
                  </div>
                  <div className="py-1 border-t border-border">
                    <form action={async () => {
                      const res = await logoutAction();
                      if (res?.success) window.location.href = res.redirectUrl;
                    }}>
                      <button
                        type="submit"
                        className="group flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-rose-500 group-hover:text-rose-600" />
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
