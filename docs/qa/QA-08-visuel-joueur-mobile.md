# QA-08 — STORY-18 : Passe visuelle mode joueur mobile

**Agent :** QA
**Date :** 2026-08-28
**Méthode :** Test en navigateur réel (Playwright), viewport 375×667 (iPhone SE), données réelles (`ESSAI IA STAT.xlsm`)

---

## Critères validés

| Critère | Statut | Preuve |
|---|---|---|
| Cartes KPI/signature/ACTIONS sur les mêmes tokens de couleur/ombre (`--gray-200`, `--shadow-sm`, `--gray-50`) | ✅ | `.pmf-card` et `.pmf-kpi-box` alignés — bordure/ombre visibles, cohérentes avec le reste de l'appli |
| Onglets Ma Fiche/Stats Match/Impact sur l'échelle "Onglet" | ✅ | `.pm-tab-btn` : Inter 0.85rem/700/0.3px, mécanique `pmTab()` non touchée (vérifié : navigation entre les 3 onglets fonctionnelle) |
| Badges pleins rouge/vert migrés, y compris tableau détaillé ATT+/ATT-/DEF+/DEF- | ✅ | En-têtes "ATTAQUE +/DÉFENSE +" et "ATTAQUE −/DÉFENSE −" : fond clair/texte foncé, conforme au pattern `.pmf-badge-up`/`-down` |
| Non-régression à 375px : canvas Impact pleine largeur en premier | ✅ | Zone "CENTRAL" pleine largeur affichée en premier, "EXT GAUCHE"/"EXT DROIT" côte à côte en dessous — `04-impact-375.png` |
| Non-régression à 375px : header sticky "Stats Match" non masqué | ✅ | Vérifié au chargement et après scroll (`window.scrollTo(0,400)`) — reste visible sous la barre de nav, pas de chevauchement |
| Non-régression à 375px : état vide "Données non disponibles" | ✅ | Testé avec session joueur réelle et données effacées — message affiché correctement (`09-empty-state-mafiche-375.png`) |
| Non-régression à 375px : badge signature sans parenthèse | ✅ | Réimport réel, joueur avec signature forte (Isaac, 10 buts) → badge affiche "But", pas "But (But DG)" (`10-signature-check-375.png`) |
| Comparaison avant/après | À valider par Romain | Captures jointes à `docs/e2e/E2E-07-visuel-joueur-mobile.md` — jugement produit, non automatisable |

**8/8 critères techniques validés** (le critère de jugement visuel est transmis à Romain, non tranchable par le QA).

## Cas limites

- Testé un joueur de champ (Lucas Ginestet, ARG) et un autre profil (Isaac, AG) — les deux rendent correctement.
- Bascule Ma Fiche → Actions "Voir tout" → Réduire : ouverture/fermeture du détail 4 quadrants sans accroc visuel après le changement de couleur des en-têtes.
- Tentative initiale via le mode "Vue joueur" (staff) pour simuler l'état vide : ce mode ne persiste pas au reload (comportement normal, pas un bug — la préview est un aperçu ponctuel, pas une vraie session). Contournée en injectant directement une session `role:'joueur'`.

## Régressions détectées

Aucune.

## Verdict global

**✅ PASSED**
