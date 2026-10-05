-- FENIX Stats CF — Migration : colonne "PVT 2 à 7" (attaque 7 contre 6 à deux pivots)
-- À exécuter une fois dans le SQL Editor du projet fenix-suivi-cf, AVANT le premier
-- réimport Excel contenant la colonne "PVT 2 à 7" (sinon l'insertion échoue : colonne inconnue).
-- Additif uniquement (add column if not exists) : sans risque si déjà appliqué,
-- n'affecte aucune ligne existante.

alter table match_data add column if not exists att_pvt2 text;
