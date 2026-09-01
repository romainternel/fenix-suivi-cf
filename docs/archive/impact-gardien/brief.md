# Brief — Page Impact pour un gardien

**Agent :** Analyst
**Date :** 2026-09-01

---

## 1. Contexte

Le jour même, un audit complet a détecté et corrigé 3 régressions liées aux gardiens (onglet Gardien de la page Analyse, table GB de la page Notes, graphique de progression) — toutes causées par une comparaison stricte entre le format "prénom seul" de la colonne Excel `Gardien` et le format court "Prénom.Initiale" utilisé ailleurs dans l'app. En vérifiant l'app après ce correctif, Romain a trouvé un 4e symptôme, sur la page Joueurs → onglet "🎯 Impact" : pour un gardien sélectionné, toutes les stats affichent 0 et les 3 zones de terrain restent vides, alors que la fiche du même gardien (onglet "Fiche") fonctionne très bien.

## 2. Investigation technique (avant tout cadrage produit)

Contrairement aux 3 régressions du matin, celle-ci n'est **pas** qu'un problème de format de nom — c'est un problème de routage et de logique métier plus profond :

- Le bouton "🎯 Impact" (`openImpactForSelected()`) route **différemment** selon que le joueur sélectionné est un gardien ou non :
  - Joueur de champ → page `page-impact` (`updateImpactPage()`), la page moderne, maintenue.
  - Gardien → page `page-gardiens` (`updateGardiensPage()`), une **ancienne page orpheline** — la checklist de régression la décrivait déjà comme "non reliée à la navigation, aucun bouton ne l'appelle", ce qui est faux dans ce cas précis : elle est bien atteinte, mais uniquement via ce chemin gardien, jamais visitée/testée depuis.
- `updateGardiensPage()` a le même bug de comparaison stricte que les 3 déjà corrigés ce matin (`row[COLS.gardien] !== gardienFilter`) — un fix ponctuel la remettrait en état.
- **Mais** `updateGardiensPage()` a aussi des lacunes structurelles par rapport à la vraie page Impact : pas de grille "Efficacité par zone", pas de mode comparaison, pas de filtre bilan/résultat, esthétique non alignée avec le reste de l'app (page jamais mise à jour depuis les passes visuelles STORY-13→19).
- La page moderne `updateImpactPage()`, elle, **ne gère pas du tout le cas gardien** — aucune branche conditionnelle, elle filtre systématiquement sur `row[COLS.club] === 'FENIX'` et `row[COLS.joueur]`, deux critères qui ne correspondent jamais à un gardien.
- Un troisième endroit du code, `printFicheJoueur()` (export PDF/PPT, `js/page-joueurs.js`), gère **déjà correctement** le cas gardien pour ses propres besoins (zones de tir dans le PDF) : filtre sur `finalite`/`gardien` avec `matchPlayerName()`, jamais sur `joueur`. C'est la meilleure référence disponible dans le code pour la bonne logique.

## 3. Problème

Un gardien ne peut aujourd'hui pas consulter ses zones d'arrêt/d'encaissement depuis l'écran qu'il utiliserait naturellement (le même bouton "Impact" que ses coéquipiers) — soit parce que l'écran affiche des zéros partout (bug de nom), soit parce qu'il atterrit sur une page visuellement datée et fonctionnellement en retard par rapport au reste de l'app. Sur ~21 joueurs de l'effectif, 3 sont des gardiens : ce n'est pas un cas marginal.

## 4. Utilisateurs

- **Romain (staff)**, sur ordinateur, en préparation de séance ou d'analyse post-match — consulte l'Impact d'un gardien au même titre que celui d'un joueur de champ, dans le même flux de navigation.
- **Un gardien connecté lui-même** (Mode Lecture Joueur, mobile), onglet "Impact" — à vérifier si le même bug/la même divergence existe côté mobile (le code de `player-mode.js` examiné ce matin utilisait déjà `matchPlayerName()` correctement pour cette page, donc probablement déjà fonctionnel côté mobile — à confirmer par l'Architect, pas supposé).

## 5. Vision

Un gardien sélectionné dans la page Joueurs affiche ses zones d'arrêt/d'encaissement sur le **même écran Impact**, avec le **même niveau de finition** (filtres, efficacité par zone, mode comparaison) qu'un joueur de champ — plus de page séparée à part, plus de logique dupliquée à maintenir en double. Le nom du joueur/gardien consulté est visible à l'écran.

## 6. Scope

**Dans le scope** :
- Faire fonctionner l'onglet Impact pour un gardien, avec la bonne source de données (finalité + gardien + impact, pas joueur), en s'appuyant sur `page-impact`/`updateImpactPage()` plutôt qu'en rafistolant `page-gardiens`.
- Afficher le nom du joueur/gardien actuellement sélectionné sur la page Impact (actuellement absent pour tout le monde, pas seulement les gardiens).
- Décommissionner proprement `page-gardiens` si elle devient inutilisée (sous réserve de validation Architect — voir Risques).
- Vérifier et, si besoin, aligner le Mode Lecture Joueur mobile (le gardien consultant sa propre page Impact).

**Hors scope** :
- Toute autre page/fonctionnalité liée aux gardiens (déjà corrigées ce matin : onglet Gardien de l'Analyse, table GB, graphique de progression).
- Refonte visuelle plus large de la page Impact au-delà de ce qui est nécessaire pour unifier le cas gardien.
- Export PDF/PPT (`printFicheJoueur()`) — déjà fonctionnel pour les gardiens, non concerné.

## 7. Critères de succès

- Sélectionner un gardien puis cliquer "Impact" affiche ses vraies stats (tirs subis, arrêts, %, buts encaissés) et ses zones d'arrêt/encaissement sur les 3 vues terrain, cohérentes avec sa fiche.
- Le nom du joueur consulté est visible sur la page Impact, pour un gardien comme pour un joueur de champ.
- Aucune régression sur l'Impact d'un joueur de champ (comportement actuel déjà correct, à préserver à l'identique).
- Le mode joueur mobile (un gardien consultant sa propre page Impact) fonctionne, vérifié explicitement — pas supposé fonctionner parce que le code semblait déjà correct.

## 8. Questions en suspens (pour l'Architect)

- `page-gardiens` peut-elle être décommissionnée entièrement, ou est-ce que quelque chose d'autre y pointe encore (à vérifier par une recherche exhaustive avant de la supprimer) ?
- La grille "Efficacité par zone" de la page Impact repose sur des seuils par poste (`getPlayerPoste()`, `ZONE_SEUILS`) pensés pour des joueurs de champ — faut-il des seuils spécifiques pour un gardien, ou peut-on simplement afficher la grille sans seuils de couleur pour ce cas (à trancher, PM/Designer) ?
