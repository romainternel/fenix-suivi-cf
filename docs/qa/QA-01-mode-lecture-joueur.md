# QA-01 — Mode Lecture Joueur (Session mai 2026)

**Agent :** QA  
**Date :** 22/05/2026  
**Scope :** Tout le mode lecture joueur (player-mode.js) tel que livré en fin de session

---

## Critères validés / échoués

### Ma Fiche
| Critère | Statut |
|---|---|
| Détection GB via `detectIsGB()` avec fallback données | ✅ |
| KPIs GB corrects (arrêts/tirs, % arrêts, buts concédés, PD, note) | ✅ |
| KPIs joueur de champ corrects (but/tir, eff, PD, PO, PB, note) | ✅ |
| Card "STATS PAR ZONE" pour GB (tableau difficulté + %) | ✅ |
| Card "ACTIONS" pour joueur de champ (4 quadrants ATT/DEF) | ✅ |
| Graphique GB = identique page Graphiques (arrêts + score + % arrêts) | ✅ |
| Graphique joueur de champ = notes ATT/DEF + total + médiane + tendance | ✅ |
| Canvas impact **supprimés** de Ma Fiche (déplacés vers Stats Match) | ✅ |
| Bouton ⛶ plein écran sur chaque carte | ✅ |

### Stats Match
| Critère | Statut |
|---|---|
| Table personnelle GB (arrêts champ/pen + % + PD + PB) | ✅ |
| Table personnelle joueur (but/tir champ/pen + % total + PB/PO/PD) | ✅ |
| Canvas impact 3 vues (ALG/face/ALD) filtré par rencontre | ✅ |
| Sélecteur de zones interactif avec redraw canvas | ✅ |
| Stats impact mises à jour selon zone sélectionnée | ✅ |
| Zones grisées = non-cliquables (`pointer-events:none`) | ✅ |
| "Stats par zone" GB filtrée par match | ✅ |
| "Actions ATT/DEF" joueur filtrée par match | ✅ |
| Bouton ⛶ plein écran sur chaque carte | ✅ |

### Modal plein écran
| Critère | Statut |
|---|---|
| Ouverture modal centré avec fond sombre | ✅ |
| Carte physiquement déplacée (pas clonée) → canvas fonctionnels | ✅ |
| Fermeture par ✕, ESC, clic fond | ✅ |
| Carte replacée exactement à sa position d'origine | ✅ |
| Graph redraw à 65vh en fullscreen, retour à 280px en fermant | ✅ |
| Canvas impact redraw après redimensionnement (150ms) | ✅ |

---

## Bugs trouvés

### 🔴 BLOQUANT — Corruption état si changement de filtre en plein écran
**Contexte :** Un joueur ouvre une carte de Stats Match en plein écran, puis **change le filtre rencontre** sans fermer le modal.  
**Ce qui se passe :** `renderPlayerMatchStats()` recrée le HTML de `#pm-match-extras` (innerHTML). La carte qui était dans `pm-match-extras` est maintenant dans le modal, donc le innerHTML ne la touche pas — MAIS `_fsOrigParent` pointe toujours vers `pm-match-extras`. À la fermeture, la carte est réinsérée dans un div qui a déjà un nouveau contenu, créant des doublons ou un désordre visuel.  
**Fix :** Fermer le modal automatiquement avant tout `renderPlayerMatchExtras()`.

### 🟡 MAJEUR — Dead code : `onPmfZoneClick` / `_drawPmfImpact` orphelins
**Contexte :** La grille de zones et les canvas impact ont été retirés de Ma Fiche, mais `onPmfZoneClick`, `_drawPmfImpact`, `_pmfZoneFilter` et leurs références dans le DOM restent dans le code.  
**Conséquence :** Pas de bug visible pour l'utilisateur, mais le code cherche `#pmf-impact-stats`, `#pmf-canvas-alg` qui n'existent plus → appels silencieux ratés. Risque de confusion maintenance.  
**Fix :** Nettoyer ces fonctions orphelines.

### 🟡 MAJEUR — Touch targets < 44px sur cellules de zone
**Contexte :** Les `.zr-cell` ont `padding: 0.38rem 0.2rem` + `font-size: 0.71rem` → hauteur ~22px.  
**Conséquence :** Sur iPhone (doigt seul, sans stylet), les zones sont difficiles à taper avec précision. Sur iPad avec doigt c'est borderline.  
**Fix :** Augmenter le padding minimum à `0.6rem 0.3rem` + `min-height: 36px`.

### 🟡 MAJEUR — iOS Safari : modal fullscreen instable avec `vh` + `position:fixed`
**Contexte :** `#pmf-fs-inner` a `min-height:75vh; max-height:92vh` + `.pmf-graph-wrap` à `height:65vh`.  
**Conséquence :** Sur iOS Safari, la barre d'adresse réduit dynamiquement le viewport. Le contenu du bas peut être tronqué. Le graphique à 65vh peut dépasser le modal.  
**Fix :** Ajouter `-webkit-overflow-scrolling: touch` au modal ; remplacer `65vh` graph par `min(65vh, 500px)` ; `overscroll-behavior: contain` sur le modal.

### 🟢 MINEUR — Bouton ⛶ légèrement sous 44px
**Contexte :** `.pmf-fs-btn` a `padding: 4px` → touch target ~30px.  
**Fix :** Augmenter à `padding: 8px`.

### 🟢 MINEUR — KPI grid joueur de champ : 6 colonnes sur petit écran
**Contexte :** `.pmf-kpi-grid` affiche 6 cases sur une ligne. Sur iPhone (<390px), les valeurs sont trop compressées.  
**Fix :** Media query `max-width:500px` → `grid-template-columns: repeat(3,1fr)`.

---

## Régressions détectées

| Régression | Statut |
|---|---|
| Connexion mot de passe (staff + joueur) | ✅ Non cassée |
| Page Notes : GB exclus du tableau joueurs | ✅ Voulu, ok |
| Page Notes : tableau GB avec TJ total/moyen | ✅ Non cassé |
| Page Graphiques : `__zero__` masqué infobulle | ✅ OK |
| `_buildGbZoneTableHTML` sans matchFilter (appel depuis Ma Fiche) | ✅ `undefined` → pas de filtre, correct |
| `_buildDetailedActionsHTML` sans matchFilter (idem) | ✅ Correct |
| PDF 4 pages (fiche/actions/matchs/graph) | ✅ Non cassé |

---

## Compatibilité

| Plateforme | Verdict |
|---|---|
| **PC Chrome/Edge** | ✅ OK — seul le bug plein-écran+filtre à corriger |
| **iPad Safari** | ⚠️ PASSABLE — touch targets borderline, 100vh trap dans modal |
| **iPhone Safari** | ❌ NON TESTÉ — KPI trop compressés, touch targets trop petits, vh instable |
| **Offline (localStorage)** | ✅ Non impacté |

---

## Verdict

> **PASSED WITH NOTES** (PC/iPad)  
> **FAILED** (iPhone — non conçu pour cette taille)

### Priorités de correction
1. 🔴 Fermer le modal avant `renderPlayerMatchExtras` (corruption état)
2. 🟡 Touch targets `.zr-cell` + `.pmf-fs-btn`
3. 🟡 iOS Safari : `-webkit-overflow-scrolling` + `overscroll-behavior`
4. 🟢 Nettoyer dead code `onPmfZoneClick` / `_drawPmfImpact`
5. 🟢 KPI grid responsive iPhone
