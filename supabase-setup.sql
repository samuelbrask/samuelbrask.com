-- ============================================================
-- Intega Quiz - kør denne EN gang i Supabase SQL Editor
-- Supabase -> SQL Editor -> New query -> indsaet alt -> Run
-- ============================================================

create extension if not exists "pgcrypto";

-- Et spil = en kursusdag.
create table if not exists quiz_games (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  label       text,
  state       jsonb not null default '{"phase":"lobby"}'::jsonb,
  created_at  timestamptz not null default now()
);

-- En deltager. Bundet til et spil, unikt kaldenavn indenfor spillet.
create table if not exists quiz_players (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references quiz_games(id) on delete cascade,
  nickname   text not null,
  total      integer not null default 0,
  last_gain  integer not null default 0,
  last_key   text,
  joined_at  timestamptz not null default now(),
  unique (game_id, nickname)
);

-- Et svar. Et pr. deltager pr. spørgsmål, håndhævet af databasen.
create table if not exists quiz_answers (
  id         bigserial primary key,
  game_id    uuid not null references quiz_games(id) on delete cascade,
  player_id  uuid not null references quiz_players(id) on delete cascade,
  qkey       text not null,
  choice     integer not null,
  ms         integer not null default 0,
  correct    boolean,
  points     integer,
  created_at timestamptz not null default now(),
  unique (player_id, qkey)
);

create index if not exists quiz_players_game on quiz_players (game_id);
create index if not exists quiz_answers_game on quiz_answers (game_id, qkey);

-- ------------------------------------------------------------
-- Adgang. Ingen login, så anon-nøglen skal kunne læse og skrive
-- i præcis disse tre tabeller og intet andet.
-- ------------------------------------------------------------
alter table quiz_games   enable row level security;
alter table quiz_players enable row level security;
alter table quiz_answers enable row level security;

drop policy if exists quiz_games_all on quiz_games;
drop policy if exists quiz_players_all on quiz_players;
drop policy if exists quiz_answers_all on quiz_answers;

create policy quiz_games_all   on quiz_games   for all using (true) with check (true);
create policy quiz_players_all on quiz_players for all using (true) with check (true);
create policy quiz_answers_all on quiz_answers for all using (true) with check (true);

-- ------------------------------------------------------------
-- Realtid. Uden dette opdaterer skærmene ikke af sig selv.
-- ------------------------------------------------------------
alter publication supabase_realtime add table quiz_games;
alter publication supabase_realtime add table quiz_players;
alter publication supabase_realtime add table quiz_answers;

-- Fuld række med i realtidsbeskeder, så værten kan se hvad der ændrede sig.
alter table quiz_games   replica identity full;
alter table quiz_players replica identity full;
alter table quiz_answers replica identity full;

-- ------------------------------------------------------------
-- Oprydning. Kør efter behov, fx efter sidste kursusdag.
-- Sletter spil ældre end 60 dage inkl. deltagere og svar.
-- ------------------------------------------------------------
-- delete from quiz_games where created_at < now() - interval '60 days';
