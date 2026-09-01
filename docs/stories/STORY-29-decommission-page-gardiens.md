# STORY-29 — Décommissionnement de la page orpheline `page-gardiens`

**En tant que** codebase (pas de bénéfice utilisateur direct, dette technique),
**Je veux** supprimer l'ancienne page `page-gardiens` devenue inutile,
**Afin de** ne pas laisser une deuxième implémentation morte et non maintenue de "l'Impact d'un gardien" traîner dans le code.

## Contexte technique
- Zone concernée : markup `<div class="page" id="page-gardiens">` et son contenu (`FENIX-HANDBALL-CF-SUIVI.html`), fonctions `updateGardiensPage()`, `drawGardienCanvas()`, sélecteurs `#filter-gardien`/`#filter-gardien-match`, canvas `#goal-canvas-alg/face/ald`
- Recherche exhaustive déjà faite par l'Architect (`docs/arch/impact-gardien.md` §1) : aucune référence externe à ce sous-système en dehors de lui-même — à **re-confirmer** avant suppression (le code peut avoir bougé entre l'Architecture et le développement de cette story)

## Critères d'acceptation
- [x] **Recherche exhaustive re-confirmée** (élargie à `filter-gardien|goal-canvas|GARDIEN_DOTS|gardienZoneFilter|toggleGardienZone|gb-tirs|gb-arrets|gb-pct|gb-buts`, au-delà de la liste initiale de l'Architecture) : 4 références supplémentaires trouvées non anticipées (`updateGardienZoneUI()`, entrées `filter-gardien-match` dans 2 tableaux de filtres partagés, 1 appel de peuplement de select) — toutes supprimées
- [x] Markup (`#page-gardiens` entier), 4 fonctions (`toggleGardienZone`, `updateGardienZoneUI`, `drawGardienCanvas`, `updateGardiensPage`), variables (`gardienZoneFilter`, `GARDIEN_DOTS`) et sélecteurs associés supprimés
- [x] **Bug réel découvert et corrigé en marge** : le tooltip au survol des canvas de la page Impact (`_showCanvasTooltip`, réutilisée depuis STORY-27 pour les deux cas) passait `isGardien: false` en dur, jamais mis à jour pour refléter le vrai statut du joueur sélectionné — un survol sur un but encaissé de gardien aurait affiché le marqueur "●" vert (positif) au lieu de "✕" rouge. Corrigé via une nouvelle variable `_impactIsGB`, mise à jour par `updateImpactPage()` et lue par le tooltip. Vérifié explicitement : marqueur correct dans les deux cas (gardien et joueur de champ)
- [x] Non-régression : navigation Dashboard/Analyse/Joueurs, changement de saison, page Impact (joueur de champ et gardien) — tous fonctionnels après suppression
- [x] Testé : 0 erreur console au chargement et lors de la navigation habituelle

## Hors scope
- Toute autre page potentiellement orpheline du projet (ex. `page-match`, déjà notée ailleurs comme désactivée) — non concernée par cette story

## Dépend de
- STORY-27 (doit être vérifiée en E2E avant que cette story ne commence — jamais l'inverse, cf. Risk R3)

## Taille
S
