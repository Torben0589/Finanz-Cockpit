import { NextRequest, NextResponse } from "next/server";

// Lightweight edge-safe guard: only checks for the PRESENCE of the session
// cookie (the real cryptographic session lives server-side in memory, see
// src/lib/session.ts, which is not accessible from the Edge runtime).
// Every API route additionally calls requireSession() itself, so this
// middleware is a UX convenience (fast redirect), not the security boundary.
const SESSION_COOKIE = "finance_cockpit_session";
const PUBLIC_PATHS = ["/login", "/setup", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (!hasSession && !pathname.startsWith("/api")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
