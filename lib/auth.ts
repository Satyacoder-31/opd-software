import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/types";
import {
  decodeSessionHeader,
  SESSION_HEADER,
} from "@/lib/session-header";

export const PENDING_AUTH_PREFIX = "pending:";

const PERMISSION_DENIED = "You do not have permission to perform this action.";

export function sessionFromAuthUser(user: User): SessionUser | null {
  const appMeta = user.app_metadata as {
    clinicId?: string;
    role?: Role;
    userId?: string;
  };
  const userMeta = user.user_metadata as { name?: string };

  if (!appMeta.clinicId || !appMeta.role || !appMeta.userId || !user.email) {
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
  session: Pick<SessionUser, "userId" | "clinicId" | "role" | "name">
) {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(supabaseAuthId, {
    app_metadata: {
      clinicId: session.clinicId,
      role: session.role,
      userId: session.userId,
    },
    user_metadata: {
      name: session.name,
    },
  });
}

async function loadSessionFromSupabase(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const fromJwt = sessionFromAuthUser(user);
  if (fromJwt) return fromJwt;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser) return null;

  if (!dbUser.isActive) return null;

  const session: SessionUser = {
    userId: dbUser.id,
    clinicId: dbUser.clinicId,
    role: dbUser.role,
    email: dbUser.email,
    name: dbUser.name,
  };

  await syncAuthMetadata(user.id, session);
  return session;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const headerStore = await headers();
  const encodedSession = headerStore.get(SESSION_HEADER);
  if (encodedSession) {
    const session = decodeSessionHeader(encodedSession);
    if (session) return session;
  }

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

export function permissionDenied() {
  return { success: false as const, error: PERMISSION_DENIED };
}

export async function ensureUserFromAuth(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const fromJwt = sessionFromAuthUser(user);
  if (fromJwt) return fromJwt;

  let dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser) {
    dbUser = await prisma.user.findFirst({
      where: {
        email: user.email,
        supabaseAuthId: { startsWith: PENDING_AUTH_PREFIX },
      },
    });

    if (dbUser) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { supabaseAuthId: user.id },
      });
    }
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

  await syncAuthMetadata(user.id, session);
  return session;
}

export function isPendingAuthId(supabaseAuthId: string): boolean {
  return supabaseAuthId.startsWith(PENDING_AUTH_PREFIX);
}
