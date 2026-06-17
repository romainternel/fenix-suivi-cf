# BACKLOG — Module Analyse FENIX Handball

**Scrum Master :** pipeline BMAD
**Date :** 2026-06-17
**Version :** 1.0
**Source :** PRD-analyse-module.md · ARCH-analyse-module.md · DESIGN-analyse-module.md

---

## Synthèse des sprints

| Sprint | Stories | Objectif livré |
|--------|---------|----------------|
| Sprint 0 (prérequis) | Hors code — session coach | ENC_FAMILLE_MAP validé |
| Sprint 1 | A-00 | Fondation parser + coverage |
| Sprint 2 | A-01, A-02, A-03 | Cards familles complètes (Bite + Snack + badges) |
| Sprint 3 | A-04, A-05 | Timeline enrichie + section bascule |
| Sprint 4 | A-06, A-07 | Gardien × famille + heatmap filtrée |
| Sprint 5 (R2) | A-08 | Saison V vs D par famille |

---

## Tableau complet des stories

| ID | Titre | Sprint | Taille | Dépend de | Parallélisable avec |
|----|-------|--------|--------|-----------|---------------------|
| **A-00** | Parser `getEncFamille()` + `ENC_FAMILLE_MAP` + coverage | 1 | S | — (prérequis absolu) | — |
| **A-01** | Cards familles — structure HTML + données de base | 2 | M | A-00 | — |
| **A-02** | Cards familles — expand/collapse tableau détail | 2 | S | A-01 | A-03 |
| **A-03** | Badge Force/Faiblesse dans les cards | 2 | S | A-01 | A-02 |
| **A-04** | Timeline — courbe d'écart + détection bascule | 3 | M | A-00 | A-05 |
| **A-05** | Timeline — section contextuelle "Pendant ce moment" | 3 | S | A-04 | — |
| **A-06** | Gardien × famille adverse — tableau + signaux | 4 | M | A-00 | — |
| **A-07** | Gardien × famille — filtre heatmap zones | 4 | S | A-06 | — |
| **A-08** | Saison V vs D par famille | 5 (R2) | M | A-00, A-01 (pattern) | — |

### Légende tailles

| Taille | Estimation effort |
|--------|------------------|
| XS | < 1h — quelques lignes JS |
| S | ½ journée — 1 fonction + CSS |
| M | 1 journée — plusieurs fonctions + intégration HTML |
| L | 2 journées — feature complexe avec interactions |
| XL | > 2 journées — architecture ou refactoring important |

---

## Séquence recommandée et dépendances

```
SPRINT 0 — PRÉREQUIS (hors code)
  └── [Session coach 15 min] Valider ENC_FAMILLE_MAP
      └── [Confirmer] définition PB = resultat === 'PB'
      └── [Confirmer] fix Bug #8 (canvas clientWidth)

SPRINT 1 — FONDATION
  └── A-00 : Parser + ENC_FAMILLE_MAP + coverage   [S]
             BLOQUE TOUT LE RESTE

SPRINT 2 — CARDS FAMILLES (après A-00)
  ├── A-01 : Cards HTML + données de base           [M]  ← séquentiel après A-00
  ├── A-02 : Expand/collapse détail                 [S]  ← séquentiel après A-01
  └── A-03 : Badges force/faiblesse                 [S]  ← peut être fait en parallèle avec A-02

SPRINT 3 — TIMELINE (après A-00, indépendant de A-01/A-02/A-03)
  ├── A-04 : Courbe d'écart + marqueur bascule      [M]  ← parallèle avec Sprint 2 si A-00 done
  └── A-05 : Section contextuelle bascule           [S]  ← séquentiel après A-04

SPRINT 4 — GARDIEN (après A-00, indépendant de Sprint 2 et 3)
  ├── A-06 : Tableau gardien × famille + signaux    [M]  ← parallèle avec Sprint 3
  └── A-07 : Filtre heatmap zones                   [S]  ← séquentiel après A-06

SPRINT 5 — SAISON (R2, après R1 complète validée)
  └── A-08 : Saison V vs D par famille              [M]  ← requiert A-00 + ≥ 5 matchs
```

### Vue parallélisme maximum (si 2 développeurs)

```
Après A-00 validé :

Développeur 1              Développeur 2
───────────────            ───────────────
A-01 (cards HTML)          A-04 (timeline courbe)
A-02 (expand/collapse)     A-05 (section bascule)
A-03 (badges)              A-06 (tableau gardien)
                           A-07 (heatmap filtrée)
```

Seul A-08 est R2 — à démarrer uniquement après validation terrain de R1.

---

## Conditions de "Done" globales (à respecter sur chaque story)

1. Le fichier `?v=` est bumped sur tous les `<script>` et `<link>` dans `FENIX-HANDBALL-CF-SUIVI.html`
2. Aucune régression sur les fonctions existantes (`generateResume3Points`, `generateIndicateurs`, `drawTimeline`, `findMomentsCles`, `saveCoachAnalyse`)
3. Le code est vanilla JS — aucun framework, aucun `import/export`
4. La feature est lisible sur tablette ≥ 768px (objectif O5)
5. Les critères d'acceptation de la story sont tous cochés par le QA

---

## Prérequis R1 (avant tout commit)

- [ ] Session coach terminée — ENC_FAMILLE_MAP renseigné avec les clés réelles
- [ ] Définition PB confirmée (`resultat === 'PB'`)
- [ ] Les 4 éléments HTML (`#enc-familles-section`, `#enc-bascule-section`, `#enc-gardien-section`, `#enc-saison-section`) présents dans `FENIX-HANDBALL-CF-SUIVI.html`
- [ ] Variables CSS `--enc-faire-courir`, `--enc-jeu-pivot`, `--enc-isoler`, `--enc-autre`, `--bascule-line` déclarées dans `:root`
- [ ] Bug #8 fix (canvas `clientWidth = 0`) prévu dans A-04

---

*Backlog v1.0 — pipeline BMAD FENIX — à lire avec les stories individuelles dans `docs/analyse/stories/`*
