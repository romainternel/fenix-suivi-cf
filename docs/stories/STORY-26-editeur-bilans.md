# STORY-26 — Écran d'édition des bilans (Should Have)

**En tant que** coach,
**Je veux** pouvoir ajuster les bornes de périodes ("Bilan 1"/"Bilan 2") directement dans l'app,
**Afin de** ne plus dépendre d'une ligne dans l'Excel pour ce réglage ponctuel.

## Contexte technique
- Zone concernée : menu "⚙ Outils", nouveau panneau `.slide-panel`, `js/page-analyse.js` ou nouveau petit module dédié
- Spec exacte : `docs/design/migration-supabase.md` §4 (même schéma que STORY-25/F6, non détaillé en maquette complète)
- Priorité **Should Have** (PRD §3) — pas de demande explicite de Romain sur ce point précis contrairement à Famille (F6), à confirmer/prioriser avec lui avant développement si le temps est limité

## Critères d'acceptation
- [ ] Nouvelle entrée "📅 Bilans" dans le menu "⚙ Outils"
- [ ] Panneau `.slide-panel` identique au pattern STORY-19/25, listant les bilans existants (Saison / Nom / Journée fin)
- [ ] Formulaire d'ajout avec les 3 champs, bouton supprimer par ligne avec confirmation native
- [ ] Toute modification écrit immédiatement dans `bilan` (Supabase), effet visible sur le filtre "Période" de la page Notes sans réimport
- [ ] **Mitigation R6** : retour d'erreur visible en cas d'échec réseau

## Hors scope
- Toute modification de la logique de calcul des bornes (`processBilans()`) — cette story édite seulement les données sources

## Dépend de
- STORY-20, STORY-21

## Taille
S
