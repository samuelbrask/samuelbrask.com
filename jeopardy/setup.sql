-- Kør hele denne fil én gang i Supabase: SQL Editor -> New query -> Run.
-- Bruger samme Supabase-projekt som din quiz. Tabellerne hedder jp_* så de ikke rammer noget eksisterende.

create table if not exists jp_games (
  code text primary key,
  title text not null default 'Sommerhus-Jeopardy',
  config jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists jp_teams (
  id uuid primary key default gen_random_uuid(),
  game_code text not null references jp_games(code) on delete cascade,
  name text not null,
  color text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);

-- Én række pr. "summerunde". Den unikke nøgle betyder, at databasen afgør, hvem der var først:
-- første hold kommer ind, alle andre får en fejl og får at vide, at de var for langsomme.
create table if not exists jp_buzzes (
  id bigint generated always as identity primary key,
  game_code text not null references jp_games(code) on delete cascade,
  round integer not null,
  team_id uuid not null references jp_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_code, round)
);

alter table jp_games  enable row level security;
alter table jp_teams  enable row level security;
alter table jp_buzzes enable row level security;

-- Åbne regler: det er en privat engangsquiz, så alle med linket må læse og skrive.
drop policy if exists "jp_games open"  on jp_games;
drop policy if exists "jp_teams open"  on jp_teams;
drop policy if exists "jp_buzzes open" on jp_buzzes;
create policy "jp_games open"  on jp_games  for all using (true) with check (true);
create policy "jp_teams open"  on jp_teams  for all using (true) with check (true);
create policy "jp_buzzes open" on jp_buzzes for all using (true) with check (true);

-- Live-opdateringer til tavle, værtspanel og telefoner.
alter publication supabase_realtime add table jp_games;
alter publication supabase_realtime add table jp_teams;
alter publication supabase_realtime add table jp_buzzes;
