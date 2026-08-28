# Backlog — Vue Joueur Mobile v2
**Scrum Master** · 2026-06-15

## SPRINT 1 — Fondations (CSS / HTML / 2 lignes JS)
_Aucune dépendance entre elles. Toutes livrables en parallèle._

| # | Story | Taille | Fichiers touchés |
|---|-------|--------|-----------------|
| S-01 | Session reprend sur dernier onglet | S | player-mode.js |
| S-02 | Canvas terrain réduit mobile | S | style.css |
| S-03 | Header Stats Match sticky | S | HTML + style.css |
| S-04 | Canvas zones responsive (face en premier) | M | style.css |
| S-05 | Tooltip note joueur de champ | S | player-mode.js |
| S-06 | Stats perso avant stats équipe | M | HTML + player-mode.js |

## SPRINT 2 — Interactivité
_S-08 indépendante. S-07 indépendante._

| # | Story | Taille | Dépend de |
|---|-------|--------|-----------|
| S-07 | Filtrer zones par résultat (Tout/Buts/Ratés) | M | — |
| S-08 | Masquer sélecteur période si aucun bilan | S | — |

## SPRINT 3 — Intelligence
_S-09 doit être faite avant S-10. S-11 est indépendante._

| # | Story | Taille | Dépend de |
|---|-------|--------|-----------|
| S-09 | Graph Ma Fiche : filtre période + 2 courbes mobile | L | S-08 (règle bilan) |
| S-10 | Diagnostic évolution ↑↓ entre bilans | M | S-09 |
| S-11 | Badge "Ta signature" — action dominante | L | — |

## SÉQUENCE RECOMMANDÉE

```
S-01 → S-02 → S-03 → S-04 → S-05 → S-06   (Sprint 1, dans n'importe quel ordre)
                    ↓
              S-07 → S-08                    (Sprint 2)
                    ↓
         S-09 → S-10   +   S-11             (Sprint 3, S-09/S-10 en séquence, S-11 en parallèle)
```

## CRITÈRE DE DONE GLOBAL
Toutes les stories PASSED au QA + `?v=` bumped à 96 + git push GitHub.
