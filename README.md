## Shaikhoology LMS

Multi-tenant learning management system built with **Next.js 15 (App Router + Turbopack)** and **Supabase**.

### Stage Overview

- **Stage 1:** Auth, onboarding, tenant creation, domain routing ✅
- **Stage 2:** Protected layout, tenant header, classroom/subject/chapter CRUD ✅
- **Stage 3 (current):** Quiz + learner progress foundation (schema, server actions, placeholder routes) 🚧

### Requirements

- Node.js 18+
- Supabase project with Postgres 15+
- Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-id>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

> `SUPABASE_SERVICE_ROLE_KEY` is required for server actions that run on the server only. Keep it **out** of the browser environment.

### Database migrations

All migrations live in `supabase/migrations`. Stage 3 introduces the quiz + progress schema, RLS, and helper functions.

Apply migrations with Supabase CLI:

```bash
supabase db push
# or, to target a local instance:
supabase migration up
```

Key objects introduced:

- `question_type` + `chapter_progress_status` enums
- `quizzes`, `questions`, `question_options`
- `user_quiz_attempts`, `user_quiz_answers`
- `user_chapter_progress`
- `is_tenant_member(uuid, uuid)` helper + `set_current_timestamp` trigger
- RLS enforced for every table (tenant isolation + per-user rules for attempts/answers/progress)

### Server actions

Located in `src/lib/actions/` and executed with Supabase service client + cookie backed auth.

- `createQuiz`, `addQuestion`, `addQuestionOption`
- `startAttempt`, `submitAttempt`
- `markChapterProgress`

These helpers infer tenant context on the server and revalidate the relevant routes upon success.

### App structure highlights

- `src/app/(protected)/classrooms/page.tsx` – tenant-classroom dashboard
- `src/app/(protected)/classrooms/[classroomId]/subjects/[subjectId]/chapters/[chapterId]/quizzes/*` – quiz list, creation and detail scaffolds
- `src/app/(protected)/classrooms/[classroomId]/subjects/[subjectId]/chapters/[chapterId]/progress/page.tsx` – learner progress placeholder
- `src/components/Breadcrumbs.tsx` – shared breadcrumb navigation

### Development

```bash
npm install
npm run dev
```

### Quality checks

```bash
npm run lint
npm run build
```

### Deployment

Deployed on Vercel. Configure custom domains (`learn.shaikhoology.com`, `*.learn.shaikhoology.com`) and set the environment variables above in Project Settings → Environment Variables.
