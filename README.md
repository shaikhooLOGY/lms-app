## Shaikhoology LMS – SuperAdmin Release

Multi-tenant learning management system powered by **Next.js 15 (App Router + Turbopack)**, **React 19**, and **Supabase Postgres + Auth**. This build introduces the full SuperAdmin console: institutes, classrooms, subjects, lessons, educator/student management, approvals, settings, and reporting.

### 1. Prerequisites
- **Node.js 18+**
- **Supabase project** (Postgres 15+) with Row-Level Security enabled
- Supabase CLI (`npm install -g supabase`) for applying migrations locally

### 2. Environment variables
Create a `.env.local` at the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-id>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

> `SUPABASE_SERVICE_ROLE_KEY` is used solely on the server. Never expose it to the browser.

Optional extras:

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."     # Settings → Notifications (if enabled)
NEXT_PUBLIC_SITE_URL="https://admin.yourdomain.com" # Used by branded links / email templates
```

### 3. Database setup
All migrations, policies, and helper functions live in `supabase/migrations`.

```bash
# Apply migrations against local Supabase (supabase start)
supabase db push

# Or target your hosted project
db_url="postgresql://user:pass@host:5432/postgres"
supabase migration up --db-url "$db_url"
```

Key tables/enums for this release:
- **Core:** `tenants`, `tenant_domains`, `tenant_members`, `memberships`, `tenant_settings`
- **Learning:** `classrooms`, `subjects`, `chapters`, `enrollments`, `approvals`, `activity_logs`
- **Progress & quizzes:** `quizzes`, `questions`, `question_options`, `user_chapter_progress`, `user_subject_progress`

All tables ship with RLS to enforce tenant isolation + per-user access.

### 4. Install & run
```bash
npm install
npm run dev
# visit http://localhost:3000
```

SuperAdmin access requires a user inside `public.superadmins`. Once authenticated, open `/admin` to reach the control center.

### 5. Quality checks
```bash
# Type safety
npx tsc --noEmit

# ESLint (flat config)
npm run lint

# Production build (Turbopack)
npm run build
```

### 6. Deployment notes
- Deploy on **Vercel** or any Node-compatible environment.
- Configure the environment variables above within your hosting provider.
- For institute subdomains (e.g. `<tenant>.learn.shaikhoology.com`), add wildcard DNS and populate `tenant_domains` accordingly.
- Background analytics or email digests can reuse `/admin/reports` server actions.

### 7. Repository tour
- `src/app/(protected)/admin/*` – SuperAdmin app (dashboard, institutes, classrooms, subjects, lessons, educators, students, approvals, settings, reports)
- `src/lib/actions/admin/*` – Supabase server actions with optimistic updates and audit logging
- `src/components/admin/*` – Reusable dark/purple UI primitives (cards, tables, drawers, modals)
- `src/vendor/zod.ts` – lightweight Zod-compatible runtime for sandboxed validation

Happy shipping!
