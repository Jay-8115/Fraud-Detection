import { clerkMiddleware } from "@clerk/nextjs/server";

import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith('/__clerk')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || '');
    requestHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '');
    requestHeaders.set('Origin', request.nextUrl.origin);

    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.hostname = 'frontend-api.clerk.dev';
    url.pathname = url.pathname.replace(/^\/__clerk/, '');

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
