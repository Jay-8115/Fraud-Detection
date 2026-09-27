import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith('/__clerk/')) {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
    let host = "";
    try {
      const base64 = publishableKey.split('_')[2];
      if (base64) {
        host = atob(base64).replace('$', '');
      }
    } catch(e) {}
    
    if (host) {
      const url = request.nextUrl.clone();
      url.hostname = host;
      url.pathname = url.pathname.replace(/^\/__clerk/, '');
      url.port = '';
      url.protocol = 'https:';

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || `https://${request.nextUrl.host}/__clerk`);
      requestHeaders.set('x-forwarded-host', request.nextUrl.host);
      requestHeaders.set('x-forwarded-proto', 'https');
      
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
