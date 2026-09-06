# STORY-33 — Import des colonnes "Articulation défensive" vers Supabase

**En tant que** Romain (staff),
**Je veux** que les 7 nouvelles colonnes Excel (`ARTICULATION DEF`, `P1`...`P6`) soient importées jusqu'à Supabase,
**Afin de** disposer de cette donnée pour l'analyse (stories suivantes).

## Contexte technique

- Zone concernée : `FENIX-HANDBALL-CF-SUIVI.html` (`const COLS = {...}`, ~L1057), `js/supabase-client.js` (`DATA_HEADER_TO_COLUMN` ~L65, `MATCH_DATA_COLUMN_ORDER` ~L96), `supabase/schema.sql`.
- `COLS` : ajouter `articulation_def: 22, p1: 23, p2: 24, p3: 25, p4: 26, p5: 27, p6: 28`.
- `DATA_HEADER_TO_COLUMN` : ajouter `articulationdef: 'articulation_def'`, `p1: 'p1'` ... `p6: 'p6'` (en-têtes normalisés — vérifier que `_normaliseHeader('ARTICULATION DEF')` produit bien `'articulationdef'` et que `_normaliseHeader('P1')` produit `'p1'`).
- `MATCH_DATA_COLUMN_ORDER` : ajouter les 7 colonnes **à la fin, dans le même ordre** que dans `COLS` (l'ordre doit correspondre exactement — cf. le commentaire d'avertissement déjà présent dans le fichier à ce sujet).
- `supabase/schema.sql` : ajouter les 7 colonnes à la définition `match_data` (documentation), et fournir en plus un script de migration séparé (`supabase/migrate-articulation-defensive.sql`) avec des `alter table ... add column if not exists ...` — c'est ce script que Romain doit exécuter manuellement dans la console Supabase avant le premier réimport avec les nouvelles colonnes (cf. `docs/arch/articulation-defensive.md` §5).
- Vérifier que le message d'erreur affiché en cas d'échec de synchronisation Supabase (`FENIX-HANDBALL-CF-SUIVI.html` ~L1565-1567) reste compréhensible si l'échec vient des colonnes manquantes côté base (pas de changement de logique nécessaire si le message générique existant couvre déjà ce cas — à vérifier en testant volontairement un import sans avoir fait la migration).

## Critères d'acceptation

- [ ] Migration SQL fournie et testée (exécutée une fois sur le projet Supabase réel par Romain ou en session)
- [ ] Réimport d'un fichier Excel contenant les 7 nouvelles colonnes → les valeurs arrivent dans `match_data` (vérifié via une requête Supabase ou `DATA` après rechargement)
- [ ] Réimport d'un fichier Excel **sans** ces colonnes (simulateur d'ancien format) → import toujours fonctionnel, aucune régression, colonnes null
- [ ] Lignes avec `ARTICULATION DEF`/`P1`-`P6` vides → aucune erreur, valeurs `null` en base
- [ ] Import tenté **avant** la migration SQL → échec propre avec le message d'erreur existant (pas de crash silencieux), documenté comme comportement attendu

## Hors scope

- Tout affichage exploitant cette donnée (STORY-34, STORY-35)
- Édition de ces colonnes dans l'app

## Dépend de

Aucune

## Taille

S
