/**
 * Legacy identity header name.
 * Middleware always strips this from inbound requests. Session identity is
 * resolved only via verified Supabase auth + DB in lib/auth.ts.
 */
export const SESSION_HEADER = "x-session-user";
