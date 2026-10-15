-- Run in Supabase: SQL Editor > New query
create extension if not exists "pgcrypto";

create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  title text not null,
  share_link_slug text not null unique,
  feedback_mode text not null default 'instant' check (feedback_mode in ('instant','end')),
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  position int not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('A','B','C','D'))
);
create index on questions (quiz_id, position);

-- Admin accounts: add your user id after creating your login (see README)
create table admins (user_id uuid primary key references auth.users(id) on delete cascade);

create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

alter table subjects  enable row level security;
alter table quizzes   enable row level security;
alter table questions enable row level security;
alter table admins    enable row level security;

create policy "public read subjects"  on subjects  for select using (true);
create policy "public read quizzes"   on quizzes   for select using (true);
create policy "public read questions" on questions for select using (true);

create policy "admin write subjects"  on subjects  for all using (is_admin()) with check (is_admin());
create policy "admin write quizzes"   on quizzes   for all using (is_admin()) with check (is_admin());
create policy "admin write questions" on questions for all using (is_admin()) with check (is_admin());
create policy "admin reads self"      on admins    for select using (user_id = auth.uid());
