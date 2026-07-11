import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { updateSession } from "@/lib/supabase/middleware";
import {
  encodeSessionHeader,
  SESSION_HEADER,
} from "@/lib/session-header";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
];

const roleRoutes: Record<string, string[]> = {
  "/settings": ["admin"],
  "/reports": ["admin", "receptionist"],
  "/consultations": ["admin", "doctor"],
  "/billing": ["admin", "receptionist"],
};

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function withSessionHeader(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  const session = response.headers.get(SESSION_HEADER);

  if (session) {
    requestHeaders.set(SESSION_HEADER, session);
  }

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const cookie of response.cookies.getAll()) {
    nextResponse.cookies.set(cookie);
  }

  nextResponse.headers.delete(SESSION_HEADER);
  return nextResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { response, user } = await updateSession(request);

  const isPublic = isPublicRoute(pathname);

  if (isPublic) return response;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = user.app_metadata?.role as string | undefined;
  const isActive = user.app_metadata?.isActive;
  if (isActive === false) {
    return NextResponse.redirect(new URL("/login?deactivated=1", request.url));
  }

  for (const [routePrefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/queue", request.url));
      }
    }
  }

  const appMeta = user.app_metadata as {
    clinicId?: string;
    role?: string;
    userId?: string;
  };
  const userMeta = user.user_metadata as { name?: string };

  const session =
    appMeta.clinicId && appMeta.role && appMeta.userId && user.email && userMeta.name
      ? {
          userId: appMeta.userId,
          clinicId: appMeta.clinicId,
          role: appMeta.role as Role,
          email: user.email,
          name: userMeta.name,
        }
      : null;
  if (session) {
    response.headers.set(SESSION_HEADER, encodeSessionHeader(session));
  }

  return withSessionHeader(request, response);
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
  ],
};
