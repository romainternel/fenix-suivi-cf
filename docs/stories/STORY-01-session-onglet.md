# STORY-01 — Session reprend sur le dernier onglet actif

**En tant que** joueur,  
**Je veux** retrouver l'onglet où j'étais quand je reviens sur l'app dans la même session,  
**Afin de** ne pas avoir à recliquer sur "Stats Match" à chaque fois que je consulte l'app entre deux entraînements.

## Contexte technique
- Fichier : `js/player-mode.js`
- Fonction `pmTab(tab)` — ligne ~88 : ajouter `sessionStorage.setItem('pm_active_tab', tab)`
- Fonction `setupPlayerUI()` — ligne ~48 : lire `sessionStorage.getItem('pm_active_tab')` avant d'appeler `pmTab()`
- Pas de nouvelle variable globale
- Pas de modification HTML

## Critères d'acceptation
- [ ] Naviguer vers l'onglet "Stats Match", fermer et rouvrir l'app dans le même onglet navigateur → l'app s'ouvre sur "Stats Match"
- [ ] Naviguer vers l'onglet "Zones", fermer et rouvrir → l'app s'ouvre sur "Zones"
- [ ] Ouvrir l'app dans un nouvel onglet navigateur → l'app s'ouvre sur "Ma Fiche" (défaut)
- [ ] Fonctionne pour les 3 onglets : fiche / match / zones

## Hors scope
- Pas de mémorisation entre sessions différentes (sessionStorage, pas localStorage)
- Pas de mémorisation du match ou de la période sélectionnée

## Dépend de
- Aucune

## Taille
S
