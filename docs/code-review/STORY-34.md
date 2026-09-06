# Code Review — STORY-34 (Mode "Articulation" : demi-terrain interactif par poste)

**Agent :** Code Reviewer
**Date :** 2026-09-02

---

## Diff revu

- `js/page-analyse.js` : +157 lignes — `ARTIC_POSTES`, `_resolveArticJoueur()`, `computeArticulationStats()`, `_articEffClass()`, `ARTIC_LAYOUTS`, `_drawArticulationCourt()`, `_setArticDispositif()`, `_selectArticPoste()`, extension de `renderEncFamillesSection()` (bouton mode), `_setEncTeamMode()` (reset auto), `_setEncGraphMode()`/`_drawEncChart()` (dispatch).
- `css/style.css` : +51 lignes, nouvelles classes `.artic-*` isolées, aucune classe existante modifiée.

## Conformité Architecture/Design

Conforme à `docs/arch/articulation-defensive.md` §2-3 et `docs/design/articulation-defensive.md` — le mode s'intègre bien comme 3e option dans `renderEncFamillesSection()` sans duplication entre vue match et vue saison (vérifié : aucun code spécifique à l'un ou l'autre contexte). Les deux layouts (0-6 / 1-5) correspondent aux maquettes.

## Réutilisation vs duplication

Bon niveau de réutilisation : `_escapeHtml()` (existant) réutilisé pour l'échappement, formule d'efficacité identique à `computeEncStats()`, pattern d'agrégation calqué sur `computeGbEncStats()` comme prévu.

## Scope

Dans le périmètre de la story. Le classement des charnières centrales (STORY-35) n'a pas été anticipé/codé en avance — correct, pas de scope creep.

## Point bloquant trouvé et déjà corrigé par le Developer avant cette review

`_resolveArticJoueur()` appelait `matchPlayerName(p.nom, raw)` — ordre des arguments inversé par rapport à la convention établie du projet (`matchPlayerName(excelName, terrainName)`, cf. `js/utils.js:91` et l'usage de référence dans `computeGbEncStats`). Avec cet ordre, la clause de garde de `_matchPlayerNameCore` (L77 : si le premier argument est déjà un nom canonique connu, retourne `false` sauf égalité stricte) bloquait silencieusement toute résolution d'un nom au format "prénom seul" — soit très exactement le risque R1 identifié par le Risk Analyst avant le développement. Le Developer a lui-même détecté ce bug en testant explicitement ce cas (`_resolveArticJoueur('Marius')` ne résolvait pas), corrigé (`matchPlayerName(raw, p.nom)`), et re-vérifié avant de livrer. Je confirme la correction en relisant le code — ordre désormais conforme à la convention établie.

## Lisibilité et maintenabilité

Code lisible, commentaires présents uniquement là où le "pourquoi" n'est pas évident (le choix du filtre `possession`, l'inversion de code couleur adverse). Les fonctions restent courtes et à responsabilité unique.

## Sécurité basique

Aucune clé/secret, aucune nouvelle requête réseau (travaille sur `DATA` déjà chargé en mémoire).

## Verdict

**APPROUVÉ** — le seul point réellement à risque (résolution de nom) a été trouvé et corrigé par le Developer lui-même, avec une vérification explicite avant livraison. Rien à reprendre. Prêt pour QA.
