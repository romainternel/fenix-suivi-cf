# E2E-06 — STORY-17 : Passe visuelle page Joueurs (terrain + fiche)

**Agent :** E2E Tester
**Date :** 2026-08-28
**Environnement :** local, session Playwright fraîche — login réel au clavier (`#login-input` + Enter), données déjà importées persistées via `localStorage` (comportement normal de l'appli, indépendant de la session d'authentification)

---

## Parcours testé

| # | Parcours | Résultat | Preuve |
|---|---|---|---|
| 1 | Login staff réel → page Joueurs → sélection d'un joueur (gardien) sur le terrain → fiche affichée | ✅ | `01-fiche-joueur.png` |

## Constat visuel (transmis à Romain pour jugement final, cf. critère non automatisable du QA)
La fiche principale (Gabin Saltel, GB) affiche désormais une ombre plus marquée et sans bordure (élévation "hero"), nettement plus détachée du fond de page que le bloc "Détail par match" en dessous, qui a lui une bordure fine et une ombre légère (élévation "card"). Les sous-onglets Fiche/Notes/Graphique/Impact sont visiblement plus affirmés (texte plus gras, légèrement plus grand). Les badges "#1 au poste"/"#3 TJ au poste" restent lisibles, fond clair/texte foncé. Le terrain SVG et les ronds joueurs sont inchangés en lisibilité. Données affichées (6/16 arrêts, 38%, etc.) strictement identiques au comportement attendu.

## Écarts avec le verdict QA
Aucun.

## Verdict

**✅ CONFIRMÉ**
