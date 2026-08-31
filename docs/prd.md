# PRD — Migration du stockage vers Supabase

**Agent :** Product Manager
**Date :** 2026-08-28

---

## 0. Décisions actées (confirmées par Romain, ne pas rouvrir sans raison nouvelle)

- **Pas de contrainte hors-ligne** — l'app peut dépendre d'une connexion internet à chaque usage. Architecture simple : appels directs à Supabase, pas de cache local à maintenir.
- **Accès staff single-user, multi-appareils** — même modèle de rôles qu'aujourd'hui (staff/joueur), pas de nouveau rôle multi-coach à concevoir.
- **Import = fichier complet à chaque fois, pas d'incrémental.** Romain n'en a jamais eu besoin et a explicitement laissé le choix à "ce qui est le plus simple à construire" — le remplacement complet est à la fois plus simple (aucune logique de fusion/déduplication) et plus sûr (aucun risque de résidu d'un ancien import, aucune incohérence si un match est supprimé côté Excel) à la volumétrie de FENIX (~3500-5500 lignes/saison, cf. `docs/research/migration-supabase.md` §2). Romain ajustera son habitude d'export si besoin, mais rien ne le lui impose : son fichier actuel contient déjà tout l'historique de saison.
- **Sécurité de l'authentification inchangée pour ce cycle** — mot de passe staff partagé, mots de passe joueurs en clair : sujet volontairement laissé de côté (cf. Brief §5, "Dehors").

## 1. Objectif

Faire de Supabase la source de vérité partagée pour toutes les données de FENIX Stats CF, en remplacement du `localStorage` par appareil — sans changer le geste de saisie de Romain (Excel reste l'outil d'entrée pour la donnée de match) et sans reconstruire un module de saisie qui n'apporterait pas de valeur.

## 2. Features

### F1 — Schéma Supabase pour les données Excel (Must Have)
Tables Supabase pour `DATA`, `Joueurs`, `Tableau_MATCH`, `Bilan` (la feuille `Temps de Jeu`, confirmée inutilisée, n'est pas migrée). Remplacement complet à chaque import (pas d'ajout incrémental, décision §0).

### F2 — Import Excel → Supabase (Must Have)
Le bouton d'import existant (`processFile()`) pousse les données vers Supabase après parsing, au lieu de (ou en plus de, transitoirement) les stocker en `localStorage`. Le flux de sélection de fichier et le parsing XLSX ne changent pas.

### F3 — Lecture depuis Supabase au chargement de l'app (Must Have)
L'app charge ses données depuis Supabase à l'ouverture, plutôt que depuis `localStorage`. Conséquence directe de "pas de contrainte hors-ligne" (§0) : il faut des états de chargement/erreur réseau basiques (aujourd'hui inexistants, puisque tout était instantané en local) — écran de chargement pendant la requête, message clair si Supabase est injoignable.

### F4 — Migration des 3 données déjà générées dans l'app (Must Have — priorité la plus immédiate)
Notes libres du coach par match, comptes joueurs, assignations manuelles de famille : ces trois-là migrent vers Supabase en premier, car c'est là que la perte de données au changement d'appareil est un problème déjà vécu aujourd'hui, indépendamment de tout Excel (cf. Brief §2, Research §4.4).

### F5 — Migration unique des données locales existantes de Romain (Must Have)
Romain a probablement déjà des notes coach / comptes joueurs / assignations famille dans son navigateur actuel, qui n'existent nulle part ailleurs (pas dans l'Excel). Il faut un mécanisme explicite de transfert unique de ce qui est déjà dans son `localStorage` vers Supabase au moment de la bascule, pour ne rien perdre. Les données Excel (`DATA` etc.) n'ont pas ce problème : elles sont entièrement régénérables par un simple réimport du fichier une fois Supabase branché.

### F6 — Écran d'édition de la feuille `Famille` dans l'app (Must Have — demande explicite de Romain)
Petit module CRUD dans l'app pour éditer le mapping "Intention attaque → Famille" directement, sans passer par une modification de code JS. Remplace le processus manuel actuel (Romain modifie l'Excel → quelqu'un recopie à la main dans `ENC_FAMILLE_MAP`).

### F7 — Écran d'édition de la feuille `Bilan` (Should Have)
Même logique que F6 mais pour les bornes de périodes ("Bilan 1"/"Bilan 2"). Moins urgent que Famille (pas de demande explicite de Romain sur ce point précis), mais même schéma de solution — à évaluer en fonction du temps disponible.

## 3. Priorités

| # | Feature | Priorité |
|---|---|---|
| F4 | Migration des 3 données app-only (notes/comptes/assignations) | **Must Have** |
| F5 | Migration unique des données locales existantes de Romain | **Must Have** |
| F1 | Schéma Supabase données Excel | **Must Have** |
| F2 | Import Excel → Supabase | **Must Have** |
| F3 | Lecture depuis Supabase au chargement | **Must Have** |
| F6 | Édition Famille dans l'app | **Must Have** |
| F7 | Édition Bilan dans l'app | Should Have |

Ordre de livraison logique : F1 → F2/F3 (le socle Excel doit exister avant de pouvoir tout brancher dessus) → F5 (migration unique, à faire une fois le socle prêt, avant que Romain ne perde ses données locales existantes) → F4 (les 3 données app-only rebranchées sur Supabase) → F6 → F7.

## 4. Critères d'acceptation

- Import d'un Excel sur l'appareil A → données visibles immédiatement sur l'appareil B sans réimport (F1-F3).
- Une note coach / un compte joueur / une assignation famille créés sur un appareil sont visibles sur un autre (F4).
- Les données déjà présentes dans le `localStorage` actuel de Romain (notes, comptes, assignations) se retrouvent dans Supabase après la bascule, sans action manuelle de recopie (F5).
- Modifier une ligne de la feuille Famille se fait dans l'app, effet visible immédiatement sur les cards d'enclenchement (F6).
- Aucune régression sur les pages existantes (Dashboard/Analyse/Joueurs/Notes/Impact/mode joueur) — à valider par le squad de contrôle habituel une fois les stories développées.
- Le scénario "Jules F" (joueur périmé visible sur un appareil non réimporté) ne se reproduit plus une fois F1-F3 livrées.

## 5. Hors scope (ce cycle)

- Saisie native de données de match (`DATA`) dans l'app — Excel reste l'outil de saisie (justifié Research §1, §3).
- Import incrémental match par match (décision §0).
- Migration de la feuille `Temps de Jeu` (confirmée inutilisée par le code).
- Amélioration du niveau de sécurité de l'authentification (mot de passe staff partagé, mots de passe joueurs en clair).
- Mode hors-ligne / cache local de secours (décision §0).
- Accès multi-coachs avec permissions différenciées (décision §0 — accès staff single-user suffisant).

## 6. Dépendances

- Un projet Supabase doit être créé par Romain (URL + clé anonyme) avant toute implémentation technique — aucune story ne peut être développée sans ces identifiants.
- F4/F6/F7 dépendent de F1 (le socle de connexion Supabase doit exister avant tout module qui lit/écrit dessus).
- F5 dépend de F1-F3 (il faut que Supabase soit fonctionnel comme destination avant de pouvoir y transférer les données locales existantes).

## 7. Risques

- **Perte de données lors de la bascule** si F5 est mal exécutée ou sautée — Romain pourrait perdre des notes coach déjà saisies. Traité comme Must Have explicite plutôt que comme un détail d'implémentation, précisément pour ne pas être oublié.
- **Dépendance réseau nouvelle** — l'app ne fonctionnera plus du tout sans connexion (décision assumée §0, mais à rappeler clairement à Romain si un jour l'usage change et qu'une connexion fiable au gymnase n'est plus garantie).
- **Fragilité du mapping positionnel de la colonne `DATA`** (déjà présente aujourd'hui, pas introduite par ce projet) — si Romain réordonne les colonnes de son Excel, l'import silencieusement mal aligné pourrait corrompre les données poussées vers Supabase. À traiter par l'Architect (validation du format à l'import plutôt qu'un mapping aveugle par position).
- Détail technique à trancher par l'Architect, pas par le PM : comment authentifier l'app auprès de Supabase (clé publique + RLS vs autre mécanisme) compte tenu du modèle d'accès simple retenu (§0).
