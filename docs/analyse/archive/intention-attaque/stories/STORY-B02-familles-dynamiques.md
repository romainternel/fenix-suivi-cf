# STORY-B02 — Dérivation dynamique des familles affichées

**En tant que** coach FENIX,
**Je veux** que la liste des familles affichées (cards, camembert, matrice, tableau V/D, saison V/D, chat IA) reflète automatiquement les données réellement chargées,
**Afin de** ne plus jamais avoir besoin d'un développeur pour faire apparaître un nouveau système que j'ai ajouté dans mon Excel.

## Contexte technique
- Zone concernée : `js/page-analyse.js`, remplacement de `ENC_FAMILLES_ORDRE` (constante figée, ligne 59), `ENC_FAMILLE_COLORS` (ligne 60) et `ENC_FAMILLE_IDS` (ligne 67).
- Nouvelles fonctions : `getActiveFamilles()`, `getFamilleColor(f)`, `getFamilleId(f)` — cf. `docs/analyse/ARCH-intention-attaque.md` §1.4.
- `ENC_FAMILLE_COLORS_BASE` / `ENC_FAMILLE_IDS_BASE` conservent les entrées existantes (dont `Bloc PVT` et `Rebond`, toujours nécessaires pour les saisons legacy) + `Jeu Rapide` ajoutée (cf. `docs/analyse/VISUAL-intention-attaque.md` — `--enc-jeu-rapide: #4F46E5`).
- **15 sites d'appel recensés** dans `page-analyse.js` (lignes indicatives, à revérifier au moment du dev car le fichier évolue) : 462, 1330, 1355, 1450, 1456-1457, 1501, 1628, 1769, 1772, 1864, 2006, 2060, 2065, 2275, 2323, 2334, 2419, 2449 — chaque site doit être migré individuellement, pas par un simple renommage global (certains itèrent en incluant `'Autre'`, d'autres non — préserver ce comportement).
- Cache : `_familles_actives`, recalculé uniquement à l'import (`processFile`) et lors d'une réassignation manuelle (`enc_famille_custom` modifié) — pas à chaque `updateAnalysePage()`.

## Critères d'acceptation
- [ ] Après import du match test, `getActiveFamilles()` retourne les 8 familles du nouveau catalogue (`Isoler`, `7vs6`, `Jeu Pivot`, `Faire Courir`, `Rentree`, `Speciaux`, `6vs5`, `Jeu Rapide`) — ni `Bloc PVT` ni `Rebond` (absents des données de ce match).
- [ ] Une famille inédite non prévue dans `ENC_FAMILLE_COLORS_BASE` (scénario futur hypothétique) reçoit une couleur de repli (`--enc-autre`) et un ID généré, sans casser le rendu.
- [ ] Ajouter une 17ᵉ ligne dans la feuille Excel `Enclenchements` (nouvelle famille) et réimporter fait apparaître cette famille dans les cards **sans modification de code**.
- [ ] `_familles_actives` n'est pas recalculé à chaque appel de `updateAnalysePage()` (vérifiable par un `console.count` temporaire pendant le dev, retiré avant commit).
- [ ] Le `?v=` est bumped.

## Hors scope
- La vérification visuelle transversale entre camembert/matrice/cards (STORY-B03, dédiée).
- Le style CSS de la nouvelle couleur (déjà spécifié par le Visual Crafter, juste à appliquer).

## Dépend de
- STORY-B01

## Taille
L
