import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // @ts-ignore - type definition might be missing or in beta
  frontendApiProxy: {
    // Only enable in production to avoid hijacking localhost or previews
    enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === "production",
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
