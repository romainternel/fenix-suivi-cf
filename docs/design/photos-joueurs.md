# Design — Photos joueurs (portrait + corps entier)

**Agent :** Designer
**Date :** 2026-09-01

---

## 1. F1 — Avatar portrait (fiche joueur staff + mode joueur mobile)

Aucun changement de layout : la photo remplace uniquement le contenu de `.jp-avatar` (54px, rond, déjà bordé blanc semi-transparent) et `.pmf-avatar` (mode joueur). Le composant reste à la même taille/position — c'est un changement de contenu, pas de structure.

```
┌───────────────────────────────────────────────┐
│  ╭────╮   MARIUS CAUJOLLE                      │  ← .jp-header (dégradé bleu poste)
│  │ 📷 │   ARG — Arrière Gauche                  │
│  ╰────╯   ⏱ 3 matchs  ⌀ 30 min/match            │
│           [🖨️ PDF]  [📊 PowerPoint]             │
└───────────────────────────────────────────────┘
```
(`📷` = photo portrait réelle, recadrée en cercle via `object-fit: cover` ; si absente → `MC` initiales, comme aujourd'hui)

**États**
- Photo disponible → `<img>` en `object-fit:cover`, remplit le cercle.
- Photo absente / erreur de chargement → repli initiales (texte actuel), **avant même le premier paint si possible** (résolution synchrone du nom → URL, pas de flash "image cassée" puis fallback).
- Aucun état de chargement visible nécessaire (photos locales/légères, pas de latence réseau perceptible attendue — cf. Architecture pour le choix de stockage).

## 2. F3 — Bascule terrain ↔ photo corps entier

Déclencheur : clic sur l'avatar (`.jp-avatar`) du joueur **actuellement sélectionné**, uniquement si une photo corps entier existe pour lui. Curseur `pointer` sur l'avatar uniquement dans ce cas (sinon curseur par défaut, pas d'affordance trompeuse).

**État par défaut (terrain)**
```
┌─────────────────┐  ┌─────────────────────────┐
│                 │  │  ╭────╮  MARIUS CAUJOLLE │
│   [ TERRAIN ]   │  │  │ 📷 │← cliquable        │
│   • • •  •      │  │  ╰────╯  ARG              │
│   •  •    •     │  │  [🖨️ PDF] [📊 PPT]        │
│                 │  │  ─────────────────────── │
└─────────────────┘  └─────────────────────────┘
   .court-container      .joueur-right-col
```

**État basculé (photo corps entier)**
```
┌─────────────────┐  ┌─────────────────────────┐
│  [↩ Terrain]    │  │  ╭────╮  MARIUS CAUJOLLE │
│                 │  │  │ 📷 │                   │
│      👕         │  │  ╰────╯  ARG              │
│     corps       │  │  [🖨️ PDF] [📊 PPT]        │
│     entier       │  │  ─────────────────────── │
└─────────────────┘  └─────────────────────────┘
```
- Bouton **"↩ Terrain"** en haut de la zone `.court-container`, toujours visible en mode photo — c'est le retour explicite demandé par le PRD, pas uniquement un second clic sur l'avatar (l'utilisateur ne doit pas deviner qu'il faut re-cliquer sur un petit avatar à droite).
- La photo occupe la même zone que le terrain (même largeur/hauteur approximative que `#hb-court-svg`, `height: 70vh`), fond transparent du PNG affiché sur un fond neutre clair ou un dégradé bleu club discret (cohérent avec le fond terrain existant).
- **Changement de joueur pendant le mode photo** : retour automatique au terrain (comportement le plus prévisible — évite de garder affichée la photo d'un joueur qui n'est plus sélectionné). Répond à la question ouverte du PRD F3.
- **Joueur sans photo corps entier sélectionné** : l'avatar n'a pas de curseur pointer, le clic ne fait rien — pas de bouton "↩ Terrain" qui apparaîtrait pour rien.

## 3. F2 — Export PDF/PPT, page de couverture

Layout actuel de `pdf-slide-cover` (dans `printFicheJoueur()`) : logo rond centré en haut, nom en gros, poste, période — tout centré verticalement sur fond bleu dégradé plein cadre.

**Proposition — photo en bas à droite, façon carte de club**, le nom/texte restant sur sa colonne actuelle (pas de recadrage du texte existant) :

```
┌──────────────────────────────────────────────┐
│  ⚪ FENIX HANDBALL                             │
│  ─────────────────                            │
│      SUIVI HANDBALL                           │
│                                                │
│      MARIUS CAUJOLLE                          │
│      ARRIÈRE GAUCHE                    ┌────┐ │
│      ─────────────────                 │ 👕 │ │
│      Saison complète                   │corps│ │
│      3 matchs · 30 min/match           │entier│ │
│                                         └────┘ │
│  Centre de Formation                          │
└──────────────────────────────────────────────┘
```
- La photo corps entier est positionnée en bas à droite du slide, **bleedant légèrement hors cadre** (dépasse le bord bas), taille ~45% de la hauteur du slide — effet "carte joueur" plutôt que photo posée au milieu d'un espace vide.
- Le texte existant (nom, poste, période) n'est pas déplacé — juste éventuellement resserré à gauche si la photo empiète visuellement (à valider en Visual Crafter selon le ratio réel des photos fournies).
- **Sans photo** : slide strictement identique à l'actuel, aucun espace vide laissé par une photo absente.

## 4. Responsive

- F1/F3 concernent la page Joueurs desktop staff (`.joueurs-layout`, flex desktop) — pas de contrainte mobile spécifique nouvelle, le comportement existant (scroll horizontal si écran étroit) est inchangé.
- F1 sur mode joueur mobile (`player-mode.js`, `.pmf-avatar`) : même principe de remplacement photo/fallback, taille de l'avatar mobile inchangée.
- F3 n'existe pas en mode joueur mobile (pas de terrain interactif équivalent dans ce mode) — hors scope PRD, confirmé.
- F2 (export) n'a pas de variante mobile (l'export est une action staff desktop).

## 5. Composants réutilisés vs nouveaux

**Réutilisés** : `.jp-avatar`, `.pmf-avatar` (juste le contenu change), `.court-container` (devient le conteneur photo en mode basculé), structure de `pdf-slide-cover` (texte/logo inchangés).

**Nouveaux** : un petit composant "résolveur de photo" (JS, pas UI) commun aux 3 features — voir Architecture. Un bouton "↩ Terrain" (nouveau, style à définir par Visual Crafter en cohérence avec les autres boutons de la page, ex. `.jp-print-btn`).
