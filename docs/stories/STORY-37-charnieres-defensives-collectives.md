# STORY-37 — Recentrage collectif du mode Articulation (charnières défensives)

**En tant que** Romain (staff),
**Je veux** que le mode Articulation évalue la performance de groupes de joueurs qui défendent ensemble (à 6, à 4, à 2) plutôt que celle d'un joueur isolé à un poste, avec un pourcentage qui se lit dans le sens normal (haut = bonne défense),
**Afin de** juger la solidité d'une charnière défensive sans être distrait par une évaluation individuelle qui ne m'intéresse pas, et sans avoir à me souvenir qu'un chiffre bas est en fait bon.

## Contexte technique

- Zone concernée : `js/page-analyse.js`, bloc Articulation (`_drawArticulationCourt`, `_articPrimaryEntry`, `_articEffClass`) ; `css/style.css` classes `.artic-poste.*` (liseré individuel), `.artic-block-*`.
- Nouvelles fonctions : `_articTauxDefense(stat)` et `_articDefClass(tauxDef, possessions)` — cf. `docs/arch/articulation-charnieres-collectives.md` §1.1/1.2 pour le code exact et les seuils (miroir exact de `_articEffClass`, vérifiés par calcul dans le Risk Analyst R2).
- Impact sur l'existant : `computeArticulationStats`, `_articBlockEff`, `ARTIC_BLOCKS`, `_articPrimaryEntry` restent inchangées dans leur calcul. `_articEffClass` n'est plus appelée dans le rendu (conservée dans le code, cf. Architecture §1.2) mais son résultat n'atteint plus le HTML.
- Réordonnancement du HTML généré par `_drawArticulationCourt` : les 4 cartes (Référence + 3 charnières) passent AVANT le terrain, précédées d'un titre de section.

## Critères d'acceptation

- [ ] Les 4 cartes (Référence, "À 6 (ligne complète)", "À 4 (centre)", "À 2 (les deux centraux)") s'affichent immédiatement après le bandeau de contrôles, avant le terrain — précédées du titre "🛡️ CHARNIÈRES DÉFENSIVES — % de séquences arrêtées".
- [ ] Chaque carte affiche `_articTauxDefense()` = `(possessions − buts − po) / possessions × 100`, PAS l'ancienne efficacité attaque adverse — vérifié par un calcul manuel sur au moins un cas réel (ex. BLOC34 à 43 séq.) comparé au chiffre affiché.
- [ ] La couleur de chaque carte suit `_articDefClass()` : vert pour une valeur haute (bonne défense), rouge pour une valeur basse — sens opposé à l'ancien système, vérifié qu'aucune carte n'affiche une couleur dans l'ancien sens.
- [ ] Aucun rond-poste n'affiche de liseré de couleur, quel que soit le mode (auto, Suggestion, override manuel) — le rond n'affiche que le nom, le badge "+N" éventuel, et le marqueur `✎` éventuel.
- [ ] Le panneau de détail par poste (au clic) n'affiche plus de % individuel par joueur — seulement le nom et le nombre de séquences observées, trié par fréquence décroissante.
- [ ] Le toggle "AFFICHAGE"/"🏆 Top Def" est renommé "COMPOSITION"/"💡 Suggestion" (libellés et tooltip mis à jour selon `docs/arch/articulation-charnieres-collectives.md` §1.4) ; le comportement interne (`_setArticViewMode('topdef')`) reste inchangé.
- [ ] Une ligne récapitulative sous le terrain liste les 6 noms dans l'ordre P1→P6, séparés par "·" — gère proprement un poste sans donnée (affiche "—" à cette position, pas de virgule orpheline ni "undefined").
- [ ] Aucune mention résiduelle d'"efficacité adverse" ou de libellé de l'ancien système ne subsiste dans l'interface utilisateur du mode Articulation (tooltips inclus).
- [ ] Les chiffres de séquences/possessions affichés (dans les cartes, tooltips, panneau de détail) sont strictement identiques à avant cette story — seule la métrique dérivée change.
- [ ] Non-régression : bascule dispositif 0-6/1-5, bascule Attaque/Défense (désactivation + reset), sélection manuelle avec/sans donnée, "Réinitialiser", vue match et vue saison.

## Hors scope

- Modification de `computeArticulationStats`, `_articBlockEff`, `ARTIC_BLOCKS`, `_articPrimaryEntry` (calcul de fond).
- STORY-35 (classement automatique des charnières P2-P5) — reste un chantier séparé ; sa pertinence après ce cycle est à redébattre avec Romain hors de cette story.
- Suppression de `_articEffClass()` elle-même (conservée non appelée, cf. Architecture §6).

## Dépend de

- Aucune (repose sur STORY-36 déjà livrée, v261/v262 en production).

## Taille

M
