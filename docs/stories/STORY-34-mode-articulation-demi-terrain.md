# STORY-34 — Mode "Articulation" : demi-terrain interactif par poste

**En tant que** Romain (staff),
**Je veux** voir un demi-terrain avec les 6 postes défensifs et l'efficacité adverse associée à chacun,
**Afin d'** analyser visuellement comment mes joueurs défendent selon le poste occupé.

## Contexte technique

- Zone concernée : `js/page-analyse.js` — `renderEncFamillesSection()` (~L1389, section déjà partagée entre vue match et vue saison complète, cf. `docs/design/articulation-defensive.md` §0 pour la justification de ce point d'insertion unique).
- Nouvelle fonction `computeArticulationStats(matchData)`, calquée sur `computeGbEncStats()` (~L2440) : filtre les lignes adverses en fin de possession (`(row[COLS.possession]||'').toString().trim()`) avec `articulation_def` renseigné, agrège par poste (`Map<poste, Map<joueurCanonique, {tirs,buts,po,eff}>>`). **Résolution des noms `P1`-`P6` obligatoirement via `matchPlayerName()`** (cf. `docs/risks/articulation-defensive.md` R1) — jamais une comparaison stricte.
- Nouveau mode `window._encGraphMode = 'articulation'`, nouveau bouton `.enc-pie-mode-btn` "🎯 Articulation" à côté de "Vue générale"/"Matrice 2×2", désactivé (classe `artic-disabled`, cf. Visual) quand `isAdv === false` (mode Attaque).
- Nouvelle fonction de rendu `_drawArticulationCourt(container, matchData)`, symétrique à `_drawEncPie()`/`_drawEncRadar()`.
- Nouveau composant CSS `.artic-court`/`.artic-poste`/etc. (cf. `docs/visual/articulation-defensive.md` pour les specs exactes).
- Deux layouts de postes selon la valeur de `articulation_def` (`0-6` vs `1-5`) — si les deux dispositifs coexistent sur la période affichée, un sélecteur permet de basculer entre les deux vues (cf. Design §1-2 pour les maquettes exactes des deux layouts).

## Critères d'acceptation

- [ ] Bouton "🎯 Articulation" visible à côté de "Vue générale"/"Matrice 2×2", uniquement actionnable en mode Défense
- [ ] Mode accessible identiquement en vue match (onglet "Intention attaque") et en vue saison complète — aucune duplication de code entre les deux
- [ ] Demi-terrain affiché avec 6 postes positionnés selon le dispositif (0-6 aligné, ou 1-5 avec P4 avancé/P3 en couverture, cf. Design)
- [ ] Chaque poste affiche le joueur l'ayant occupé le plus souvent sur la période et l'efficacité adverse associée (`(buts+po)/possessions*100`, même formule que le reste de la section)
- [ ] Poste occupé par plusieurs joueurs différents sur la période → badge "+N autres", clic sur le poste liste tous les joueurs avec leur efficacité respective
- [ ] Aucune donnée d'articulation sur la période sélectionnée → message d'état vide explicite, pas d'erreur
- [ ] Poste avec moins de 5 séquences → efficacité grisée avec `(n<3)` (cohérent avec le pattern déjà utilisé pour le tableau Gardien)
- [ ] Noms `P1`-`P6` résolus via `matchPlayerName()` — vérifié explicitement avec un nom Excel légèrement différent du format court (`Prénom` seul par exemple)
- [ ] Non-régression vérifiée sur les modes "Vue générale" et "Matrice 2×2" existants après l'ajout du 3e mode

## Hors scope

- Classement automatique des meilleures charnières centrales (STORY-35)
- Sélecteur de joueur dédié (peut être ajouté si le temps le permet, sinon reporté)

## Dépend de

STORY-33

## Taille

L
