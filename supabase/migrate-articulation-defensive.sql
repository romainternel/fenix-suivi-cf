-- FENIX Stats CF — Migration STORY-33 : colonnes "Articulation défensive"
-- À exécuter une fois dans le SQL Editor du projet fenix-suivi-cf, AVANT le premier
-- réimport Excel contenant les colonnes ARTICULATION DEF / P1-P6.
-- Additif uniquement (add column if not exists) : sans risque si déjà appliqué,
-- n'affecte aucune ligne existante.

alter table match_data add column if not exists articulation_def text;
alter table match_data add column if not exists p1 text;
alter table match_data add column if not exists p2 text;
alter table match_data add column if not exists p3 text;
alter table match_data add column if not exists p4 text;
alter table match_data add column if not exists p5 text;
alter table match_data add column if not exists p6 text;
