# Design — Page Impact pour un gardien

**Agent :** Designer
**Date :** 2026-09-01

---

## Principe général

Aucun nouvel écran, aucun nouveau composant visuel — `page-impact` existe déjà et fonctionne bien pour un joueur de champ. On y ajoute : (1) un intitulé nom du joueur, pour les deux cas ; (2) un vocabulaire qui s'adapte selon joueur de champ / gardien (labels des stats, labels de la légende) ; (3) les mêmes 3 vues terrain et la grille de zone, alimentées par la bonne source de données selon le cas.

## F2 — Nom du joueur affiché (maquette)

Ajouté juste sous le titre de section, au-dessus de la ligne filtres/stats — même position que le sous-titre déjà utilisé ailleurs dans l'app pour ce genre de contexte (cf. fiche joueur, `_subHdr` dans l'export PDF, qui fait déjà "Nom · Période").

```
┌──────────────────────────────────────────────────────────────┐
│  🎯 IMPACT AU SHOOT          [Période ▾] [🎨 Efficacité] [🔀]│
│  Enzo Ditta — Gardien de but                                  │
├──────────────────────────────────────────────────────────────┤
│  [Joueur ▾] [Résultat ▾]              15 / 40   |   38%       │
│                                        ARRÊTS      EFFICACITÉ │
│                                        TIRS SUBIS              │
└──────────────────────────────────────────────────────────────┘
```

- Quand aucun joueur n'est sélectionné ("Tous les joueurs") : `Tous les joueurs` à la place du nom, en `--gray-600`, pas en gras — cohérent avec l'état "vue d'ensemble" déjà présent ailleurs (ex. Dashboard sans filtre).
- Le poste est affiché à côté du nom (`— Gardien de but` / `— Ailier Gauche` etc., réutilise le mapping `_posteLblMap` déjà existant dans `printFicheJoueur()`) — donne le contexte sans avoir à deviner depuis les stats.
- Style : `font-size: 0.85rem; color: var(--gray-600); font-weight: 600;` pour le nom, poste en `font-weight: 400`, même ligne — cohérent avec les sous-titres déjà utilisés dans l'app (pas un nouveau token).

## F1 — Vocabulaire adaptatif selon le type de joueur sélectionné

| Élément | Joueur de champ (inchangé) | Gardien (nouveau) |
|---|---|---|
| Stat 1 (gauche) | `BUTS` | `ARRÊTS` |
| Stat 2 (centre) | `TIRS` | `TIRS SUBIS` |
| Stat 3 (droite) | `EFFICACITÉ` (% de réussite) | `EFFICACITÉ` (% d'arrêt — même libellé, le sens s'inverse naturellement) |
| Option filtre Résultat | `But` / `Tir raté` | `But encaissé` / `Arrêt` |
| Légende sous les 3 vues terrain | point vert = but, croix rouge = tir raté (déjà en place) | point vert = arrêt, croix rouge = but encaissé (même code couleur, sens inversé — cohérent avec la légende déjà utilisée par `printFicheJoueur()` pour l'export PDF d'un gardien : `${isGB ? 'Arrêt' : 'But'}` / `${isGB ? 'But encaissé' : 'Tir raté'}`) |

**Aucun changement de layout** — uniquement les libellés textuels générés dynamiquement selon `isGbSelected` (le calcul existe déjà dans `updateZoneEfficacite()`, à réutiliser/remonter au niveau de `updateImpactPage()`).

**Correction incidente repérée en marge** (à faire ou signaler, pas bloquant) : l'option actuelle `<option value="Tir raté">Tir arrêté</option>` du filtre Résultat a un libellé "Tir arrêté" pour un `value="Tir raté"` — mismatch déjà présent avant ce cycle, sans lien avec le bug gardien. Pas dans le scope de cette story sauf si le Developer le corrige au passage puisqu'il touche ce même bloc de filtre.

## F5 (Nice to Have, non maquetté en détail) — Grille Efficacité par zone

Si retenue : mêmes cellules `zr-cell` déjà existantes, coloration par seuil désactivée pour un gardien (pas de `ZONE_SEUILS` pertinents pour ce poste) — afficher la grille en mode neutre (pourcentage sans couleur sémantique) plutôt que d'inventer de nouveaux seuils sans données de référence. Décision finale laissée à l'Architect/Developer selon l'effort réel, cette feature reste Nice to Have.

## États

- **Chargement/vide** : identique à l'existant — `impact-eff` affiche `—` si `pct === null` (déjà géré, pas de changement).
- **Gardien sans aucun tir subi** (cas rare, ex. gardien n'ayant jamais joué) : mêmes cartes à 0, mêmes 3 terrains vides — comportement déjà correct pour ce cas côté joueur de champ (`impact-total`/`impact-buts` à 0), pas de nouvel état à concevoir.
- **Erreur silencieuse actuelle** (0 partout pour un gardien à cause du bug) : disparaît avec le fix, pas un état à concevoir mais le bug que ce cycle corrige.

## Responsive

Aucun changement — la page Impact desktop n'est pas concernée par le mode joueur mobile (page distincte, `js/player-mode.js`, à vérifier séparément en F3 mais sans nouvelle maquette : le pattern mobile existant pour l'Impact joueur de champ s'applique tel quel si F3 ne révèle pas d'écart).

## Composants réutilisés (tout, rien de nouveau)

`.section-header`, `.goal-container`/`.goal-wrapper`, `#zone-rect-selector`/`.zr-cell`, boutons `.btn-comparer`, mapping `_posteLblMap` (déjà présent dans `js/page-joueurs.js`), tokens couleur `--gray-600` etc.
