# Analyse Match MD — Modèles de progression collective transférables au CF Fenix

**Contexte :** recherche menée pour nourrir une session de travail BMAD sur l'évolution de l'application de suivi CF (base séquencée : actions individuelles, contexte tactique, données physiques). Objectif : progression collective de l'équipe N1, dont émergent les individus au-dessus du collectif.

---

## 1. Tableau comparatif des modèles identifiés

| Source / sport | Principe | Ce qui est transférable à la base séquencée |
|---|---|---|
| Basket NBA/NCAA (OBPR/DBPR, Offensive/Defensive Rating) | Indices normalisés "par 100 possessions" — indépendants du rythme de jeu, donc comparables match à match même si le nombre de possessions varie. La note est interprétée comme le nombre de points par 100 possessions au-dessus de l'adversaire si le joueur évoluait avec 9 joueurs moyens. | La séquence est déjà l'unité de base : calculer un ratio buts/perte par séquence offensive et défensive, normalisé, pour comparer deux matchs à rythme différent. |
| Basket NBA (PCA hiérarchique) | Modèle multi-niveaux : joueur dans son poste, dans son équipe, dans le temps, via régression multi-niveaux et analyse en composantes principales. | Structure la hiérarchie équipe → poste → joueur → période, avec un indice composite à chaque niveau plutôt que des stats isolées. |
| Football pro (network analysis), transposé au hand EHF Euro 2018 | Centralité de degré et de flux, densité et centralisation du réseau calculées pour quantifier la contribution individuelle à l'organisation collective et l'équilibre de l'interplay. Le secteur arrière identifié comme structurant l'interplay selon les formations tactiques. | Si la saisie capture qui-passe-à-qui par séquence : construire un graphe de passes par match/période et suivre l'évolution de sa densité et de sa centralisation — angle quasi inexploité en hand selon la littérature. |
| Rugby (charge chronique, rolling average) | Moyenne mobile sur 4 à 8 semaines de charge influençant positivement la performance en match. | Appliquer une moyenne mobile sur 3-5 matchs aux indicateurs collectifs plutôt que des moyennes de saison figées — fait ressortir une vraie trajectoire et pas juste un cumul. |
| Rugby — England talent pathway | Séparation explicite entre exigence du poste ("ce qui définit le world-class à un poste") et préférence stylistique du coach. | Permet de juger la progression d'un joueur vers son poste indépendamment du système Fenix — utile si comparaison de deux périodes avec des consignes tactiques différentes. |
| Hand — AI fatigue monitoring (Frontiers 2026) | Time series classiques (moyenne mobile, ARIMA, lissage exponentiel) appliquées à des KPI physiques individuels pour prédire la charge. | Méthode simple et low-cost à appliquer aux données physiques/temps de jeu pour détecter une tendance plutôt qu'un instantané. |
| Hand jeunes — biais de sélection (DHB) | Les biais de maturation et d'âge relatif compensent partiellement le désavantage d'âge relatif, et impactent la sélection et le développement des talents. | Point de vigilance : sur du 16-22 ans, ne jamais comparer deux joueurs nés la même année sans contexte de maturation — sinon "progression" mesure en partie de la biologie. |

---

## 2. KPI : existant probable vs à ajouter (priorisé)

**Niveau 1 — exploitable immédiatement avec l'existant, fort impact**
Indice d'efficacité par séquence offensive (buts + passes décisives / nombre de séquences offensives), et son équivalent défensif (pertes provoquées + interceptions / séquences défensives), calculés en moyenne mobile sur 3-5 matchs plutôt qu'en cumul saison. Calcul le plus proche du "rating par possession" du basket — aucune capture nouvelle nécessaire.

**Niveau 2 — exploitable avec un enrichissement léger de la saisie, impact fort**
Construire le graphe de passes par match nécessite que la saisie inclue systématiquement le passeur précédent dans la séquence, pas seulement le finisseur. Gratuit si déjà capturé ; sinon champ à ajouter.

**Niveau 3 — nouveau KPI à fort potentiel différenciant, effort modéré**
Indicateur de structure de possession : nombre de passes avant tir, et vitesse de jeu (durée moyenne de la séquence offensive). Permet de voir si l'équipe progresse vers un jeu plus rapide/direct ou plus construit — signal de progression collective indépendant du score.

**Niveau 4 — exploratoire, effort plus élevé**
Indice composite multi-niveaux (façon PCA basket) combinant 4-5 KPI collectifs normalisés en un seul score de "forme d'équipe" suivi en courbe sur la saison. Intéressant pour une vue d'ensemble présentable, mais demande de fixer une pondération arbitraire — à trancher en équipe plutôt qu'à décider seul.

---

## 3. Propositions de visualisation pour l'appli HTML existante

- **Courbe de tendance en moyenne mobile** (pas de moyenne cumulée) pour 3-4 KPI collectifs clés, avec une bande de référence horizontale représentant le standard Starligue déjà construit dans la table de référence par poste. Visualise la trajectoire de l'équipe par rapport à une cible fixe, pas juste par rapport à elle-même.

- **Graphe de réseau de passes par match** (nœuds = postes, épaisseur = fréquence des passes), affiché en comparaison côte à côte entre deux périodes de la saison, pour visualiser si la structure de jeu se densifie ou se polarise sur certains postes.

- **Radar chart** comparant les profils collectifs de deux périodes (ex : début vs fin de saison) sur les mêmes axes — efficacité attaque, efficacité défense, vitesse de jeu, discipline (pertes/fautes) — pour un coup d'œil rapide en réunion.

---

## 4. Points ouverts à trancher en session BMAD

- La saisie capture-t-elle déjà le passeur précédent dans chaque séquence, ou seulement l'action finale ? Détermine si le réseau de passes est gratuit ou demande un changement de saisie.
- Quelle moyenne mobile (3 ou 5 matchs) donne le signal le plus stable sans trop lisser les vraies ruptures de forme — à tester sur les données réelles plutôt qu'à fixer a priori.
- Indice composite unique (lisible, mais arbitraire dans sa pondération) ou 4-5 indicateurs séparés affichés ensemble (plus rigoureux, moins synthétique) — choix de philosophie d'outil, pas seulement technique.
- Comment neutraliser l'effet maturation/âge dans la lecture de la progression individuelle qui émergera de l'analyse collective, étant donné l'amplitude d'âge 16-22 ans du groupe.
