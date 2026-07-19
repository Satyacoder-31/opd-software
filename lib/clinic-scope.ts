/**
 * Application-level clinic (tenant) isolation helpers.
 *
 * Primary enforcement: every data query/mutation must include clinicId from
 * the verified session (requireSessionUser). RLS policies in
 * prisma/migrations/rls.sql are optional defense-in-depth and only apply when
 * the database role does not bypass RLS and auth.uid() is set per request.
 *
 * Prisma currently connects as the pooler/owner role, so do not treat RLS as
 * the sole tenant boundary.
 */

export function clinicScope(clinicId: string) {
  return { clinicId } as const;
}

export function assertClinicMatch(
  resourceClinicId: string,
  sessionClinicId: string
): boolean {
  return resourceClinicId === sessionClinicId;
}
