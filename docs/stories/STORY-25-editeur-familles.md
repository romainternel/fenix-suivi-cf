# STORY-25 — Écran d'édition des familles tactiques

**En tant que** coach,
**Je veux** pouvoir modifier le rattachement d'une "Intention attaque" à une famille directement dans l'app,
**Afin de** ne plus avoir besoin d'une modification de code pour ajuster cette configuration en cours de saison.

## Contexte technique
- Zone concernée : menu "⚙ Outils" (`FENIX-HANDBALL-CF-SUIVI.html`, `.nav-tools-menu`), nouveau panneau `.slide-panel` (réutilise STORY-19), nouvelles fonctions `js/page-analyse.js`
- Spec exacte : `docs/design/migration-supabase.md` §3, `docs/visual/migration-supabase.md` §4
- Modèle direct à suivre : `openPlayerAccountsModal()`/`savePlayerAccount()`/`deletePlayerAccount()` (`js/player-mode.js`) — même structure, même pattern `.slide-panel`, adapté à `famille_mapping`

## Critères d'acceptation
- [x] Nouvelle entrée "🏷️ Familles tactiques" dans le menu "⚙ Outils", à la suite de "Comptes joueurs"/"Vue joueur"
- [x] Panneau `.slide-panel` (glisse depuis la droite, overlay, Échap, focus trap — identique à STORY-19) listant les correspondances existantes, triées alphabétiquement par "Intention attaque". Testé : Échap ferme le panneau et rend le focus à "⚙ Outils".
- [x] Formulaire d'ajout : champ texte "Intention attaque" + liste déroulante fermée sur les 8 familles connues (`ENC_FAMILLES_ORDRE`)
- [x] Bouton supprimer (`🗑`) par ligne avec confirmation native (`confirm()`), testé via le bouton réel du DOM
- [x] Toute modification (ajout/suppression) écrit immédiatement dans `famille_mapping` (Supabase) et met à jour `FAMILLE_MAPPING` en mémoire — effet visible immédiatement sur les cards d'enclenchement de la page Analyse sans rechargement de page. **Testé numériquement, pas juste visuellement** : réassignation de "BLOC" (Jeu Pivot → Isoler) → possessions Jeu Pivot 9→7, Isoler 26→28 sur le match affiché, sans navigation ; réassignation inverse → valeurs exactement restaurées.
- [x] État vide / premier lancement : si `famille_mapping` ne contient que les valeurs par défaut (pas encore éditées), un bandeau discret l'indique. Testé dans les deux sens : bandeau visible sur les 17 valeurs par défaut inchangées, disparaît après une modification, réapparaît après restauration exacte de l'état par défaut.
- [x] **Mitigation R6** : retour d'erreur visible en cas d'échec réseau lors d'un ajout/suppression — testé explicitement (échec simulé), message d'erreur affiché.
- [x] Testé : modifier une famille, vérifier que la page Analyse (camembert/matrice Enclenchements) reflète le changement sans avoir à réimporter l'Excel — confirmé (cf. ci-dessus). Aucune donnée réelle laissée altérée : la correspondance BLOC/Jeu Pivot a été restaurée à l'identique et vérifiée via l'API REST après le test.

## Hors scope
- Édition de la feuille `Bilan` (STORY-26)
- Toute modification de la logique de classification elle-même (`getEncFamille()` déjà simplifiée en STORY-24) — cette story ne fait qu'éditer les données, pas la fonction qui les consomme

## Dépend de
- STORY-20, STORY-24

## Taille
M
