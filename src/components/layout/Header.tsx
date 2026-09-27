"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
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
  MoreHorizontal,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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
  const { user, isLoaded } = useUser();
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
      const mobileMenuEl = document.getElementById("mobile-menu-container");
      const userDropdownEl = document.getElementById("user-dropdown-container");

      if (mobileMenuEl && !mobileMenuEl.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (userDropdownEl && !userDropdownEl.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isAdmin = isLoaded && user?.publicMetadata?.role === "admin";
  const items = isAdmin ? adminItems : navItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          {/* Logo - redirects to index page when clicked */}
          <Link href="/" className="flex items-center gap-2 font-bold text-primary transition-opacity hover:opacity-90">
            <img src="/logo.svg" alt="FraudWatch" className="h-7 w-7" />
            <span className="text-lg tracking-tight">FraudWatch</span>
          </Link>

          {/* Navigation Links */}
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
        </div>

        {/* Right Side Actions / Theme Switcher / User Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle Button */}
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

          <SignedOut>
            <div className="flex gap-2">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Sign Up</button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
