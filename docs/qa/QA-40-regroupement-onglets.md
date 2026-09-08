# QA-40 — Regroupement des onglets (5→3 en vue match, structure commune en vue saison)

**Agent :** QA
**Date :** 2026-09-08
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8170), données réelles Supabase (4 matchs).

---

## ⚠️ Incident de test (corrigé immédiatement, à consigner)

En testant l'onglet "Notes & Outils", j'ai cliqué "💾 Sauvegarder mon analyse" avec un texte de test dans le champ Coach — **cette action a réellement écrit sur la base Supabase de production** (`coach_analyses`, match "J01 BILLERE-FENIX"), le serveur local ne pointant pas vers un environnement de test séparé (`SUPABASE_URL` en dur, pointe toujours vers `oamldfduxwsghrxdsaxy`, cf. `js/supabase-client.js`). Vérifié via requête REST directe : la ligne test a bien été écrite (`updated_at` horodaté au moment du test).

**Corrigé immédiatement** : suppression de la ligne test via `DELETE` REST direct sur `coach_analyses` pour ce `match_key`. Vérifié par une seconde requête que la table est revenue à son état d'avant le test (aucune ligne pour ce match — cohérent avec le champ vide/placeholder déjà observé sur ce même match dans une capture d'écran antérieure, `docs/regression/screenshots/story42-e2e-fullpage.png`, prise avant cet incident).

**Leçon pour les prochaines stories** : ne plus jamais cliquer un bouton d'enregistrement (Coach, éditeurs Familles/Bilans, comptes joueurs, import Excel) pendant un test, même "local" — toujours vérifier par lecture de code si une action écrit sur Supabase avant de la déclencher, ou se limiter à l'inspection de l'état/du DOM sans l'actionner. Le Chat IA (`sendChatMessage`) a été vérifié sans risque (aucun appel réseau, purement en mémoire) avant d'être testé.

## Critères d'acceptation

- [x] En vue match, exactement 3 onglets visibles : "Vue d'ensemble", "Tactique", "Notes & Outils" — aucun des 5 anciens noms n'apparaît (`docs/regression/screenshots/story40-match-overview.png`).
- [x] "Vue d'ensemble" contient Indicateurs Clés (en premier) puis Timeline/Moments clés/Bascules — rien de manquant, ordre cohérent avec le wireframe validé.
- [x] "Tactique" contient les familles (`#enc-familles-section`) puis le Gardien (`#enc-gardien-section`), dans cet ordre — vérifié programmatiquement (`compareDocumentPosition`) en plus du visuel.
- [x] "Notes & Outils" : textarea Coach présent (non re-testé en écriture après l'incident, mais présence/rendu confirmés) et Chat IA fonctionnel — testé avec une vraie question ("supériorités"), réponse cohérente avec STORY-42 (`docs/regression/screenshots/story40-match-tactique.png` pour Tactique ; Chat vérifié par lecture du DOM, pas de capture supplémentaire pour éviter tout risque).
- [x] En vue saison, exactement 2 onglets : "Tactique" (familles, actif par défaut) et "Tendances" (tableau de corrélations) — bascule testée dans les deux sens (`docs/regression/screenshots/story40-saison-tendances.png`).
- [x] Premier onglet sélectionné par défaut à l'ouverture (vue d'ensemble en vue match, tactique en vue saison) — confirmé sur un match n'ayant jamais eu d'onglet actif en session.
- [x] `sessionStorage.an_active_tab` : testé avec un ancien id invalide (`resume`, injecté manuellement) → retombe proprement sur "overview" sans erreur JS. Testé aussi la traversée saison→match avec un id valide en saison mais invalide en match (`tendances`) → retombe sur "overview" (comportement attendu, "tendances" n'existe pas dans `AN_TABS_MATCH`).
- [x] Non-régression : chart des familles (camembert) se dessine correctement dès le premier clic sur "Tactique" en vue match (capture) — le mécanisme de redessin à l'ouverture d'onglet, déjà en place avant cette story, couvre bien le nouvel onglet renommé.

## Régressions détectées

Aucune liée au code de la story. L'incident ci-dessus est une caractéristique du projet (pas d'environnement de test séparé), pas une régression introduite par STORY-40 — le même risque existait déjà avant cette story pour quiconque testerait `saveCoachAnalyse()` en local.

## Verdict

**PASSED WITH NOTES** — tous les critères d'acceptation validés. La note porte sur la méthode de test (incident corrigé), pas sur le code livré.
