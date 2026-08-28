# E2E-08 — STORY-16 : Passe visuelle page Analyse (bloc match + 5 onglets)

**Agent :** E2E Tester
**Date :** 2026-08-28
**Environnement :** local, session Playwright fraîche — login staff réel au clavier (`#login-input` + Enter)

---

## Parcours testé

| # | Parcours | Résultat | Preuve |
|---|---|---|---|
| 1 | Login staff réel → Analyse → sélection d'un second match (AMICAL FENIX-BILLERE, non testé par le Developer) → onglet Enclenchements | ✅ | `13-e2e-fresh-billere-enc.png` |
| 2 | (repris des vérifications Developer, ré-audité) Résumé — bloc hero + cartes Résumé/Coach/Indicateurs | ✅ | `01-resume-hero.png` |
| 3 | Enclenchements — cards familles, camembert, Matrice 2×2, drill-down | ✅ | `02-enclenchements.png` → `08-detail-panel.png` |
| 4 | Gardien — état vide | ✅ | `09-gardien-tab.png` |
| 5 | État vide global (données effacées) | ✅ | `10-empty-state-analyse.png` |
| 6 | Non-régression mobile — canvas Impact, header sticky | ✅ | `11-mobile-smoke-impact.png`, `12-mobile-smoke-sticky.png` |

## Constat visuel (transmis à Romain pour jugement final, cf. critère non automatisable du QA)
Sur les 2 matchs testés (L'Union et Billère, données différentes), le bloc terrain+cartes affiche une ombre nettement plus marquée que les cartes des onglets en dessous, cohérent avec sa position de bloc le plus important de l'écran. Les cards familles d'enclenchement sont visuellement plus calmes qu'avant — la hiérarchie entre le % principal, les stats secondaires (encl./tir) et les libellés est plus nette avec 3 tailles au lieu de ~7. Le camembert, la matrice 2×2 et le tableau de détail par intention d'attaque n'ont pas changé visuellement. Aucune donnée affichée n'a changé.

## Écarts avec le verdict QA
Aucun.

## Verdict

**✅ CONFIRMÉ**
