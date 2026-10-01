import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SESSION_HEADER } from "@/lib/session-header";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/api/health",
  "/clinics",
  "/api/webhooks/razorpay",
  "/terms",
  "/privacy",
];

const ALL_STAFF_ROLES = ["owner", "admin", "doctor", "receptionist"] as const;

/**
 * Lightweight route → role allowlists for Edge.
 * Unified hospital OPD mode allows hospital users to manage everything.
 * More specific paths MUST be evaluated before parent paths.
 */
const routeAllowedRoles: Record<string, readonly string[]> = {
  "/settings/clinic": ALL_STAFF_ROLES,
  "/settings/availability": ALL_STAFF_ROLES,
  "/settings/prescriptions": ALL_STAFF_ROLES,
  "/settings/medicines": ALL_STAFF_ROLES,
  "/settings/labs": ALL_STAFF_ROLES,
  "/settings/notifications": ALL_STAFF_ROLES,
  "/settings/staff": ALL_STAFF_ROLES,
  "/settings/fees": ALL_STAFF_ROLES,
  "/settings/subscription": ALL_STAFF_ROLES,
  "/settings/audit": ALL_STAFF_ROLES,
  "/settings": ALL_STAFF_ROLES,
  "/reports": ALL_STAFF_ROLES,
  "/consultations": ALL_STAFF_ROLES,
  "/billing": ALL_STAFF_ROLES,
  "/labs": ALL_STAFF_ROLES,
  "/appointments": ALL_STAFF_ROLES,
  "/patients": ALL_STAFF_ROLES,
  "/queue": ALL_STAFF_ROLES,
};

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** Strip any client-supplied identity header before forwarding the request. */
function stripIdentityHeader(request: NextRequest): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(SESSION_HEADER);
  return requestHeaders;
}

function nextWithCleanHeaders(
  request: NextRequest,
  source: NextResponse
): NextResponse {
  const requestHeaders = stripIdentityHeader(request);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const cookie of source.cookies.getAll()) {
    nextResponse.cookies.set(cookie);
  }

  nextResponse.headers.delete(SESSION_HEADER);
  return nextResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The software is for the hospital, not patients — redirect public patient portal routes to login
  if (
    pathname === "/portal" ||
    pathname.startsWith("/portal/") ||
    pathname === "/clinics" ||
    pathname.startsWith("/clinics/")
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublic = isPublicRoute(pathname);

  // Fast-path cookie detection: Supabase SSR stores auth in sb-*-auth-token cookies
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  // 1. Fast path for public routes without session cookie: instant response (<5ms)
  if (isPublic && !hasAuthCookie) {
    return nextWithCleanHeaders(request, NextResponse.next({ request }));
  }

  // 2. Fast path for protected routes without session cookie: instant redirect to /login (<5ms)
  if (!isPublic && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Auth cookie is present: validate and refresh session
  const { response, user } = await updateSession(request);

  if (isPublic) {
    // If authenticated user visits login or signup, redirect them into the dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/queue", request.url));
    }
    return nextWithCleanHeaders(request, response);
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = (
    user.app_metadata?.role ||
    user.user_metadata?.role
  ) as string | undefined;
  const isActive = user.app_metadata?.isActive;
  // Treat missing isActive as active for older tokens, but explicit false blocks.
  if (isActive === false) {
    return NextResponse.redirect(new URL("/login?deactivated=1", request.url));
  }

  // If role is present in JWT, perform fast edge authorization check.
  // If role is not yet in JWT metadata, allow the request to proceed to server components
  // where requireSessionUser() checks the authoritative database role.
  if (role) {
    const normalizedRole = role.toLowerCase();
    for (const [routePrefix, allowedRoles] of Object.entries(routeAllowedRoles)) {
      if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
        if (!allowedRoles.includes(normalizedRole)) {
          return NextResponse.redirect(new URL("/queue", request.url));
        }
        break;
      }
    }
  }

  return nextWithCleanHeaders(request, response);
}

export const config = {
  matcher: [
    "/",
    "/queue/:path*",
    "/appointments/:path*",
    "/patients/:path*",
    "/labs/:path*",
    "/portal/:path*",
    "/clinics/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/consultations/:path*",
    "/billing/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/login",
    "/signup",
    "/terms",
    "/privacy",
    "/auth/:path*",
    "/api/:path*",
  ],
};
