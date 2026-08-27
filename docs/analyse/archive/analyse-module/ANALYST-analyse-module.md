# Analyst — Module Analyse FENIX Handball
**Agent :** Analyst  
**Date :** 2026-06-17  
**Input :** Entretien utilisateur + docs/audit/AUDIT-NUIT-2026-06-16.md + js/page-analyse.js

---

## 1. Contexte et utilisateurs

**Application :** FENIX-HANDBALL-CF-SUIVI — app web vanilla JS de suivi de match handball, usage club uniquement.

**Utilisateurs du module Analyse :**
- **Coach principal** (utilisateur primaire) — analyse post-match, prépare la semaine suivante
- **Max** (co-coach / analyste) — même usage

**Quand :** Exclusivement **après le match**. Pas d'usage temps réel ni pendant la semaine sauf préparation du match suivant.

**Plateforme :** Desktop / tablette (le module Analyse est côté staff, pas accessible en mode joueur).

---

## 2. Problème central

> Le staff dispose de données riches encodées match par match (enclenchements, défenses, zones, gardiens, actions) mais la page Analyse actuelle ne les exploite pas. On voit *ce qui s'est passé* (score, résumé, indicateurs) mais pas *pourquoi* ni *comment y remédier*.

**Les 3 questions sans réponse aujourd'hui :**
1. Quel enclenchement a mis l'adversaire en difficulté — et est-ce notre force ou leur faiblesse ?
2. À quel moment le match a basculé — et nos choix tactiques à ce moment étaient-ils bons ?
3. Quelle famille d'attaque (Faire courir / Jeu Pivot / Isoler) est notre arme principale cette saison ?

---

## 3. Données disponibles (non exploitées)

### Colonne `enclenchement` (COLS index 9)
- Format : parties séparées par ";" — ex : `8;0;Bloc 4`
  - Partie 1 : nom du mouvement (ex: 8 = croisé sans ballon)
  - Partie 2 : variante (ex: 0 = jeu autour du pivot)
  - Partie 3 : finalité (ex: Bloc 4 = bloc du pivot)
- Source : logiciel vidéo du club — encodage automatique
- **3 familles naturelles identifiées par le coach :**
  - **Faire courir** — exploiter les transitions, la fatigue défensive
  - **Jeu Pivot** — direct, indirect ou bloc autour du pivot
  - **Isoler** — créer un duel 1v1 pour un joueur en particulier
- **Présent pour FENIX ET l'adversaire** — le `club` indique qui attaque

### Colonne `defense_attaquee` (COLS index 5)
- Symétrique selon `club` :
  - Club = FENIX → defense_attaquee = défense adverse (ex: 0-6, 1-5, 2-4)
  - Club = Adversaire → defense_attaquee = défense FENIX
- Encodé par le coach — valeurs type : "0-6", "1-5", "2-4", "3-2-1", etc.

### Colonnes gardien
- `gardien` (index 10) : nom du gardien en jeu
- `field_position` (index 12) : zone de tir
- `finalite` (index 8) : Tir arrêté / But
- Rotations fréquentes : plusieurs gardiens par match possible

### Colonne `periode` (index 13)
- MT1 / MT2 — permet la comparaison première/deuxième mi-temps

### Colonnes actions (index 16-18)
- `action_joueur`, `action_att`, `action_def` — séparées par ";"
- Permettent d'analyser les contributions individuelles dans chaque enclenchement

---

## 4. État actuel de la page Analyse

### Ce qui existe (`js/page-analyse.js`, 743 lignes)
| Fonction | Description |
|----------|-------------|
| `updateAnalysePage()` | Point d'entrée — filtre 1 match à la fois |
| `generateResume3Points()` | Top 3 stats auto-générées |
| `generateIndicateurs()` | KPIs FENIX vs ADV avec MT1/MT2 |
| `drawTimeline()` | Canvas évolution du score |
| `findMomentsCles()` | Détection de runs ≥3 buts consécutifs |
| `saveCoachAnalyse()` | Notes libres coach (localStorage) |
| `sendChatMessage()` | Chatbot local répondant aux questions |
| `generateSeasonCorrelations()` | KPIs V/D/N (sans match sélectionné) |

### Ce qui manque
- Aucune exploitation de `enclenchement`
- Aucune exploitation de `defense_attaquee`
- Aucune analyse par famille d'enclenchement (Faire courir / Jeu Pivot / Isoler)
- Pas de détection du moment bascule (au-delà des runs de buts)
- Pas de vue multi-matchs croisée sur les patterns
- Pas d'export

---

## 5. Besoins utilisateur — priorisés

### Besoin #1 — CRITIQUE : Le moment bascule
**"Je veux voir quel moment du match a retourné la situation, et si mes choix à ce moment étaient bons."**

Ce besoin implique :
- Identifier la séquence qui a inversé l'écart de score
- Afficher les enclenchements utilisés pendant cette séquence
- Évaluer l'efficacité des choix tactiques (changements de système, gardien, etc.)

### Besoin #2 — CRITIQUE : Famille d'enclenchement efficace
**"Je veux savoir si c'est Faire courir / Isoler / Jeu Pivot qui a mis l'adversaire en difficulté ce soir."**

Ce besoin implique :
- Classifier les enclenchements par famille
- Calculer l'efficacité par famille (buts / tirs + PB)
- Distinguer "notre force récurrente" vs "faiblesse de l'adversaire ce soir"

### Besoin #3 — IMPORTANT : Force récurrente vs faiblesse ponctuelle
**"Ce pattern qu'on a exploité — c'est parce qu'on est bons dessus, ou parce qu'eux étaient faibles ?"**

Ce besoin implique :
- Comparer les stats du match actuel aux moyennes saison
- Si l'efficacité d'un enclenchement est ≥ 1.5x la moyenne saison → faiblesse adverse
- Si elle est consistante sur tous les matchs → force FENIX

### Besoin #4 — UTILE : Gardien par enclenchement adverse
**"Notre gardien est-il en difficulté sur certains types d'attaque ennemie ?"**

Ce besoin implique :
- Filtrer les lignes Club=Adversaire
- Croiser enclenchement adverse × résultat (arrêt/but)
- Afficher par gardien (vu les rotations fréquentes)

### Besoin #5 — NICE TO HAVE : Défense attaquée × résultat
**"Quand l'adversaire joue en 0-6, on marque combien ?"**

---

## 6. Contraintes techniques

- App vanilla JS — pas de framework, pas de bundler
- Données lues depuis Excel via SheetJS → tableau `DATA[]`
- `enclenchement` est une chaîne multi-parties (";") — parsing nécessaire
- Pas de colonne score instantané → pas de momentum basé sur l'écart en temps réel (sauf reconstruction depuis les lignes)
- Pas de gestion des compositions (trop complexe à encoder)
- Export PDF/PPT existant pour le joueur — pas encore pour l'Analyse

---

## 7. Périmètre recommandé

**Dans le scope :**
- Vue par match : enclenchements × famille × résultat
- Moment bascule amélioré (au-delà des runs)
- Gardien par enclenchement adverse
- Comparaison match vs saison (force vs faiblesse)
- Vue saison : enclenchements V vs D

**Hors scope (pour l'instant) :**
- Compositions défense/attaque (complexité encodage)
- Détection pattern perdant automatique (XL)
- Drill-down hiérarchique complet (L)
- Notation sous pression du score (colonne absente)
