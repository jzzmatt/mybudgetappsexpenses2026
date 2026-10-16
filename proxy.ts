import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { isClerkConfigured } from "@/lib/clerk/config";
import { INSTALL_ASSET_PATHS } from "@/lib/pwa/public-paths";

const isPublicRoute = createRouteMatcher([
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
  "/sso-callback",
  ...INSTALL_ASSET_PATHS,
]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  const { userId } = await auth();

  if (!userId) {
    const signInUrl = new URL("/login", request.url);
    signInUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

function passthroughProxy(_request: NextRequest) {
  return NextResponse.next();
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) {
    return passthroughProxy(request);
  }

  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest$|sw\\.js$|offline\\.html$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
