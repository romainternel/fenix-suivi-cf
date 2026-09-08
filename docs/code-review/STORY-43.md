# Code Review — STORY-43 : Timeline — refonte visuelle et bascules sur la courbe

**Agent :** Code Reviewer
**Date :** 2026-09-09

---

## Fichiers modifiés

- `js/page-analyse.js` : `drawTimeline()` réécrite (aire d'écart dégradée remplace les 2 courbes absolues, grille verticale toutes les 10 min, marqueurs bascule en losange sur la courbe + ligne pointillée) ; `drawMomentumOverlay()` supprimée (logique fusionnée dans `drawTimeline()`, elle n'était appelée que depuis là) ; `CLAUDE.md` version `v273` → `v274`.
- `FENIX-HANDBALL-CF-SUIVI.html` : bump `?v=273` → `?v=274`.

## Conformité Architecture / Story

Conforme : `getSortedGoals`/`normPos`/`scoreHistory` non modifiés (vérifié ligne par ligne, code identique à avant). Les marqueurs de bascule réutilisent `_bascules` (déjà peuplé par `detectAllBascules()`, non touché) et son champ `b.apres` déjà calculé — aucun recalcul introduit pour positionner le losange sur la courbe.

**Bonne décision technique** : `drawMomentumOverlay()` faisait déjà presque exactement ce que demandait la story (aire dégradée + courbe d'écart), mais en overlay secondaire par-dessus les 2 anciennes courbes absolues avec un rendu plat (10% d'opacité fixe). Plutôt que de garder 2 fonctions qui dessinent la même chose à des échelles différentes, le Developer a fusionné : la logique de zone (déjà correcte) devient le rendu principal, améliorée avec un vrai dégradé (`createLinearGradient`) au lieu d'une opacité plate. `drawMomentumOverlay()` n'ayant plus aucun appelant, sa suppression évite du code mort — bon réflexe, sans toucher à `detectBasculeMoment()` (dead code préexistant et non lié à cette story, laissé tel quel, correctement noté hors scope).

**Point de vigilance vérifié par le QA plutôt que supposé** : le système de tooltip au survol (`window._timelineHitAreas`, `initTimelineTooltip()`) et le clic pour dérouler les séquences (`showMCSequences`) ne sont pas mentionnés dans le contexte technique de la story, mais dépendent entièrement de la géométrie que cette story change. Le Developer a conservé exactement la même forme d'objet (`type`/`x`/`y`/`w`/`h`/`label`/`text`/`positif`/`rawPos`/`startRaw`/`endRaw`/`seqRows`) en ne changeant que les coordonnées — bonne discipline de ne pas toucher à un système qui fonctionne déjà pour se concentrer sur ce que la story demande.

## Vérifications systématiques

- **Réutilisation vs duplication** : un seul point de calcul de `diffToY`/`posToX`, utilisé pour l'aire, la courbe, les marqueurs MC et bascule, et les hit areas — pas de dérive entre plusieurs formules qui auraient pu légèrement diverger.
- **Scope** : `detectAllBascules`, `getSortedGoals`, `normPos` non modifiés. La liste textuelle "⚡ Bascules du match" (`renderBasculContext`) non touchée, reste affichée en complément comme demandé en "Hors scope".
- **Recherche de références résiduelles** : `grep` de `drawMomentumOverlay` sur tout le projet — plus aucun appel, uniquement la définition (supprimée) et des mentions dans la documentation archivée (historique, sans impact).

## Remarque

**Note (pas bloquante)** : avec un match à beaucoup de bascules (11 observées sur un match réel de test), les lignes pointillées verticales des bascules se superposent visuellement aux lignes des moments clés dans la zone haute du graphique — dense mais lisible (couleurs distinctes : orange bascules, vert/rouge MC). La story ne demandait pas de mécanisme de dé-densification, donc pas un écart au cahier des charges — à surveiller si Romain trouve ça chargé sur les matchs à beaucoup de bascules.

## Verdict

**APPROUVÉ** — aucun point bloquant.
