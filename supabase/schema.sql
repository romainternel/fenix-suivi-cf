-- FENIX Stats CF — Schéma initial Supabase (STORY-20)
-- À exécuter une fois dans le SQL Editor du projet fenix-suivi-cf.
-- Réf. docs/arch/migration-supabase.md §1.3, §1.2bis

-- ── Données issues de l'Excel (remplacées intégralement à chaque import, STORY-21) ──

create table match_data (
  id                 bigserial primary key,
  position           text,
  rencontre          text not null,
  club               text,
  phase_att          text,
  ge                 text,
  defense_attaquee   text,
  resultat           text,
  joueur             text,
  finalite           text,
  enclenchement      text,
  gardien            text,
  position_tir       text,
  field_position     text,
  periode            text,
  possession         text,
  position_terrain   text,
  action_joueur      text,
  action_att         text,
  action_def         text,
  impact             text,
  saison             text,
  intention_attaque  text
);

create table joueurs (
  nom         text primary key,
  poste       text not null,
  saison      text,
  nom_complet text
);

create table tableau_match (
  id    bigserial primary key,
  match text not null,
  min   integer,
  nom   text not null
);

create table bilan (
  id          bigserial primary key,
  saison      text,
  nom         text not null,
  journee_fin text not null
);

-- ── Données éditées dans l'app (jamais touchées par l'import Excel) ──

-- Remplace ENC_FAMILLE_MAP (hardcodé) + enc_famille_custom (localStorage) : une seule source désormais
create table famille_mapping (
  intention_attaque text primary key,
  famille           text not null
);

create table coach_analyses (
  match_key  text primary key,
  contenu    text not null,  -- "analyse" est un mot réservé PostgreSQL (alias de ANALYZE), renommé
  updated_at timestamptz default now()
);

-- Lien compte Supabase Auth <-> joueur FENIX (pas de mot de passe ici, géré par auth.users, §1.2bis)
create table player_profiles (
  user_id    uuid primary key references auth.users(id),
  nom        text not null unique,
  poste      text,
  updated_at timestamptz default now()
);

-- ── Row Level Security : activée avec policies permissives sur toutes les tables (PRD §0) ──
-- Accès staff mono-utilisateur via la clé publishable, pas de modèle de permission différencié.

alter table match_data      enable row level security;
alter table joueurs         enable row level security;
alter table tableau_match   enable row level security;
alter table bilan           enable row level security;
alter table famille_mapping enable row level security;
alter table coach_analyses  enable row level security;
alter table player_profiles enable row level security;

create policy "allow all - match_data"      on match_data      for all using (true) with check (true);
create policy "allow all - joueurs"         on joueurs         for all using (true) with check (true);
create policy "allow all - tableau_match"   on tableau_match   for all using (true) with check (true);
create policy "allow all - bilan"           on bilan           for all using (true) with check (true);
create policy "allow all - famille_mapping" on famille_mapping for all using (true) with check (true);
create policy "allow all - coach_analyses"  on coach_analyses  for all using (true) with check (true);
create policy "allow all - player_profiles" on player_profiles for all using (true) with check (true);
