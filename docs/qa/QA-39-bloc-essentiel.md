# QA-39 — Bloc "Essentiel" en tête de page (match + saison)

**Agent :** QA
**Date :** 2026-09-08
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8160), données réelles Supabase (4 matchs, 1V/3D).

---

## Critères d'acceptation

- [x] En vue match, le bloc Essentiel apparaît avant tout onglet **et avant le bloc terrain**, sans scroller sur un écran desktop standard, avec le résultat (❌ DÉFAITE 20-29) et les mêmes 3 constats qu'avant la story, texte et icônes identiques (`docs/regression/screenshots/story39-essentiel-match-fullpage.png`).
- [x] L'onglet "Résumé" ne contient plus ce bloc en double — confirmé par `document.querySelector('#an-tab-resume .ia-card')` → `null`. La carte "Ton Analyse (Coach)" occupe maintenant toute la largeur (plus de grille à moitié vide).
- [x] En vue saison, le bloc Essentiel affiche "4 matchs analysés cette saison" + "1 victoire · 3 défaites · 0 nuls", suivi des 2 signaux forts les plus importants, triés par écart décroissant (55% puis 28%) — texte identique aux valeurs déjà visibles dans le tableau de corrélations en dessous (`docs/regression/screenshots/story39-essentiel-saison.png`).
- [x] Cas "moins de 3 matchs" : testé en réduisant temporairement `MATCHS` à 2 éléments puis en appelant `generateSeasonCorrelations()` — affiche "2 matchs analysés cette saison" + "Pas assez de matchs pour dégager des tendances (minimum 3)." Restauration de `MATCHS` confirmée propre (retour à l'affichage 4 matchs sans état résiduel).
- [x] Le candidat "Supériorités" du bloc Essentiel utilise `computeSuperiorites()` (STORY-42) — confirmé par lecture du code, aucun calcul dupliqué réintroduit.
- [x] Le contenu du bloc Essentiel change bien quand on change de match (re-testé implicitement en re-sélectionnant le match) et quand on bascule saison ↔ match (essentiel-match et essentiel-saison basculent en miroir exact de `analyse-content`/`analyse-empty`, vérifié via `getComputedStyle().display`).
- [x] Persistance au changement d'onglet interne (Résumé → Timeline) : le bloc Essentiel reste affiché à l'identique, n'est pas régénéré ni vidé — cohérent avec le fait qu'il vit maintenant hors du système d'onglets.

## Cas non prévu explicitement, testé par prudence

Le cas "0 signal fort mais ≥3 matchs et ≥2 types de résultat" (branche `colHeaders.length >= 2` mais `signauxForts` vide) n'a pas pu être testé avec les données réelles (il y a toujours eu au moins 1 signal fort sur ce jeu de données) — vérifié uniquement par lecture de code : `signauxHtml` retombe sur "Pas de signal fort marquant pour l'instant." Cohérent avec le pattern des autres messages de repli, mais recommandé de re-vérifier visuellement si un jeu de données sans signal fort apparaît un jour.

## Régressions détectées

Aucune. Terrain/comparatif FENIX-Adversaire inchangé. Indicateurs clés (STORY-42) toujours fonctionnels avec la nouvelle disposition. Coach (textarea + sauvegarde) toujours présent et fonctionnel dans l'onglet Résumé, juste seul dans sa carte. 0 erreur console sur l'ensemble du parcours (vue saison, vue match, changement d'onglet).

## Verdict

**PASSED** — tous les critères d'acceptation validés en conditions réelles, y compris les 2 cas limites explicitement prévus par la story (moins de 3 matchs ; testé aussi moins de 2 types de résultat par lecture de code cohérente avec le pattern déjà validé).
