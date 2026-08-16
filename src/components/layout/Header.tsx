"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/react";
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
  const { signOut } = useClerk();
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

          {isLoaded && user && (
            <>
              {/* Mobile Navigation Dropdown (3-dots) */}
              <div 
                id="mobile-menu-container"
                className="relative md:hidden"
              >
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 focus:outline-none"
                  aria-label="Navigation Menu"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {mobileMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border bg-card p-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Navigation</p>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {items.map((item) => {
                        const isActive = item.href === "/admin" || item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
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
                    </div>
                  </div>
                )}
              </div>

              {/* User Block Trigger */}
              <div 
                id="user-dropdown-container"
                className="relative"
                onMouseEnter={() => {
                  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                    setDropdownOpen(true);
                  }
                }}
                onMouseLeave={() => {
                  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                    setDropdownOpen(false);
                  }
                }}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/80 transition-all duration-200 focus:outline-none"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm shadow-inner">
                    {user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold leading-none text-foreground flex items-center gap-1">
                      {user.fullName || "Analyst"}
                      <span className="text-[8px] text-muted-foreground">▼</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px] mt-0.5">
                      {user.emailAddresses?.[0]?.emailAddress}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border bg-card p-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b">
                      <p className="text-xs font-semibold text-foreground">{user.fullName || "Analyst"}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {user.emailAddresses?.[0]?.emailAddress}
                      </p>
                      <p className="text-[9px] font-bold text-primary mt-1.5 uppercase tracking-wider">
                        {user.publicMetadata?.role || "user"}
                      </p>
                    </div>
                    
                    <div className="mt-1.5 space-y-0.5">
                      <Link
                        href="/activities"
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                          pathname === "/activities"
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        View All Activities
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                          pathname === "/settings"
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Settings
                      </Link>
                      
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut({ redirectUrl: "/" });
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
