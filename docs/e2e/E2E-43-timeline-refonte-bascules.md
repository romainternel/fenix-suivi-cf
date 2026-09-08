# E2E-43 — Timeline : refonte visuelle et bascules sur la courbe

**Agent :** E2E Tester
**Date :** 2026-09-09
**Environnement :** serveur MCP Playwright, serveur statique local (port 8191), données réelles Supabase.

---

## Parcours testés

Sur un 3e match, différent des 2 déjà couverts par le QA ("AMICAL FENIX-LIMOGES", match nul serré 37-38) : connexion → Analyse → sélection du match → onglet "Vue d'ensemble".

## Résultat par parcours

✅ Capture `docs/regression/screenshots/story43-e2e-match3.png` : courbe d'écart cohérente avec un match très disputé (oscille près de zéro toute la rencontre), légende adaptée au nom réel de l'adversaire ("LIMOGES devant"), grille 10 minutes lisible, bascules et moments clés positionnés sur la courbe.
✅ 0 erreur console.

## Écarts avec le verdict QA

Aucun. Le QA avait déjà couvert les interactions (tooltip, clic, DPR, resize, changement de match) en profondeur sur 2 matchs — ce passage confirme sur un 3e match, au profil de score différent (match nul très serré plutôt qu'une victoire ou défaite nette), que le rendu reste cohérent.

## Verdict

**CONFIRMÉ** — le parcours critique de la story fonctionne en conditions réelles sur un 3e match, sans écart avec le verdict QA.
