# E2E-39 — Bloc "Essentiel" en tête de page (match + saison)

**Agent :** E2E Tester
**Date :** 2026-09-08
**Environnement :** serveur MCP Playwright, serveur statique local (port 8161), données réelles Supabase.

---

## Parcours testés

1. Connexion staff → clic "🔍 Analyse" → état par défaut (vue saison, aucun match sélectionné).
2. Sélection du match "AMICAL FENIX-BILLERE" via le sélecteur `MATCH` (interaction UI réelle).

## Résultat par parcours

✅ **Parcours 1** — Capture `docs/regression/screenshots/story39-e2e-saison-view.png` : le bloc Essentiel (bordure gauche bleue, fond dégradé) apparaît immédiatement après la barre de filtres, avant le bloc terrain — "4 MATCHS ANALYSÉS CETTE SAISON", "1 victoire · 3 défaites · 0 nuls", puis les 2 signaux forts. Rien à scroller pour le voir.
✅ **Parcours 2** — Capture `docs/regression/screenshots/story39-e2e-match-view.png` : sur un 2e match réel différent de celui testé par le QA, le bloc bascule correctement (bordure rouge, "❌ DÉFAITE 20-29", 3 constats propres à ce match) — confirme que le comportement n'est pas câblé en dur sur un seul match de test.
✅ **Console navigateur** — 0 erreur, 0 warning sur l'ensemble du parcours.
✅ **Non-régression visuelle** — bloc terrain/comparatif et cartes FENIX/Adversaire rendent normalement sous le bloc Essentiel dans les deux vues.

## Écarts avec le verdict QA

Aucun. Le QA avait déjà testé le basculement en profondeur (y compris les cas limites via manipulation de `MATCHS`) ; ce passage confirme, en parcours UI pur sur un match différent de celui du QA, que le rendu correspond à ce qui était attendu.

## Verdict

**CONFIRMÉ** — le parcours critique de la story fonctionne en conditions réelles sur plusieurs matchs, sans écart avec le verdict QA.
