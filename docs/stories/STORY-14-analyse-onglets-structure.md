# STORY-14 — Découpage de la page Analyse en 5 onglets (structure)

**En tant que** membre du staff,
**Je veux** accéder directement à une section précise de la page Analyse (résumé, timeline, enclenchements, gardien, chat) sans avoir à scroller toute la page,
**Afin de** retrouver une information en quelques secondes plutôt qu'en faisant défiler 8 sections empilées.

## Contexte technique
- Zone concernée : `FENIX-HANDBALL-CF-SUIVI.html` (structure `#analyse-content`), `js/page-analyse.js` (nouvelle fonction `_analyseTab()`)
- Design : `docs/design/navigation-refonte.md` §2 · Architecture : `docs/arch/navigation-refonte.md` §1.1
- Pattern de référence à répliquer (pas à factoriser) : `pmTab()` dans `js/player-mode.js`
- **Cette story est structure uniquement — pas de polish visuel.** Le style des onglets réutilise `.pm-tab-btn` existant tel quel pour l'instant ; l'habillage définitif vient dans STORY-16.
- Le bloc terrain + cartes FENIX/ADVERSAIRE (`#match-block-section`) **reste hors onglets, toujours visible** au-dessus — ne pas y toucher.

## Répartition des sections existantes dans les 5 onglets
| Onglet | Contenu (déplacé tel quel, IDs internes inchangés) |
|---|---|
| Résumé *(par défaut)* | Résumé du match (IA) + Ton Analyse (Coach) + Indicateurs Clés |
| Timeline | Évolution du score + Moments clés + Bascules du match |
| Enclenchements | `#enc-familles-section` (cards + camembert/matrice + drill-down) |
| Gardien | `#enc-gardien-section` |
| Chat IA | Chat container |

## Critères d'acceptation
- [ ] 5 boutons d'onglet visibles sous le bloc terrain+cartes, au-dessus du contenu
- [ ] Chaque section listée ci-dessus est déplacée dans le bon conteneur d'onglet, avec tout son contenu et ses IDs internes intacts — vérifié en comparant le contenu de chaque section avant/après le déplacement (rien de perdu, rien de dupliqué)
- [ ] `updateAnalysePage()` continue d'appeler les 6 fonctions de rendu existantes (`generateResume3Points`, `generateIndicateurs`, `drawTimeline`, `renderBasculContext`, `renderEncFamillesSection`, `renderGardienEncSection`) sans aucune modification de leur code interne
- [ ] `_analyseTab(tab)` bascule l'affichage entre les 5 conteneurs (`display:none`/`block`), met à jour l'état visuel actif du bouton d'onglet cliqué, et sauvegarde l'onglet actif dans `sessionStorage` (clé `an_active_tab`)
- [ ] **Canvas (R1) :** ouvrir directement l'onglet Timeline (ou Enclenchements) sur un match qui vient d'être sélectionné, sans être jamais passé par cet onglet avant, affiche bien le canvas correctement dimensionné (pas de canvas vide/tronqué) — `_analyseTab()` doit ré-invoquer `drawTimeline()`/`_drawEncChart()` à l'ouverture de l'onglet concerné
- [ ] **Vue saison (R3) :** en "Saison complète" (aucun match sélectionné), les onglets Timeline et Chat IA sont désactivés/grisés (non cliquables) ; si l'onglet mémorisé en `sessionStorage` n'est pas disponible dans le contexte courant, l'app retombe automatiquement sur l'onglet "Résumé" plutôt que d'afficher un onglet vide
- [ ] **Drill-down enclenchements (R4) :** changer de match pendant que l'onglet Enclenchements est fermé, puis le rouvrir, ne montre jamais un détail (famille/intention sélectionnée) qui correspondrait à l'ancien match
- [ ] **Non-régression globale (R2) :** après le déplacement de markup, les pages Dashboard, Joueurs, Comptes et Vue joueur sont parcourues manuellement une par une et fonctionnent normalement (le fichier HTML étant unique, une balise mal fermée dans Analyse peut casser une autre page)
- [ ] L'onglet actif se mémorise d'une visite à l'autre de la page Analyse (revenir depuis Joueurs retombe sur le dernier onglet consulté), comme le fait déjà le mode joueur

## Hors scope
- Tout habillage visuel des onglets au-delà du style `.pm-tab-btn` réutilisé tel quel (STORY-16)
- Badge de notification (point rouge) sur l'onglet Enclenchements pour le taux de couverture — mentionné en Design comme piste, non retenu dans cette story pour rester atomique ; à reprendre en story séparée si souhaité après livraison

## Dépend de
- Aucune

## Taille
L
