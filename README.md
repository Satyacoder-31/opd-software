# Medyx

OPD EMR for clinics and local hospitals — walk-in queue, consultations, prescriptions, billing, and daily reports.

**Stack:** Next.js 15 · React 19 · Prisma 6 · PostgreSQL (Supabase) · Supabase Auth · Tailwind CSS 4

---

## Local setup

### Prerequisites

- Node.js 20+
- A Supabase project (Auth + Postgres)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in values:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled Postgres URL (app queries, usually port 6543 + `pgbouncer=true`) |
| `DIRECT_URL` | Direct Postgres URL (migrations, usually port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only; never expose to the client) |
| `NEXT_PUBLIC_APP_URL` | App origin, e.g. `http://localhost:3000` |
| `UPSTASH_REDIS_REST_URL` | Optional. Shared rate-limit store for multi-instance production |
| `UPSTASH_REDIS_REST_TOKEN` | Optional. Token for the Upstash Redis REST API |

### 3. Database

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed   # optional demo clinic + patients
```

### Tenant isolation (clinic data)

**Primary boundary:** every server action scopes queries with `clinicId` from the verified session (`requireSessionUser()` → DB-backed user row). Identity is never taken from client-supplied headers.

**Optional defense-in-depth:** Row-Level Security policies in `prisma/migrations/rls.sql`. These only help when:

1. The app connects with a database role that does **not** bypass RLS (not the table owner / `postgres` superuser), and
2. `auth.uid()` is available for the request (Supabase Auth JWT context).

Today Prisma uses `DATABASE_URL` as a privileged pooler role, so **do not rely on RLS alone**. Prefer keeping strict `clinicId` filters in application code. If you enable RLS for an extra layer:

```bash
psql "$DIRECT_URL" -f prisma/migrations/rls.sql
```

Optional realtime for the queue board:

```bash
psql "$DIRECT_URL" -f prisma/migrations/realtime.sql
```

### 4. Supabase Auth URLs

In **Authentication → URL Configuration**, add:

- Site URL: your `NEXT_PUBLIC_APP_URL`
- Redirect URLs:
  - `{APP_URL}/auth/callback`
  - `{APP_URL}/auth/callback?next=/login/reset-password`

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright smoke / OPD E2E |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

---

## Production deploy checklist

### Vercel (recommended)

1. Push the repo and import the project in Vercel.
2. Set all environment variables from `.env.example` (use production Supabase values).
3. Set `NEXT_PUBLIC_APP_URL` to the production domain (e.g. `https://app.yourclinic.com`).
4. Build command: `prisma generate && next build` (or add `prisma generate` to a `postinstall` script).
5. Deploy and confirm `/api/health` returns `{ "status": "ok" }`.
6. Update Supabase Auth redirect URLs for the production domain.
7. Run migrations against production:

```bash
npx prisma migrate deploy
```

8. Apply `rls.sql` / `realtime.sql` if not already applied on that database.

### Post-deploy smoke test

- [ ] Sign up / log in
- [ ] Register a patient and add to queue
- [ ] Start consultation → prescribe → submit
- [ ] Receptionist billing: draft → mark paid → receipt PDF
- [ ] Download prescription / medical certificate from completed visit
- [ ] Void invoice and save corrected draft
- [ ] Amend a finalized consultation with a reason
- [ ] Open **Reports** for today
- [ ] Admin: **Settings → Audit log**
- [ ] Forgot password email flow
- [ ] Schedule a future appointment from patient detail
- [ ] Assign doctor from queue (admin)
- [ ] Fee master + GST on invoice / receipt
- [ ] Export patients / visits / billing CSV from Reports

### Attachments storage

Create a private Supabase Storage bucket named `consultation-attachments` (Settings → Storage). Doctors upload visit reports/images into it from the consultation screen.

### E2E tests

```bash
npx playwright install chromium
npm run test:e2e
```

Authenticated OPD flow (optional): set `E2E_EMAIL` and `E2E_PASSWORD` for a seeded clinic user before `npm run test:e2e`.

---

## Backup and restore

### Supabase Point-in-Time Recovery (PITR)

On paid Supabase plans, enable **Database → Backups / PITR** in the dashboard. Use this for production clinics.

### Manual logical backup

```bash
# Dump (use DIRECT_URL host/credentials)
pg_dump "$DIRECT_URL" --format=custom --file="medyx-$(date +%Y%m%d).dump"

# Restore into an empty database
pg_restore --clean --if-exists --no-owner --dbname="$DIRECT_URL" medyx-YYYYMMDD.dump
```

After restore, run `npx prisma migrate deploy` if the dump is older than current migrations.

### What to back up

- Postgres data (patients, visits, invoices, audit logs)
- Environment secrets (store securely; rotate if leaked)
- Do **not** commit `.env` or service-role keys

---

## Health check

`GET /api/health` — returns `200` with `{ status: "ok" }` when the database is reachable, otherwise `503`.

Use this for uptime monitors and load-balancer probes.

---

## Roles

| Role | Access |
|------|--------|
| **admin** | Full access including settings, audit log, reports |
| **doctor** | Queue, patients, consultations, prescriptions |
| **receptionist** | Queue, patients, billing, reports |

---

## Support / incidents

1. Check `/api/health` and Vercel/Supabase status.
2. Inspect recent rows in **Settings → Audit log**.
3. Review application logs (Vercel function logs / structured `logger` output).
4. If data corruption is suspected, stop writes and restore from the latest backup/PITR.
