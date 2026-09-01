# STORY-29 — Décommissionnement de la page orpheline `page-gardiens`

**En tant que** codebase (pas de bénéfice utilisateur direct, dette technique),
**Je veux** supprimer l'ancienne page `page-gardiens` devenue inutile,
**Afin de** ne pas laisser une deuxième implémentation morte et non maintenue de "l'Impact d'un gardien" traîner dans le code.

## Contexte technique
- Zone concernée : markup `<div class="page" id="page-gardiens">` et son contenu (`FENIX-HANDBALL-CF-SUIVI.html`), fonctions `updateGardiensPage()`, `drawGardienCanvas()`, sélecteurs `#filter-gardien`/`#filter-gardien-match`, canvas `#goal-canvas-alg/face/ald`
- Recherche exhaustive déjà faite par l'Architect (`docs/arch/impact-gardien.md` §1) : aucune référence externe à ce sous-système en dehors de lui-même — à **re-confirmer** avant suppression (le code peut avoir bougé entre l'Architecture et le développement de cette story)

## Critères d'acceptation
- [ ] **Recherche exhaustive re-confirmée** (`grep -rn "page-gardiens\|updateGardiensPage\|drawGardienCanvas"`) : aucune référence restante en dehors du bloc à supprimer, y compris dans `case 'gardiens':` du routeur de pages générique et l'appel de rafraîchissement lié au changement de saison
- [ ] Markup, fonctions et sélecteurs associés supprimés
- [ ] Non-régression : le reste de l'app (changement de saison, navigation entre pages) fonctionne normalement après suppression
- [ ] Testé : aucune erreur console au chargement de l'app et lors de la navigation habituelle

## Hors scope
- Toute autre page potentiellement orpheline du projet (ex. `page-match`, déjà notée ailleurs comme désactivée) — non concernée par cette story

## Dépend de
- STORY-27 (doit être vérifiée en E2E avant que cette story ne commence — jamais l'inverse, cf. Risk R3)

## Taille
S
