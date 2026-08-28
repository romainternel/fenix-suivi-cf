# Backlog — Refonte Navigation & Design Visuel
**Scrum Master** · 2026-08-28

## Vague 1 — Fondations (aucune dépendance entre elles, livrables en parallèle)
| # | Story | Taille |
|---|-------|--------|
| STORY-12 | Menu "Outils" (regroupe Comptes + Vue joueur) | S |
| STORY-13 | Tokens visuels de base (couleurs, ombres, typo, radius) | S |
| STORY-14 | Découpage Analyse en 5 onglets (structure) | L |

## Vague 2 — Habillage visuel (dépend de la Vague 1)
| # | Story | Taille | Dépend de |
|---|-------|--------|-----------|
| STORY-15 | Passe visuelle Dashboard | M | STORY-13 |
| STORY-16 | Passe visuelle Analyse (bloc match + 5 onglets) | L | STORY-13, STORY-14 |
| STORY-17 | Passe visuelle Joueurs | M | STORY-13 |
| STORY-18 | Passe visuelle mode joueur mobile | M | STORY-13 |
| STORY-19 | Panneau latéral Comptes/Vue joueur | M | STORY-13, STORY-12 |

## Séquence recommandée
```
STORY-13 ─┬─→ STORY-15
          ├─→ STORY-14 ─→ STORY-16
          ├─→ STORY-17
          ├─→ STORY-18
          └─→ STORY-19 (après STORY-12)
STORY-12 ──────────────→ STORY-19
```
STORY-13 et STORY-14 sont les deux bloquantes à livrer en premier (l'une fonde le visuel de toutes les autres stories, l'autre conditionne STORY-16 spécifiquement). STORY-12 est indépendante et peut être livrée à tout moment de la Vague 1.

## Critère de Done global
Toutes les stories PASSED au QA (avec repasse explicite de la checklist mobile de `docs/audit-final/AUDIT-2026-08-28.md` sur STORY-16 et STORY-18) + `?v=` bumpé sur tous les fichiers concernés + git push GitHub.

## Suivi
Enchaîner avec `/squad-control STORY-12` (ou dans l'ordre de la séquence recommandée) pour lancer le squad de contrôle (Developer → Code Reviewer → Security Auditor → QA → E2E Tester → Regression Guardian) story par story.
