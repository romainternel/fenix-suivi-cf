# STORY-22 — Lecture depuis Supabase au démarrage de l'app

**En tant que** coach,
**Je veux** que l'app charge automatiquement les données depuis Supabase à l'ouverture, sur n'importe quel appareil,
**Afin de** ne plus jamais voir des données périmées faute de réimport local (cf. scénario "Jules F", audit du 2026-08-28).

## ⚠️ Story la plus sensible du cycle (mitigation du risque P0 R1)
`docs/risks/migration-supabase.md` R1 : la quasi-totalité du code de rendu de l'app (Dashboard, Analyse, Joueurs, Notes, Impact, mode joueur) lit `DATA` comme un **tableau de lignes positionnelles** (`row[COLS.rencontre]`, etc.). Les lignes reçues de Supabase arrivent sous forme d'**objets nommés** (`{rencontre: ..., club: ...}`). La fonction qui reconstruit le tableau positionnel dans le bon ordre est le point le plus critique de tout ce cycle : une erreur d'ordre y est invisible à l'œil (aucune erreur JS), mais corrompt silencieusement l'affichage de toute l'app.

## Contexte technique
- Zone concernée : `loadFromLocalStorage()` (`FENIX-HANDBALL-CF-SUIVI.html`, à remplacer/compléter par une version asynchrone `loadFromSupabase()`), `DOMContentLoaded`
- Spec exacte : `docs/arch/migration-supabase.md` §1.5, `docs/design/migration-supabase.md` §1 (état de chargement/erreur)
- Les globales `DATA`, `JOUEURS_TERRAIN`, `TEMPS_JEU`, `_rawBilanRows`, `MATCHS`, `SAISONS`, `JOUEURS_FENIX`, `BILANS` doivent être peuplées sous exactement la même forme qu'aujourd'hui, pour que `extractUniqueValues()`, `processBilans()`, `populateFilters()`, `updateDashboard()` continuent de fonctionner sans modification

## Critères d'acceptation
- [ ] Au chargement de la page, un état "Chargement des données…" s'affiche pendant la requête Supabase (Design F3) — jamais d'écran blanc
- [ ] En cas d'échec réseau, un état d'erreur clair avec bouton "Réessayer" s'affiche (Design F3) — pas de plantage silencieux ni de page à moitié rendue
- [ ] `DATA` est reconstruit en tableau de lignes positionnelles dans l'ordre exact attendu par `COLS` (position/rencontre/club/phase_att/ge/defense_attaquee/resultat/joueur/finalite/enclenchement/gardien/position_tir/field_position/periode/possession/position_terrain/action_joueur/action_att/action_def/impact/saison/intention_attaque)
- [ ] **Test de non-régression explicite obligatoire** : importer `ESSAI IA STAT.xlsm` via STORY-21, recharger la page, comparer un par un plusieurs écrans clés (Dashboard, fiche joueur, page Analyse — camembert enclenchements, page Notes) entre le comportement observé et le comportement de référence documenté dans les rapports E2E déjà produits (`docs/e2e/E2E-*.md`, `docs/regression/audit-complet-2026-08-28.md`) sur le même fichier — toute divergence de chiffre affiché est un bloquant
- [ ] `JOUEURS_TERRAIN`/`TEMPS_JEU`/`_rawBilanRows` reconstruits selon la même logique que le code actuel (`processFile()`), à partir des lignes `joueurs`/`tableau_match`/`bilan` reçues de Supabase
- [ ] Le scénario "Jules F" ne peut plus se produire : un appareil qui n'a jamais servi à importer un fichier affiche quand même les données à jour dès l'ouverture

## Hors scope
- Lecture de `famille_mapping`/`coach_analyses`/`player_accounts` (STORY-23/24)
- Édition de données depuis cette story — lecture seule

## Dépend de
- STORY-20, STORY-21 (nécessite des données déjà présentes en base pour être testée)

## Taille
L
