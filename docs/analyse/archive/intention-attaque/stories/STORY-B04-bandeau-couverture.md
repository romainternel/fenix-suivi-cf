# STORY-B04 — Bandeau de couverture + card "Non classifié" enrichie

**En tant que** coach FENIX,
**Je veux** voir immédiatement si des tirs ont une intention non reconnue, et pouvoir les résoudre en un clic,
**Afin de** ne pas avoir à ouvrir la console ou à chercher moi-même les cas problématiques.

## Contexte technique
- Zone concernée : section `#enc-familles-section` (`page-analyse.js`), juste après le titre "⚡ ENCLENCHEMENTS OFFENSIFS FENIX" — cf. `docs/analyse/DESIGN-intention-attaque.md` §1-2.
- Réutilise la card "Non classifié" existante (v176) et le mécanisme de réassignation `enc_famille_custom` (v170) — **aucune nouvelle UI de réassignation**, uniquement le bandeau et le lien de scroll.
- Dénominateur de couverture = lignes avec `Intention attaque` **ou** `Enclenchement` renseigné (exclut les lignes sans aucune donnée d'enclenchement, cf. risque R4) ; numérateur = lignes correctement résolues en une famille autre que "Non classifié".
- Le bandeau ne s'affiche que si couverture < 100% (masqué du DOM, pas juste caché en CSS, si 0 orphelin).

## Critères d'acceptation
- [ ] Sur le match test (187 lignes, 4 en "BLOC"), le bandeau affiche un texte cohérent avec le nombre réel d'orphelins (pas nécessairement "4 sur 187" littéralement si le dénominateur exclut les lignes sans enclenchement — le chiffre doit être vérifié manuellement contre les données réelles, pas supposé).
- [ ] Clic sur "Résoudre →" scrolle vers la card "Non classifié" et déclenche le halo visuel (cf. Visual Crafter, `encHighlightPulse`).
- [ ] Après réassignation manuelle de toutes les intentions orphelines via le dropdown existant, le bandeau disparaît immédiatement (sans réimport ni rechargement de page).
- [ ] Import d'un match à 100% de couverture → bandeau absent du DOM (vérifiable en inspectant l'arbre, pas juste visuellement).
- [ ] Le `?v=` est bumped.

## Hors scope
- La distinction visuelle entre orphelin "legacy" et orphelin "Intention attaque" — volontairement absente (cf. Design §2, l'utilisateur n'a pas besoin de cette distinction).
- Le calcul de `getActiveFamilles()`/classification (STORY-B01/B02, prérequis).

## Dépend de
- STORY-B01 (pour disposer du statut "Non classifié" par ligne)

## Taille
M
