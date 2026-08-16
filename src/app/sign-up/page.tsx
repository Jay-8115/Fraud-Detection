"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SignUp } from "@clerk/react";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4 relative transition-colors duration-200">
      {/* Header bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary hover:opacity-90 transition-opacity">
          <img src="/logo.svg" alt="FraudWatch" className="h-8 w-8" />
          <span className="text-xl font-extrabold text-foreground tracking-tight">FraudWatch</span>
        </Link>

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

          <Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>

      {/* Main SignUp Component Container */}
      <div className="w-full flex items-center justify-center pt-12">
        <SignUp />
      </div>
    </div>
  );
}
