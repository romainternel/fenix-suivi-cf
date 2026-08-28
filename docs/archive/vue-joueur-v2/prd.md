# PRD — UX Vue Joueur Mobile v2
**Agent :** Product Manager  
**Date :** 2026-06-15  
**Input :** docs/brief.md + docs/research/ux-vue-joueur.md  
**App actuelle :** v95

---

## 1. OBJECTIF

Rendre la vue joueur réellement utilisable sur mobile (iOS et Android) en moins de 2 minutes par session, avec une hiérarchie d'information centrée sur le joueur et un diagnostic automatique de sa progression par période.

---

## 2. FEATURES — MUST HAVE (P1)

---

### F-01 — Graph Ma Fiche : simplifié + filtre période
**Besoin :** Le graph actuel a 5 courbes, illisible sur 375px. Le joueur ne peut pas filtrer par période depuis Ma Fiche.

**Ce qu'on construit :**
- Sur mobile (< 600px) : afficher uniquement TOTAL (ligne pleine bleue) + ligne zéro (référence). Les courbes ATT/DEF/Médiane/Tendance masquées par défaut.
- Bouton "Détail" (toggle) pour les réafficher si le joueur veut.
- Sélecteur de période intégré au graph : liste déroulante "Toute la saison / [Bilan 1 label] / [Bilan 2 label]…"
- Si aucun bilan n'est défini → sélecteur absent, graph affiche toute la saison.

**Critères d'acceptation :**
- [ ] Sur iPhone SE (375px), le graph affiche 2 courbes max par défaut
- [ ] Le sélecteur de période liste exactement les bilans du fichier Excel
- [ ] Si 0 bilan défini → sélecteur invisible (pas affiché vide)
- [ ] Changer de période recharge le graph sans rechargement page

---

### F-02 — Diagnostic évolution ↑↓ entre bilans
**Besoin :** Le joueur veut savoir s'il progresse ou régresse d'une période à l'autre.

**Ce qu'on construit :**
- Quand un bilan est sélectionné dans F-01, calculer la note moyenne (TOTAL) sur ce bilan ET sur le bilan précédent.
- Afficher sous le titre du graph : `↑ +2.3 pts vs période précédente` (vert) ou `↓ -1.1 pts` (rouge) ou `= Stable` (gris).
- Si pas de bilan précédent (premier bilan) → ne rien afficher.
- Si "Toute la saison" → ne rien afficher.

**Critères d'acceptation :**
- [ ] Indicateur affiché uniquement quand bilan sélectionné ET bilan précédent existe
- [ ] Calcul : moyenne des TOTAL sur les matchs du bilan sélectionné vs bilan précédent
- [ ] Couleur : vert si positif, rouge si négatif, gris si delta < 0.5 (stable)
- [ ] Pas de valeur fabriquée si données insuffisantes (< 2 matchs sur un bilan)

---

### F-03 — Info-bulle note joueur de champ
**Besoin :** Le 'i' tooltip existe pour les GB mais pas pour les joueurs de champ → incohérence.

**Ce qu'on construit :**
- Ajouter le même badge 'i' à côté de la NOTE dans les KPIs de Ma Fiche (joueurs de champ)
- Tooltip au tap : "Score calculé sur tes actions : Actions ATT positives - négatives + Actions DEF positives - négatives"

**Critères d'acceptation :**
- [ ] Badge 'i' visible sur la stat NOTE pour tout joueur non-GB
- [ ] Tap sur 'i' → tooltip visible sur mobile (pas hover)
- [ ] Même style visuel que le 'i' GB existant

---

### F-04 — Stats perso avant stats équipe (Stats Match)
**Besoin :** Ordre actuel = stats équipe → stats perso. Doit être inversé (joueur = héros).

**Ce qu'on construit :**
- Réorganiser l'ordre d'affichage dans pm-match-page : stats personnelles + zones de tir personnelles EN PREMIER, puis stats équipe (les cartes FENIX vs ADVERSAIRE) en dessous.

**Critères d'acceptation :**
- [ ] En ouvrant Stats Match, la première chose visible est la table personnelle du joueur (pas les stats équipe)
- [ ] Les cartes équipe sont toujours présentes mais en bas de page
- [ ] Aucune donnée supprimée

---

### F-05 — Barre filtres Stats Match sticky
**Besoin :** Quand le joueur scrolle dans Stats Match, les filtres PÉRIODE et MATCH disparaissent. Il ne sait plus où il est.

**Ce qu'on construit :**
- Rendre la barre de titre/filtres de pm-match-page sticky sous la pm-bar (top: 56px).
- Elle reste visible pendant tout le scroll.

**Critères d'acceptation :**
- [ ] La barre "STATS DU MATCH + filtres" reste visible à tout moment pendant le scroll
- [ ] Elle se positionne directement sous la pm-bar (pas de chevauchement)
- [ ] Le contenu scrolle en dessous (pas de masquage de contenu)

---

### F-06 — Canvas Zones responsive (mobile)
**Besoin :** 3 canvas côte à côte sur 375px = ~120px chacun, trop petits pour distinguer les tirs.

**Ce qu'on construit :**
- Sur mobile (< 600px) : canvas "face" passe en pleine largeur en premier. "alg" et "ald" en dessous côte à côte (50% chacun).
- Sur desktop (≥ 600px) : layout actuel conservé (3 colonnes).

**Critères d'acceptation :**
- [ ] Sur 375px : canvas face ≥ 300px de large
- [ ] Sur 375px : canvas alg et ald ≥ 150px chacun
- [ ] Sur desktop ≥ 600px : layout 3 colonnes inchangé

---

### F-07 — Zones filtrables par résultat
**Besoin :** Le joueur veut voir "où je rate" séparément de "où je marque".

**Ce qu'on construit :**
- Dans l'onglet 🎯 Zones, ajouter 3 boutons toggle : **Tout** / **Buts** (ou Arrêts pour GB) / **Ratés** (ou Buts encaissés pour GB)
- Filtre appliqué aux impactRows avant dessin des canvas
- Recalcul du stat header (nb tirs, %)

**Critères d'acceptation :**
- [ ] Boutons Tout/Buts/Ratés visibles sous le titre
- [ ] Tap sur un bouton → canvas redessiné instantanément avec filtre
- [ ] Stats header (nb tirs, %) recalculées selon le filtre
- [ ] Labels adaptés pour GB (Tout / Arrêts / Buts encaissés)

---

### F-08 — Sélecteur période masqué si aucun bilan
**Besoin :** Début de saison → aucun bilan défini → le sélecteur de période ne doit pas apparaître vide.

**Ce qu'on construit :**
- Dans Ma Fiche (graph) et dans Stats Match (sélecteur PÉRIODE existant) : n'afficher le sélecteur que si `BILANS.length > 0`.

**Critères d'acceptation :**
- [ ] Si 0 bilan dans le fichier → aucun sélecteur de période affiché
- [ ] Si ≥ 1 bilan → sélecteur affiché avec les options disponibles
- [ ] S'applique à la vue joueur ET à la vue staff pour cohérence

---

## 3. FEATURES — SHOULD HAVE (P2)

---

### F-09 — Stat vedette "Ta signature"
**Besoin :** Identifier l'action dans laquelle ce joueur domine statistiquement toute l'équipe.

**Ce qu'on construit :**
- Calculer pour chaque joueur son action ATT ou DEF la plus fréquente (positive).
- Comparer à la moyenne de toute l'équipe pour cette action.
- Si le joueur est ≥ 1.5x la moyenne → afficher un badge "💥 [Action]" dans Ma Fiche.
- Pour GB : si son % d'arrêts dans une zone est ≥ 1.5x la moyenne des autres GB → badge zone.
- Si aucune action ne ressort → rien affiché (pas de fabrication).

**Critères d'acceptation :**
- [ ] Badge affiché uniquement si seuil 1.5x atteint
- [ ] Si aucune action ne ressort → zone badge absente (pas de placeholder)
- [ ] Label clair : "💥 Duel gagné att — tu domine l'équipe sur cette action"

---

### F-10 — Session reprend sur dernier onglet
**Besoin :** Au reconnect, le joueur retrouve l'onglet où il était.

**Ce qu'on construit :**
- `sessionStorage.setItem('pm_active_tab', tab)` dans `pmTab()`
- Dans `setupPlayerUI()` : lire la valeur et appeler `pmTab(savedTab || 'fiche')`

**Critères d'acceptation :**
- [ ] Reconnexion dans la même session → même onglet
- [ ] Nouvelle session (nouvel onglet navigateur) → onglet 'fiche' par défaut

---

### F-11 — Canvas terrain vu du dessus réduit
**Besoin :** Le canvas terrain occupe trop de place verticale dans Stats Match.

**Ce qu'on construit :**
- Réduire la hauteur max du canvas terrain (classe `.terrain-wrapper-small`) à 140px max sur mobile.
- Sur desktop, conserver la taille actuelle.

**Critères d'acceptation :**
- [ ] Canvas terrain ≤ 140px de hauteur sur mobile
- [ ] Les dots de tir restent lisibles (ratio proportionnel maintenu)

---

## 4. HORS SCOPE

| Feature | Raison |
|---------|--------|
| Partage réseaux sociaux | Données internes uniquement (décision staff) |
| Export PDF vue joueur | Complexité + hors usage joueur |
| Comparaison joueur vs joueur | Données privées |
| Redesign densité Ma Fiche | Pas jugé problématique par le staff |
| Notifications push | Hors budget technique actuel |

---

## 5. DÉPENDANCES

- F-01 et F-02 dépendent de la structure BILANS existante (`processBilans()`, `BILANS[]`)
- F-09 nécessite que tous les joueurs aient des données (au moins 3 matchs) pour être fiable
- F-08 impacte aussi la vue staff → vérifier qu'on ne casse pas le comportement existant

---

## 6. RISQUES

| Risque | Impact | Mitigation |
|--------|--------|------------|
| F-02 : bilan précédent pas toujours défini | Calcul impossible | Ne rien afficher si données insuffisantes |
| F-09 : seuil 1.5x arbitraire | Badges trompeurs | Configurable par Romain si besoin |
| F-05 sticky header : masquer contenu | Scroll cassé | z-index + padding-top sur le contenu |
| Android canvas : image base64 | Image absente | F-06 résout en CSS, pas dépendant de l'image |

---

## 7. ORDRE DE LIVRAISON RECOMMANDÉ

```
Sprint 1 (fondations) : F-08, F-10, F-05, F-11
Sprint 2 (lisibilité)  : F-06, F-07, F-03, F-04
Sprint 3 (intelligence): F-01, F-02, F-09
```

Logique : corriger d'abord les problèmes de layout (rapides, sans risque), ensuite les features de données (plus complexes, besoin de tests).
