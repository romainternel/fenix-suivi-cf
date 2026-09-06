# PRD — Articulation défensive (efficacité par poste occupé)

**Agent :** Product Manager
**Date :** 2026-09-02

---

## 1. Objectif

Permettre à Romain d'analyser l'efficacité défensive de FENIX en fonction du dispositif (0-6 / 1-5) et des joueurs occupant chaque poste défensif (P1-P6), avec une mise en avant automatique des meilleures combinaisons de charnière centrale.

## 2. Features

### F1 — Import des colonnes Excel vers Supabase
Les 7 nouvelles colonnes (`ARTICULATION DEF`, `P1`...`P6`) sont importées comme les autres colonnes `DATA` : ajoutées à `COLS`, au mapping nom-d'en-tête → colonne Supabase, et à la table `match_data` (7 colonnes texte nullable, migration SQL à appliquer une fois par Romain).

### F2 — Mode "Articulation" dans la section Intention attaque (Défense)
Un 3e mode d'affichage à côté de "Vue générale" / "Matrice 2×2", visible uniquement en mode Défense (`isAdv === true` — l'articulation n'a de sens que côté défensif). Affiche un demi-terrain handball avec les 6 postes positionnés selon le dispositif dominant de la période affichée (0-6 ou 1-5 — bascule si les deux coexistent, cf. Design). Chaque poste affiche le(s) joueur(s) l'ayant occupé et l'efficacité adverse (buts/tirs) associée.

### F3 — Filtre par poste / joueur
Cliquer un poste (ou choisir un joueur dans un sélecteur) filtre le détail affiché à ce poste/joueur précis — cohérent avec le filtre match déjà actif sur la page (comportement identique à la sélection de famille existante).

### F4 — Classement automatique des meilleures charnières centrales
Calcule, pour chaque combinaison de joueurs observée aux postes 2 à 5, l'efficacité adverse associée, et met en avant les 2-3 meilleures (adversaire le moins efficace), avec un seuil minimum de séquences pour être éligible (évite un classement sur un échantillon non significatif).

## 3. Priorités

| Feature | Priorité | Justification |
|---|---|---|
| F1 — Import des colonnes | **Must Have** | Bloquant : sans les données en base, rien d'autre n'est possible |
| F2 — Mode Articulation (visuel demi-terrain) | **Must Have** | Cœur de la demande explicite de Romain |
| F3 — Filtre poste/joueur | **Must Have** | Sans filtre, le visuel n'est qu'une image statique — la valeur est dans l'exploration |
| F4 — Classement automatique charnière centrale | **Should Have** | Valeur ajoutée réelle et explicitement demandée, mais peut suivre F1-F3 de quelques jours sans bloquer la livraison du reste |

## 4. Critères d'acceptation

**F1**
- [ ] Réimport d'un fichier Excel contenant les 7 nouvelles colonnes → les valeurs arrivent dans `match_data` (Supabase) sans erreur
- [ ] Réimport d'un fichier Excel **sans** ces colonnes (ancien format) → import toujours fonctionnel, colonnes vides/null, aucune régression
- [ ] Lignes non taguées (Articulation/P1-P6 vides) → traitées comme non-données, pas d'erreur d'affichage

**F2**
- [ ] En vue match (onglet où vit la section Intention attaque) ET en vue saison complète, le mode "Articulation" est accessible en Défense
- [ ] Le mode "Articulation" n'apparaît pas (ou est désactivé) en mode Attaque — l'articulation défensive n'a pas de sens côté attaque FENIX
- [ ] Demi-terrain affiché avec 6 postes positionnés correctement selon 0-6 ou 1-5
- [ ] Chaque poste affiche le joueur l'ayant occupé le plus souvent sur la période, et l'efficacité adverse correspondante

**F3**
- [ ] Clic sur un poste → détail (joueur(s), nombre de séquences, efficacité adverse) mis à jour
- [ ] Sélection d'un joueur spécifique → filtre cohérent avec le poste

**F4**
- [ ] Les 2-3 meilleures combinaisons P2-P5 sont affichées, classées par efficacité adverse croissante
- [ ] Une combinaison avec un échantillon insuffisant (seuil à définir en Architecture) n'apparaît pas dans le classement, ou apparaît explicitement marquée comme non significative

## 5. Hors scope

- Simulation "what-if" d'une ligne jamais jouée.
- Articulation offensive (le concept n'existe que côté défense dans les données fournies).
- Édition manuelle des postes dans l'app (les données viennent uniquement de l'import Excel, comme le reste de `match_data`).

## 6. Dépendances

- F2/F3/F4 dépendent entièrement de F1 (aucune donnée exploitable avant l'import).
- Réutilise `renderEncFamillesSection()` et son système de mode (`window._encGraphMode`) déjà en place — pas de nouvelle page ni de nouvelle route.
- Réutilise le pattern d'agrégation de `computeGbEncStats()` (regroupement + calcul d'efficacité par sous-catégorie) comme référence technique la plus proche.

## 7. Risques (aperçu — détaillés par le Risk Analyst)

- Migration Supabase : ajouter des colonnes à une table existante avec des données réelles en production — à faire proprement (ALTER TABLE additif, jamais destructif).
- Couverture de données probablement faible au démarrage (Romain tague au fur et à mesure) — le classement F4 doit rester silencieux/prudent plutôt que trompeur sur un petit échantillon.
- Ambiguïté sur l'emplacement UI (onglet séparé vs mode intégré) déjà réduite par la Designer (cf. Brief §7) mais à valider en revue.
