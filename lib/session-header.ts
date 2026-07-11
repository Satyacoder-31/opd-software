import type { SessionUser } from "@/lib/types";

export const SESSION_HEADER = "x-session-user";

export function encodeSessionHeader(session: SessionUser): string {
  return btoa(JSON.stringify(session));
}

export function decodeSessionHeader(value: string): SessionUser | null {
  try {
    const session = JSON.parse(atob(value)) as SessionUser;

    if (
      !session?.userId ||
      !session?.clinicId ||
      !session?.role ||
      !session?.email ||
      !session?.name
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
