# Visual — Refonte Navigation & Design Visuel FENIX Stats CF

**Agent :** Visual Crafter
**Date :** 2026-08-28
**Input :** `docs/design/navigation-refonte.md` (Designer) + palette existante `css/style.css:1-28`

**Cadrage rappelé (PRD F3) :** retouche approfondie, pas de refonte du système. Police (Inter / Bebas Neue), couleur de marque (#0A2463) et stack CSS vanilla conservées. Le travail ici est sur l'exécution : hiérarchie, espacement, ombres, états, cohérence — pas sur le remplacement des fondations.

---

## 1. Palette de tokens

### 1.1 Tokens conservés tels quels
```css
--fenix-blue: #0A2463;
--fenix-blue-light: #1E3A8A;
--fenix-white: #FFFFFF;
--fenix-dark: #0F172A;
--fenix-accent: #3B82F6;
--fenix-success: #10B981;
--fenix-danger: #EF4444;
```
Ces 7 tokens sont déjà cohérents et suffisamment distincts (vérifié WCAG en §6). Ils restent la base de toute couleur à sens (succès, danger, marque, accent).

### 1.2 Tokens ajoutés — échelle de gris neutre
`--fenix-gray` actuel (`#F1F5F9`) est unique et utilisé indifféremment comme fond de carte, fond de page et séparateur — c'est une des causes concrètes du manque de hiérarchie constaté. Extension en échelle à 5 niveaux (valeurs Tailwind Slate, déjà utilisées ponctuellement dans le code existant en `#94A3B8`/`#64748B`/`#CBD5E1` — on les formalise en tokens plutôt que de les laisser en valeurs inline dispersées) :
```css
--gray-50:  #F8FAFC;  /* fond de page */
--gray-100: #F1F5F9;  /* = --fenix-gray, fond de carte secondaire */
--gray-200: #E2E8F0;  /* bordures, séparateurs */
--gray-400: #94A3B8;  /* texte tertiaire, icônes inactives */
--gray-600: #64748B;  /* texte secondaire (labels) */
--gray-900: #0F172A;  /* = --fenix-dark, texte principal */
```

### 1.3 Token ajouté — surface élevée
Pour distinguer une carte "importante" (ex. bloc terrain+cartes en haut d'Analyse, carte signature joueur) d'une carte "standard" :
```css
--surface-raised: #FFFFFF;
--surface-raised-border: 1px solid var(--gray-200);
```

### 1.4 Couleurs à sens — inchangées
`--enc-*` (familles enclenchement) et `--fenix-warning` (#8B4513, PB/alertes douces) restent identiques — déjà cohérentes, aucune retouche nécessaire.

---

## 2. Typographie

Base actuelle conservée : **Inter** (texte), **Bebas Neue** (titres condensés). Échelle formalisée (remplace les tailles en `rem` dispersées et parfois incohérentes relevées dans le code, ex. titres de section entre 0.85rem et 1.05rem selon l'écran sans règle apparente) :

| Niveau | Usage | Font | Taille | Weight | Letter-spacing |
|---|---|---|---|---|---|
| Display | Titre de page (ex. "STATISTIQUES JOUEURS") | Bebas Neue | 1.4rem | 400 | 1.5px |
| Section | Titre de bloc/carte (ex. "ENCLENCHEMENTS OFFENSIFS") | Bebas Neue | 1.05rem | 400 | 1px |
| Onglet | Libellé d'onglet actif/inactif (nav Analyse, mode joueur) | Inter | 0.85rem | 700 | 0.3px |
| Corps | Texte courant, labels de tableau | Inter | 0.82rem | 400-600 | normal |
| Valeur clé | Chiffre mis en avant (KPI, stat) | Inter | 1.3-1.8rem | 800 | -0.5px |
| Micro | Sous-labels, footnotes | Inter | 0.68-0.72rem | 600-700 | 0.4px, UPPERCASE |

**Règle de hiérarchie :** dans une carte, il ne doit jamais y avoir plus de 3 niveaux typographiques simultanés (ex. Section + Valeur clé + Micro). Le code actuel empile parfois 4-5 tailles différentes dans une même carte (ex. cards famille enclenchement) — à assainir en priorité.

---

## 3. Ombres & élévation

Les 4 tokens `--shadow-sm/md/lg/xl` existent déjà mais sont peu utilisés dans le code actuel (la plupart des cartes utilisent une simple bordure `1px solid #E2E8F0`, plate). On introduit une échelle d'élévation à 3 niveaux, appliquée systématiquement selon le rôle de la carte :

```css
/* Niveau 0 — carte standard (contenu de liste, ligne de tableau) */
.surface-flat { border: 1px solid var(--gray-200); box-shadow: none; }

/* Niveau 1 — carte de contenu (bloc Analyse, fiche joueur) */
.surface-card {
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  border-radius: 12px;
  transition: box-shadow 150ms ease, transform 150ms ease;
}
.surface-card:hover { box-shadow: var(--shadow-md); }

/* Niveau 2 — carte proéminente (résumé match, bloc terrain, signature joueur) */
.surface-hero {
  border: none;
  box-shadow: var(--shadow-lg);
  border-radius: 14px;
}
```

**Coins arrondis** — actuellement incohérents (4px à 16px selon les composants relevés dans le code). Échelle fixée : `8px` (petits éléments : badges, boutons), `12px` (cartes standard), `14-16px` (cartes proéminentes, modales/panneaux).

---

## 4. États interactifs

| Élément | Normal | Hover | Focus | Active | Disabled |
|---|---|---|---|---|---|
| `.nav-btn` (page) | fond `--fenix-blue`, texte blanc | — (déjà l'état actif porte le sens) | outline 2px `--fenix-accent`, offset 2px | fond `--fenix-blue-light` | — |
| `.nav-dropdown` (Outils) | fond transparent, bordure `--gray-200` | fond `--gray-50`, bordure `--fenix-blue` | outline 2px `--fenix-accent` | fond `--gray-100` | opacity 0.5 |
| Onglet Analyse (`.tab-btn`) | texte `--gray-600` | texte `--fenix-blue` | outline 2px `--fenix-accent` | soulignement 2px `--fenix-blue`, texte `--fenix-blue` 700 | — |
| `.surface-card` (carte cliquable) | `--shadow-sm` | `--shadow-md` + `translateY(-1px)` | outline 2px `--fenix-accent`, offset 2px | `translateY(0)` | opacity 0.4, cursor default |
| Bouton primaire (`ACCÉDER`, `CRÉER LE COMPTE`) | fond `--fenix-blue` | fond `--fenix-blue-light` | outline 2px `--fenix-accent`, offset 2px | `scale(0.98)` | fond `--gray-200`, texte `--gray-400` |

**Contrainte de rapidité (déjà une règle du projet, cf. mindset) :** toutes les transitions ≤ 200ms, `ease` ou `ease-out` — jamais de courbe "bounce"/"elastic" sur un outil de travail consulté en vestiaire entre deux séances.

---

## 5. Micro-animations

| Composant | Trigger | Propriété | Durée | Easing |
|---|---|---|---|---|
| Changement d'onglet (Analyse, mode joueur) | clic | `opacity` 0→1 sur le contenu entrant | 150ms | ease-out |
| Panneau latéral Comptes/Vue joueur (§3 Design) | ouverture | `transform: translateX(100%→0)` + overlay `opacity 0→0.55` | 200ms | ease-out (déjà la durée utilisée pour `.enc-coverage-banner`, cf. code existant — on la reprend pour rester cohérent) |
| Carte au survol (`.surface-card`) | hover | `box-shadow` + `translateY` | 150ms | ease |
| Badge d'alerte sur onglet (point rouge non-lu, cf. Design §2) | apparition | `scale(0→1)` | 200ms | ease-out avec léger overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`) — seule exception "rebond", volontaire pour capter l'œil sur un signal d'alerte |
| Chargement de fichier Excel | pendant le parsing | pas de nouvelle animation — le spinner/état actuel est suffisant, ne pas ajouter de superflu ici |

---

## 6. Checklist contraste WCAG

| Paire | Contexte | Ratio | Verdict |
|---|---|---|---|
| `#FFFFFF` sur `#0A2463` (--fenix-blue) | Boutons/nav actifs | 11.9:1 | ✅ AAA |
| `#0F172A` (--fenix-dark) sur `#FFFFFF` | Texte principal | 17.7:1 | ✅ AAA |
| `#64748B` (--gray-600) sur `#FFFFFF` | Labels/texte secondaire | 4.6:1 | ✅ AA (texte normal) |
| `#94A3B8` (--gray-400) sur `#FFFFFF` | Micro-labels uniquement, jamais de texte porteur d'info | 2.8:1 | ⚠️ sous le seuil AA — usage restreint aux éléments strictement décoratifs/redondants (ex. flèche de tri déjà accompagnée d'un libellé) |
| `#FFFFFF` sur `#10B981` (--fenix-success) | Badges succès | 2.4:1 | ⚠️ insuffisant pour du texte — utiliser `#065F46` (vert foncé) sur fond `#D1FAE5` (vert très clair) à la place, comme déjà fait pour d'autres badges du code existant |
| `#FFFFFF` sur `#EF4444` (--fenix-danger) | Badges erreur | 3.8:1 | ⚠️ limite — même traitement : `#991B1B` sur `#FEE2E2` pour tout badge texte |

**Action Developer :** les badges pleins rouge/vert existants (`--fenix-success`/`--fenix-danger` en fond avec texte blanc) doivent être audités un par un et basculés vers le pattern "texte foncé sur fond clair" partout où c'est du texte informatif — garder le fond plein uniquement pour les indicateurs sans texte (points, barres).
