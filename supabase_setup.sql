-- Steadyspend — Supabase setup
-- Paste this whole file into: Supabase dashboard → SQL Editor → New query → Run.
-- Safe to run once. Creates the table that stores each account's household budgets in the cloud,
-- and locks it down so a user can only ever see or change their OWN rows.

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id text not null,
  name text not null default 'My Household',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, household_id)
);

alter table public.budgets enable row level security;

create policy "Users can view their own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- Optional but recommended for testing: Authentication → Providers → Email → turn OFF
-- "Confirm email" so a freshly signed-up account can sign in immediately without clicking an
-- email link first. Turn it back on before you actually launch, so real signups are verified.
