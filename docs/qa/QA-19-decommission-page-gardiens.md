# QA-19 — Décommissionnement de la page orpheline `page-gardiens` (STORY-29)

**Agent :** QA
**Date :** 2026-09-01

---

## Critères d'acceptation testés

| # | Critère | Résultat |
|---|---|---|
| 1 | Recherche exhaustive re-confirmée, élargie | ✅ 4 références supplémentaires trouvées et nettoyées, non anticipées par l'Architecture |
| 2 | Markup + fonctions + variables supprimés | ✅ |
| 3 | Bug tooltip découvert et corrigé | ✅ testé dans les deux sens |
| 4 | Non-régression | ✅ |
| 5 | 0 erreur console | ✅ |

## Vérification du bug tooltip — le point le plus important de cette QA

Testé explicitement, pas supposé :
- Gardien sélectionné (Gabin.S), survol d'un point avec `resultat: "But"` (but encaissé) → tooltip affiche `✕` en rouge (`#fca5a5`) — correct, un but encaissé est un événement négatif pour le gardien
- Joueur de champ sélectionné (Antonin Vache), survol d'un point avec `resultat: "But"` (but marqué) → tooltip affiche `●` en vert (`#6ee7b7`) — correct, inchangé par rapport à avant STORY-27/29

Sans ce fix, le premier cas aurait affiché à tort `●` vert (positif) pour un but encaissé — une inversion silencieuse du sens visuel, découverte uniquement parce que le Developer a pris le temps de tester le tooltip lui-même plutôt que de se fier à l'apparence des points seuls (déjà vérifiée correcte lors de STORY-27).

## Non-régression

Navigation Dashboard → Analyse → Joueurs, changement de saison, page Impact (gardien + joueur de champ) — tous testés après suppression, 0 erreur console, comportement identique à avant.

## Bugs trouvés

Un (tooltip, voir ci-dessus) — confirmé corrigé.

---

## Verdict : ✅ PASSED
