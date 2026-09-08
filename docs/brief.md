# Brief — Réorganisation de la page Analyse

**Agent :** Analyst
**Date :** 2026-09-08

---

## 1. Contexte

La page Analyse existe depuis le tout début du projet et a reçu des ajouts story par story pendant des mois (STORY-14 pour les onglets, modules A-01 à A-07 pour les familles/gardien, STORY-33 à 38 pour l'Articulation, etc.) — chaque ajout a été pensé et testé isolément, jamais l'ensemble. Résultat, recensé dans `docs/brainstorm/reorganisation-page-analyse.md` : 15 blocs de contenu distincts, répartis entre un bloc fixe en haut de page (terrain + cartes comparatives), 5 onglets, et une vue "Saison complète" quasiment indépendante. Romain formule directement le symptôme : "un vrai problème de lecture logique et simplifiée... il y a plein de choses mais ça me paraît fouillis."

## 2. Problème

Ce n'est pas un problème de qualité de contenu (chaque bloc individuel a été validé en son temps) mais d'**agencement d'ensemble** :
- Le découpage en 5 onglets (Résumé/Timeline/Intention attaque/Gardien/Chat IA) reflète l'ordre historique de développement, pas nécessairement un vrai parcours de lecture pour un coach.
- Un bloc lourd (terrain + nuage de tirs + cartes comparatives) occupe une place fixe en haut de page, avant tout onglet, sans certitude qu'il soit consulté à chaque visite.
- L'information de synthèse ("comment s'est passé ce match") est dispersée entre le résumé IA, les indicateurs clés et l'ancien système de badges (retiré en v269) — jamais réunie à un seul endroit.
- La vue "Saison complète" ne partage presque aucune structure visuelle avec la vue d'un match précis, ce qui casse la prévisibilité de l'appli.

## 3. Utilisateurs

Romain, staff/coach, desktop, en session de préparation ou de débrief tactique — inchangé par rapport aux cycles précédents. Point ajouté par ce cycle : le CONTEXTE d'usage varie (débrief juste après un match vs préparation d'un futur adversaire vs suivi de tendances saison), et la page actuelle ne s'adapte pas à ce contexte — elle présente toujours la même chose dans le même ordre.

## 4. Vision

Une page qui se lit en 10 secondes pour l'essentiel, et qui s'approfondit à la demande — pas l'inverse. Moins de sections de même rang visuel, un seul endroit pour "comprendre le match tout de suite", et un accès secondaire (pas supprimé, juste moins mis en avant) pour ce qui est réellement consulté rarement (Chat IA, terrain/nuage de tirs).

## 5. Scope

**Dans le scope de ce cycle (Designer/Visual Crafter à détailler) :**
- Un bloc de synthèse unique en tête de page ("Essentiel du match"), qui réunit ce qui est aujourd'hui dispersé (résumé IA, indicateurs clés, tendance tactique la plus marquante).
- Réduction du nombre de sections de même rang (piste retenue du brainstorm : fusionner Résumé+Timeline et Intention attaque+Gardien) — le Designer tranche la structure exacte.
- Le bloc terrain/nuage de tirs replié par défaut (accordéon), pour libérer la hauteur d'écran au profit du contenu qui varie selon la section active.
- Une structure commune entre vue match et vue "Saison complète", pour que l'appli reste prévisible d'un contexte à l'autre.
- **Livrable attendu avant toute validation : un exemple visuel concret de la page reorganisée**, que Romain doit pouvoir regarder et juger avant qu'on ne découpe quoi que ce soit en stories.

**Hors scope (retenu pour une vision plus tardive, pas ce cycle) :**
- Le mode "Préparation / Debrief / Saison" qui réorganiserait dynamiquement les sections selon le contexte d'usage (idée du brainstorm, vision 12 mois) — trop structurant pour être tranché en un seul cycle sans d'abord valider la réorganisation de base.
- Retrait pur et simple du Chat IA — reste accessible, seulement moins mis en avant visuellement.
- Aucune modification des calculs/données sous-jacents à aucun des blocs existants — uniquement leur organisation et leur présentation.

## 6. Critères de succès

- Romain regarde l'exemple visuel et dit "oui, c'est plus clair" avant qu'aucune ligne de code de production ne soit touchée.
- Le nombre de sections de même niveau hiérarchique diminue par rapport aux 5 onglets actuels.
- Aucune fonctionnalité existante ne disparaît — seulement leur place et leur mise en avant relative changent.
- La vue match et la vue saison partagent une structure reconnaissable.

## 7. Questions en suspens

- La fusion exacte des onglets (Résumé+Timeline, Intention attaque+Gardien) proposée par le Brainstormer est une piste, pas une décision actée — à valider ou ajuster par Romain une fois qu'il voit le résultat visuel, pas avant.
- Le contenu précis du bloc "Essentiel du match" (quels indicateurs, quelle formulation du verdict) est à concevoir par le Designer à partir de ce qui existe déjà (pas de nouvelle donnée à calculer).
