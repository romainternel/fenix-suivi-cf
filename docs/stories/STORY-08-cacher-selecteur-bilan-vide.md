# STORY-08 — Masquer le sélecteur de période si aucun bilan n'est défini

**En tant que** joueur en début de saison,  
**Je veux** ne pas voir un sélecteur de période vide ou inutile,  
**Afin d'** avoir une interface propre même quand le staff n'a pas encore rempli les bilans.

## Contexte technique
- Fichier HTML : `FENIX-HANDBALL-CF-SUIVI.html`
- Fichier JS : `js/player-mode.js` — `buildPmMatchNav()` (~ligne 1160)

**Dans Stats Match :** Le div `pm-bilan-wrap` (ligne ~3392) est géré par `buildPmMatchNav()`.  
Dans cette fonction, trouver l'endroit où `pm-bilan-wrap.style.display` est mis à `'flex'` ou `''` et ajouter la condition `BILANS.length > 0`.

**Dans Ma Fiche (préparation pour STORY-09) :** La condition `BILANS.length > 0` sera également utilisée dans `renderPlayerFiche()` pour décider d'afficher ou non le sélecteur de période du graph. Cette story ne touche PAS au graph (STORY-09 le crée), mais documente la règle commune.

**Règle :** `if (typeof BILANS !== 'undefined' && BILANS.length > 0)` avant tout affichage de sélecteur de période.

## Critères d'acceptation
- [ ] Quand `BILANS.length === 0` (aucun bilan dans le fichier Excel) : le sélecteur PÉRIODE est absent de Stats Match
- [ ] Quand `BILANS.length >= 1` : le sélecteur PÉRIODE apparaît normalement dans Stats Match
- [ ] Aucune erreur JS si `BILANS` est vide
- [ ] Le sélecteur MATCH reste toujours visible (non affecté)
- [ ] Aucune régression sur la vue staff (le filtre PÉRIODE staff non affecté)

## Hors scope
- Pas de modification du graph Ma Fiche (STORY-09)
- Pas de message "pas encore de bilan disponible" — juste masquer

## Dépend de
- Aucune

## Taille
S
