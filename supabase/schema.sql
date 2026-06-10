-- ============================================================
-- PORTFOLIO.ROM leaderboard schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- ============================================================

create table public.leaderboard (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 12),
  score      int  not null check (score between 1 and 400), -- snake max is ~397
  created_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

-- anyone may read scores
create policy "public read"
  on public.leaderboard for select
  to anon
  using (true);

-- anyone may submit a score (insert only — no updates or deletes,
-- so nobody can tamper with existing rows; constraints cap values)
create policy "public insert"
  on public.leaderboard for insert
  to anon
  with check (true);

-- index for the top-scores query
create index leaderboard_score_idx on public.leaderboard (score desc);
