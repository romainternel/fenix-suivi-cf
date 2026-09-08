# Brainstorm — Réorganisation de la page Analyse

**Agent :** Brainstormer
**Date :** 2026-09-08

---

## Contexte pris en compte

La page Analyse contient aujourd'hui, recensé directement dans le code (`FENIX-HANDBALL-CF-SUIVI.html:307-590`) :
- Une barre de filtres sticky (Match/Club/Résultat/GE), toujours visible
- Un bloc terrain + nuage de tirs + 2 cartes comparatives FENIX/Adversaire (3 sous-blocs chacune), **fixe en haut de page, avant les onglets**, qu'un match soit sélectionné ou non
- 5 onglets côte à côte : Résumé (IA + notes coach + indicateurs), Timeline (score + moments clés + bascules), Intention attaque (cartes familles, Attaque/Défense, 3 sous-modes dont Articulation), Gardien, Chat IA
- Une vue "Saison complète" entièrement différente (cartes familles + tableau de corrélations) qui ne partage presque rien visuellement avec la vue match

15 blocs de contenu distincts, accumulés story par story sur plusieurs mois — jamais repensés comme un tout. C'est très probablement la source du "fouillis" que Romain ressent : pas un problème de qualité de chaque bloc pris isolément (chacun a été testé et validé), mais un problème d'agencement d'ensemble.

## Idées sauvages (sans filtre)

- **Supprimer les onglets, tout en scroll continu** — comme un rapport de match qu'on lit de haut en bas, avec une table des matières collante sur le côté pour sauter à une section. Plus de clic "onglet perdu", tout est là si on scrolle.
- **Mode "Préparation" vs "Debrief" vs "Saison"** — un sélecteur en haut qui change ce qui est mis en avant : en debrief juste après un match, on veut Résumé+Timeline+Coach en premier ; en préparation d'un futur adversaire, on veut Intention attaque adverse+Gardien en premier ; en vue saison, on veut les tendances. Même contenu, ordre et emphase différents selon le moment.
- **Une "carte de match" façon jeu vidéo** — un seul encart type FIFA/2K post-match : note globale, 3 stats clés, 1 phrase de verdict — avant tout le reste, qui devient du "détail" consultable en dessous.
- **Terrain/nuage de tirs en accordéon fermé par défaut** — visuellement lourd, pas forcément consulté à chaque ouverture de page ; le laisser fermé (mais accessible en 1 clic) libère toute la hauteur d'écran au-dessus de la ligne de flottaison pour ce qui compte vraiment.
- **Timeline "chapitrée"** — fusionner évolution du score + moments clés + bascules en un seul objet visuel scrubbable (comme une timeline de montage vidéo), au lieu de 3 blocs empilés qui racontent la même histoire de 3 façons différentes.
- **Fusionner "Résumé" et "Timeline" en un seul onglet "Vue d'ensemble du match"** — les deux répondent à la même question ("qu'est-ce qui s'est passé"), juste avec des granularités différentes (texte vs graphique).
- **Fusionner "Intention attaque" et "Gardien" en un seul onglet "Analyse tactique"** — les deux répondent à "comment on a joué/défendu", et le gardien est déjà lu à travers le prisme des familles adverses (`renderGardienEncSection`).
- **Retirer le Chat IA rule-based de la navigation principale** — c'est un onglet entier pour une fonctionnalité jamais connectée à une vraie IA (confirmé dans CLAUDE.md §9, "jamais priorisé") ; le garder accessible mais pas au même niveau que les 4 autres.
- **Un bandeau de résumé qui reste visible en scrollant** (sticky, comme le filtre) — score + 2-3 chiffres clés toujours à l'écran, pour ne jamais perdre le contexte du match en cours d'analyse, même en scrollant loin dans le détail tactique.

## Inspirations cross-domaine

- **Rapport de match sportif (presse/broadcast)** — un article de match commence toujours par le verdict et 2-3 faits marquants, PUIS le détail statistique. La page actuelle fait l'inverse : elle ouvre sur des chiffres bruts (indicateurs), le "verdict" (résumé IA) est une carte parmi d'autres au même niveau visuel.
- **Dossier patient médical (SOAP note)** — "Chief complaint" toujours en tête, fixe, quelle que soit la profondeur de la consultation ; le reste s'organise en sections dépliables classées par pertinence clinique, pas par ordre chronologique de saisie. Directement transposable : un "motif du jour" (ce qu'on cherche à comprendre dans CE match) en tête fixe.
- **Écran post-match jeu vidéo (FIFA/NBA 2K)** — note globale + 3 stats vedettes en un seul écran avant même de proposer d'aller voir le détail par joueur/statistique. Confirme l'idée de "carte de match" ci-dessus.
- **Terminal financier (Bloomberg)** — panels denses mais modulaires, l'utilisateur choisit ce qui reste affiché. Overkill pour une appli mono-utilisateur en vanilla JS, mais l'idée de "replier ce qui n'est pas consulté aujourd'hui" (terrain/nuage de tirs) est directement applicable sans la complexité d'un vrai système de widgets.
- **Fil d'actualité (app news)** — présente des "cartes d'insight" déjà synthétisées (1 carte = 1 constat) plutôt qu'un tableau brut à interpréter soi-même. La section "Tendances saison" pourrait devenir 3-4 cartes de constats ("Vous perdez plus de balles en défaite : 22 vs 17") plutôt qu'un tableau à 6 lignes à lire ligne par ligne.

## Questions qui dérangent

- **Les 5 onglets reflètent-ils un vrai découpage d'usage, ou l'ordre dans lequel les stories ont été développées ?** (Résumé=STORY-14, Timeline=ancien module, Intention attaque=modules A-01/34/36/37/38, Gardien=A-06/07, Chat=ancien module) — rien n'indique qu'un coach pense naturellement "je vais d'abord dans Résumé, puis Timeline, puis..." plutôt que par exemple "je veux d'abord voir la tactique, ensuite le gardien".
- **Le bloc terrain + cartes équipe est-il vraiment consulté à CHAQUE visite ?** Il est fixe en haut, avant tout onglet, occupant une hauteur d'écran significative — mais rien ne prouve que Romain le regarde systématiquement plutôt que d'aller directement à l'onglet qui l'intéresse ce jour-là.
- **Le Chat IA (rule-based, jamais connecté à une vraie IA, "jamais priorisé" selon CLAUDE.md) mérite-t-il encore un onglet de même rang que les 4 autres ?**
- **Qu'est-ce que Romain regarde EN PREMIER à chaque ouverture ?** Si ce n'est pas "Résumé" (l'onglet par défaut actuel), le premier écran qu'il voit à chaque fois n'est pas le bon.
- **La vue "Saison complète" doit-elle vraiment être une page presque entièrement différente de la vue match**, ou existe-t-il une structure commune (même "carte de match"/mêmes sections, juste sur une période plus large) qui rendrait l'appli plus prévisible ?

## Top 3 actionnables (court terme, réaliste en vanilla JS)

1. **Un bloc "Essentiel" unique en tête de page** (score, verdict IA en une phrase, 2-3 indicateurs clés, alerte tactique la plus marquante) — fusionne ce qui est aujourd'hui dispersé entre le résumé IA, les indicateurs clés et les badges de familles (ces derniers viennent d'être retirés des cartes, l'occasion de les faire revivre ici sous une forme plus fiable si besoin).
2. **Réduire de 5 à 3 sections** en fusionnant Résumé+Timeline ("Vue d'ensemble") et Intention attaque+Gardien ("Tactique"), en gardant Chat IA en accès secondaire (pas au même rang visuel).
3. **Replier le bloc terrain/nuage de tirs par défaut** (accordéon, 1 clic pour l'ouvrir) — récupère immédiatement de la hauteur d'écran pour le contenu qui varie selon la section active.

## Vision 12 mois

Une page organisée par **moment d'usage** plutôt que par type de donnée : un sélecteur "Préparation adversaire" / "Debrief post-match" / "Suivi saison" en tête, qui réordonne/met en avant les sections pertinentes à ce moment précis, sans dupliquer le contenu ni complexifier le modèle de données — juste une couche de présentation qui sait ce que le coach cherche selon le contexte.
