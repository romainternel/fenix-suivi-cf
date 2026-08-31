# QA-13 — Lecture depuis Supabase au démarrage de l'app (STORY-22)

**Agent :** QA
**Date :** 2026-08-31

---

## Critères d'acceptation testés

| # | Critère | Résultat |
|---|---|---|
| 1 | État "Chargement…" à l'ouverture, jamais d'écran blanc | ✅ Vérifié par code (`showSupabaseBootLoading()` synchrone, premier appel) |
| 2 | État d'erreur clair + bouton "Réessayer" sur échec réseau | ✅ Testé en conditions réelles — écran affiché, récupération complète au clic |
| 3 | `DATA` reconstruit dans l'ordre exact attendu par `COLS` | ✅ Vérifié index par index (22/22), confirmé indirectement par cohérence des % du camembert (somme = 100%) |
| 4 | Non-régression multi-écrans (Dashboard, fiche joueur, Analyse, Notes) sur device jamais-importé | ✅ 4 écrans comparés, aucune divergence |
| 5 | `JOUEURS_TERRAIN`/`TEMPS_JEU`/`_rawBilanRows` reconstruits correctement | ✅ 21 joueurs sur le terrain, temps de jeu affiché par joueur |
| 6 | Scénario "Jules F" ne peut plus se produire | ✅ Jules Gougeon (joueur réel actuel) affiché correctement en 0/0 |

## Scénario de test principal

Device simulé n'ayant **jamais** importé de fichier localement : `localStorage.clear()` + `sessionStorage.clear()`, rechargement complet de la page, connexion réelle (`#login-input` / "Partage"). L'app charge intégralement ses données depuis Supabase sans jamais présenter l'écran d'import vide — reproduction exacte du scénario "Jules F" documenté dans l'audit du 2026-08-28, désormais impossible.

## Cas limite testé : échec réseau + récupération

`fetchAll` intercepté pour simuler une panne réseau totale → écran d'erreur affiché avec bouton "Réessayer" → restauration du réseau + clic → chargement réussi, `DATA.length` = 364, 0 erreur console. Confirme que l'app ne reste jamais bloquée sur un échec transitoire (ex. wifi du gymnase).

## Bugs trouvés

Aucun.

## Remarque non bloquante

`updateImportUI()` retombe sur un nom de fichier/date générique ("Supabase") quand `localStorage` ne contient pas de trace d'import local (cas du device qui n'a jamais importé) — comportement attendu et documenté dans le code (`FENIX-HANDBALL-CF-SUIVI.html:1718-1722`), pas un bug : ces métadonnées ne sont pas trackées côté Supabase par choix de scope de STORY-20/21.

---

## Verdict : ✅ PASSED
