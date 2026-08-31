# Code Review — STORY-22 (Lecture depuis Supabase au démarrage de l'app)

**Agent :** Code Reviewer
**Date :** 2026-08-31
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` (suppression de `loadFromLocalStorage()`, ajout de `loadFromSupabase()` + 3 helpers overlay, `DOMContentLoaded` mis à jour, markup `#supabase-boot-overlay`), `css/style.css` (styles overlay), `js/supabase-client.js` (+`MATCH_DATA_COLUMN_ORDER`, `rowToPositionalArray()`)

---

## Vérification du point le plus critique du cycle (R1)

C'est le seul point qui compte vraiment pour cette story : `MATCH_DATA_COLUMN_ORDER` (`js/supabase-client.js:96-102`) doit correspondre **index par index** à `COLS` (`FENIX-HANDBALL-CF-SUIVI.html:1090-1095`). Comparaison faite manuellement, position par position :

| # | COLS | MATCH_DATA_COLUMN_ORDER |
|---|---|---|
| 0 | position | position |
| 1 | rencontre | rencontre |
| 2 | club | club |
| 3 | phase_att | phase_att |
| 4 | ge | ge |
| 5 | defense_attaquee | defense_attaquee |
| 6 | resultat | resultat |
| 7 | joueur | joueur |
| 8 | finalite | finalite |
| 9 | enclenchement | enclenchement |
| 10 | gardien | gardien |
| 11 | position_tir | position_tir |
| 12 | field_position | field_position |
| 13 | periode | periode |
| 14 | possession | possession |
| 15 | position_terrain | position_terrain |
| 16 | action_joueur | action_joueur |
| 17 | action_att | action_att |
| 18 | action_def | action_def |
| 19 | impact | impact |
| 20 | saison | saison |
| 21 | intention_attaque | intention_attaque |

22/22 identiques. Confirmé également par les tests réels (cf. QA/E2E) : le camembert enclenchements de la page Analyse affiche 8 familles dont les pourcentages somment exactement à 100%, ce qui serait statistiquement improbable si une seule colonne était décalée.

Point d'attention positif : le Developer n'a **pas** dérivé cet ordre de `Object.keys(DATA_HEADER_TO_COLUMN)` (qui aurait donné le même résultat aujourd'hui mais casserait silencieusement si quelqu'un réordonnait ce littéral plus tard) — il a écrit une liste explicite séparée, avec un commentaire qui prévient explicitement contre cette tentation. Bon réflexe de discipline défensive sur le point le plus fragile de toute la migration.

## Gestion des deux états UI (chargement / erreur)

`loadFromSupabase()` appelle `showSupabaseBootLoading()` en tout premier, de façon synchrone, avant le moindre `await` (`FENIX-HANDBALL-CF-SUIVI.html:1671-1672`) — garantit que l'état de chargement s'affiche toujours, y compris sur un `Réessayer` depuis l'état d'erreur (même fonction rappelée). Le `catch` unique autour de tout le bloc (`Promise.all` + reconstruction + rendu) bascule sur `showSupabaseBootError()` sans jamais laisser un état intermédiaire à moitié rendu — cohérent avec le critère "pas de plantage silencieux ni de page à moitié rendue".

## Reconstruction JOUEURS_TERRAIN / TEMPS_JEU / _rawBilanRows

Logique de placement sur le terrain reprise à l'identique de `processFile()` (pool de positions par poste, `POSTE_POSITIONS`), avec un tri par nom ajouté pour la déterminisme — absent de `processFile()` (qui suit l'ordre des lignes Excel) mais sans impact fonctionnel observable, l'assignation de position étant déjà arbitraire au sein d'un même poste. `TEMPS_JEU` et `_rawBilanRows` reconstruits avec des transformations mineures et correctes (`r.min`→valeur, `r.journee_fin`→`journeeFin`).

## Suppression de `loadFromLocalStorage()`

Fonction supprimée entièrement plutôt que conservée en fallback mort — cohérent avec le principe "pas de code de compatibilité non utilisé". `localStorage` reste utilisé ailleurs (filename/date d'import, données joueurs hors-Excel) : pas une suppression générale de `localStorage`, seulement du chemin de chargement initial.

## Scope

Conforme — story explicitement "hors scope : lecture de famille_mapping/coach_analyses/player_accounts (STORY-23/24)", aucune de ces tables n'est touchée par `loadFromSupabase()`. Lecture seule, aucune écriture ajoutée.

## Non-régression

Testé en conditions réelles avec `localStorage`/`sessionStorage` totalement vidés (device n'ayant jamais importé) : Dashboard, fiche joueur, page Analyse (camembert), page Notes tous corrects. Cf. rapports QA/E2E pour le détail des captures.

---

## Verdict : ✅ APPROUVÉ
