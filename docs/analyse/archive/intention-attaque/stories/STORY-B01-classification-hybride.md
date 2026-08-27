# STORY-B01 — Classification hybride par ligne + signalement des orphelins

**En tant que** coach FENIX,
**Je veux** que chaque tir soit classé via `Intention attaque` quand elle est renseignée (sinon via l'ancien texte libre), et que toute intention non reconnue par le catalogue soit signalée plutôt que silencieusement rangée dans "Autre",
**Afin de** ne jamais perdre de visibilité sur un tir mal catalogué, tout en gardant les saisons passées identiques à avant.

## Contexte technique
- Zone concernée : `js/page-analyse.js`, nouvelle fonction `getFamilleForRow(row)` — point d'entrée unique de classification.
- `getEncFamille(encStr)` (existante, `~ligne 1302`) **n'est pas modifiée** — sert uniquement de repli legacy.
- `_ENC_FAMILLE_CUSTOM` (localStorage `enc_famille_custom`) reste l'unique mécanisme de réassignation manuelle, maintenant consulté aussi pour les intentions normalisées (pas seulement le texte libre).
- `COLS.intentionAttaque = 21` avec garde-fou de vérification d'en-tête (cf. `docs/analyse/ARCH-intention-attaque.md` §1.2) — si l'en-tête à l'index 21 n'est pas "Intention attaque", chercher l'index réel dans la ligne d'en-tête.
- Dépend de `INTENTION_FAMILLE_MAP` construite en STORY-B00.
- Cas de test réel : match `AMICAL FENIX-L'UNION` dans `ESSAI IA STAT.xlsm` — 4 lignes avec `Intention attaque = "BLOC"` (absent du catalogue de 16 entrées).

## Critères d'acceptation
- [ ] `getFamilleForRow(row)` avec `row[COLS.intentionAttaque] = "ISO 3"` retourne `"Isoler"`.
- [ ] `getFamilleForRow(row)` avec `row[COLS.intentionAttaque] = "BLOC"` (absent du catalogue) retourne `"Non classifié"` — **jamais** `"Autre"`, **jamais** une famille devinée.
- [ ] Les 4 lignes réelles à `"BLOC"` du match test remontent bien en "Non classifié" après import, vérifiable dans la card correspondante (pas seulement en test unitaire isolé).
- [ ] `getFamilleForRow(row)` avec `row[COLS.intentionAttaque]` vide et `row[COLS.enclenchement] = "8;0;Bloc 4"` retourne exactement ce que retournait `getEncFamille("8;0;Bloc 4")` avant ce chantier (non-régression stricte, testé par comparaison directe des deux appels).
- [ ] `getFamilleForRow(row)` avec les deux colonnes vides retourne `"Autre"` sans exception (comportement identique à l'existant pour ce cas).
- [ ] Une réassignation manuelle via `enc_famille_custom` sur une intention orpheline (ex. assigner `"BLOC"` → `"Jeu Pivot"`) est immédiatement respectée par `getFamilleForRow` sans réimport du fichier.
- [ ] Réimporter une saison 100% legacy (ex. saison 2025-2026 utilisée lors de l'audit du 2026-08-26, si le fichier est disponible pour test) produit des pourcentages par famille strictement identiques à ceux observés avant ce chantier.

## Hors scope
- L'affichage du bandeau de couverture et de la card enrichie (STORY-B04).
- La dérivation dynamique de la liste des familles affichées et la migration des sites d'affichage (STORY-B02).

## Dépend de
- STORY-B00

## Taille
M
