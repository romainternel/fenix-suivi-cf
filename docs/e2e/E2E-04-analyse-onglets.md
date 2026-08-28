# E2E-04 — STORY-14 : Découpage Analyse en 5 onglets

**Agent :** E2E Tester
**Date :** 2026-08-28
**Environnement :** local (build post-Developer), session Playwright fraîche et indépendante du QA — nouveau navigateur, login réel au clavier, import réel du fichier, sélection réelle du match via le menu déroulant

---

## Parcours testés

| # | Parcours | Résultat | Preuve |
|---|---|---|---|
| 1 | Login staff réel → import `ESSAI IA STAT.xlsm` réel → onglet "Analyse" → sélection réelle de "AMICAL FENIX-L'UNION" dans le menu MATCH | ✅ | `01-onglet-resume-defaut.png` — bloc terrain+cartes toujours visible en haut, barre de 5 onglets en dessous, "Résumé" actif par défaut avec le contenu attendu |
| 2 | Clic réel sur l'onglet "Timeline" — **premier accès à cet onglet depuis l'import**, cas le plus à risque pour R1 | ✅ | `02-onglet-timeline-premiere-ouverture.png` — canvas "ÉVOLUTION DU SCORE" correctement dimensionné (pleine largeur du panneau) et parfaitement dessiné dès le premier affichage, aucun canvas vide ni tronqué |

Captures dans `docs/e2e/screenshots/story-14-analyse-onglets/`.

## Écarts avec le verdict QA

Aucun. Le point le plus à risque de cette story (R1, canvas dimensionné à zéro si jamais ouvert avant un redraw) a été spécifiquement reciblé ici en conditions réelles et strictement indépendantes (nouvelle session, nouveau processus navigateur, aucun état préalable) — confirmé sans écart avec `docs/qa/QA-05-analyse-onglets-structure.md`.

## Test de fumée sur l'impact potentiel
Le bloc terrain + cartes FENIX/ADVERSAIRE au-dessus des onglets (hors scope de cette story) reste identique à son état avant la story — aucune interférence du nouveau système d'onglets sur ce bloc.

## Verdict

**✅ CONFIRMÉ** — le verdict PASSED du QA est confirmé en conditions réelles, y compris sur le scénario le plus à risque de la story.
