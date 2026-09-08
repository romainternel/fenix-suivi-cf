# STORY-45 — Matrice 2×2 : refonte visuelle

**En tant que** Romain (staff),
**Je veux** que la matrice fréquence × efficacité soit plus grande et plus agréable à lire,
**Afin de** repérer directement dans quel quadrant se trouve chaque famille (force dominante, à corriger, etc.) sans effort de lecture.

## Contexte technique

- Aucun changement de calcul — la fonction existante qui positionne les familles sur la matrice (à localiser précisément par le Developer en amont, non auditée en détail dans ce cycle) garde son contrat d'entrée/sortie.
- Refonte CSS/rendu uniquement : matrice agrandie, 4 quadrants teintés avec libellés ("Force dominante" haut-droit, "Arme sous-utilisée" haut-gauche, "À muscler" bas-droit, "À corriger" bas-gauche — cf. mockup validé et `docs/visual/reorganisation-page-analyse.md`), bulles avec ombre portée et effet de survol (léger agrandissement).
- Si la matrice est actuellement en Canvas 2D plutôt qu'en HTML/CSS positionné (à vérifier par le Developer), adapter l'implémentation du mockup (divs positionnés en `%`) au mécanisme réellement en place plutôt que de forcer une réécriture complète non prévue par ce cycle.

## Critères d'acceptation

- [ ] La matrice est visuellement plus grande qu'aujourd'hui et lisible sans plisser les yeux sur un écran desktop standard.
- [ ] Les 4 quadrants sont visuellement distincts (teinte de fond différente) avec leur libellé.
- [ ] Chaque bulle affiche toujours le nom de la famille et son % d'efficacité, positionnée au même endroit relatif qu'aujourd'hui (même donnée sous-jacente, pas de changement de position logique).
- [ ] Survoler une bulle produit un effet visuel (agrandissement léger) sans casser la mise en page.
- [ ] Non-régression : bascule Attaque/Défense et Vue générale/Matrice 2×2/Articulation continuent de fonctionner, en vue match et en vue saison.

## Hors scope

- Tout changement de calcul de fréquence/efficacité par famille.
- Les autres sous-modes (Vue générale, Articulation) — inchangés.

## Dépend de

- Aucune.

## Taille

S
