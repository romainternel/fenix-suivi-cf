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
- [x] Au chargement de la page, un état "Chargement des données…" s'affiche pendant la requête Supabase (Design F3) — jamais d'écran blanc. Vérifié par lecture directe du code (`loadFromSupabase()`, `FENIX-HANDBALL-CF-SUIVI.html:1671-1672`) : `showSupabaseBootLoading()` est le tout premier appel, synchrone, avant tout `await` — s'exécute donc systématiquement, y compris sur un `Réessayer`.
- [x] En cas d'échec réseau, un état d'erreur clair avec bouton "Réessayer" s'affiche (Design F3) — pas de plantage silencieux ni de page à moitié rendue. Testé en conditions réelles (fetchAll monkey-patché pour lever une erreur) : écran "Impossible de contacter le serveur" + bouton Réessayer affichés (`docs/e2e/screenshots/story-22-error-state.png`), clic sur Réessayer → récupération complète (overlay masqué, `DATA.length` = 364, 0 erreur console).
- [x] `DATA` est reconstruit en tableau de lignes positionnelles dans l'ordre exact attendu par `COLS` (position/rencontre/club/phase_att/ge/defense_attaquee/resultat/joueur/finalite/enclenchement/gardien/position_tir/field_position/periode/possession/position_terrain/action_joueur/action_att/action_def/impact/saison/intention_attaque)
- [x] **Test de non-régression explicite obligatoire** : importé `ESSAI IA STAT.xlsm` via STORY-21, page rechargée avec `localStorage`/`sessionStorage` totalement vidés (simulation d'un appareil n'ayant jamais importé). Comparés : Dashboard (chiffres identiques aux valeurs de référence établies dans la session — `docs/e2e/screenshots/story-22-boot-supabase.png`), fiche joueur Antonin Vache (2/4, 50%, `docs/e2e/screenshots/story-22-joueurs-page.png`), page Analyse — camembert enclenchements (8 familles, somme des % = 100%, `docs/e2e/screenshots/story-22-analyse-page.png`), page Notes & Actions Joueurs (NOTE TOTAL = NOTE ATT + NOTE DEF vérifié sur chaque ligne, `docs/e2e/screenshots/story-22-notes-page.png`). Aucune divergence détectée.
- [x] `JOUEURS_TERRAIN`/`TEMPS_JEU`/`_rawBilanRows` reconstruits selon la même logique que le code actuel (`processFile()`), à partir des lignes `joueurs`/`tableau_match`/`bilan` reçues de Supabase — 21 joueurs sur le terrain (compte exact attendu), TPS JEU/MOY TJ cohérents.
- [x] Le scénario "Jules F" ne peut plus se produire : un appareil qui n'a jamais servi à importer un fichier affiche quand même les données à jour dès l'ouverture. Vérifié explicitement sur Jules Gougeon (JG, le joueur réel actuel) : fiche affichée correctement en 0/0 (aucune donnée de match, comme attendu), sans aucune confusion avec l'ancien "Jules F" (`docs/e2e/screenshots/story-22-jules-g.png`).

## Hors scope
- Lecture de `famille_mapping`/`coach_analyses`/`player_accounts` (STORY-23/24)
- Édition de données depuis cette story — lecture seule

## Dépend de
- STORY-20, STORY-21 (nécessite des données déjà présentes en base pour être testée)

## Taille
L
