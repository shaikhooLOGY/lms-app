-- Stage 3: Quizzes & Progress Tracking schema
set check_function_bodies = off;

-- Ensure pgcrypto is available for gen_random_uuid
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------
-- Helper enums
-- ----------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type public.question_type as enum (
      'mcq_single',
      'mcq_multi',
      'true_false',
      'short_text'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'chapter_progress_status') then
    create type public.chapter_progress_status as enum (
      'not_started',
      'in_progress',
      'completed'
    );
  end if;
end
$$;

-- ----------------------------------------------------------------------
-- Shared helper functions
-- ----------------------------------------------------------------------
create or replace function public.is_tenant_member(p_tenant uuid, p_uid uuid)
  returns boolean
  language sql
  stable
  set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = p_tenant
      and tm.user_id = p_uid
  );
$$;

create or replace function public.set_current_timestamp()
  returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.populate_quiz_context()
  returns trigger
  language plpgsql
  set search_path = public
as $$
declare
  v_subject uuid;
  v_classroom uuid;
  v_tenant uuid;
begin
  if new.chapter_id is not null then
    select c.subject_id, s.classroom_id, cl.tenant_id
      into v_subject, v_classroom, v_tenant
    from public.chapters c
    join public.subjects s on s.id = c.subject_id
    join public.classrooms cl on cl.id = s.classroom_id
    where c.id = new.chapter_id;

    if not found then
      raise exception 'Chapter % not found for quiz', new.chapter_id;
    end if;

    new.subject_id := v_subject;
    new.classroom_id := v_classroom;
    new.tenant_id := v_tenant;
  elsif new.subject_id is not null then
    select s.classroom_id, cl.tenant_id
      into v_classroom, v_tenant
    from public.subjects s
    join public.classrooms cl on cl.id = s.classroom_id
    where s.id = new.subject_id;

    if not found then
      raise exception 'Subject % not found for quiz', new.subject_id;
    end if;

    new.classroom_id := v_classroom;
    new.tenant_id := v_tenant;
  elsif new.classroom_id is not null then
    select cl.tenant_id
      into v_tenant
    from public.classrooms cl
    where cl.id = new.classroom_id;

    if not found or v_tenant is null then
      raise exception 'Classroom % not found for quiz', new.classroom_id;
    end if;

    new.tenant_id := v_tenant;
  else
    raise exception 'Quiz must reference a chapter, subject, or classroom';
  end if;

  return new;
end;
$$;

create or replace function public.populate_question_context()
  returns trigger
  language plpgsql
  set search_path = public
as $$
declare
  v_tenant uuid;
begin
  select q.tenant_id
    into v_tenant
  from public.quizzes q
  where q.id = new.quiz_id;

  if not found then
    raise exception 'Quiz % not found for question', new.quiz_id;
  end if;

  new.tenant_id := v_tenant;
  return new;
end;
$$;

create or replace function public.populate_question_option_context()
  returns trigger
  language plpgsql
  set search_path = public
as $$
declare
  v_tenant uuid;
begin
  select q.tenant_id
    into v_tenant
  from public.questions q
  where q.id = new.question_id;

  if not found then
    raise exception 'Question % not found for option', new.question_id;
  end if;

  new.tenant_id := v_tenant;
  return new;
end;
$$;

create or replace function public.populate_quiz_attempt_context()
  returns trigger
  language plpgsql
  set search_path = public
as $$
declare
  v_tenant uuid;
begin
  select q.tenant_id
    into v_tenant
  from public.quizzes q
  where q.id = new.quiz_id;

  if not found then
    raise exception 'Quiz % not found for attempt', new.quiz_id;
  end if;

  new.tenant_id := v_tenant;
  return new;
end;
$$;

create or replace function public.populate_quiz_answer_context()
  returns trigger
  language plpgsql
  set search_path = public
as $$
declare
  v_tenant uuid;
begin
  select a.tenant_id
    into v_tenant
  from public.user_quiz_attempts a
  where a.id = new.attempt_id;

  if not found then
    raise exception 'Attempt % not found for answer', new.attempt_id;
  end if;

  new.tenant_id := v_tenant;
  return new;
end;
$$;

create or replace function public.populate_chapter_progress_context()
  returns trigger
  language plpgsql
  set search_path = public
as $$
declare
  v_subject uuid;
  v_classroom uuid;
  v_tenant uuid;
begin
  select c.subject_id, s.classroom_id, cl.tenant_id
    into v_subject, v_classroom, v_tenant
  from public.chapters c
  join public.subjects s on s.id = c.subject_id
  join public.classrooms cl on cl.id = s.classroom_id
  where c.id = new.chapter_id;

  if not found then
    raise exception 'Chapter % not found for progress', new.chapter_id;
  end if;

  new.subject_id := v_subject;
  new.classroom_id := v_classroom;
  new.tenant_id := v_tenant;
  return new;
end;
$$;

-- ----------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type public.question_type not null,
  prompt text not null,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, order_index)
);

create table public.user_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score numeric(6,2),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  attempt_id uuid not null references public.user_quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  option_id uuid references public.question_options(id) on delete cascade,
  free_text text,
  is_correct boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_chapter_progress (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.chapter_progress_status not null default 'not_started',
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chapter_id)
);

-- ----------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------
create trigger set_timestamp_quizzes
  before update on public.quizzes
  for each row
  execute function public.set_current_timestamp();

create trigger populate_quizzes_context
  before insert or update on public.quizzes
  for each row
  execute function public.populate_quiz_context();

create trigger set_timestamp_questions
  before update on public.questions
  for each row
  execute function public.set_current_timestamp();

create trigger populate_questions_context
  before insert or update on public.questions
  for each row
  execute function public.populate_question_context();

create trigger set_timestamp_question_options
  before update on public.question_options
  for each row
  execute function public.set_current_timestamp();

create trigger populate_question_options_context
  before insert or update on public.question_options
  for each row
  execute function public.populate_question_option_context();

create trigger set_timestamp_quiz_attempts
  before update on public.user_quiz_attempts
  for each row
  execute function public.set_current_timestamp();

create trigger populate_quiz_attempts_context
  before insert or update on public.user_quiz_attempts
  for each row
  execute function public.populate_quiz_attempt_context();

create trigger set_timestamp_quiz_answers
  before update on public.user_quiz_answers
  for each row
  execute function public.set_current_timestamp();

create trigger populate_quiz_answers_context
  before insert or update on public.user_quiz_answers
  for each row
  execute function public.populate_quiz_answer_context();

create trigger set_timestamp_chapter_progress
  before update on public.user_chapter_progress
  for each row
  execute function public.set_current_timestamp();

create trigger populate_chapter_progress_context
  before insert or update on public.user_chapter_progress
  for each row
  execute function public.populate_chapter_progress_context();

-- ----------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.user_quiz_attempts enable row level security;
alter table public.user_quiz_answers enable row level security;
alter table public.user_chapter_progress enable row level security;

create policy quizzes_select on public.quizzes
  for select using (public.is_tenant_member(tenant_id, auth.uid()));

create policy quizzes_insert on public.quizzes
  for insert with check (public.is_tenant_member(tenant_id, auth.uid()));

create policy quizzes_update on public.quizzes
  for update using (public.is_tenant_member(tenant_id, auth.uid()))
  with check (public.is_tenant_member(tenant_id, auth.uid()));

create policy quizzes_delete on public.quizzes
  for delete using (public.is_tenant_member(tenant_id, auth.uid()));

create policy questions_select on public.questions
  for select using (public.is_tenant_member(tenant_id, auth.uid()));

create policy questions_insert on public.questions
  for insert with check (public.is_tenant_member(tenant_id, auth.uid()));

create policy questions_update on public.questions
  for update using (public.is_tenant_member(tenant_id, auth.uid()))
  with check (public.is_tenant_member(tenant_id, auth.uid()));

create policy questions_delete on public.questions
  for delete using (public.is_tenant_member(tenant_id, auth.uid()));

create policy question_options_select on public.question_options
  for select using (public.is_tenant_member(tenant_id, auth.uid()));

create policy question_options_insert on public.question_options
  for insert with check (public.is_tenant_member(tenant_id, auth.uid()));

create policy question_options_update on public.question_options
  for update using (public.is_tenant_member(tenant_id, auth.uid()))
  with check (public.is_tenant_member(tenant_id, auth.uid()));

create policy question_options_delete on public.question_options
  for delete using (public.is_tenant_member(tenant_id, auth.uid()));

create policy user_quiz_attempts_select on public.user_quiz_attempts
  for select using (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

create policy user_quiz_attempts_insert on public.user_quiz_attempts
  for insert with check (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

create policy user_quiz_attempts_update on public.user_quiz_attempts
  for update using (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  )
  with check (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

create policy user_quiz_attempts_delete on public.user_quiz_attempts
  for delete using (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

create policy user_quiz_answers_select on public.user_quiz_answers
  for select using (
    exists (
      select 1
      from public.user_quiz_attempts a
      where a.id = user_quiz_answers.attempt_id
        and a.user_id = auth.uid()
        and public.is_tenant_member(a.tenant_id, auth.uid())
    )
  );

create policy user_quiz_answers_insert on public.user_quiz_answers
  for insert with check (
    exists (
      select 1
      from public.user_quiz_attempts a
      where a.id = user_quiz_answers.attempt_id
        and a.user_id = auth.uid()
        and public.is_tenant_member(a.tenant_id, auth.uid())
    )
  );

create policy user_quiz_answers_update on public.user_quiz_answers
  for update using (
    exists (
      select 1
      from public.user_quiz_attempts a
      where a.id = user_quiz_answers.attempt_id
        and a.user_id = auth.uid()
        and public.is_tenant_member(a.tenant_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.user_quiz_attempts a
      where a.id = user_quiz_answers.attempt_id
        and a.user_id = auth.uid()
        and public.is_tenant_member(a.tenant_id, auth.uid())
    )
  );

create policy user_quiz_answers_delete on public.user_quiz_answers
  for delete using (
    exists (
      select 1
      from public.user_quiz_attempts a
      where a.id = user_quiz_answers.attempt_id
        and a.user_id = auth.uid()
        and public.is_tenant_member(a.tenant_id, auth.uid())
    )
  );

create policy user_chapter_progress_select on public.user_chapter_progress
  for select using (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

create policy user_chapter_progress_insert on public.user_chapter_progress
  for insert with check (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

create policy user_chapter_progress_update on public.user_chapter_progress
  for update using (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  )
  with check (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

create policy user_chapter_progress_delete on public.user_chapter_progress
  for delete using (
    public.is_tenant_member(tenant_id, auth.uid())
    and user_id = auth.uid()
  );

-- ----------------------------------------------------------------------
-- Advisor recommendations / housekeeping
-- ----------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'handle_new_user'
      and pg_catalog.pg_function_is_visible(oid)
      and pg_catalog.pg_get_function_identity_arguments(oid) = ''
  ) then
    execute 'alter function public.handle_new_user() set search_path = public';
  end if;
end;
$$;

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename like '%_bak_%'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
    begin
      execute format(
        'create policy %I on public.%I for all using (false) with check (false)',
        r.tablename || '_deny_all',
        r.tablename
      );
    exception
      when duplicate_object then
        null;
    end;
  end loop;
end;
$$;

