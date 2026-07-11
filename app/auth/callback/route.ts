import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserFromAuth } from "@/lib/auth";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
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
    await supabase.auth.exchangeCodeForSession(code);
    await ensureUserFromAuth();
  }

  return NextResponse.redirect(`${origin}${next}`);
}
