# STORY-41 — Terrain en accordéon replié + option "Météo"

**En tant que** Romain (staff),
**Je veux** que le bloc terrain/comparatif soit replié par défaut pour gagner de la hauteur d'écran, et pouvoir basculer entre le nuage de tirs actuel et une vue "météo" en dégradé de couleur par zone,
**Afin de** libérer l'espace pour le contenu que je consulte à chaque fois, et repérer d'un coup d'œil les zones chaudes/froides du terrain sans lire les % un par un.

## Contexte technique

- Zone concernée : bloc terrain existant (`FENIX-HANDBALL-CF-SUIVI.html`, `#terrain-canvas`/`#terrain-wrapper` + cartes comparatives FENIX/Adversaire), `drawTerrain(data)` (L2482+).
- **Accordéon** : le conteneur englobant devient un accordéon fermé par défaut (chevron "▾ Déplier"/"▴ Replier"), état non persisté entre sessions (revient toujours replié à l'ouverture, cf. `docs/design/reorganisation-page-analyse.md` §5). N'affecte que la présentation — `drawTerrain()` doit toujours pouvoir dessiner correctement une fois déplié même si le canvas était caché au chargement (attention au `container.clientWidth`/`clientHeight` lu à 0 si le conteneur est `display:none` au moment du premier calcul — redessiner au moment de l'ouverture, pas seulement au chargement de la page).
- **Mode Météo** : nouvelle fonction `drawTerrainMeteo(data)`, appelée sur les mêmes `terrainData` déjà filtrées (L2472-2477) que `drawTerrain()` — pas de nouveau filtrage. Découpe le terrain en grille (proposé 6×4, ajustable), calcule par cellule `buts / (buts + tirsRatés)` sur les tirs dont `position_terrain` tombe dans cette cellule, peint chaque cellule sur une échelle rouge→vert, applique un flou (`ctx.filter = 'blur(Npx)'`) pour un rendu dégradé continu plutôt qu'une grille de blocs nets. Cellules sans tir : transparentes.
- **Seuil d'échantillon (Risk R4)** : une cellule avec moins de N tirs (seuil à définir en développement, cohérent avec les seuils déjà utilisés ailleurs dans l'app pour "échantillon faible") doit être atténuée/grisée plutôt que peinte en couleur pleine trompeuse.
- Toggle `Nuage de tirs / 🌡️ Météo` : variable module-level `_terrainMode` ('dots'|'meteo'), `drawTerrain()` devient le dispatcher entre les deux fonctions de rendu.
- **Performance (Risk R5)** : mesurer le temps de rendu du mode Météo avec flou sur le match de la saison ayant le plus de tirs enregistrés ; si perceptiblement lent, réduire le rayon du flou plutôt que le retirer.

## Critères d'acceptation

- [ ] Le bloc terrain/comparatif est replié par défaut à l'ouverture d'un match (staff comme lecture, si applicable) et à chaque nouvelle visite — jamais mémorisé ouvert.
- [ ] Un clic sur l'en-tête (chevron) déplie/replie le bloc, avec une transition visible mais rapide (< 250ms, cohérent avec le reste du projet).
- [ ] Le nuage de tirs existant (points but/tir raté/PB/PO/jet franc) fonctionne à l'identique une fois le bloc déplié, y compris après un changement de filtre Club/Résultat/GE pendant que le bloc est replié (redessine correctement à l'ouverture).
- [ ] Le bouton "🌡️ Météo" bascule vers une vue en dégradé de couleur (rouge = faible réussite, vert = forte réussite), sans aucun pourcentage affiché sur le terrain lui-même, avec plusieurs zones de couleurs distinctes possibles simultanément.
- [ ] Une cellule avec un échantillon très faible (1-2 tirs) est visuellement atténuée plutôt que peinte en couleur pleine.
- [ ] Le mode sélectionné (Nuage/Météo) reste cohérent lors d'un changement de filtre Club/Résultat/GE (ne repasse pas silencieusement en mode Nuage).
- [ ] Non-régression : les 2 cartes comparatives FENIX/Adversaire (Général/Att placée/Grand espace) et le bouton "TOTAUX" restent inchangés dans leur contenu et leur fonctionnement.

## Hors scope

- Toute nouvelle donnée ou colonne Excel — le mode Météo réutilise `position_terrain`/`resultat` déjà présents.
- Le contenu des cartes comparatives elles-mêmes (Général/Att placée/Grand espace) — non modifié par cette story.

## Dépend de

- Aucune.

## Taille

M
