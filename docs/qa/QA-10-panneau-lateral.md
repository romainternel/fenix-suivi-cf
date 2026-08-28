# QA-10 — STORY-19 : Panneau latéral pour Comptes et Vue joueur

**Agent :** QA
**Date :** 2026-08-28
**Méthode :** Test en navigateur réel (Playwright), données réelles (`ESSAI IA STAT.xlsm`)

---

## Critères validés

| Critère | Statut | Preuve |
|---|---|---|
| Panneaux glissent depuis la droite (translateX), pas de fondu centré | ✅ | `.slide-panel` : `transform: translateX(100%) → 0`, testé sur les 2 panneaux — `01-comptes-open.png`, `02-vuejoueur-open.png` |
| Overlay semi-transparent, cliquable pour fermer | ✅ | `.slide-panel-overlay` (200ms ease-out) ; clic sur l'overlay ferme le panneau Vue joueur, vérifié via `classList.contains('open') === false` après clic |
| Contenu interne strictement identique | ✅ | Formulaire de compte (sélecteur + mot de passe + bouton), sélecteur de joueur, boutons Annuler/Voir sa vue : aucun champ modifié, testé un cycle complet création + suppression de compte |
| Échap ferme le panneau + retour de focus sur "Outils" | ✅ | Vérifié programmatiquement : `document.activeElement.id === 'nav-tools-btn'` après Escape |
| Focus piégé dans le panneau (Tab ne sort pas) | ✅ | Testé Tab en boucle complète (select → Annuler → Voir sa vue → retour au select) ET Shift+Tab en sens inverse (premier élément → dernier) — les deux sens du piège fonctionnent |
| Recensement des autres modales documenté | ✅ | Commentaire CSS + Code Review : 5 autres modales (gb-zone, notes-detail, player, graph, eff-info) explicitement laissées en l'état avec raison |
| Testé desktop + 375px (pleine largeur probable) | ✅ | `.slide-panel` passe à `width:100%` sous 480px, confirmé visuellement — `04-mobile-375.png` |

**7/7 critères validés.**

## Cas limites

- **Bug trouvé et corrigé pendant l'implémentation** (documenté en détail dans le Code Review) : une règle CSS `#pa-modal{display:none}` morte, restée d'une itération antérieure, empêchait le panneau Comptes joueurs de s'afficher du tout après le passage à `classList`. Corrigée par le Developer avant que le QA ne commence son test — donc testée dans son état corrigé, mais vérifiée explicitement une seconde fois par le QA pour confirmer l'absence de résidu.
- Flux complet "créer un compte joueur" (sélection, mot de passe, création, apparition dans la liste, suppression) testé de bout en bout, pas seulement l'ouverture/fermeture visuelle du panneau.
- Réouverture du panneau Comptes après une création de compte (le panneau se rafraîchit sur place) : le focus n'est pas volé à l'utilisateur (vérifié que l'auto-focus ne se déclenche qu'à l'ouverture initiale, pas aux rafraîchissements).
- Bouton "Comptes joueurs" ré-ouvert plusieurs fois de suite (fermé/rouvert) : pas de classe `open` résiduelle, pas de double-overlay.

## Régressions détectées

Aucune. Les 5 autres modales du fichier (`#gb-zone-modal`, `#notes-detail-modal`, `#player-modal`, `#graph-modal`, `#eff-info-modal`) n'ont reçu aucune modification de CSS ou de JS.

## Verdict global

**✅ PASSED**
