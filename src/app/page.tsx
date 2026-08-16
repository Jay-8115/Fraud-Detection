"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  Lock, 
  ChevronRight, 
  BarChart3, 
  Fingerprint,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary hover:opacity-90 transition-opacity">
            <img src="/logo.svg" alt="FraudWatch" className="h-8 w-8" />
            <span className="text-xl tracking-tight text-foreground font-extrabold">FraudWatch</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Light / Dark Mode Toggle */}
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

            {/* Sign In Link - High contrast in both Light & Dark modes */}
            <Link 
              href="/sign-in" 
              className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors px-2 py-1"
            >
              Sign In
            </Link>

            <Link href="/sign-up">
              <Button className="font-semibold shadow-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 px-6 text-center overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 dark:bg-primary/20 px-3.5 py-1 text-sm text-primary font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Enterprise Fraud Detection
            </div>

            {/* Main Headline - Theme Aware High Contrast */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Detect financial fraud with{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary bg-clip-text text-transparent">
                surgical precision.
              </span>
            </h1>

            {/* Subtitle - Muted Foreground for High Readability */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload transaction datasets. Run advanced ML models in seconds. Generate audit-ready reports. Built for analysts who trust their tools with real money.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                  Start Analyzing <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold border-border hover:bg-muted text-foreground">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Unquestionably Reliable</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                The platform designed for rigorous financial auditing and real-time risk assessment.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Activity,
                  title: "Multi-Model Execution",
                  description: "Run Random Forest, XGBoost, Isolation Forest and more simultaneously to cross-verify anomalies."
                },
                {
                  icon: BarChart3,
                  title: "Dense Data Visualization",
                  description: "Information-rich dashboards built for analysts. Spot trends, inspect outliers, and dive into raw transaction data."
                },
                {
                  icon: ShieldCheck,
                  title: "Audit-Ready Reporting",
                  description: "Export comprehensive PDF reports detailing risk scores, model accuracy metrics, and AI-generated summaries."
                },
                {
                  icon: Fingerprint,
                  title: "Explainable AI",
                  description: "Don't just get a risk score. Get the 'why'. Feature importance analysis shows exactly what triggered the alert."
                },
                {
                  icon: Database,
                  title: "Large Dataset Support",
                  description: "Process thousands of transactions in seconds. Securely upload CSV or Excel files up to 10MB."
                },
                {
                  icon: Lock,
                  title: "Bank-Grade Security",
                  description: "Your data is encrypted at rest and in transit. Built with stringent role-based access controls."
                }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="bg-card text-card-foreground p-6 rounded-2xl border border-border/80 shadow-2xs hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.svg" alt="FraudWatch" className="h-6 w-6 grayscale opacity-60" />
            <span className="font-bold text-foreground">FraudWatch</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} FraudWatch Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
