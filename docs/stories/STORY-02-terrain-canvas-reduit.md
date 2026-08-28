# STORY-02 — Canvas terrain vu du dessus réduit sur mobile

**En tant que** joueur sur téléphone,  
**Je veux** que le dessin du terrain ne prenne pas toute la hauteur de mon écran,  
**Afin de** voir rapidement mes zones de tir sans scroller interminablement.

## Contexte technique
- Fichier : `css/style.css`
- Classe existante `.terrain-wrapper-small` — ligne ~605
- Ajouter une media query `@media (max-width: 600px)` avec `max-height: 130px` sur `.terrain-wrapper-small`
- Le canvas interne calcule sa hauteur depuis `container.clientHeight` → suit automatiquement
- Aucune modification JS

## Critères d'acceptation
- [ ] Sur mobile (375px simulé), le canvas terrain fait ≤ 130px de hauteur
- [ ] Les points de tir restent visibles et proportionnels (pas d'étirement)
- [ ] Sur desktop (≥ 601px), le canvas terrain conserve sa taille actuelle
- [ ] Aucune régression sur la page Joueurs du staff (canvas terrain staff inchangé)

## Hors scope
- Pas de modification du canvas impact (alg/face/ald)
- Pas de changement de la taille sur desktop

## Dépend de
- Aucune

## Taille
S
