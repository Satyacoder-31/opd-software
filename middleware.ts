import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SESSION_HEADER } from "@/lib/session-header";
import { rolesWith, type Permission } from "@/lib/rbac";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/api/health",
];

/** Route prefixes gated by RBAC permissions (JWT role is a hint; actions re-check DB). */
const permissionRoutes: Record<string, Permission> = {
  "/settings": "settings.access",
  "/reports": "reports.read",
  "/consultations": "consultations.read",
  "/billing": "billing.read",
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

  for (const [routePrefix, permission] of Object.entries(permissionRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      const allowedRoles = rolesWith(permission).map(String);
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
    "/patients/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/consultations/:path*",
    "/billing/:path*",
    "/login",
    "/signup",
    "/auth/:path*",
    "/api/:path*",
  ],
};
