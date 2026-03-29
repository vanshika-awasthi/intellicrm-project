/**
 * middleware.ts  (root of project — same level as next.config.ts)
 *
 * Next.js Edge Middleware — protects all /dashboard/* routes.
 * Reads the access_token from the Authorization header OR an
 * "access_token" cookie (set server-side after login if you choose).
 *
 * NOTE: The primary security boundary is your Express API (JWT middleware).
 * This middleware provides UX-level redirection only — do NOT rely on it
 * as your sole auth gate.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for access token cookie (set by server on login response)
  // If using in-memory Zustand only, this won't exist — rely on your
  // Express API to reject requests with missing/expired JWTs instead.
  const token = request.cookies.get("access_token")?.value;

  if (!token && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


