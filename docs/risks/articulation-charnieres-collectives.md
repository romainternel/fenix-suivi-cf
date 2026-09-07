# Risques — Recentrage collectif du mode Articulation (charnières défensives)

**Agent :** Risk Analyst
**Date :** 2026-09-07

---

Feature purement front-end, calcul de base inchangé — les catégories pertinentes ici sont la régression fonctionnelle sur une feature existante et les cas limites de présentation, pas la connectivité/permissions/concurrence.

## Tableau de risques

| # | Risque | Probabilité | Impact | Recommandation |
|---|---|---|---|---|
| R1 | Résidu de l'ancienne métrique (efficacité attaque adverse) oublié sur un des 5 sites d'appel identifiés par l'Architect (2 branches de rendu de poste, panneau de détail, carte Référence, boucle des 3 blocs) — un seul site non converti afficherait un pourcentage dans le sens inverse des autres, une incohérence particulièrement trompeuse puisque visuellement indiscernable d'un pourcentage correct | Moyenne | Élevé (un chiffre lu à l'envers dans un outil de décision tactique est pire qu'un chiffre absent) | Vérification exhaustive site par site en Code Review, avec une checklist explicite des 5 emplacements ; le QA doit comparer un cas réel calculé à la main (ex. 43 séq., X buts+PO) au pourcentage affiché |
| R2 | Seuils de `_articDefClass` mal transposés (erreur d'inversion arithmétique, ex. `<` au lieu de `<=` sur la borne) — classerait certaines charnières dans la mauvaise couleur qualitative | Faible | Moyen | Test explicite avec 2-3 valeurs connues aux bornes (37%, 38%, 55%, 56% côté ancien système → vérifier que leurs compléments à 100 tombent dans la classe miroir attendue) |
| R3 | `_articPrimaryEntry()` continue de calculer `eff` en interne pour le tri "Suggestion" — si un développeur futur (ou un correctif rapide) réintroduit par erreur ce chiffre dans le HTML en pensant l'afficher "juste pour debug", régression silencieuse vers l'affichage individuel que ce cycle retire explicitement | Faible | Moyen | Commentaire explicite dans le code (déjà prévu par l'Architecture) rappelant que `eff` ne doit jamais atteindre le HTML rendu |
| R4 | Le renommage des libellés ("Top Def"→"Suggestion", "Bloc Total"→"À 6", etc.) casse une référence dans la documentation existante (STORY-34/36, checklist de régression) qui utilise encore les anciens noms — pas un risque applicatif, mais un risque de confusion documentaire lors d'une future recherche dans les rapports archivés | Élevée (certain) | Faible | Accepté : les rapports historiques (QA-21, E2E-19/20, checklist v258-v262) restent datés et font foi pour leur époque ; seule la checklist vivante (I22) doit refléter le vocabulaire actuel après ce cycle |
| R5 | La ligne récapitulative des 6 noms sous le terrain (nouveau, §6 du Design) devient incohérente avec les ronds si un poste n'a pas de joueur (`—`) — à vérifier que cette ligne gère proprement l'absence de donnée plutôt que d'afficher "undefined" ou une virgule orpheline | Faible | Faible | Cas limite à tester explicitement en QA : dispositif avec au moins un poste sans donnée |

## Classement

- **P1** : R1 — bloquant pour le go-live sans vérification exhaustive, pas pour démarrer le développement.
- **P2** : R2, R3 — à couvrir par des tests ciblés, pas de mitigation de conception supplémentaire.
- **P3** : R4, R5 — cosmétique/documentaire, acceptés en l'état avec la recommandation notée.

Aucun risque P0.
