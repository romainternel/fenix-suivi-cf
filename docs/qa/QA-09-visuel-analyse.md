# QA-09 — STORY-16 : Passe visuelle page Analyse (bloc match + 5 onglets)

**Agent :** QA
**Date :** 2026-08-28
**Méthode :** Test en navigateur réel (Playwright), données réelles (`ESSAI IA STAT.xlsm`)

---

## Critères validés

| Critère | Statut | Preuve |
|---|---|---|
| Bloc terrain+cartes en `.surface-hero` | ✅ | `#match-block-section` : radius 14px, shadow-lg, cohérent avec Résumé/Enclenchements en dessous — `01-resume-hero.png` |
| Cartes des 5 onglets en `.surface-card` | ✅ | `.analyse-section`/`.analyse-card` : bordure fine + ombre légère sur Résumé, Coach, Indicateurs, Timeline, Enclenchements, Gardien — vérifié sur 3 onglets différents |
| Onglets sur l'échelle "Onglet" (actif/inactif/hover/focus) | ✅ | `.an-tab-btn` déjà à 0.85rem/700/0.3px depuis STORY-17 ; `:focus-visible` (outline accent) ajouté, absent avant |
| Cards familles enclenchement : max 3 niveaux typographiques | ✅ | `.enc-card-mini` : 7 tailles distinctes consolidées à 3 (Valeur clé/Corps/Micro) — `02-enclenchements.png` |
| Badges pleins rouge/vert migrés | ✅ (déjà conforme) | `.enc-badge-mini` déjà fond clair/texte foncé avant la story ; vérifié visuellement en forçant l'affichage des deux variantes (aucune occurrence naturelle dans le jeu de test) — `04-badge-force-faiblesse-check.png` |
| Canvas non affectés dans leur logique | ✅ | Camembert, matrice 2×2, terrain de tir : rendus identiques, `page-analyse.js` non modifié |
| Non-régression 375px : canvas Impact pleine largeur | ✅ | `11-mobile-smoke-impact.png` |
| Non-régression 375px : header sticky non masqué | ✅ | `12-mobile-smoke-sticky.png` (vérifié après scroll) |
| Non-régression : état vide "Importe un fichier Excel..." | ✅ | `10-empty-state-analyse.png` — rendu correct dans le bloc désormais en élévation hero |
| Comparaison avant/après (Enclenchements + vue d'ensemble) | À valider par Romain | Captures jointes à `docs/e2e/E2E-08-visuel-analyse.md` — jugement produit, non automatisable |

**9/9 critères techniques validés** (le critère de jugement visuel est transmis à Romain, non tranchable par le QA).

## Cas limites

- Drill-down enclenchements (clic sur une card en vue Matrice 2×2) : tableau détaillé par intention d'attaque s'ouvre et se ferme correctement, carte sélectionnée mise en évidence — aucune régression du mécanisme malgré le changement de style des cards.
- Bascule Vue générale ↔ Matrice 2×2, Attaque ↔ Défense : les 8 familles + "Non classifié" s'affichent avec les nouvelles tailles de texte sur les deux vues.
- Onglet Gardien sans donnée gardien pour ce match : message "Aucune donnée gardien." affiché correctement dans la carte `.surface-card`.
- Mode joueur (Impact, Stats Match) : re-testé à 375px alors qu'aucun sélecteur `.pmf-*`/`.pm-*` n'est touché par cette story — confirmation active plutôt que supposition, cohérent avec le caractère sensible de ces correctifs signalé par la story.

## Régressions détectées

Aucune.

## Verdict global

**✅ PASSED**
