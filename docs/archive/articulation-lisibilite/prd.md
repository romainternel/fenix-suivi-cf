# PRD — Refonte lisibilité du mode Articulation

**Agent :** Product Manager
**Date :** 2026-09-06

---

## 1. Objectif

Réorganiser la présentation du mode Articulation (terrain, contrôles, indicateurs) sans toucher au calcul des données, pour que Romain identifie en un coup d'œil qui occupe chaque poste, quel réglage est actif, et retrouve un placement des postes fidèle à la vraie ligne des 6m.

## 2. Features

### F1 — Ronds-poste allégés (nom seul)
Les 6 ronds sur le terrain n'affichent plus que le nom du joueur (plus de pourcentage empilé dans le cercle). Un signal visuel minimal d'efficacité peut subsister (ex. couleur de bordure) si le Designer le juge nécessaire pour ne pas perdre l'information en un coup d'œil — mais le chiffre lui-même migre ailleurs (détail au clic, cartes Bloc).

### F2 — Postes sur la courbe réelle du 6m (dispositif 0-6)
Les 6 postes du dispositif 0-6, actuellement alignés à `y` constant dans `ARTIC_LAYOUTS['0-6']`, sont repositionnés pour suivre le tracé de l'arc 6m dessiné par `_articCourtSvg()` (`M 12.5,10 A 37.5,30 0 0,0 87.5,10`) : le `y` de chaque poste se calcule à partir de son `x` selon l'équation de cette ellipse, pas une valeur fixe.

### F3 — Cohérence du dispositif 1-5
Le dispositif 1-5 a déjà des postes à hauteurs variables (P3 en couverture, P4 avancé) mais pas nécessairement calés sur un tracé précis. Revalider ce placement à la lumière de la même logique que F2, sans nécessairement forcer un calcul d'arc strict si la disposition en losange actuelle reste plus lisible pour un 1-5 (dispositif où P3/P4 ne sont justement pas sur la ligne des autres).

### F4 — Bandeau de contrôles réorganisé
Les trois mécanismes de réglage (dispositif 0-6/1-5, mode Le+utilisé/Top Def, sélection manuelle par poste) sont regroupés dans une zone visuellement distincte du terrain, avec un état actif lisible sans ambiguïté pour chacun.

### F5 — Nouvelle hiérarchie des indicateurs
Redéfinir où vit chaque donnée déjà calculée aujourd'hui, en s'appuyant sur ce qui existe :
- Efficacité individuelle par poste (`computeArticulationStats`) — reste consultable, mais plus dans le rond (cf. F1)
- Efficacité globale adverse de référence (`stats.global`)
- 3 cartes Bloc (`ARTIC_BLOCKS`/`_articBlockEff`)
- Panneau de détail multi-joueurs au clic sur un poste
- Sélecteur manuel de joueur par poste

Le Designer propose une organisation spatiale unique pour ces 5 éléments plutôt qu'un empilement séquentiel comme aujourd'hui.

## 3. Priorités

| # | Feature | Priorité |
|---|---|---|
| F1 | Ronds-poste allégés (nom seul) | **Must Have** |
| F2 | Postes sur la courbe réelle du 6m (dispositif 0-6) | **Must Have** |
| F4 | Bandeau de contrôles réorganisé | **Must Have** |
| F5 | Nouvelle hiérarchie des indicateurs | **Must Have** |
| F3 | Cohérence du dispositif 1-5 | **Should Have** |
| — | Signal visuel discret d'efficacité dans le rond (option de F1) | **Nice to Have** — à la discrétion du Designer |

## 4. Critères d'acceptation

- Aucun pourcentage n'apparaît plus dans un rond-poste sur le terrain, pour aucun dispositif.
- Sur le dispositif 0-6, le `y` de chaque poste dans `ARTIC_LAYOUTS` est dérivé de l'équation de l'arc 6m (même famille de calcul que le tracé SVG), vérifiable visuellement : les 6 ronds semblent "posés" sur la ligne, pas alignés au-dessus ou en dessous.
- Les contrôles de dispositif, de mode, et la sélection manuelle sont visuellement séparés du terrain et de leurs résultats (postes, blocs), avec un affichage clair de l'option active pour chacun.
- Chacune des 5 données listées en F5 a un emplacement défini et documenté dans la maquette du Designer — aucune n'est supprimée, seulement replacée.
- Aucune régression sur les valeurs numériques affichées (mêmes calculs `computeArticulationStats`/`_articBlockEff`/`_articEffClass`).
- Non-régression des fonctionnalités existantes : bascule dispositif, bascule Top Def/Le+utilisé, sélection manuelle avec ou sans donnée, désactivation du bouton Articulation en mode Attaque, fonctionnement identique en vue match et en vue saison.

## 5. Hors scope

- Modification des calculs (`computeArticulationStats`, `_articBlockEff`, seuils `possessions>=5`, formule d'efficacité).
- STORY-35 (classement automatique des charnières centrales P2-P5) — chantier séparé, non fusionné ici.
- Ajout d'un nouveau filtre sur les données sous-jacentes (période, résultat, adversaire) — le retour de Romain porte sur la lisibilité des contrôles existants, pas sur l'ajout d'un filtre inédit, sauf clarification contraire en cours de conception.
- Le composant terrain SVG lui-même (`_articCourtSvg()` : tracé du but, 6m, 9m) n'est pas redessiné — seul le placement des postes dessus change.

## 6. Dépendances

- `_articCourtSvg()` et son tracé d'arc (`js/page-analyse.js`) doivent rester la source de vérité géométrique pour F2/F3 — le calcul du nouveau `ARTIC_LAYOUTS` doit dériver de la même équation, pas d'une approximation indépendante, pour garantir que les postes restent visuellement sur la ligne si le tracé du terrain est un jour ajusté.
- `JOUEURS_TERRAIN`, `matchPlayerName()`, `computeArticulationStats()`, `_articBlockEff()` : inchangés, réutilisés tels quels.

## 7. Risques

- **Lisibilité du 1-5** : si F3 impose un calcul d'arc strict au 1-5, le résultat pourrait moins bien représenter un vrai dispositif 1-5 (où P3/P4 sortent délibérément de la ligne) — le Designer doit trancher au cas par cas plutôt qu'appliquer F2 mécaniquement au 1-5.
- **Perte d'info si le signal d'efficacité est totalement retiré du rond** : un utilisateur pressé pourrait devoir cliquer sur chaque poste pour savoir "qui est fort/faible" alors qu'aujourd'hui c'est visible d'un coup d'œil — à évaluer par le Designer via un signal minimal (couleur) plutôt qu'un retrait complet.
- **Ambiguïté persistante sur "les filtres"** : si l'interprétation retenue dans le Brief (clarté du bandeau de contrôles) ne correspond pas à l'intention réelle de Romain, la maquette du Designer devra être validée avec lui avant développement — c'est un point de vérification explicite avant de lancer le Developer.
