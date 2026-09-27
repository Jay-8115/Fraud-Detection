import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "FraudWatch - Enterprise Fraud Detection",
  description: "Detect financial fraud with surgical precision.",
  icons: {
    icon: "/favicon.svg",
  },
};

// This server component guarantees synchronization runs reliably on page load
// after authentication, without relying on client-side API calls.
async function UserSync() {
  try {
    await getAuthenticatedUser();
  } catch (error) {
    console.error("UserSync failed in layout");
  }
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClerkProvider>
          <Providers>
            <UserSync />
            {children}
            <Analytics />
            <SpeedInsights />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}