# STORY-26 — Écran d'édition des bilans (Should Have)

**En tant que** coach,
**Je veux** pouvoir ajuster les bornes de périodes ("Bilan 1"/"Bilan 2") directement dans l'app,
**Afin de** ne plus dépendre d'une ligne dans l'Excel pour ce réglage ponctuel.

## Contexte technique
- Zone concernée : menu "⚙ Outils", nouveau panneau `.slide-panel`, `js/page-analyse.js` ou nouveau petit module dédié
- Spec exacte : `docs/design/migration-supabase.md` §4 (même schéma que STORY-25/F6, non détaillé en maquette complète)
- Priorité **Should Have** (PRD §3) — pas de demande explicite de Romain sur ce point précis contrairement à Famille (F6), à confirmer/prioriser avec lui avant développement si le temps est limité

**Confirmé avec Romain (2026-09-01)** : oui, à faire pour terminer le cycle Supabase.

## ⚠️ Bug latent préexistant découvert pendant le développement (corrigé)
`processBilans()` (`FENIX-HANDBALL-CF-SUIVI.html`) traite les bilans dans l'ordre où ils arrivent dans `_rawBilanRows`, pas triés par journée de fin — un bilan dont la journée de fin est antérieure au dernier déjà traité (`endIdx <= prevEndIdx`) est silencieusement ignoré du calcul, sans erreur. Sans risque tant que la seule source était l'Excel (les lignes de la feuille Bilan sont naturellement dans l'ordre chronologique), mais l'éditeur de cette story n'a plus cette garantie : un nouveau bilan ajouté avec une journée de fin antérieure au dernier bilan existant serait invisible dans les filtres sans aucun message d'erreur. **Corrigé sans toucher à la logique de calcul de `processBilans()` elle-même** (respect du "Hors scope" ci-dessous) : `_rawBilanRows` est désormais systématiquement trié par journée de fin croissante avant d'être transmis, à la fois dans le nouvel éditeur (`_refreshBilansData()`) et dans le chargement initial (`loadFromSupabase()`, où le même risque latent existait déjà, non découvert faute d'avoir eu l'occasion de tester avec des bilans mal ordonnés).

## Critères d'acceptation
- [x] Nouvelle entrée "📅 Bilans" dans le menu "⚙ Outils"
- [x] Panneau `.slide-panel` identique au pattern STORY-19/25, listant les bilans existants (Saison / Nom / Journée fin). Testé : Échap ferme + rend le focus à "⚙ Outils".
- [x] Formulaire d'ajout avec les 3 champs, bouton supprimer par ligne avec confirmation native — testé via le bouton réel du DOM
- [x] Toute modification écrit immédiatement dans `bilan` (Supabase), effet visible sur le filtre "Période" de la page Notes sans réimport. **Testé bout en bout avec un bilan intentionnellement mal ordonné** (journée de fin antérieure au dernier bilan existant) pour vérifier explicitement le bug latent ci-dessus : sans le fix, le bilan était invisible dans `BILANS`/le filtre ; avec le fix, les 3 bilans (dont celui mal ordonné) apparaissent correctement triés
- [x] **Mitigation R6** : retour d'erreur visible en cas d'échec réseau — testé explicitement (échec simulé)

## Hors scope
- Toute modification de la logique de calcul des bornes (`processBilans()`) — cette story édite seulement les données sources (le tri appliqué est un tri des données en entrée, pas un changement de la logique de calcul des bornes elle-même)

## Dépend de
- STORY-20, STORY-21

## Taille
S
