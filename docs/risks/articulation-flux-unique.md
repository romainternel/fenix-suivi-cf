# Risques — Simplification du mode Articulation (flux unique)

**Agent :** Risk Analyst
**Date :** 2026-09-08

---

Feature front-end pure sur un module déjà en production, retouché à 5 reprises consécutives (v264→v267 + ce cycle) — les catégories pertinentes restent la régression fonctionnelle et les cas limites de présentation.

## Tableau de risques

| # | Risque | Probabilité | Impact | Recommandation |
|---|---|---|---|---|
| R1 | Suppression accidentelle d'une fonction encore utile ailleurs — `_setArticListingFilter`/`_selectArticPoste`/`_articPosteHighlighted` sont retirées dans ce cycle ; si l'une était référencée par un `onclick` oublié dans un template non touché, la fonctionnalité casserait silencieusement (pas d'erreur avant le clic) | Moyenne | Moyen | Recherche exhaustive de chaque nom de fonction supprimée dans tout `js/page-analyse.js` avant de les retirer, pas seulement dans le bloc Articulation |
| R2 | Seuil de fiabilité du classement (`>= 5`) mal aligné avec celui de la couleur (`_articDefClass`, `possessions < 5` → `noref`) — un décalage d'une unité classerait une composition à exactement 5 séquences différemment entre le groupe "Fiable" et la couleur affichée à côté | Faible | Faible | Test explicite avec une composition à exactement 5 séquences, vérifier qu'elle tombe dans "Fiable" ET n'affiche pas `(n<3)` |
| R3 | Perte de la capacité à "tout réinitialiser d'un coup" (l'ancien lien "Réinitialiser" global disparaît) — si Romain a modifié 4-5 postes manuellement et veut tout annuler, il doit maintenant rouvrir chaque encart un par un plutôt qu'un clic global | Moyenne | Faible | Accepté pour ce cycle (Romain n'a pas demandé à garder un reset global, et cliquer une ligne du classement à la largeur "À 6" réinitialise les 6 postes d'un coup, ce qui couvre le cas d'usage principal) — à surveiller si Romain le redemande explicitement |
| R4 | `_setArticManualJoueur` fermant l'encart inconditionnellement (Architecture §1.6) pourrait fermer un encart que l'utilisateur n'a pas ouvert lui-même si la fonction est appelée par un autre chemin de code futur — actuellement aucun autre appelant n'existe, donc sans impact réel aujourd'hui | Faible | Faible | Documenté dans le commentaire de la fonction plutôt que traité comme un vrai risque actif |
| R5 | Le classement "À 6" (ligne complète) peut n'avoir aucune composition à 6 joueurs identiques observée deux fois (échantillon très dispersé, déjà constaté : "aucune séquence avec ce groupe" fréquent pour ce niveau) — le groupe "Fiable" pourrait être vide en permanence pour cette largeur précise, réduisant l'utilité du classement "À 6" | Élevée (déjà observé) | Faible (comportement honnête, pas un bug) | Vérifier que l'état vide de chaque groupe (Fiable vide, ou les deux vides) reste lisible et n'affiche pas un panneau cassé — critère d'acceptation à ajouter explicitement pour "À 6" en particulier, pas seulement pour le cas générique |

## Classement

- **P1** : aucun — pas de risque bloquant le développement.
- **P2** : R1, R2, R5 — à couvrir explicitement en Code Review/QA avant livraison.
- **P3** : R3, R4 — acceptés en l'état, documentés.

Aucun risque P0.
