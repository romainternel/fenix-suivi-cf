# PRD — Articulation offensive (mode "Articulation" côté Attaque)

**Agent :** Product Manager
**Date :** 2026-09-15

---

## 1. Objectif produit

Donner à Romain, côté attaque FENIX, le même outil objectif qu'il a déjà côté défense adverse : identifier — à partir des données réellement observées, pas d'une impression — quelle composition de joueurs à quels postes produit le meilleur rendement offensif, à deux niveaux de granularité (les 6 postes au complet, ou la seule base arrière).

## 2. Périmètre v1 (dans le cycle)

### 2.1 Import des données (préalable technique, sans lequel rien d'autre n'est possible)
- Les 7 colonnes Excel `ARTICULATION ATT` / `ALG` / `ARG` / `DC` / `ARD` / `ALD` / `PVT` sont importées vers `match_data` (Supabase) à chaque import Excel, comme n'importe quelle autre colonne du pipeline.
- Résilience : un fichier Excel antérieur à l'introduction de ces colonnes (elles n'existent pas encore dans les saisons avant 2026-2027) doit continuer à s'importer normalement, colonnes absentes proprement, aucune erreur (même exigence que STORY-33 pour la défense).

### 2.2 Mode "Articulation" côté Attaque (page Analyse, onglet Tactique)
- Le bouton "🎯 Articulation" (aujourd'hui à côté de "Vue générale"/"Matrice 2×2", actif uniquement en mode Défense) devient cliquable **aussi** en mode Attaque.
- En mode Attaque, ce bouton affiche un demi-terrain avec les 6 postes offensifs (ALG, ARG, DC, ARD, ALD, PVT) positionnés dans une disposition d'attaque placée réaliste (arc à 9m pour ARG/DC/ARD, ailes et pivot près de la ligne des 6m pour ALG/ALD/PVT).
- Chaque poste affiche le joueur qui l'a le plus occupé sur la période filtrée (match ou saison, selon le filtre MATCH déjà en place sur la page). Un badge "+N" indique si d'autres joueurs ont aussi tenu ce poste.
- **Clic sur un poste** → même geste qu'en défense : un panneau s'ouvre juste sous le terrain, listant les joueurs déjà observés à ce poste (triés par fréquence, avec leur nombre de séquences), plus un sélecteur complet de l'effectif avec un retour explicite "Auto (le plus utilisé)". Le choix est mémorisé pour la session de consultation (pas persisté en base — comportement identique à la défense).
- **Sélecteur de groupement ("LARGEUR" en défense, même emplacement)** : deux boutons, **"6 complet"** (les 6 postes) et **"Base arrière"** (ARG-DC-ARD uniquement).
- **Résumé sous le terrain**, pour le groupement actif : % d'efficacité (buts / (buts + tirs ratés), formule standard de l'app — pas la formule inversée de la défense) de la composition actuellement affichée sur le terrain pour ce groupement, avec le détail But/Tir raté/PB/PO/Jet franc, et le nombre de séquences.
- **Classement (colonne de droite, identique à la défense)** : toutes les compositions distinctes observées pour le groupement actif, triées par efficacité décroissante, regroupées **Fiable (≥5 séquences)** / **Échantillon faible (<5)** — répond directement à "le meilleur 6" et "la meilleure base arrière" de la demande initiale. Cliquer une ligne du classement place d'un coup toute la composition sur le terrain (même geste qu'en défense).
- Le mode Attaque/Défense (`⚡ Attaque` / `🛡 Défense`, déjà existant) continue de fonctionner : basculer entre les deux ne réinitialise plus le mode Articulation à "Vue générale" comme aujourd'hui (comportement qui n'avait de sens que parce que l'attaque n'avait pas encore d'articulation) — chaque côté garde son propre état (dispositif n'existe pas côté attaque, mais groupement/poste manuel/poste ouvert sont propres à chaque côté).

### 2.3 Cohérence avec l'existant (contraintes de non-régression explicites)
- Le mode Articulation Défense (inchangé dans ce cycle) doit continuer à fonctionner exactement comme avant, y compris le rendu vide du panneau Attaque analogue quand aucune donnée n'est encore disponible pour la période (message explicite, jamais un panneau cassé ou silencieusement vide).
- Formule d'efficacité **volontairement différente** de la défense (pas d'inversion) — documenté pour éviter toute confusion future entre les deux modes qui se ressemblent visuellement mais répondent à une question différente (réussite défensive vs efficacité offensive standard).

## 3. Hors périmètre v1

- Distinction supériorité numérique (+) / effectif normal dans l'articulation attaque — les deux types de séquences sont regroupés sans distinction (cf. Brief §"Différences structurelles").
- Groupements autres que "6 complet"/"Base arrière" (ex. "Ailiers", poste isolé) — non demandés, architecture ouverte pour en ajouter un plus tard sans refonte.
- Édition manuelle des colonnes source dans l'Excel.
- Export PDF/PPT incluant ce nouveau mode (l'export actuel de la page Analyse n'existe pas — hors périmètre de tout cycle Analyse jusqu'ici, pas introduit ici).

## 4. Critères d'acceptation (haut niveau, détaillés en stories)

1. Réimport d'un fichier Excel contenant les 7 nouvelles colonnes → valeurs retrouvées dans `match_data` (vérification directe Supabase).
2. Réimport d'un ancien fichier sans ces colonnes → aucune erreur, comportement inchangé.
3. Bouton "🎯 Articulation" cliquable en mode Attaque, affiche le demi-terrain offensif avec les 6 postes peuplés à partir de données réelles.
4. Bascule "6 complet" / "Base arrière" → résumé et classement recalculés en conséquence.
5. Clic sur un poste → panneau d'édition identique en comportement à la défense, changement de joueur reflété immédiatement sur le terrain et dans le résumé/classement.
6. Clic sur une ligne du classement → place toute la composition d'un coup.
7. % affiché = efficacité standard (buts/(buts+tirs ratés)), vérifiable manuellement sur un cas réel.
8. Bascule Attaque ↔ Défense en mode Articulation ne perd pas l'état de chaque côté et n'affiche jamais un panneau vide sans message explicite.

## 5. Métrique de succès

Romain peut, en un coup d'œil sur un match ou la saison, nommer sa meilleure base arrière et son meilleur 6 offensif observés, avec le nombre de séquences à l'appui — sans calcul manuel.
