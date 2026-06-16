# Dev Brief — Vue Joueur Mobile v2 · Sprint 1-2-3

**Agent :** Developer  
**Date :** 2026-06-15  
**Input :** docs/arch/vue-joueur-v2.md + docs/stories/BACKLOG.md + STORY-01 à STORY-11  
**Version de départ :** v95  
**Version cible :** v104+

---

## Contexte

Amélioration de la vue joueur mobile (player-mode.js) en 3 sprints.  
App vanilla JS, SheetJS, Chart.js 4.4.0, PptxGenJS, html2canvas.  
Fichiers principaux touchés : `js/player-mode.js`, `css/style.css`, `FENIX-HANDBALL-CF-SUIVI.html`.  
Règle absolue : bumper `?v=` sur TOUS les `<link>` et `<script>` de l'HTML après chaque modification.

---

## Règle de versioning

Chaque livraison incrémente le numéro de version dans les URLs :
```html
<link rel="stylesheet" href="css/style.css?v=96">
<script src="js/player-mode.js?v=96">
```
Tous les tags concernés doivent être mis à jour en même temps.

---

## Fichiers touchés

| Fichier | Type de modification |
|---------|---------------------|
| `js/player-mode.js` | Nouvelles fonctions, nouvelles variables globales, réordonnancement appels |
| `css/style.css` | Nouvelles classes, remplacement media queries existantes |
| `FENIX-HANDBALL-CF-SUIVI.html` | Réordonnancement divs pm-match-page, nouvelle classe sticky, fonctions inline |

---

## Ordre d'implémentation

```
Bloc 1 — CSS/HTML purs (sans logique) :
  S-01 (sessionStorage), S-02 (terrain), S-03 (sticky), S-04 (canvas), S-08 (bilan)

Bloc 2 — JS simple, réutilise l'existant :
  S-05 (tooltip), S-06 (réordonnancement), S-07 (filtre résultat)

Bloc 3 — JS avec nouveau calcul :
  S-11 (signature)
```

---

## Stories

---

### S-01 — Session reprend sur le dernier onglet actif

**Fichiers :** `js/player-mode.js`

**Implémentation :**
```javascript
// Dans pmTab(tab) — ajouter :
sessionStorage.setItem('pm_active_tab', tab);

// Dans setupPlayerUI() — remplacer l'appel pmTab('fiche') par :
if (typeof DATA !== 'undefined' && DATA.length > 0)
    pmTab(sessionStorage.getItem('pm_active_tab') || 'fiche');
```

**Critères d'acceptation :**
- [ ] Naviguer vers "Stats Match", fermer et rouvrir dans le même onglet → app s'ouvre sur Stats Match
- [ ] Naviguer vers "Zones", fermer et rouvrir → app s'ouvre sur Zones
- [ ] Nouvel onglet navigateur → app s'ouvre sur Ma Fiche (défaut)
- [ ] Fonctionne pour les 3 onglets : fiche / match / zones

---

### S-02 — Canvas terrain vu du dessus réduit sur mobile

**Fichiers :** `css/style.css`

**Implémentation :**
```css
@media (max-width: 600px) {
    .terrain-wrapper-small { max-height: 130px; }
}
```
Le canvas interne lit `container.clientHeight` → suit automatiquement.

**Critères d'acceptation :**
- [ ] Sur 375px simulé, canvas terrain ≤ 130px de hauteur
- [ ] Points de tir visibles et proportionnels (pas d'étirement)
- [ ] Desktop ≥ 601px : taille actuelle conservée
- [ ] Aucune régression sur la page Joueurs staff

---

### S-03 — Barre de filtres Stats Match sticky

**Fichiers :** `css/style.css`, `FENIX-HANDBALL-CF-SUIVI.html`

**Implémentation HTML :** Ajouter classe `pm-stats-header` sur le div header dans `pm-match-page`.

**Implémentation CSS :**
```css
.pm-stats-header {
    position: sticky;
    top: 56px;
    background: white;
    z-index: 50;
    padding: 10px 0 14px;
    margin: -20px 0 16px;
    box-shadow: 0 2px 6px rgba(0,0,0,.06);
}
```
Note : `margin: -20px` compense le `padding-top: 76px` du parent (`76 - 56 = 20`).

**Critères d'acceptation :**
- [ ] En scrollant, la barre filtres reste collée sous la pm-bar
- [ ] Le contenu scrolle EN DESSOUS de la barre (pas de chevauchement)
- [ ] Filtres PÉRIODE et MATCH restent cliquables en position sticky
- [ ] Aucune régression onglets Ma Fiche et Zones

---

### S-04 — Canvas zones de tir lisibles sur mobile (face en premier)

**Fichiers :** `css/style.css`

**Implémentation :** Remplacer les media queries existantes sur `.pmf-canvases` :
```css
@media (max-width: 600px) {
    .pmf-canvases { grid-template-columns: repeat(2, 1fr); }
    .pmf-canvas-wrap:nth-child(1) { order: 2; }                        /* alg → 2e ligne gauche */
    .pmf-canvas-wrap:nth-child(2) { order: 1; grid-column: span 2; }  /* face → 1er, pleine largeur */
    .pmf-canvas-wrap:nth-child(3) { order: 3; }                        /* ald → 2e ligne droite */
}
```
Ordre DOM : alg (1er), face (2e), ald (3e) — ne pas modifier le JS, CSS order suffit.

**Critères d'acceptation :**
- [ ] Sur 375px : canvas "face" (CENTRAL) en premier, pleine largeur (≥ 300px)
- [ ] Sur 375px : "alg" (EXT GAUCHE) et "ald" (EXT DROIT) côte à côte en dessous
- [ ] Desktop ≥ 601px : 3 colonnes égales (layout actuel inchangé)
- [ ] Fonctionne dans l'onglet Zones ET Stats Match
- [ ] Les labels EXT GAUCHE / CENTRAL / EXT DROIT suivent leurs canvas
- [ ] Aucune régression page Joueurs staff

---

### S-05 — Info-bulle "comment est calculée ma note" (joueur de champ)

**Fichiers :** `js/player-mode.js`

**Implémentation :** Dans `renderPlayerFiche()`, dans le KPI NOTE joueur de champ, ajouter badge ℹ :
```javascript
`<div class="pmf-kpi-lbl">NOTE<span title="Score calculé sur tes actions : (Actions ATT+) - (ATT-) + (Actions DEF+) - (DEF-)" style="cursor:help;background:#CBD5E1;color:#1E293B;border-radius:50%;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;margin-left:3px">i</span></div>`
```
Copie exacte du pattern déjà utilisé sur le badge NOTE GB.

**Critères d'acceptation :**
- [ ] Badge "i" visible à côté de NOTE dans les KPIs pour les joueurs de champ
- [ ] Tap/clic → tooltip natif (title attribute) visible
- [ ] Badge absent pour les gardiens (ils ont déjà leur propre "i")
- [ ] Même style visuel que le "i" GB
- [ ] Aucune régression sur l'affichage des KPIs

---

### S-06 — Stats personnelles affichées avant les stats équipe

**Fichiers :** `FENIX-HANDBALL-CF-SUIVI.html`, `js/player-mode.js`

**Ordre HTML actuel (pm-match-page) :**
```
pm-match-banner → pm-ai-card → pm-match-cards → pm-match-player-table → pm-match-extras
```

**Ordre cible :**
```
pm-match-banner → pm-match-player-table → pm-match-extras → pm-ai-card → pm-match-cards
```

**Dans `renderPlayerMatchStats()` :** Réordonner les appels de fonctions dans le même ordre que les divs.  
Note : `onPmmZoneClick()` dépend de `_pmmImpactRows` défini dans `renderPlayerMatchExtras()` — maintenir l'ordre relatif de ces deux-là.

**Critères d'acceptation :**
- [ ] Première section visible sans scroll = stats personnelles du joueur
- [ ] Zones de tir personnelles avant les cartes FENIX / ADVERSAIRE
- [ ] Cartes stats équipe toujours présentes, en bas
- [ ] `onPmmZoneClick()` fonctionne toujours

---

### S-07 — Filtrer les zones de tir par résultat (Tout / Buts / Ratés)

**Fichiers :** `js/player-mode.js`, `css/style.css`

**Nouvelle variable globale :**
```javascript
let _pmzResultFilter = '';   // '' | 'pos' | 'neg'
```

**Nouvelle fonction :**
```javascript
function onPmzResultFilter(val) {
    _pmzResultFilter = val;
    renderPlayerZones();
}
```

**Dans `renderPlayerZones()` :** Appliquer le filtre avant le dessin des canvas.  
Labels adaptés selon `isGB` : "Arrêts" / "Buts encaissés" pour les gardiens.  
La légende est cliquable (remplace les boutons `.pmz-btn` mentionnés dans la story — implémentation finale via `.pmz-filter-item` intégrée à la légende).

**Zone grid** : utilise `_pmmImpactRows` (toutes les actions — non filtré).  
**Canvas + stats header** : utilise `displayRows` (filtré selon `_pmzResultFilter`).

**CSS :**
```css
.pmz-filter-item {
    cursor: pointer; padding: 2px 9px; border-radius: 12px;
    display: inline-block; transition: background 0.15s, color 0.15s;
    user-select: none; font-size: 0.75rem;
}
.pmz-filter-active { background: #1E293B; color: white !important; }
.pmz-filter-active span { color: white !important; }
```

**Extension :** Appliquer le même filtre cliquable sur la page Impact staff (`onImpactResultFilter(val)`).

**Critères d'acceptation :**
- [ ] Légende "Tout / ● But / ✕ Raté" cliquable dans l'onglet Zones
- [ ] Tap "Buts" → seuls les ● verts dessinés sur les canvas, stats recalculées
- [ ] Tap "Ratés" → seuls les ✕ rouges dessinés sur les canvas, stats recalculées
- [ ] Tap sur l'item actif → revient à "Tout"
- [ ] GB : labels "Arrêts" et "Buts encaissés"
- [ ] Zone grid (nb tirs par zone) reste non filtrée
- [ ] Même filtre disponible sur la page Impact staff (Tout / But marqué / Tir arrêté/raté)
- [ ] Aucune régression onglet Stats Match

---

### S-08 — Masquer le sélecteur de période si aucun bilan

**Fichiers :** `js/player-mode.js`

**Implémentation :** Dans `buildPmMatchNav()`, conditionner l'affichage de `pm-bilan-wrap` :
```javascript
if (typeof BILANS !== 'undefined' && BILANS.length > 0) {
    // afficher pm-bilan-wrap
} else {
    // masquer pm-bilan-wrap
}
```

**Critères d'acceptation :**
- [ ] `BILANS.length === 0` → sélecteur PÉRIODE absent de Stats Match
- [ ] `BILANS.length >= 1` → sélecteur PÉRIODE visible
- [ ] Aucune erreur JS si BILANS est vide
- [ ] Sélecteur MATCH toujours visible
- [ ] Aucune régression vue staff

---

### S-09 — Graph Ma Fiche : filtre période + 2 courbes mobile

**Statut : ABANDONNÉ**  
**Raison :** Décision utilisateur en cours de sprint — "Pas utile en fait le séparateur sur le graph ni le filtre période."  
Architecture documentée dans docs/arch/vue-joueur-v2.md (F-01) pour référence future si besoin.

---

### S-10 — Diagnostic évolution ↑↓ entre bilans

**Statut : ABANDONNÉ**  
**Raison :** Dépendait de S-09 — abandonné avec S-09 sur décision utilisateur.  
Architecture documentée dans docs/arch/vue-joueur-v2.md (F-02) pour référence future.

---

### S-11 — Badge "Ta signature" : l'action où le joueur domine l'équipe

**Fichiers :** `js/player-mode.js`, `css/style.css`

**Nouvelle fonction `computePlayerSignature(nom, isGB)` :**

*Joueur de champ :*
1. Collecter les actions positives (NOTE_GROUPS.attPlus + defPlus) du joueur sur la saison
2. Calculer la moyenne équipe par action (total actions / nb joueurs FENIX avec données)
3. Garder uniquement : occurrences ≥ 3 ET ratio ≥ 1.5x la moyenne
4. Retourner l'action avec le ratio max, ou `null`
5. Si < 5 joueurs FENIX avec données → retourner `null`

*Gardien :*
1. Calculer le % d'arrêts par zone pour CE gardien (min 5 tirs par zone)
2. Comparer à la moyenne des autres GB sur cette zone (min 3 tirs chacun)
3. Si ratio ≥ 1.5x → retourner la zone comme signature
4. Retourner la meilleure zone ou `null`

**HTML badge (injecté entre KPIs et graph dans `renderPlayerFiche()`) :**
```html
<div class="pmf-card pmf-signature">
    <div style="font-size:1.5rem;flex-shrink:0">💥</div>
    <div>
        <div style="font-weight:700;color:#1E293B;font-size:0.92rem">${sig.label}</div>
        <div style="font-size:0.78rem;color:#92400E;margin-top:2px">Tu domines l'équipe sur cette action cette saison</div>
    </div>
</div>
```
Si `null` → aucun bloc (pas de placeholder).

**CSS :**
```css
.pmf-signature {
    display: flex; align-items: center; gap: 14px;
    background: #FFFBEB; border-left: 4px solid #F59E0B;
}
```

**Critères d'acceptation :**
- [ ] Joueur avec ratio ≥ 1.5x et ≥ 3 occurrences → badge "💥 [action]" dans Ma Fiche
- [ ] Aucune action ne ressort → bloc absent (pas de placeholder)
- [ ] GB : signature possible sur une zone d'arrêts ("Zone 6m central G")
- [ ] Badge entre les KPIs et le graph
- [ ] Aucune erreur JS si équipe peu fournie
- [ ] < 5 joueurs FENIX avec données → badge absent
- [ ] Aucune régression sur le reste de Ma Fiche

---

## Extras hors stories — implémentés en cours de sprint

| Feature | Version | Description |
|---------|---------|-------------|
| Graph légende symboles | v102 | `pointStyle:'line'` sur datasets Tendance/Médiane → affiche un tiret dans la légende au lieu d'un cercle |
| Graph légende cliquable | v102 | Déjà natif Chart.js 4 — aucun code ajouté |
| ATT/DEF card order | v101 | Réordonnancement cartes : ATT+ / ATT− en ligne 1, DEF+ / DEF− en ligne 2 (était ATT+/DEF+ puis ATT−/DEF−) |
| Graph mobile fin | v104 | `borderWidth` et `pointRadius` réduits sur iPhone (`isPhone = Math.min(screen.width, screen.height) < 500`) |
| Graph paysage | v104 | CSS `@media (orientation:landscape) and (max-height:600px)` → hauteur réduite à 220px + `orientationchange` listener + `_pmfChart.resize()` |

---

## Contraintes transverses

- Ne pas utiliser `window.innerWidth` pour détecter un téléphone (change avec l'orientation) — utiliser `Math.min(window.screen.width, window.screen.height) < 500`
- Toujours détruire `_pmfChart` avant de recréer le graphique
- `_pmmImpactRows` = toutes les lignes d'impact (zone grid), `displayRows` = lignes filtrées (canvas + stats)
- `NOTE_GROUPS` dans utils.js = source de vérité pour les catégories d'actions
