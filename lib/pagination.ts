export const MAX_PATIENT_PAGE_SIZE = 50;
export const DEFAULT_PATIENT_PAGE_SIZE = 25;

export function clampPagination(skip = 0, take = DEFAULT_PATIENT_PAGE_SIZE) {
  const safeSkip = Number.isFinite(skip) ? Math.max(0, Math.floor(skip)) : 0;
  const safeTake = Number.isFinite(take)
    ? Math.min(MAX_PATIENT_PAGE_SIZE, Math.max(1, Math.floor(take)))
    : DEFAULT_PATIENT_PAGE_SIZE;
  return { skip: safeSkip, take: safeTake };
}
