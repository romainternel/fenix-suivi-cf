# Brief — Amélioration UX Vue Joueur
**Agent :** Analyst  
**Date :** 2026-06-15  
**Input :** Research UX vue joueur + réponses Romain Ternel  
**Version app :** v95

---

## 1. CONTEXTE

La vue joueur (player mode) existe depuis la v83. Elle permet à chaque joueur du CF FENIX Toulouse de se connecter avec son propre compte et de consulter ses stats personnelles. La revue du squad (4 personas : 17–24 ans, iPhone + Android) révèle que **l'expérience est fonctionnelle mais pas engageante** : trop dense, hiérarchie inversée (équipe avant joueur), graphique illisible sur mobile.

Par ailleurs, Romain signale un besoin plus profond que le simple affichage : **le joueur doit pouvoir comprendre sa trajectoire**, pas seulement ses chiffres bruts. Est-ce que je progresse ? Dans quelle période ai-je été le meilleur ? Qu'est-ce que je fais mieux que mes coéquipiers ?

---

## 2. PROBLÈME

Aujourd'hui un joueur qui ouvre l'app :
- Voit un graphique avec 5 courbes illisibles sur téléphone
- Doit scroller pour trouver ses propres stats (noyées après les stats équipe)
- Ne comprend pas comment sa note est calculée
- Ne peut pas savoir s'il progresse ou régressé sur une période récente
- Ne sait pas quelle est sa "signature" — l'action dans laquelle il excelle

---

## 3. UTILISATEURS

| Profil | Âge | Appareil | Contexte d'usage |
|--------|-----|----------|-----------------|
| Joueur de champ | 17–24 ans | iPhone ou Android | Vestiaire, bus, entre deux entraînements — max 2 min |
| Gardien | 17–24 ans | Android basique | Même contexte, cherche ses stats arrêts en premier |
| PC (rare) | staff preview | Desktop | Vérification avant entretien joueur |

**Appareil prioritaire : téléphone mobile (iOS et Android)**  
Résolution cible : 375px (iPhone SE) à 430px (iPhone 15 Pro Max), Android 360–412px  
Interaction : tactile uniquement, pas de survol

---

## 4. VISION

> Quand un joueur ouvre l'app après un match, il comprend en 10 secondes si sa saison va dans le bon sens — et il sait quelle est son arme principale.

---

## 5. SCOPE

### Dans le périmètre (cette version)

**A — Graph Ma Fiche simplifié + filtre période**
Le joueur voit son évolution avec un graph lisible (2 courbes max sur mobile). Il peut sélectionner une période (les bilans déjà définis dans le fichier Excel : J? → J?). Le graphique affiche automatiquement un indicateur visuel : progression positive ↑ ou négative ↓ sur la période sélectionnée vs la période précédente.

**B — Diagnostic évolution entre bilans**
Si le joueur sélectionne un bilan, l'app compare sa note moyenne sur ce bilan vs le bilan précédent et affiche : "↑ +2.3 pts vs période précédente" ou "↓ -1.1 pts". Concret, actionnable.

**C — Stat vedette ("Ta signature")**
Dans Ma Fiche, après la note et l'efficacité : identifier l'action ATT ou DEF dans laquelle ce joueur est statistiquement au-dessus de la moyenne de l'équipe (même poste). Si elle existe, l'afficher comme un badge ou une mise en avant. Si aucune action ne ressort, ne rien afficher (pas de fabrication).

**D — Info-bulle note joueur de champ**
Même système que le 'i' existant pour les gardiens : formule claire (ATT+ - ATT- + DEF+ - DEF-), en français simple.

**E — Hiérarchie Stats Match : perso en premier**
Dans l'onglet Stats Match, réorganiser : stats personnelles (table + zones de tir) apparaissent AVANT les stats équipe. L'équipe devient contexte, pas centre.

**F — Zones filtrables par résultat**
Dans l'onglet 🎯 Zones, ajouter des boutons toggle : Tout / Buts / Ratés (ou Arrêts / Buts encaissés pour GB). Filtre simple sur les rows avant dessin canvas.

**G — Canvas Zones responsive**
Sur mobile (< 600px) : les 3 canvas passent en layout colonne. Face en pleine largeur, Ext Gauche + Ext Droit côte à côte en dessous.

**H — Session reprend sur dernier onglet**
`sessionStorage` pour mémoriser l'onglet actif. Au reconnect, le joueur retrouve là où il était.

### Hors périmètre (cette version)
- Partage réseaux sociaux → décision staff = données internes uniquement, NO-GO confirmé
- Export PDF depuis la vue joueur
- Notifications push
- Comparaison entre joueurs (données privées)

---

## 6. CRITÈRES DE SUCCÈS

1. Le joueur trouve sa note en moins de 3 secondes à l'ouverture
2. Le graphique Ma Fiche est lisible sur iPhone SE (375px) sans zoom
3. En sélectionnant un bilan, le joueur voit immédiatement si il a progressé ou régressé
4. La "stat vedette" n'est affichée que si elle est statistiquement fondée (pas de fabrication)
5. Les zones de tir sont lisibles sur mobile (canvas min 280px de large)
6. Aucune régression sur la vue staff existante

---

## 7. RÉPONSES AUX QUESTIONS — Brief finalisé

- **Q-PM-1 ✅ :** Stat vedette = comparaison vs **toute l'équipe** (pas seulement même poste). Pour les GB : peut être un % significatif dans une zone de terrain précise.
- **Q-PM-2 ✅ :** Diagnostic bilan ↑↓ uniquement dans **Ma Fiche**.
- **Q-PM-3 ✅ :** Sur Android : **terrain dessiné en CSS** (pas de fallback fond couleur — le terrain doit être visible).
- **Q-PM-4 ✅ :** Densité Ma Fiche pas un problème tel quel.

---

## 8. POINTS AJOUTÉS EN REVUE (observés sur l'app en direct)

**I — Barre "STATS DU MATCH" doit être sticky**
Quand le joueur scrolle dans l'onglet Stats Match, la barre de titre (avec les filtres PÉRIODE et MATCH) disparaît. Il ne sait plus sur quel match/période il est. → La barre de filtres doit rester fixée en haut sous la pm-bar pendant le scroll.

**J — Canvas terrain vu du dessus trop grand**
Le canvas "POSITIONS DE TIR SUR LE TERRAIN" prend trop de place verticalement dans Stats Match. Le réduire (hauteur max) pour qu'il ne monopolise pas l'écran avant d'arriver aux zones de tir sur le but.

**K — Bilans : cas début de saison**
Si le coach n'a pas encore rempli l'onglet Bilan du fichier Excel (début de saison), il n'y a aucun bilan disponible. Dans ce cas, le sélecteur de période doit être **complètement masqué** (pas affiché vide). Le filtre période n'apparaît que quand au moins un bilan est défini.

---

## 9. SCOPE FINAL — 11 features

| Ref | Feature | Priorité |
|-----|---------|----------|
| A | Graph Ma Fiche simplifié (2 courbes mobile) + filtre période bilans | P1 |
| B | Diagnostic ↑↓ évolution entre bilans (dans Ma Fiche) | P1 |
| C | Stat vedette "Ta signature" (vs toute l'équipe) | P2 |
| D | Info-bulle note joueur de champ | P1 |
| E | Stats perso avant stats équipe dans Stats Match | P1 |
| F | Canvas Zones responsive (colonne sur mobile) | P1 |
| G | Zones filtrables par résultat (Tout/Buts/Ratés) | P1 |
| H | Session reprend sur dernier onglet | P2 |
| I | Barre filtres Stats Match sticky au scroll | P1 |
| J | Canvas terrain vu du dessus réduit | P2 |
| K | Sélecteur période masqué si aucun bilan défini | P1 |

**Hors scope :** partage réseaux sociaux, export PDF vue joueur, densité Ma Fiche (pas problématique)
