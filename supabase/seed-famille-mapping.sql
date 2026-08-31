-- FENIX Stats CF — Amorçage initial de famille_mapping (STORY-23, mécanisme B)
-- À exécuter une fois dans le SQL Editor du projet fenix-suivi-cf, après schema.sql.
-- Réf. docs/arch/migration-supabase.md §2 (mécanisme B).
--
-- Reprend telle quelle la table ENC_FAMILLE_MAP actuellement câblée en dur dans
-- js/page-analyse.js (17 correspondances Intention attaque → Famille, validées par le coach
-- le 2026-08-27). Idempotent (ON CONFLICT) : peut être rejoué sans risque si besoin.
--
-- Si Romain a des overrides personnels dans son navigateur (enc_famille_custom), ils seront
-- automatiquement appliqués par-dessus au premier chargement de l'app via le mécanisme A
-- (checkAndOfferLocalMigration, "Migrer maintenant") — pas besoin de les ajouter ici.

insert into famille_mapping (intention_attaque, famille) values
  ('ISO 2', 'Isoler'),
  ('ISO 3', 'Isoler'),
  ('ISO 4', 'Isoler'),
  ('ISO 5', 'Isoler'),
  ('7vs6', '7vs6'),
  ('1&2', 'Jeu Pivot'),
  ('2&3', 'Jeu Pivot'),
  ('3&4', 'Jeu Pivot'),
  ('4&5', 'Jeu Pivot'),
  ('5&6', 'Jeu Pivot'),
  ('GLISSE', 'Jeu Pivot'),
  ('BLOC', 'Jeu Pivot'),
  ('FAIRE COURIR', 'Faire courir'),
  ('RENTREE', 'Rentrée'),
  ('SPECIAUX', 'Spéciaux'),
  ('6vs5', '6vs5'),
  ('JEU RAPIDE', 'Jeu Rapide')
on conflict (intention_attaque) do update set famille = excluded.famille;
