import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SESSION_HEADER } from "@/lib/session-header";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/api/health",
  "/portal",
  "/clinics",
  "/api/webhooks/razorpay",
  "/terms",
  "/privacy",
];

/**
 * Lightweight route → role allowlists for Edge.
 * Keep in sync with lib/rbac.ts (JWT role is a hint; actions re-check DB).
 * Do not import @/lib/rbac or @prisma/client here — they blow the Edge size limit.
 */
const routeAllowedRoles: Record<string, readonly string[]> = {
  "/settings": ["owner", "admin"],
  "/reports": ["owner", "admin", "receptionist"],
  "/consultations": ["owner", "admin", "doctor"],
  "/billing": ["owner", "admin", "receptionist"],
  "/labs": ["owner", "admin", "doctor", "receptionist"],
  "/appointments": ["owner", "admin", "doctor", "receptionist"],
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

  const { response, user } = await updateSession(request);

  const isPublic = isPublicRoute(pathname);

  if (isPublic) {
    return nextWithCleanHeaders(request, response);
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = user.app_metadata?.role as string | undefined;
  const isActive = user.app_metadata?.isActive;
  // Treat missing isActive as active for older tokens, but explicit false blocks.
  if (isActive === false) {
    return NextResponse.redirect(new URL("/login?deactivated=1", request.url));
  }

  for (const [routePrefix, allowedRoles] of Object.entries(routeAllowedRoles)) {
    if (pathname.startsWith(routePrefix)) {
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/queue", request.url));
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
