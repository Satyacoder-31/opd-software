# UX Issue Log

Grouped by pattern. Severity: **P0** (blocks workflow), **P1** (confusing), **P2** (polish).

## Form reset on validation error

| Route | Severity | Issue | Fix |
|-------|----------|-------|-----|
| `/signup` | P0 | All fields clear on server validation error | `onSubmit` + controlled state via `useServerActionForm` |
| `/login` | P1 | Same pattern (2 fields) | Same hook |
| `/patients` (create) | P0 | Create form clears on error | Controlled PatientForm |
| `/settings` (invite) | P1 | Invite form clears on error | Same hook |

## View vs edit mismatch

| Route | Severity | Issue | Fix |
|-------|----------|-------|-----|
| `/patients/[id]` | P0 | "View" opens edit form | Read-only `PatientProfile` + `/edit` route |

## Layout / information hierarchy

| Route | Severity | Issue | Fix |
|-------|----------|-------|-----|
| `/patients` | P0 | Registration form crowds list | List-first; CTA to `/patients/new` |

## Loading / perceived performance

| Route | Severity | Issue | Fix |
|-------|----------|-------|-----|
| All dashboard | P1 | Blank screen during nav | `loading.tsx` skeleton |
| `/queue` | P1 | 4s polling always on | Visibility-aware polling, 8s interval |
| `/queue` | P2 | Hard reload on consult start | `router.push` |

## Missing feedback

| Route | Severity | Issue | Fix |
|-------|----------|-------|-----|
| `/login` | P1 | `?registered=1` never shown | Success banner |
| `/patients` | P1 | No success after register | Banner + redirect |
| `/patients` table | P1 | Add to queue silent | Toast/banner feedback |
| `/billing/[id]` | P1 | Status stale after mark paid | Local state + refresh |
| `/settings` | P2 | Success/error same style | Color-coded messages |
| `/consultations/[id]` | P2 | Errors use muted color | `text-danger` for errors |

## Search / data

| Route | Severity | Issue | Fix |
|-------|----------|-------|-----|
| `/patients` | P1 | Search on every keystroke | 300ms debounce |
| `/patients` | P2 | List capped at 50 | Load more pagination |

## Deferred (security / ops)

- Role checks only in middleware
- No password reset
- No error boundaries
- No tests
