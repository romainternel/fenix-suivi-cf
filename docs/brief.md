# Brief — Articulation défensive (efficacité par poste occupé)

**Agent :** Analyst
**Date :** 2026-09-02

---

## 1. Contexte

Romain a ajouté 7 nouvelles colonnes à la feuille Excel `DATA` (positions 22 à 28, juste après `Intention attaque`) :

| Colonne Excel | Rôle |
|---|---|
| `ARTICULATION DEF` | Système défensif FENIX pour la séquence : `ARTICULATION DEF 0-6` (défense alignée, 6 joueurs à 6m) ou `ARTICULATION DEF 1-5` (défense étagée, 5 joueurs à 6m + 1 avancé) |
| `P1` à `P6` | Nom du joueur FENIX (format court `Prénom.Initiale`) occupant chacun des 6 postes défensifs pour cette séquence |

**Sémantique des postes** (confirmée par Romain, dos au but, joueur qui défend) :
- **0-6** : P1 = ailier gauche adverse, P2 = arrière gauche adverse, P3/P4 = milieu, jusqu'à P6 = côté droit — les 6 joueurs alignés à 6m.
- **1-5** : même principe mais P4 est le joueur avancé (sorti sur un attaquant), P3 est celui resté en couverture derrière lui (la "zone").

Ces colonnes ne sont pas renseignées sur toutes les lignes — uniquement sur les séquences d'attaque adverse que Romain a explicitement taguées (visible dans son fichier : lignes avec `Intention attaque` type "Faire courir"/"Rentrée" souvent taguées, d'autres non). C'est une donnée **défensive** : elle décrit comment FENIX défendait pendant une séquence d'attaque de l'adversaire — elle s'inscrit donc naturellement dans la section déjà existante "DÉFENSE FENIX — Intention attaque adverses" (page Analyse), pas dans le sens Attaque.

## 2. Problème

Aujourd'hui, la section Défense de l'onglet "Intention attaque" répond à "quelle intention adverse nous pose problème" (par famille tactique), mais pas à "quel dispositif défensif, avec quels joueurs à quels postes, est le plus efficace face à l'adversaire". Romain n'a aucun moyen de savoir si, par exemple, sa charnière centrale (postes 2 à 5, ceux qui gèrent le cœur du jeu adverse) est plus solide avec telle combinaison de joueurs plutôt que telle autre — une question directement utile pour composer ses lignes défensives en match et à l'entraînement.

## 3. Utilisateurs

Romain (staff), sur desktop principalement (même contexte d'usage que le reste de la page Analyse) — en préparation de match ou en debrief, pour composer ou valider ses choix de lignes défensives.

## 4. Vision

Depuis la page Analyse (vue match ou saison complète), voir sur un visuel de demi-terrain handball quel joueur a occupé quel poste défensif, avec l'efficacité adverse (buts/tirs) associée à chaque poste/joueur/combinaison — et une mise en avant automatique des combinaisons de charnière centrale (postes 2 à 5) les plus efficaces sur la période analysée.

## 5. Scope

**Dans le scope :**
1. Import des 7 nouvelles colonnes Excel → Supabase (`match_data`), en réutilisant le pipeline d'import existant (résilient au nom d'en-tête, cf. `docs/arch/migration-supabase.md`).
2. Nouveau mode d'affichage "Articulation" dans la section "Intention attaque" existante côté Défense (`renderEncFamillesSection`, déjà partagée entre la vue match — onglet dédié — et la vue saison complète) : un demi-terrain handball avec les 6 postes défensifs positionnés selon le type d'articulation (0-6 ou 1-5), affichant qui a joué où et l'efficacité adverse associée.
3. Sélection d'un poste (ou d'un joueur à un poste) → détail de l'efficacité adverse pour ce poste/joueur, sur le match sélectionné ou la saison complète selon le contexte déjà actif.
4. Mise en avant automatique des 2-3 meilleures combinaisons de charnière centrale (postes 2 à 5) sur la période, classées par efficacité adverse (plus l'adversaire est inefficace, meilleure est la combinaison défensive).

**Hors scope (explicitement) :**
- Simulation "what-if" (composer une ligne hypothétique jamais jouée et projeter un résultat) — l'analyse porte sur des combinaisons réellement observées dans les données, pas une projection.
- Modification du système de tagging Excel lui-même (déjà fait par Romain).
- Un poste défensif pour l'attaque FENIX (la donnée n'a de sens que côté défense).

## 6. Critères de succès

- Les 7 nouvelles colonnes remontent correctement de l'Excel jusqu'à Supabase après un réimport, sans casser l'import existant pour les lignes non taguées (valeurs vides tolérées).
- Le nouveau mode "Articulation" est accessible à la fois en vue match (dans l'onglet où vivent déjà les familles d'intention) et en vue saison complète, sans dupliquer la logique entre les deux (réutilise `renderEncFamillesSection`).
- Le demi-terrain affiche correctement les 6 postes, avec un layout différent selon 0-6 vs 1-5.
- Cliquer sur un poste ou un joueur affiche l'efficacité adverse réelle pour ce filtre.
- Les meilleures combinaisons de charnière centrale (P2-P5) sont identifiées automatiquement, avec un seuil minimum de données pour éviter un classement basé sur 1-2 séquences.

## 7. Questions en suspens

- **Seuil de significativité** pour le classement automatique des combinaisons (nombre minimum de séquences/tirs avant qu'une combinaison soit éligible) — à trancher en PM/Architecture, par analogie avec les seuils déjà utilisés ailleurs (`n<3` déjà affiché comme avertissement dans le tableau Gardien × Systèmes adverses).
- **Emplacement exact du nouveau mode** : Romain a écrit "un onglet à côté d'intention attaque" pour la vue match, mais "un onglet articulation dans Défense Fenix — Intention attaque adverses" pour la vue saison — ces deux formulations correspondent en réalité au **même** point d'insertion technique (`renderEncFamillesSection`, mode Défense), qui est déjà partagé entre les deux contextes. Le Designer documente ce choix explicitement ; à confirmer avec Romain à la revue si un onglet de plus haut niveau séparé était réellement souhaité plutôt qu'un mode supplémentaire à l'intérieur de la section existante.
