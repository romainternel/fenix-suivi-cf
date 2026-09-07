# Design — Recentrage collectif du mode Articulation (charnières défensives)

**Agent :** Designer
**Date :** 2026-09-07

---

## 1. Principe général

Inversion de la hiérarchie visuelle actuelle : les 3 charnières (+ Référence) passent AVANT le terrain dans l'ordre de lecture, en grand format ; le terrain devient un simple plan d'identification (qui est où), sans aucune évaluation dessus. Le bandeau de contrôles reste au-dessus de tout (inchangé dans son principe, seul le libellé du toggle Affichage change, cf. §4).

## 2. Maquette ASCII

```
┌───────────────────────────────────────────────────────────────────┐
│  🛡 DÉFENSE FENIX — INTENTION ATTAQUE ADVERSES     [Attaque][Défense]│
│  [Vue générale] [Matrice 2×2] [🎯 Articulation]                     │
├───────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │  DISPOSITIF   [ 0-6 (116 séq.) ] [ 1-5 (13 séq.) ]             │ │
│ │  COMPOSITION  [ Le + utilisée ]  [ 💡 Suggestion ]             │ │
│ │  ⚙ 2 postes modifiés manuellement · [Réinitialiser]             │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  🛡️ CHARNIÈRES DÉFENSIVES — % de séquences arrêtées               │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐│
│ │  RÉFÉRENCE    │ │  À 6 (LIGNE)  │ │  À 4 (CENTRE) │ │ À 2 (CŒUR)││
│ │  (0-6, global)│ │  P1→P6        │ │  P2-P3-P4-P5  │ │  P3-P4   ││
│ │               │ │               │ │               │ │          ││
│ │     52%       │ │  aucune séq.  │ │  aucune séq.  │ │   63%    ││
│ │   116 séq.    │ │  avec ce      │ │  avec ce      │ │  43 séq. ││
│ │               │ │  groupe       │ │  groupe       │ │          ││
│ └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘│
│                                                                     │
│              ┌─────────────────────────────────────┐              │
│              │▓▓▓▓▓▓▓▓▓▓▓▓░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← but        │
│              │      ___________________            │              │
│              │    ╱                     ╲           │  ← ligne 6m  │
│              │(P1)                       (P6)       │              │
│              │  (P2)                   (P5)          │              │
│              │      (P3)         (P4)                │              │
│              │           ⌒⌒⌒⌒⌒⌒⌒⌒                     │              │
│              └─────────────────────────────────────┘              │
│              Zacharie.D  Louis.M  Lukas.J  Marius.C  Leni.A  Isaac.M│
│                                                                     │
│ ┌─ P3 — joueurs vus à ce poste ──────────────────────────────────┐ │  ← au clic sur un poste
│ │ Lukas.J     70 séq.                                            │ │
│ │ Isaac.M     31 séq.                                            │ │
│ │ ─────────────────────────────────────────────────────────────│ │
│ │ Voir un autre joueur à ce poste : [— Auto (le + utilisée) — ▾] │ │
│ └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

Chaque rond du terrain n'affiche plus que le nom (2 lignes : `P3` / `Lukas.J`) — plus aucun liseré de couleur. Le badge `+N` et le marqueur `✎` restent (ils indiquent une information factuelle — "il y a d'autres joueurs possibles ici" / "tu as forcé ce choix" — pas une évaluation).

## 3. Réponse aux questions en suspens du Brief

**Devenir de "Top Def" → renommé "💡 Suggestion".** Il ne s'appelle plus "Top Def" (qui sous-entendait un chiffre individuel) mais "💡 Suggestion" : en interne, le mécanisme reste identique (choisit le joueur individuellement le plus économe par poste, `_articPrimaryEntry`), mais aucune valeur individuelle n'apparaît nulle part — seul son EFFET est visible : la composition change sur le terrain, et l'utilisateur regarde alors si CETTE composition obtient une bonne charnière collective dans les 4 cartes du haut. Le tooltip du bouton l'explique explicitement (cf. Visual).

**Contenu du panneau de détail par poste → liste + fréquence, sans %.** Le panneau garde son utilité première (voir qui a joué ce poste, pour choisir manuellement quelqu'un d'autre en connaissance de cause) mais perd toute colonne de performance. Le tri reste par nombre de séquences décroissant (le plus utilisé en premier), qui est une information neutre (fréquence d'usage), pas une évaluation.

## 4. Bandeau de contrôles

Renommage du second toggle : "AFFICHAGE" → **"COMPOSITION"**, ses deux boutons "Le + utilisé" → **"Le + utilisée"** (accord avec "composition", féminin) et "🏆 Top Def" → **"💡 Suggestion"**. Fonctionnement inchangé (bascule `window._articViewMode`), seul l'habillage textuel change pour ne plus évoquer un jugement de performance individuelle.

## 5. Charnières défensives (élément central)

4 cartes de même gabarit, dans l'ordre : Référence, À 6, À 4 (Central), À 2 (les deux centraux) — reprennent exactement les 3 blocs déjà calculés (`ARTIC_BLOCKS`) + la référence globale, mais :
- Affichées EN PREMIER, immédiatement sous le bandeau de contrôles et un titre de section ("🛡️ CHARNIÈRES DÉFENSIVES — % de séquences arrêtées") qui pose explicitement le sens de lecture.
- Le % est désormais un taux de réussite défensive (haut = bon), couleur verte pour les valeurs hautes.
- Renommage des libellés pour un langage plus parlant : "Bloc Total" → **"À 6 (ligne complète)"**, "Bloc Central (P2-P5)" → **"À 4 (centre)"**, "BLOC34 (P3-P4)" → **"À 2 (les deux centraux)"** — le vocabulaire "charnière défensive à N" de Romain devient le vocabulaire affiché à l'écran, pas une notation technique (P2-P5, etc., reléguée en sous-texte discret).

## 6. Terrain (élément secondaire, identification uniquement)

Position inchangée (STORY-36, courbe du 6m). Simplification :
- Suppression du liseré de couleur (`.artic-poste.fort/.moyen/.faible/.noref`).
- Ajout, sous le terrain, d'une ligne récapitulative discrète listant les 6 noms dans l'ordre P1→P6 (texte simple, pas un nouveau composant graphique) — utile pour lire d'un coup d'œil la composition sans avoir à regarder 6 ronds séparément, en écho direct à ce que les cartes de charnières évaluent.
- Badge `+N` et marqueur `✎` conservés tels quels (informations factuelles, pas des évaluations).

## 7. États

- **Charnière sans séquence correspondante** : "aucune séquence avec ce groupe" (inchangé dans le principe, texte identique).
- **Poste sans donnée** : rond semi-transparent, "—" (inchangé).
- **Panneau de détail vide** (aucun historique pour ce poste) : "Aucune donnée pour ce poste" (inchangé, sans la partie % qui disparaît).

## 8. Responsive

Les 4 cartes de charnières passent en grille 2×2 sous ~700px (comportement déjà en `flex-wrap` depuis STORY-36, conservé). Le titre de section ("🛡️ CHARNIÈRES DÉFENSIVES...") reste sur une ligne, wrap si nécessaire sur très petit écran (cas rare, page Analyse = desktop/iPad).

## 9. Composants réutilisés vs nouveaux

**Réutilisés :** `_articCourtSvg()`, `ARTIC_LAYOUTS`/`_articArcY` (positions), `_articBlockEff()`, `ARTIC_BLOCKS` (structure des 3 blocs), `_articPrimaryEntry()` (mécanique de composition, y compris en mode Suggestion), le panneau de détail et son sélecteur (`_setArticManualJoueur`), le bandeau de contrôles (`.artic-control-bar`, STORY-36).

**Nouveaux :** la fonction de dérivation du % de réussite défensive (Architecture §1), le titre de section des charnières, la ligne récapitulative des 6 noms sous le terrain, les nouveaux libellés ("À 6"/"À 4"/"À 2"/"💡 Suggestion"/"COMPOSITION").

**Retirés :** `.artic-poste-eff`-like liseré individuel (déjà réduit à une classe CSS en STORY-36, supprimée ici), la colonne % du panneau de détail.
