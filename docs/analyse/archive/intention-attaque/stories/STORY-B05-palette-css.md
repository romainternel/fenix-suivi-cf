# STORY-B05 — Palette CSS et micro-animations

**En tant que** développeur,
**Je veux** ajouter les styles exacts spécifiés par le Visual Crafter pour la nouvelle famille et le bandeau de couverture,
**Afin que** le rendu final soit cohérent avec l'identité visuelle existante de l'app.

## Contexte technique
- Zone concernée : `css/style.css`, section des variables `--enc-*` (lignes 16-25).
- Spécifications exactes dans `docs/analyse/VISUAL-intention-attaque.md` : `--enc-jeu-rapide: #4F46E5`, styles `.enc-coverage-banner`, `.enc-card-highlight` + keyframes `encBannerIn`/`encHighlightPulse`, styles `.enc-orphelin-row`.
- `--enc-bloc-pvt` et `--enc-rebond` restent inchangés dans le fichier (toujours utilisés pour le rendu des saisons legacy).

## Critères d'acceptation
- [ ] `--enc-jeu-rapide: #4F46E5` ajoutée sans supprimer aucune variable existante.
- [ ] Le bandeau de couverture utilise exactement les styles spécifiés (fond `#FEF3E2`, bordure gauche `var(--fenix-warning)`, animation d'entrée 200ms).
- [ ] Le halo de guidage (`encHighlightPulse`) dure 1.5s et ne boucle pas.
- [ ] Vérification visuelle manuelle : sur le camembert du match test, la tranche "Jeu Rapide" (indigo) reste distinguable de "Jeu Pivot" (violet) même en tranches adjacentes — ajouter un `stroke` blanc 1px entre tranches si ce n'est pas déjà le cas dans le composant existant.
- [ ] Contrastes WCAG vérifiés conformes au tableau de `docs/analyse/VISUAL-intention-attaque.md` §6 (aucune valeur en dessous d'AA).
- [ ] Le `?v=` du CSS est bumped.

## Hors scope
- Toute modification de la structure HTML des cards/camembert (Design/Architecture, stories précédentes).

## Dépend de
- STORY-B04 (les éléments DOM `.enc-coverage-banner`/`.enc-card-highlight` doivent exister avant d'y appliquer le style)

## Taille
S
