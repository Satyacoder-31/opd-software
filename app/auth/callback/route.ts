import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserFromAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

function safeNextPath(next: string | null): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    next.includes("\0")
  ) {
    return "/queue";
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.warn("auth_callback_exchange_failed", { error: error.message });
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback`
      );
    }
    await ensureUserFromAuth();
  }

  return NextResponse.redirect(`${origin}${next}`);
}
