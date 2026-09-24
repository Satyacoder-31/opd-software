import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { can, type Permission } from "@/lib/rbac";
import type { SessionUser } from "@/lib/types";

export const PENDING_AUTH_PREFIX = "pending:";

const PERMISSION_DENIED = "You do not have permission to perform this action.";

export function sessionFromAuthUser(user: User): SessionUser | null {
  const appMeta = user.app_metadata as {
    clinicId?: string;
    role?: Role;
    userId?: string;
    isActive?: boolean;
  };
  const userMeta = user.user_metadata as { name?: string };

  if (!appMeta.clinicId || !appMeta.role || !appMeta.userId || !user.email) {
    return null;
  }

  if (appMeta.isActive === false) {
    return null;
  }

  const name = userMeta.name;
  if (!name) return null;

  return {
    userId: appMeta.userId,
    clinicId: appMeta.clinicId,
    role: appMeta.role,
    email: user.email,
    name,
  };
}

async function syncAuthMetadata(
  supabaseAuthId: string,
  session: Pick<SessionUser, "userId" | "clinicId" | "role" | "name"> & {
    isActive?: boolean;
  }
) {
  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(supabaseAuthId, {
      app_metadata: {
        clinicId: session.clinicId,
        role: session.role,
        userId: session.userId,
        isActive: session.isActive ?? true,
      },
      user_metadata: {
        name: session.name,
      },
    });
  } catch (error) {
    logger.warn("sync_auth_metadata_failed", {
      supabaseAuthId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Resolve the session from a verified Supabase user + authoritative DB row.
 * JWT metadata is treated as a hint only; isActive/role/clinic always come from DB when available.
 */
async function resolveSessionFromUser(user: User): Promise<SessionUser | null> {
  let dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser && user.email) {
    const matchedByEmail = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (matchedByEmail) {
      dbUser = await prisma.user.update({
        where: { id: matchedByEmail.id },
        data: { supabaseAuthId: user.id },
      });
    }
  }

  if (dbUser) {
    if (!dbUser.isActive) return null;

    const session: SessionUser = {
      userId: dbUser.id,
      clinicId: dbUser.clinicId,
      role: dbUser.role,
      email: dbUser.email,
      name: dbUser.name,
    };

    const fromJwt = sessionFromAuthUser(user);
    const metadataStale =
      !fromJwt ||
      fromJwt.userId !== session.userId ||
      fromJwt.clinicId !== session.clinicId ||
      fromJwt.role !== session.role ||
      fromJwt.name !== session.name ||
      user.app_metadata?.isActive === false;

    if (metadataStale) {
      await syncAuthMetadata(user.id, { ...session, isActive: true });
    }

    return session;
  }

  // Fallback for brand-new users whose DB row is still being claimed.
  return sessionFromAuthUser(user);
}

async function loadSessionFromSupabase(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (!hasAuthCookie) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return resolveSessionFromUser(user);
}

/**
 * Always resolves identity from the verified Supabase session + DB.
 * Never trusts client-supplied session headers.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  return loadSessionFromSupabase();
});

export async function requireSessionUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

export function requireRole(session: SessionUser, allowed: Role[]): void {
  if (!allowed.includes(session.role)) {
    redirect("/queue");
  }
}

export function roleAllowed(session: SessionUser, allowed: Role[]): boolean {
  return allowed.includes(session.role);
}

export function requirePermission(
  session: SessionUser,
  permission: Permission
): void {
  if (!can(session, permission)) {
    redirect("/queue");
  }
}

export function permissionDenied() {
  return { success: false as const, error: PERMISSION_DENIED };
}

export async function ensureUserFromAuth(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  let dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser) {
    dbUser = await prisma.$transaction(async (tx) => {
      // Find matching user by email (either pending invite or seeded user)
      const existing = await tx.user.findUnique({
        where: { email: user.email! },
      });

      if (!existing) return null;

      return tx.user.update({
        where: { id: existing.id },
        data: { supabaseAuthId: user.id },
      });
    });
  }

  if (!dbUser) return null;
  if (!dbUser.isActive) return null;

  const session: SessionUser = {
    userId: dbUser.id,
    clinicId: dbUser.clinicId,
    role: dbUser.role,
    email: dbUser.email,
    name: dbUser.name,
  };

  await syncAuthMetadata(user.id, { ...session, isActive: true });
  return session;
}

export function isPendingAuthId(supabaseAuthId: string): boolean {
  return supabaseAuthId.startsWith(PENDING_AUTH_PREFIX);
}
