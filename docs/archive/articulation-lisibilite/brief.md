# Brief — Refonte lisibilité du mode Articulation

**Agent :** Analyst
**Date :** 2026-09-06

---

## 1. Contexte

Le mode "Articulation" (page Analyse, section Intention attaque adverse) a été construit et enrichi en trois livraisons rapprochées : STORY-34 (v258, demi-terrain + 6 postes), puis deux retours utilisateur directs livrés sans nouveau cycle `/construire` (v259 : terrain dessiné, sélection manuelle, bouton Top Def, référence globale ; v260 : 3 cartes "Bloc"). Chaque ajout était cohérent pris isolément, mais l'empilement n'a jamais été reconsidéré dans son ensemble. Romain signale maintenant que le résultat cumulé ne lui convient pas — en particulier sur la lisibilité et les filtres — d'où ce retour à un cycle complet de conception plutôt qu'un nouveau patch ponctuel.

## 2. Problème

Ce que Romain ne peut pas bien faire aujourd'hui avec l'écran actuel :
- **Lire vite qui est où.** Chaque rond-poste empile badge + nom + pourcentage d'efficacité dans un cercle de 56px — trop dense pour une lecture rapide, alors que le premier réflexe recherché est "qui joue à quel poste".
- **Savoir ce qu'il est en train de regarder.** Trois mécanismes de contrôle coexistent au-dessus du terrain (toggle dispositif 0-6/1-5, toggle Le+utilisé/Top Def, sélection manuelle par poste au clic) sans hiérarchie visuelle claire entre eux — Romain les qualifie globalement de "filtres" et juge l'ensemble peu clair.
- **Se projeter sur une vraie défense.** Les 6 postes du dispositif 0-6 sont alignés sur une ligne droite alors que la ligne des 6m dessinée juste en dessous est une courbe — l'écart entre le tracé réel et le placement des joueurs nuit à la lecture tactique immédiate.

## 3. Utilisateurs

Romain, staff/coach, en session de préparation ou de débrief tactique — usage desktop (page Analyse, jamais consultée en mode joueur mobile). Le contexte est un enchaînement d'analyses (plusieurs matchs, plusieurs dispositifs, plusieurs hypothèses de composition) où la vitesse de lecture et la clarté de "quel réglage est actif" comptent autant que la donnée elle-même.

## 4. Vision

Un demi-terrain qui se lit comme une vraie feuille de match — les 6 joueurs positionnés sur la courbe réelle du 6m, identifiables d'un coup d'œil par leur seul nom — avec les indicateurs de performance (poste isolé, bloc de joueurs, référence adverse) rangés dans une zone dédiée séparée du terrain, et des contrôles de dispositif/mode clairement distincts du contenu qu'ils affectent.

## 5. Scope

**Dans le scope :**
- Retirer le pourcentage d'efficacité affiché à l'intérieur des ronds-poste ; ne garder que le nom du joueur (le Designer tranche si un signal visuel discret, ex. couleur de contour, doit subsister dans le rond).
- Repositionner les 6 ronds du dispositif 0-6 sur la courbe réelle du tracé 6m (`_articCourtSvg()`), et revalider le placement du dispositif 1-5 sur la même logique.
- Réorganiser la zone de contrôle (dispositif / mode Top Def↔Le+utilisé / sélection manuelle par poste) en un bandeau lisible, avec une hiérarchie visuelle claire de ce qui est actif.
- Redéfinir où vit chaque donnée déjà calculée : efficacité par poste, efficacité globale de référence, les 3 cartes Bloc, le panneau de détail multi-joueurs, le sélecteur manuel.

**Hors scope :**
- Le calcul des données (`computeArticulationStats`, `_articBlockEff`, seuils de significativité) reste inchangé — rien dans le retour de Romain ne remet en cause les chiffres, seulement leur présentation.
- STORY-35 (classement automatique des charnières centrales) reste un chantier séparé.
- Aucun nouveau filtre sur les données sous-jacentes (période, résultat…) n'est ajouté dans ce cycle, sauf clarification contraire de Romain en cours de route.

## 6. Critères de succès

- Romain identifie qui occupe chaque poste sans avoir à lire un chiffre.
- Il sait à tout moment, sans ambiguïté, quel dispositif et quel mode d'affichage sont actifs.
- Le placement des 6 postes du dispositif 0-6 suit visuellement la courbe du 6m dessinée sur le terrain.
- Aucune régression sur les chiffres affichés — même logique de calcul, seulement une réorganisation de la présentation.

## 7. Questions en suspens

- Romain parle de "filtres" sans détailler lequel le gêne précisément. Ce brief part de l'hypothèse que le problème est la clarté visuelle du bandeau de contrôles existant (dispositif/mode/sélection manuelle empilés sans hiérarchie), pas l'absence d'un filtre supplémentaire — à confirmer sur la maquette du Designer plutôt qu'en le redemandant à froid.
- Faut-il conserver un signal d'efficacité minimal dans le rond (ex. liseré coloré) ou le retirer intégralement du terrain et ne l'afficher qu'au clic/dans les cartes Bloc ? Tranché en conception (Designer).
- Le dispositif 1-5 a déjà des postes à hauteurs variables (P3/P4 décalés) — faut-il les recaler strictement sur l'arc du 6m/9m ou seulement resserrer visuellement l'esprit de la règle appliquée au 0-6 ? À valider avec Romain sur la maquette.
