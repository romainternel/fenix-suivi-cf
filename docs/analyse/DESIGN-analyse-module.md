# DESIGN — Module Analyse FENIX Handball

**Agent :** Designer (pipeline BMAD)
**Date :** 2026-06-17
**Version :** 1.0
**Inputs :** PRD-analyse-module.md · UX-RESEARCH-analyse-module.md · ANALYST-analyse-module.md · css/style.css
**Destinataires :** Architect · Dev

---

## 0. Principes de design retenus

### Hiérarchie Bite / Snack / Meal (pattern SGX Studio)

Chaque feature suit la même logique d'affichage :
- **Bite** : 1 chiffre + couleur + label — lisible en 3 secondes sans interaction
- **Snack** : tableau ou contexte expandable au clic — lecture 30 secondes
- **Meal** : timeline enrichie + heatmap filtrée — analyse complète

### Règles typographiques héritées

| Élément | Police | Taille | Couleur |
|---------|--------|--------|---------|
| Titres section | Bebas Neue | 1.3rem | `--fenix-blue` (#0A2463) |
| Valeurs KPI | Bebas Neue | 1.5–2rem | `--fenix-dark` (#0F172A) |
| Labels | Inter 700 | 0.6–0.7rem | #64748B uppercase |
| Corps tableau | Inter | 0.85rem | `--fenix-dark` |
| Sous-texte badge | Inter | 0.72rem | #64748B |

### Palette couleurs projet (variables CSS existantes)

```
--fenix-blue:       #0A2463   → structure, en-têtes
--fenix-blue-light: #1E3A8A   → hover, dégradés
--fenix-gold:       #F59E0B   → accent, bascule, alertes
--fenix-success:    #10B981   → force FENIX, signal BON
--fenix-danger:     #EF4444   → faiblesse, signal ALERTE
--fenix-gray:       #F1F5F9   → fonds neutres, disabled
--fenix-dark:       #0F172A   → texte principal
--fenix-warning:    #8B4513   → attention (brun, peu lisible — remplacer par F59E0B pour la bascule)
```

**Couleurs spécifiques au module Analyse (nouvelles variables à déclarer) :**
```css
--enc-faire-courir:  #0EA5E9   /* bleu ciel — dynamisme, vitesse */
--enc-jeu-pivot:     #8B5CF6   /* violet — pivot, jeu intérieur */
--enc-isoler:        #F59E0B   /* gold — duel, 1v1 */
--enc-autre:         #94A3B8   /* slate — non classifié */
--bascule-line:      #F59E0B   /* gold — marqueur bascule */
--zone-danger:       rgba(239, 68, 68, 0.12)    /* rouge translucide */
--zone-avantage:     rgba(16, 185, 129, 0.12)   /* vert translucide */
```

### Insertion dans la page existante

```
[Page Analyse — flux vertical existant]

  ┌─ Sélecteur match ─────────────────────────────────────┐
  │ "Match vs Pontault · 15/03/2026"                      │
  └───────────────────────────────────────────────────────┘

  ┌─ Résumé 3 points ─────────────────────────────────────┐  ← EXISTANT, inchangé
  └───────────────────────────────────────────────────────┘

  ┌─ Indicateurs KPI (FENIX vs ADV) ──────────────────────┐  ← EXISTANT, inchangé
  └───────────────────────────────────────────────────────┘

  ╔═ F-01/02 — Cards familles d'enclenchement ════════════╗  ← NOUVEAU — s'insère ici
  ╠═ F-03 — Timeline enrichie + section bascule ══════════╣  ← NOUVEAU (enrichit drawTimeline)
  ╠═ F-04 — Gardien × famille adverse ════════════════════╣  ← NOUVEAU
  ╚═══════════════════════════════════════════════════════╝

  ┌─ Moments clés ────────────────────────────────────────┐  ← EXISTANT, inchangé
  └───────────────────────────────────────────────────────┘

  ┌─ Notes coach ─────────────────────────────────────────┐  ← EXISTANT, inchangé
  └───────────────────────────────────────────────────────┘

  ┌─ Chat ────────────────────────────────────────────────┐  ← EXISTANT, inchangé
  └───────────────────────────────────────────────────────┘
```

---

## F-00 — Parser famille enclenchement (fondation invisible)

Pas de maquette UI. Spécification technique complète.

### Format de la donnée source

La colonne `enclenchement` (COLS index 9) contient des chaînes du type :
```
"8;0;Bloc 4"
 ^  ^  ^
 |  |  partie 3 : finalité du mouvement (ex: "Bloc 4" = bloc du pivot)
 |  partie 2 : variante (ex: "0" = jeu autour du pivot)
 partie 1 : identifiant du mouvement → CLÉ DE CLASSIFICATION
```

La partie 1 (`encStr.split(';')[0].trim()`) est la seule clé utilisée pour la classification famille.

### Logique de classification — `getEncFamille(encStr)`

```javascript
// Pseudo-code de la fonction
function getEncFamille(encStr) {
  if (!encStr || typeof encStr !== 'string') return 'Autre';
  const cle = encStr.split(';')[0].trim();
  return ENC_FAMILLE_MAP[cle] ?? 'Autre';
}
```

**Règles métier :**
1. Toujours retourner une string, jamais `null` ni exception
2. Clé inconnue → `'Autre'` (pas de plantage)
3. Chaîne vide → `'Autre'`
4. La clé est extraite AVANT toute normalisation (casse, espaces) — la normalisation est dans le mapping

### Proposition `ENC_FAMILLE_MAP` — valeurs probables handball

Le mapping est construit sur les patterns tactiques handball documentés dans la littérature (UX-RESEARCH section 1C) et la taxonomie naturelle identifiée par le coach FENIX.

```javascript
const ENC_FAMILLE_MAP = {
  // ───────────────────────────────────────────
  // FAIRE COURIR — transitions, vitesse, fatigue défensive
  // Caractéristiques : départ rapide après récupération,
  // exploitation du déséquilibre adverse, contre-attaque
  // Efficacité attendue : la plus haute (~60-70%) car défense non en place
  // ───────────────────────────────────────────
  '1':   'Faire courir',   // Contre-attaque directe
  '2':   'Faire courir',   // Jeu rapide (fast break)
  '3':   'Faire courir',   // Transition après récupération
  'CA':  'Faire courir',   // Contre-attaque (variante texte)
  'FC':  'Faire courir',   // "Faire courir" explicite
  'JR':  'Faire courir',   // Jeu rapide (sigle)

  // ───────────────────────────────────────────
  // JEU PIVOT — exploitation du pivot, blocs, supériorités intérieures
  // Caractéristiques : pivot direct ou indirect, croisés autour du pivot,
  // écrans, bloc pivot pour libérer un tireur
  // Efficacité attendue : intermédiaire (~45-55%) — dépend de la défense
  // ───────────────────────────────────────────
  '4':   'Jeu Pivot',      // Pivot direct
  '5':   'Jeu Pivot',      // Pivot indirect
  '6':   'Jeu Pivot',      // Croisé autour pivot
  '7':   'Jeu Pivot',      // Bloc pivot
  '8':   'Jeu Pivot',      // Croisé sans ballon (ex: "8;0;Bloc 4")
  '9':   'Jeu Pivot',      // Jeu en bloc
  'JP':  'Jeu Pivot',      // "Jeu Pivot" explicite
  'PIV': 'Jeu Pivot',      // Pivot (sigle)
  'Bloc':'Jeu Pivot',      // Bloc (si encodé en texte en partie 1)

  // ───────────────────────────────────────────
  // ISOLER — duel 1v1, exploitation d'un avantage individuel
  // Caractéristiques : fixation d'un défenseur, décalage,
  // pénétration en zone libre, tir en situation de supériorité créée
  // Efficacité attendue : basse (~35-45%) — duel difficile
  // ───────────────────────────────────────────
  '10':  'Isoler',         // Isolation arrière
  '11':  'Isoler',         // Isolation ailier
  '12':  'Isoler',         // Duel direct 1v1
  '13':  'Isoler',         // Décalage + tir
  'IS':  'Isoler',         // "Isoler" explicite
  'ISO': 'Isoler',         // Isolation (sigle)
  '1v1': 'Isoler',         // Duel direct

  // ───────────────────────────────────────────
  // Clés courantes à vérifier avec le coach lors de la session de validation
  // Ces valeurs sont des hypothèses — à confirmer/corriger
  // ───────────────────────────────────────────
};
```

**IMPORTANT — Session validation obligatoire :**
Ce mapping est une proposition basée sur la logique handball générale et le format `"8;0;Bloc 4"` documenté. La session de 15 min avec le coach (prérequis R1 selon PRD section 5) doit :
1. Extraire toutes les valeurs uniques de partie 1 présentes dans les données (`[...new Set(DATA.map(r => r[COLS.enclenchement]?.split(';')[0]))]`)
2. Attribuer une famille à chacune
3. Remplacer ce mapping proposé par le mapping réel validé

### Détection automatique des clés inconnues

Pour alimenter la session de validation et le monitoring continu :

```javascript
// A appeler lors du chargement des données (updateAnalysePage)
function logEncFamillesInconnues(rows) {
  const inconnues = new Set();
  rows.forEach(r => {
    const cle = (r[COLS.enclenchement] || '').split(';')[0].trim();
    if (cle && !ENC_FAMILLE_MAP[cle]) inconnues.add(cle);
  });
  if (inconnues.size > 0) {
    console.warn('[FENIX] Clés enclenchement non classifiées:', [...inconnues]);
  }
  return inconnues;
}
```

**Indicateur de couverture dans l'UI** (si > 20% de lignes en "Autre") :

```
┌─ Avertissement couverture ───────────────────────────────┐
│  ⚠  27% des enclenchements non classifiés (clé inconnue) │
│  Familles d'enclenchement : résultats partiels           │
│  → Mettre à jour ENC_FAMILLE_MAP                         │
└──────────────────────────────────────────────────────────┘
```
Style : fond `#FEF3C7` (ambre clair), bordure `--fenix-gold`, icône `⚠`. Affiché en haut de la section F-01 si couverture < 80%.

---

## F-01 + F-02 — Cards familles d'enclenchement + badges force/faiblesse

### Vue d'ensemble de la section

**Titre de section :**
```
┌───────────────────────────────────────────────────────────────────────────────┐
│ section-header (border-bottom: 2px solid --fenix-gray)                        │
│                                                                               │
│ [⚡] ENCLENCHEMENTS OFFENSIFS          [n=26 poss.] [Couverts: 89%]           │
│      section-title (Bebas Neue 1.3rem)   badge gris  badge vert/rouge        │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Maquette — 3 cards côte à côte (desktop ≥ 851px)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ENCLENCHEMENTS OFFENSIFS                              [n=26] [Couv. 89%]   ║
╟──────────────────────────────────────────────────────────────────────────────╢
║                                                                              ║
║  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ║
║  │ [●] FAIRE COURIR    │  │ [●] JEU PIVOT        │  │ [●] ISOLER          │  ║
║  │ (pastille #0EA5E9)  │  │ (pastille #8B5CF6)   │  │ (pastille #F59E0B)  │  ║
║  │─────────────────────│  │─────────────────────│  │─────────────────────│  ║
║  │                     │  │                      │  │                     │  ║
║  │       67%           │  │        52%           │  │       44%           │  ║
║  │  EFF. POSSESSION    │  │  EFF. POSSESSION     │  │  EFF. POSSESSION    │  ║
║  │  (Bebas 2rem)       │  │  (Bebas 2rem)        │  │  (Bebas 2rem)       │  ║
║  │                     │  │                      │  │                     │  ║
║  │  8 tirs · 6 buts    │  │  12 tirs · 7 buts   │  │  6 tirs · 3 buts    │  ║
║  │  (Inter 0.8rem)     │  │  (Inter 0.8rem)      │  │  (Inter 0.8rem)     │  ║
║  │                     │  │                      │  │                     │  ║
║  │  ████████░░  67%    │  │  ██████░░░░  52%    │  │  █████░░░░░  44%    │  ║
║  │  (barre verte)      │  │  (barre neutre)      │  │  (barre rouge)      │  ║
║  │  moy. saison: 64%   │  │  moy. saison: 54%   │  │  moy. saison: 50%   │  ║
║  │                     │  │                      │  │                     │  ║
║  │  ⭐ FORCE FENIX     │  │  (pas de badge)      │  │  (pas de badge)     │  ║
║  │  Moy. 64% / +3%     │  │                      │  │  n=6, trop peu      │  ║
║  │  (badge vert)       │  │                      │  │  (avertissement)    │  ║
║  │                     │  │                      │  │                     │  ║
║  │  [▼ Voir détail]    │  │  [▼ Voir détail]     │  │  [▼ Voir détail]    │  ║
║  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Maquette — cards empilées (tablette portrait ≤ 850px)

```
╔══════════════════════════════════════════════════════╗
║  ENCLENCHEMENTS OFFENSIFS              [n=26][89%]   ║
╟──────────────────────────────────────────────────────╢
║  ┌────────────────────────────────────────────────┐  ║
║  │ [●] FAIRE COURIR          67%   ████████░░     │  ║
║  │ 8 tirs · 6 buts   ⭐ Force FENIX (+3%)         │  ║
║  │ [▼ Voir détail]                                │  ║
║  └────────────────────────────────────────────────┘  ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ [●] JEU PIVOT             52%   ██████░░░░     │  ║
║  │ 12 tirs · 7 buts                               │  ║
║  │ [▼ Voir détail]                                │  ║
║  └────────────────────────────────────────────────┘  ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ [●] ISOLER                44%   █████░░░░░     │  ║
║  │ 6 tirs · 3 buts   (n=6, données insuffisantes)│  ║
║  │ [▼ Voir détail]                                │  ║
║  └────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════╝
```

### Anatomie d'une card — spécification détaillée

```
┌─────────────────────────────────────────────────────────┐
│ ZONE A — En-tête famille                                │
│                                                         │
│  ●  FAIRE COURIR                              [actif?▼] │
│  ↑                                                      │
│  pastille couleur 10×10px (border-radius: 50%)          │
│  Famille : Inter 700, 0.75rem, uppercase, letter-sp 1px │
│  Caret : ▼ ou ▲ selon état expansion (Inter 0.7rem)     │
├─────────────────────────────────────────────────────────┤
│ ZONE B — Métrique principale                            │
│                                                         │
│                    67%                                  │
│              EFF. POSSESSION                            │
│                                                         │
│  Chiffre : Bebas Neue, 2.2rem, --fenix-dark             │
│  Label : Inter 700, 0.6rem, uppercase, #64748B          │
├─────────────────────────────────────────────────────────┤
│ ZONE C — Métriques secondaires                          │
│                                                         │
│  8 tirs     ·     6 buts     ·     (n=8 poss.)         │
│                                                         │
│  Inter, 0.8rem, #64748B · séparateur "·" espacé        │
│  "n=X poss." en italique si n < 10 (signal faible vol.) │
├─────────────────────────────────────────────────────────┤
│ ZONE D — Barre de progression contextuelle              │
│                                                         │
│  [████████░░░]  67%  (moy. saison : 64%)               │
│                                                         │
│  Barre : height 6px, border-radius 3px                  │
│  Fond barre : --fenix-gray                              │
│  Remplissage : vert (#10B981) si eff > moy · ×1.0      │
│              : rouge (#EF4444) si eff < moy · ×0.85    │
│              : #94A3B8 si < 3 matchs saison (pas de ref)│
│  Largeur remplissage : min(eff%, 100%)                  │
│  Texte sous barre : "moy. saison : X%"                  │
│  Inter, 0.65rem, #94A3B8                                │
├─────────────────────────────────────────────────────────┤
│ ZONE E — Badge force/faiblesse (F-02, voir ci-dessous)  │
├─────────────────────────────────────────────────────────┤
│ ZONE F — Bouton expansion                               │
│                                                         │
│  [▼ Voir le détail]                                     │
│                                                         │
│  Bouton texte, Inter 0.75rem, --fenix-blue              │
│  background: transparent, border: none                   │
│  hover: underline + cursor pointer                       │
│  État actif (expandé) : "▲ Masquer le détail"           │
└─────────────────────────────────────────────────────────┘
```

### État "Non utilisé" (famille absente du match)

```
┌─────────────────────────────────────────────────────────┐
│ ●  ISOLER                                               │
│─────────────────────────────────────────────────────────│
│                                                         │
│         Non utilisé ce match                            │
│         (0 possession enregistrée)                      │
│                                                         │
│  Card entière : opacity: 0.45                           │
│  Fond : --fenix-gray (F1F5F9)                           │
│  Bordure : 1px dashed #CBD5E1                           │
│  Pastille couleur : opacity 0.4                         │
│  Pas de bouton "Voir détail"                            │
└─────────────────────────────────────────────────────────┘
```

### CSS de la card famille (nouvelles classes à créer)

```css
/* Container des 3 cards */
.enc-famille-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 850px) {
  .enc-famille-grid { grid-template-columns: 1fr; }
}

/* Card individuelle */
.enc-famille-card {
  background: var(--fenix-white);
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: var(--shadow-md);
  border-top: 3px solid transparent;   /* colorée par --enc-couleur */
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}
.enc-famille-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}
.enc-famille-card.expanded {
  border-color: var(--enc-couleur, var(--fenix-blue));
  box-shadow: 0 0 0 2px var(--enc-couleur, var(--fenix-blue)), var(--shadow-md);
}
.enc-famille-card.disabled {
  opacity: 0.45;
  cursor: default;
  background: var(--fenix-gray);
  border-style: dashed;
  border-color: #CBD5E1;
}

/* Pastille couleur famille */
.enc-famille-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}

/* Valeur principale */
.enc-famille-eff {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.2rem;
  color: var(--fenix-dark);
  line-height: 1;
  margin: 0.5rem 0 0.1rem;
}

/* Barre de progression */
.enc-progress-track {
  height: 6px;
  background: var(--fenix-gray);
  border-radius: 3px;
  margin: 0.6rem 0 0.25rem;
  overflow: hidden;
}
.enc-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.enc-progress-fill.above  { background: var(--fenix-success); }
.enc-progress-fill.below  { background: var(--fenix-danger); }
.enc-progress-fill.noref  { background: #94A3B8; }
```

---

## F-01b — Tableau détail famille (état expandé)

### Maquette — tableau inséré sous la card (inline)

```
╔══════════════════════════════════════════════════════════╗
║  [●] FAIRE COURIR                    67%  ████████░░    ║
║  ⭐ Force FENIX       8 tirs · 6 buts · (n=8 poss.)     ║
║  ▲ Masquer le détail                                     ║
╟──────────────────────────────────────────────────────────╢
║  FAIRE COURIR — Détail des 8 tirs (3 enclenchements)     ║
║                                                          ║
║  ┌───────────────────────┬──────┬──────┬────────┐        ║
║  │ Enclenchement         │ Tirs │ Buts │  Eff.  │        ║
║  ├───────────────────────┼──────┼──────┼────────┤        ║
║  │ Croisé sans ballon    │  4   │  3   │  75%   │        ║
║  │ Jeu rapide            │  3   │  2   │  67%   │        ║
║  │ Transition zone       │  1   │  1   │ 100%   │        ║
║  ├───────────────────────┼──────┼──────┼────────┤        ║
║  │ Total famille         │  8   │  6   │  67%   │  ← gras║
║  └───────────────────────┴──────┴──────┴────────┘        ║
╚══════════════════════════════════════════════════════════╝
```

### Spécification du tableau détail

```
En-tête tableau :
  background: --fenix-blue (#0A2463)
  color: white
  font: Inter 700, 0.7rem, uppercase
  padding: 0.6rem 0.75rem

Lignes données :
  background: alterné blanc / --fenix-gray
  font: Inter, 0.85rem, --fenix-dark
  text-align: center (colonnes chiffres) / left (nom enclenchement)
  padding: 0.55rem 0.75rem

Ligne Total :
  font-weight: 700
  background: #EFF6FF (bleu très clair)
  border-top: 2px solid --fenix-blue

Colonne Eff. :
  colorée : vert si > 60%, rouge si < 40%, gris sinon
  (seuils indicatifs — à valider)

Animation expansion :
  max-height: 0 → auto avec transition 0.3s ease
  Pas d'animation complexe — simple overflow hidden
```

### État cas limite — 1 seul enclenchement

```
  ┌───────────────────────┬──────┬──────┬────────┐
  │ Enclenchement         │ Tirs │ Buts │  Eff.  │
  ├───────────────────────┼──────┼──────┼────────┤
  │ Croisé sans ballon    │  8   │  6   │  75%   │
  ├───────────────────────┼──────┼──────┼────────┤
  │ Total famille         │  8   │  6   │  75%   │
  └───────────────────────┴──────┴──────┴────────┘
  → Ligne Total identique à la seule ligne — acceptable, ne pas masquer
```

---

## F-02 — Badges force/faiblesse

### Spécification visuelle des 2 badges

#### Badge "Force FENIX" (vert, étoile)

```
┌──────────────────────────────────────────────────────┐
│  ⭐ FORCE FENIX                                       │
│     Moy. saison : 64% · Ce match : 67% (+3%)         │
└──────────────────────────────────────────────────────┘

Styles :
  background: #D1FAE5   (vert très clair — même que .moment-badge.positif)
  color: #059669         (vert foncé)
  border-left: 3px solid #10B981
  border-radius: 6px
  padding: 0.35rem 0.6rem
  margin-top: 0.5rem

Icône : ⭐ (unicode, pas d'image — performance)
Titre : "FORCE FENIX" — Inter 700, 0.7rem, uppercase
Sous-texte : "Moy. saison : X% · Ce match : Y% (écart : +Z%)"
             Inter, 0.65rem, #059669
```

#### Badge "Faiblesse adverse" (orange/gold, éclair)

```
┌──────────────────────────────────────────────────────┐
│  ⚡ FAIBLESSE ADVERSE                                 │
│     Moy. saison : 44% · Ce match : 78% (+34%)        │
└──────────────────────────────────────────────────────┘

Styles :
  background: #FEF3C7   (ambre clair)
  color: #92400E         (brun foncé — lisibilité)
  border-left: 3px solid #F59E0B   (--fenix-gold)
  border-radius: 6px
  padding: 0.35rem 0.6rem
  margin-top: 0.5rem

Icône : ⚡ (unicode)
Titre : "FAIBLESSE ADVERSE" — Inter 700, 0.7rem, uppercase
Sous-texte : "Moy. saison : X% · Ce match : Y% (écart : +Z%)"
             Inter, 0.65rem, #92400E
```

#### État "Données insuffisantes" (< 3 matchs saison)

```
┌──────────────────────────────────────────────────────┐
│  ○  Min. 3 matchs pour comparer (X joués)            │
└──────────────────────────────────────────────────────┘

Styles :
  background: transparent
  color: #94A3B8   (slate — discret)
  border: 1px dashed #CBD5E1
  border-radius: 6px
  padding: 0.3rem 0.6rem
  font: Inter, 0.65rem, italic
  margin-top: 0.5rem
```

### Logique d'affichage et seuils

```
Priorité : Faiblesse adverse > Force FENIX (un seul badge max par card)

FAIBLESSE ADVERSE :
  condition : effMatch / effMoyenneSaison >= 1.5
             ET n >= 5 (possessions ce match)
             ET matchsSaison >= 3

FORCE FENIX :
  condition : |effMatch - effMoyenneSaison| / effMoyenneSaison <= 0.10
             ET varianceSaison faible (à définir : cv < 0.2 recommandé)
             ET matchsSaison >= 3
             ET n >= 5

AUCUN BADGE :
  ni l'un ni l'autre → pas d'affichage dans la Zone E

DONNÉES INSUFFISANTES :
  matchsSaison < 3 → afficher le message gris (TOUJOURS visible si < 3 matchs)
  n < 5 → afficher "(n trop faible pour badge)" dans sous-texte saison

Note sur la variance saison (Force FENIX) :
  Le coefficient de variation (écart-type / moyenne) mesure la consistance.
  CV < 0.2 → performance régulière → potentiellement une force structurelle.
  Calcul à réaliser dans generateSeasonCorrelations() étendue.
```

### Positionnement dans la card

```
┌─────────────────────────────────────────────────────┐
│ [Zone A] En-tête famille                            │
├─────────────────────────────────────────────────────┤
│ [Zone B] Métrique principale — EFF 67%              │
├─────────────────────────────────────────────────────┤
│ [Zone C] 8 tirs · 6 buts · (n=8)                   │
├─────────────────────────────────────────────────────┤
│ [Zone D] Barre de progression + moy. saison         │
├─────────────────────────────────────────────────────┤
│ [Zone E] ⭐ FORCE FENIX                              │  ← badge ici
│          Moy. 64% · Ce match : 67% (+3%)            │
├─────────────────────────────────────────────────────┤
│ [Zone F] ▼ Voir le détail                           │
└─────────────────────────────────────────────────────┘
```

---

## F-03 — Timeline enrichie + section bascule

### Enrichissement du canvas existant

Le canvas de `drawTimeline()` est conservé tel quel. La fonction `drawMomentumOverlay(ctx, scoreHistory, canvas)` est appelée APRÈS le dessin existant, en superposition.

#### Vue canvas enrichi — maquette schématique

```
  Score
   ^
35 │                    ╭────────────────
30 │              ╭─────╯     ← FENIX (bleu, existant)
25 │         ╭───╯
20 │ ───╭────╯
   │
   │─── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ← ligne zéro écart (tirets gris)
   │
+3 │ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ← courbe écart (orange, épaisseur 2px)
   │                              ▼ creux
-5 │                 ╰──╮
   │    ZONE VERTE       │ ZONE ROUGE
   │    (diff > 0)       │ (diff < 0)
   │                ┊
   │          ┊ BASCULE     ← ligne pointillée verticale orange
   │          ┊ (label en haut)
   │
   └──────────────────────────────────────────────→ Possessions / Temps
       MT1                    MT2
```

#### Spécification de la courbe d'écart

```
drawMomentumOverlay(ctx, scoreHistory, canvas) :

1. Données d'entrée :
   scoreHistory[] = [{pos, fenix, adv}, ...] (déjà calculé dans drawTimeline)
   + possessions brutes pour l'axe X (index dans DATA filtré par match)

2. Calcul de l'écart à chaque possession :
   diff[i] = scoreHistory[i].fenix - scoreHistory[i].adv

3. Zones colorées (dessinées AVANT la courbe pour rester en fond) :
   - Zone diff > 0 : fillStyle = rgba(16, 185, 129, 0.12)   ← --zone-avantage
   - Zone diff < 0 : fillStyle = rgba(239, 68, 68, 0.12)    ← --zone-danger
   - Polygone fermé sur la ligne y=0

4. Courbe écart :
   strokeStyle = #F59E0B   (--bascule-line, gold)
   lineWidth = 2px
   setLineDash([]) — ligne continue
   Note : tracée avec la même normalisation X que drawTimeline()

5. Ligne zéro :
   strokeStyle = #94A3B8   (gris slate)
   lineWidth = 1px
   setLineDash([4, 4])   ← tirets discrets

6. Détection du moment bascule :
   a) Croisement zéro défavorable : premier index i où diff[i] < 0 ET diff[i-1] >= 0
   b) Si plusieurs croisements : retenir le premier en deuxième mi-temps (ou le premier global)
   c) Creux minimum : argmin(diff) — point le plus bas de l'écart

7. Marqueur bascule :
   Ligne verticale pointillée :
     strokeStyle = #F59E0B
     lineWidth = 1.5px
     setLineDash([6, 3])
   Label "BASCULE" :
     fillStyle = #F59E0B
     font = "700 11px Inter"
     Fond blanc derrière le label : ctx.fillRect (fond #FFFFFF, padding 2px)
   Petit triangle pointant vers le bas à la position du creux :
     ctx.beginPath(); triangle plein #F59E0B, 8px

8. Si aucune bascule (diff > 0 tout le match) :
   Pas de marqueur. Message affiché dans la section contextuelle (voir ci-dessous).
```

### Section contextuelle "Pendant ce moment"

Affichée SOUS le canvas, dans un bloc HTML (pas canvas). S'affiche automatiquement si un moment bascule est détecté.

#### Maquette — bascule détectée

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ┊ BASCULE DÉTECTÉE — Possessions 18 à 24 · Score passé de +3 à -2 (MT2)   ║
╟──────────────────────────────────────────────────────────────────────────────╢
║                                                                              ║
║  ATTAQUE ADVERSE pendant ce run (6 possessions) :                           ║
║  ─────────────────────────────────────────────────                           ║
║  ┌──────────────────────────────────────────────────────────────────────┐   ║
║  │ [●] Jeu Pivot    × 3 possessions  →  2 buts   (eff. 67%)            │   ║
║  │ [●] Faire courir × 2 possessions  →  2 buts   (eff. 100%) ← MAX     │   ║
║  │ [●] Isoler       × 1 possession   →  0 but    (eff. 0%)             │   ║
║  └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║  ATTAQUE FENIX pendant ce run (6 possessions) :                             ║
║  ─────────────────────────────────────────────────                           ║
║  ┌──────────────────────────────────────────────────────────────────────┐   ║
║  │ [●] Jeu Pivot    × 2 possessions  →  0 but    (eff. 0%)  ← ECHEC    │   ║
║  │ [●] Faire courir × 1 possession   →  0 but    (eff. 0%)  ← ECHEC    │   ║
║  │ Aucun but FENIX sur cette séquence                                   │   ║
║  └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### Maquette — aucune bascule

```
╔══════════════════════════════════════════════════════════════════╗
║  ✓  Aucune bascule détectée                                      ║
║     FENIX a mené du début à la fin de ce match.                  ║
╚══════════════════════════════════════════════════════════════════╝

Styles :
  background: #D1FAE5 (vert très clair)
  color: #059669
  border-radius: 8px
  padding: 0.75rem 1rem
  font: Inter, 0.85rem
```

#### Spécification de la section contextuelle

```
Conteneur global :
  background: #FFFBEB   (ambre très clair — code couleur bascule)
  border-left: 4px solid #F59E0B
  border-radius: 8px
  padding: 1rem 1.2rem
  margin-top: 0.75rem

En-tête section :
  "┊ BASCULE DÉTECTÉE — ..."
  font: 'Bebas Neue', 1rem, #92400E
  Caractère "┊" : symbole barre verticale, couleur #F59E0B

Blocs attaque (2 blocs) :
  Titre bloc : Inter 700, 0.7rem, uppercase, #64748B, avec séparateur ─────
  Lignes d'enclenchements :
    Pastille couleur famille (8px) + Nom famille + "× N possessions" + "→ X buts" + "(eff. Y%)"
    Inter, 0.82rem, --fenix-dark
  Indicateur MAX (adversaire) : badge inline "#F59E0B" — "← MAX"
  Indicateur ECHEC (FENIX) : badge inline "#EF4444" — "← ECHEC"

Logique "pendant ce run" :
  fenêtre = possessions de idxBascule-3 à idxBascule+3 (ou bornée au match)
  → environ 6-7 possessions autour du moment bascule
  Filtrer club !== 'FENIX' pour le bloc adversaire
  Filtrer club === 'FENIX' pour le bloc FENIX
```

---

## F-04 — Tableau gardien × famille adverse

### Maquette principale — tableau compact

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  GARDIEN × SYSTÈMES ADVERSES                                                ║
╟──────────────────────────────────────────────────────────────────────────────╢
║                                                                              ║
║  Gardien :  [MARTIN ▼]    % arrêts global ce match :  38%                  ║
║             (si 1 seul gardien : texte fixe, pas de select)                 ║
║             Moy. saison : 44%  (référence affichée si ≥ 3 matchs)           ║
║                                                                              ║
║  ┌──────────────────────┬───────┬───────┬─────────┬────────────────┐        ║
║  │ Système adverse      │ Tirs  │ Arr.  │ % arr.  │ Signal         │        ║
║  ├──────────────────────┼───────┼───────┼─────────┼────────────────┤        ║
║  │ [●] Faire courir     │   8   │   4   │   50%   │ ✅ BON          │        ║
║  │ [●] Jeu Pivot        │  12   │   3   │   25%   │ 🔴 ALERTE       │        ║
║  │ [●] Isoler           │   5   │   2   │   40%   │ —   Neutre     │        ║
║  │ Autre / non classif. │   2   │   1   │   50%   │ (n<3)          │        ║
║  ├──────────────────────┼───────┼───────┼─────────┼────────────────┤        ║
║  │ Total                │  27   │  10   │   37%   │                │        ║
║  └──────────────────────┴───────┴───────┴─────────┴────────────────┘        ║
║                                                                              ║
║  Cliquer sur une ligne pour filtrer la heatmap                              ║
║  (texte d'aide, Inter 0.72rem, #94A3B8, italique)                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Spécification des signaux

```
Signal calculé par rapport à la moyenne gardien saison :

  ALERTE (rouge) :
    % arrêts ce match < (moy. saison gardien - 15 points de %)
    Affichage : fond #FEE2E2, couleur #DC2626
    Texte : "🔴 ALERTE" (Inter 700, 0.78rem)

  BON (vert) :
    % arrêts ce match > (moy. saison gardien + 10 points de %)
    Affichage : fond #D1FAE5, couleur #059669
    Texte : "✅ BON" (Inter 700, 0.78rem)

  NEUTRE (gris) :
    Dans l'intervalle [moy-15%, moy+10%]
    Affichage : fond transparent, couleur #64748B
    Texte : "—" centré

  VOLUME INSUFFISANT (n < 3 tirs) :
    Pas de signal vert/rouge
    Affichage : fond transparent, couleur #94A3B8
    Texte : "(n<3)" en italique

  PAS DE RÉFÉRENCE SAISON (< 3 matchs) :
    Colonne Signal entière : "—" gris
    Note sous le tableau : "Min. 3 matchs pour calculer les signaux gardien"
```

### Spécification du tableau

```
En-tête tableau :
  background: --fenix-blue
  color: white
  font: Inter 700, 0.7rem, uppercase

Lignes de données :
  Alternance blanc / #F8FAFC
  Ligne sélectionnée (heatmap filtrée) :
    background: #EFF6FF
    border-left: 3px solid --enc-couleur (famille)
  hover : background #F1F5F9, cursor pointer

Ligne Total :
  font-weight: 700
  background: --fenix-gray
  border-top: 2px solid --fenix-blue

Sélecteur gardien (si ≥ 2 gardiens) :
  <select> avec style .filter-group select existant
  label "Gardien :" en Inter 700, 0.72rem, uppercase, #64748B
  Changement de gardien → recalcul des signaux uniquement (pas rechargement complet)
```

### Intégration heatmap zones (état filtré)

```
Sans filtre (état par défaut) :
  → canvas zones de but existant = tous les tirs adverses, tous enclenchements
  → Titre du canvas : "Zones adverses (tous systèmes)"

Avec filtre actif (clic sur ligne famille) :
  → Canvas filtré sur cette famille
  → Titre : "Zones adverses — Jeu Pivot (12 tirs)"
  → Bouton "Tout afficher" en haut à droite du canvas pour réinitialiser le filtre

Disposition recommandée (tablette desktop) :
  ┌────────────────────────────────┬──────────────────────┐
  │  Tableau 4 colonnes            │  Canvas heatmap 3×3  │
  │  (65% largeur)                 │  (35% largeur)       │
  └────────────────────────────────┴──────────────────────┘
  flex-direction: row · gap: 1rem
  @media ≤ 768px → flex-direction: column (heatmap sous tableau)
```

---

## F-05 — Enclenchements saison V vs D (R2)

> Feature Release 2 — s'affiche quand aucun match n'est sélectionné (vue saison globale)

### Maquette — tableau comparatif

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  EFFICACITÉ PAR FAMILLE — SAISON  (V=8 · D=5 · N=2)                        ║
╟──────────────────────────────────────────────────────────────────────────────╢
║                                                                              ║
║  ┌─────────────────────┬──────────────┬──────────────┬────────────────┐     ║
║  │ Famille             │ Eff. moy. V  │ Eff. moy. D  │ Diff. V–D      │     ║
║  ├─────────────────────┼──────────────┼──────────────┼────────────────┤     ║
║  │ [●] Faire courir    │     64%      │     51%      │   +13%  ↑       │     ║
║  │ [●] Jeu Pivot       │     52%      │     55%      │    -3%  ↓       │     ║
║  │ [●] Isoler          │     40%      │     38%      │    +2%  →       │     ║
║  └─────────────────────┴──────────────┴──────────────┴────────────────┘     ║
║                                                                              ║
║  Note de lecture : Faire courir = arme principale en victoire (+13%).       ║
║  Jeu Pivot : légèrement plus efficace en défaite — signal à surveiller.     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Spécification de la colonne Diff. V–D

```
Colonne "Diff. V–D" = Eff. Victoires - Eff. Défaites

Positif (famille plus efficace en V) :
  couleur: --fenix-success (#10B981)
  texte: "+X%  ↑"
  → NORMAL — notre jeu fonctionne quand on gagne

Négatif (famille plus efficace en D) :
  couleur: --fenix-danger (#EF4444)
  texte: "-X%  ↓"
  → ANOMALIE — ce système apparaît dans nos défaites

Neutre (diff < 3%) :
  couleur: #64748B
  texte: "~X%  →"
  → Pas d'effet détecté

Cellules Eff. moy. V et Eff. moy. D :
  Fond coloré selon niveau absolu :
    > 60% → #D1FAE5 (vert)
    40-60% → transparent
    < 40% → #FEE2E2 (rouge)
```

### État "Prérequis non atteint" (< 5 matchs)

```
╔══════════════════════════════════════════════════════════════════╗
║  EFFICACITÉ PAR FAMILLE — SAISON                                 ║
╟──────────────────────────────────────────────────────────────────╢
║                                                                  ║
║  Données insuffisantes pour la comparaison saison.              ║
║  Matchs enregistrés : 3  (minimum requis : 5)                   ║
║                                                                  ║
║  Cette vue sera disponible à partir du 5e match.                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

Styles : identiques à l'état "données insuffisantes" de generateSeasonCorrelations()
  (réutiliser le pattern existant de cette fonction)
```

### Intégration dans `generateSeasonCorrelations()`

La F-05 s'insère à la fin de la section `generateSeasonCorrelations()` existante, après les tableaux V/D/N actuels. Pas de remplacement — ajout d'un bloc supplémentaire.

```
[Section saison existante — inchangée]
 → Tableau KPIs V/D/N (existant)

[Nouveau bloc F-05 — ajouté en dessous]
 → Tableau familles V vs D
```

---

## Récapitulatif — Flux de la page Analyse après R1

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SÉLECTEUR MATCH                                                         │
│ "Match vs Pontault · 15/03/2026  [28-24]"                              │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ RÉSUMÉ 3 POINTS                              [EXISTANT — inchangé]      │
│ Efficacité : 67%  ·  PB : 8  ·  Gardien : 38%                         │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ INDICATEURS KPI FENIX vs ADV                 [EXISTANT — inchangé]      │
│ cards avantage/desavantage avec MT1/MT2                                │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ ENCLENCHEMENTS OFFENSIFS                         [NOUVEAU — F-01/02]   ║
║                                                                         ║
║  [●FAIRE COURIR 67%↑⭐] [●JEU PIVOT 52%=] [●ISOLER 44%↓]              ║
║  → clic → tableau détail expandable (F-01b)                            ║
╚═════════════════════════════════════════════════════════════════════════╝
           │
           ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ TIMELINE MATCH                                   [ÉTENDU — F-03]       ║
║  [canvas existant score bleu/rouge]                                    ║
║  [+ courbe écart orange + zones vert/rouge + marqueur BASCULE]         ║
║                                                                         ║
║  ┊ BASCULE DÉTECTÉE — Poss. 18→24 — Score +3 → -2                     ║
║  [Attaque adverse : Jeu Pivot × 3 (67%) · Faire courir × 2 (100%)]   ║
║  [Attaque FENIX   : Jeu Pivot × 2 (0%)  · FC × 1 (0%)]               ║
╚═════════════════════════════════════════════════════════════════════════╝
           │
           ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ GARDIEN × SYSTÈMES ADVERSES                      [NOUVEAU — F-04]      ║
║  Gardien : MARTIN · 38% arrêts global                                  ║
║  [Tableau famille × tirs × arrêts × signal] [Heatmap zones filtrée]   ║
╚═════════════════════════════════════════════════════════════════════════╝
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ MOMENTS CLÉS                                 [EXISTANT — inchangé]      │
│ (runs ≥ 3 buts — coexiste avec F-03)                                   │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ NOTES COACH                                  [EXISTANT — inchangé]      │
│ CHAT                                         [EXISTANT — inchangé]      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Contraintes tablette 10" — validation objectif O5

**Viewport de référence :** 1024×768px (tablette paysage standard)

| Section | Hauteur estimée | Lisible sans scroll ? |
|---------|-----------------|----------------------|
| Cards familles (3 côte à côte) | ~160px | Oui |
| Timeline canvas enrichi | ~220px (existant) | Oui |
| Section contextuelle bascule | ~140px | Oui |
| Tableau gardien + heatmap | ~220px | Oui |
| **Total nouvelles sections** | **~740px** | **Limite** |

**Recommandation :** Les sections F-01/02 et F-04 doivent être compressibles. Ajouter un toggle de section (bouton collapse en haut à droite de chaque `section-header`) réutilisant le pattern `.avg-toggle-btn` existant. L'état collapse est mémorisé en `localStorage` pour ne pas forcer le coach à recliquer à chaque match.

**Breakpoints :**
```
≥ 1024px : 3 cards famille côte à côte · tableau gardien + heatmap côte à côte
850–1023px : 3 cards côte à côte compressées · tableau + heatmap empilés
≤ 849px  : cards empilées · tout empilé
```

---

## Inventaire CSS — classes nouvelles vs existantes

### Classes existantes réutilisées SANS modification

| Classe | Utilisation dans le module Analyse |
|--------|------------------------------------|
| `.section` | Conteneur de chaque feature (F-01, F-03, F-04) |
| `.section-header` / `.section-title` | Titres "ENCLENCHEMENTS OFFENSIFS" etc. |
| `.moment-badge.positif` / `.negatif` | Section contextuelle bascule |
| `.indicateur-card.avantage` / `.desavantage` | Base visuelle des signaux gardien |
| `.table-container` | Enveloppe responsive des tableaux |
| `table`, `th`, `td` | Tableaux F-01b, F-04, F-05 |
| `.filter-group select` | Sélecteur gardien F-04 |
| `.avg-toggle-btn` | Collapse des sections |
| `.pmf-kpi-box` / `.pmf-kpi-val` / `.pmf-kpi-lbl` | Métriques compactes dans les cards |

### Nouvelles classes à créer

| Classe | Feature | Description courte |
|--------|---------|-------------------|
| `.enc-famille-grid` | F-01 | Grid 3 colonnes (ou 1 col sur tablette portrait) |
| `.enc-famille-card` | F-01 | Card famille avec border-top colorée |
| `.enc-famille-card.expanded` | F-01b | État expandé avec outline |
| `.enc-famille-card.disabled` | F-01 | État non utilisé (opacity 0.45) |
| `.enc-famille-dot` | F-01 | Pastille couleur 10px ronde |
| `.enc-famille-eff` | F-01 | Valeur principale Bebas 2.2rem |
| `.enc-progress-track` | F-01 | Fond barre 6px |
| `.enc-progress-fill` | F-01 | Remplissage barre (.above / .below / .noref) |
| `.enc-badge-force` | F-02 | Badge vert Force FENIX |
| `.enc-badge-faiblesse` | F-02 | Badge ambre Faiblesse adverse |
| `.enc-badge-nodata` | F-02 | Badge gris Min. 3 matchs |
| `.enc-detail-table` | F-01b | Tableau détail expandable |
| `.enc-coverage-warning` | F-00 | Avertissement couverture < 80% |
| `.enc-bascule-section` | F-03 | Conteneur section contextuelle bascule |
| `.enc-bascule-header` | F-03 | En-tête "BASCULE DÉTECTÉE" |
| `.enc-bascule-block` | F-03 | Bloc "Attaque adverse" / "Attaque FENIX" |
| `.enc-gardien-layout` | F-04 | Flex row tableau + heatmap |
| `.enc-signal-alerte` | F-04 | Cellule signal rouge |
| `.enc-signal-bon` | F-04 | Cellule signal vert |
| `.enc-signal-neutre` | F-04 | Cellule signal gris |
| `.enc-saison-table` | F-05 | Tableau V vs D |

**Total : ~20 nouvelles classes** — à regrouper dans un bloc `/* === MODULE ANALYSE === */` en fin de `style.css`.

---

## Checklist de validation designer → Architect

Avant de transmettre ce document pour l'implémentation, vérifier :

- [ ] F-00 : le mapping `ENC_FAMILLE_MAP` proposé est cohérent avec les valeurs réelles du fichier Excel FENIX (session coach à tenir avant dev)
- [ ] F-01 : les 3 cards tiennent côte à côte sur 1024px sans overflow ni compression illisible
- [ ] F-01 : la barre de progression est distincte de la `.pmf-kpi-box` existante (ne pas confondre)
- [ ] F-02 : un seul badge maximum par card — logique de priorité confirmée (Faiblesse > Force)
- [ ] F-02 : les deux badges sont distinguables pour un daltonien (rouge/vert → utiliser icônes ⭐ et ⚡ en plus des couleurs)
- [ ] F-03 : `drawMomentumOverlay` est appelée APRÈS `drawTimeline` — aucune modification des lignes de dessin existantes
- [ ] F-03 : le canvas gère `clientWidth = 0` (Bug #8) avec `requestAnimationFrame` avant dessin de l'overlay
- [ ] F-04 : le filtre famille → heatmap réoriente le canvas existant sans le réécrire
- [ ] F-05 : s'affiche uniquement hors sélection de match ET ≥ 5 matchs — pas de régression sur `generateSeasonCorrelations()`
- [ ] Général : aucune nouvelle dépendance externe — vanilla JS uniquement

---

*Document DESIGN v1.0 — pipeline BMAD FENIX — à transmettre à l'Architect pour implémentation R1.*
