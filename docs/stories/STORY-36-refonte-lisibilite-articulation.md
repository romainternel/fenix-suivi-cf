# STORY-36 — Refonte lisibilité du mode Articulation

**En tant que** Romain (staff),
**Je veux** un demi-terrain Articulation lisible en un coup d'œil (postes sur la vraie courbe du 6m, noms seuls dans les ronds, contrôles clairement séparés du contenu),
**Afin de** repérer instantanément qui joue où et quel réglage est actif, sans être gêné par un pourcentage empilé dans chaque rond ni par un bandeau de contrôles qui se confond avec le terrain.

## Contexte technique

- Zone concernée : `js/page-analyse.js` — bloc "Articulation défensive (STORY-34)" (`ARTIC_LAYOUTS`, `_articCourtSvg`, `_articEffClass`, `_articPrimaryEntry`, `computeArticulationStats`, `ARTIC_BLOCKS`, `_articBlockEff`, `_drawArticulationCourt`, `_setArticDispositif`, `_setArticViewMode`, `_setArticManualJoueur`, `_selectArticPoste`) ; `css/style.css` classes `.artic-*`.
- Nouvelles structures : `ARTIC_6M_ARC` (constante), `_articArcY(x, arc)` (fonction pure) — cf. `docs/arch/articulation-lisibilite.md` §1.1 pour le code exact à reprendre tel quel.
- Nouvelle fonction : `_resetArticManual()` — vide `window._articManualPoste` et redessine.
- Impact sur l'existant : `ARTIC_LAYOUTS` change de valeurs (tous les postes se déplacent visuellement) ; le rendu de chaque poste perd son enfant `.artic-poste-eff` (texte) au profit d'une classe d'état sur `.artic-poste` lui-même ; `.artic-global-eff` disparaît, sa valeur migre dans une carte au même gabarit que `.artic-blocks`. Aucun changement dans `computeArticulationStats`, `_articBlockEff`, `ARTIC_BLOCKS`, `_articPrimaryEntry`, `_articCourtSvg` — uniquement leur consommation dans le rendu.

## Critères d'acceptation

- [ ] `ARTIC_LAYOUTS` est recalculé via `_articArcY`/`ARTIC_6M_ARC` (docs/arch/articulation-lisibilite.md §1.1) pour le dispositif 0-6 (6 postes) et pour P1/P2/P5/P6 du dispositif 1-5 ; P3/P4 du 1-5 gardent des coordonnées fixes dédiées (`[50, 46]` et `[50, 66]`).
- [ ] Visuellement, les 6 ronds du dispositif 0-6 semblent posés sur la courbe du 6m dessinée par `_articCourtSvg()` — pas alignés en ligne droite.
- [ ] Chaque rond-poste n'affiche plus que le nom du joueur (plus de pourcentage, plus de texte d'efficacité) — vérifié pour les 3 branches de rendu existantes (override manuel avec donnée, override manuel sans donnée, mode auto avec donnée).
- [ ] L'efficacité d'un poste reste visible sous forme d'un liseré de couleur (`box-shadow`) sur le rond, avec les mêmes seuils que `_articEffClass()` (fort/moyen/faible/noref) et les mêmes couleurs que les cartes Bloc existantes.
- [ ] `.artic-poste.selected` (surlignage de sélection) utilise `outline`, pas `box-shadow` — cliquer sur un poste `fort` (ou tout autre statut coloré) doit laisser visibles SIMULTANÉMENT le liseré de couleur et le halo de sélection.
- [ ] Les toggles "Dispositif" (0-6/1-5) et "Affichage" (Le+utilisé/Top Def) sont regroupés dans un même conteneur visuellement délimité (`.artic-control-bar`), distinct du terrain.
- [ ] Dès qu'au moins un poste a un override manuel actif (`window._articManualPoste` non vide), une ligne "⚙ N poste(s) modifié(s) manuellement · Réinitialiser" apparaît dans le bandeau de contrôles ; le poste concerné affiche un petit indicateur `✎`.
- [ ] Cliquer sur "Réinitialiser" vide tous les overrides manuels et redessine (équivalent à cliquer individuellement "— Auto —" dans chaque sélecteur concerné).
- [ ] Changer de dispositif fait immédiatement disparaître la ligne "N postes modifiés" (déjà garanti par `_setArticDispositif`, qui vide `_articManualPoste` — à vérifier, pas à recoder).
- [ ] La référence d'efficacité globale adverse (`stats.global[dispositif]`) est rendue comme une carte supplémentaire dans le même conteneur que les 3 cartes Bloc (`ARTIC_BLOCKS`), avec le même gabarit visuel, plutôt qu'en ligne de texte séparée — y compris la gestion de l'échantillon faible (`n<5` → label `(n<3)`, comme les autres cartes).
- [ ] Le panneau de détail au clic sur un poste et son sélecteur manuel de joueur fonctionnent à l'identique de l'existant (aucune régression fonctionnelle, seulement un déplacement/allègement visuel autour).
- [ ] Non-régression : bascule Vue générale/Matrice 2×2 (mode Attaque), désactivation du bouton Articulation en mode Attaque avec reset automatique, fonctionnement identique en vue match et en vue saison.
- [ ] Testé visuellement à largeur iPad portrait (~768px) : aucun chevauchement entre un rond-poste (P1/P6 du 0-6, proches du but) et le rectangle du but (R2 du Risk Analyst).

## Hors scope

- Modification des calculs (`computeArticulationStats`, `_articBlockEff`, seuils de significativité, formule d'efficacité) — aucun chiffre affiché ne doit changer, seulement sa présentation.
- STORY-35 (classement automatique des charnières centrales P2-P5) — reste un chantier séparé.
- Ajout d'un nouveau filtre sur les données sous-jacentes (période, résultat, adversaire).
- Redessin du tracé du terrain lui-même (`_articCourtSvg()` — but, lignes 6m/9m) : seul le placement des postes dessus change.

## Dépend de

- Aucune (repose sur STORY-34 déjà livrée, v258-260 en production).

## Taille

M
