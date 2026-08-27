# STORY-B03 — Vérification transversale de cohérence entre affichages

**En tant que** développeur,
**Je veux** vérifier explicitement que cards, camembert, matrice 2×2 et tableau d'efficacité V/D affichent tous le même jeu de familles avec les mêmes valeurs pour un même match,
**Afin de** garantir qu'aucun des ~15 sites migrés en STORY-B02 n'a été oublié ou mal branché (risque R2, probabilité élevée identifiée par le Risk Analyst).

## Contexte technique
- Ne s'agit pas d'ajouter une nouvelle feature, mais d'un passage de vérification dédié — cf. `docs/analyse/RISKS-intention-attaque.md` R2 : "prévoir une story de vérification transversale distincte des stories d'implémentation".
- Sur le match test `AMICAL FENIX-L'UNION`, comparer pour chaque famille active : % utilisation (cards) = part du camembert = position dans la matrice = ligne du tableau "Efficacité par famille".
- Une méthode simple : extraire par `console.log`/script temporaire les valeurs affichées par chacun des 4 rendus pour la même famille et les comparer programmatiquement (écart = bug), plutôt qu'une simple relecture visuelle.

## Critères d'acceptation
- [ ] Pour chacune des 8 familles actives du match test, le pourcentage d'utilisation affiché dans la card correspond exactement à la part du camembert (à l'arrondi près, cohérent).
- [ ] Les mêmes 8 familles (+ éventuellement "Non classifié") apparaissent dans la matrice 2×2 — aucune famille manquante ou en trop par rapport aux cards.
- [ ] Le tableau "Efficacité par famille — Saison" liste exactement les mêmes familles, dans un ordre cohérent (tri par utilisation décroissante, comme avant ce chantier).
- [ ] La liste déroulante des familles dans le chat IA reflète également le même jeu de 8 familles.
- [ ] Aucune référence résiduelle à l'ancienne constante figée `ENC_FAMILLES_ORDRE` ne subsiste dans `page-analyse.js` (vérifiable par une recherche texte dans le fichier).

## Hors scope
- Toute correction de fond sur la logique de classification (déjà couverte par B01/B02) — cette story ne fait que vérifier, elle ne doit pas nécessiter de nouvelle décision produit.

## Dépend de
- STORY-B02

## Taille
S
