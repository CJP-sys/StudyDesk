
create table if not exists public.study_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"subjects":[],"notes":[],"tasks":[],"cards":[],"log":[],"plans":[],"n":1}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint study_data_object check (jsonb_typeof(data) = 'object'),
  constraint study_data_size check (pg_column_size(data) <= 1048576)
);

alter table public.study_data enable row level security;
revoke all on table public.study_data from anon, authenticated;
grant select, insert, update on table public.study_data to authenticated;

drop policy if exists "Users can read their own study data" on public.study_data;
create policy "Users can read their own study data"
  on public.study_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own study data" on public.study_data;
create policy "Users can create their own study data"
  on public.study_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own study data" on public.study_data;
create policy "Users can update their own study data"
  on public.study_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
