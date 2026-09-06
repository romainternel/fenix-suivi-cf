# E2E-18 — Import des colonnes "Articulation défensive" (STORY-33)

**Agent :** E2E Tester
**Date :** 2026-09-02
**Outil :** MCP Playwright, contre la production réelle (https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html, v257)

---

## Parcours testés

1. Connexion staff (`Partage`) → accès dashboard, données existantes chargées (540 lignes, 4 matchs après le test — 539/3 avant)
2. Clic sur le badge de source de données (`#header-data-badge`) → ouverture du sélecteur de fichier natif
3. Upload du fichier Excel réel de Romain (`ESSAI IA STAT.xlsm`, contenant les colonnes `ARTICULATION DEF`/`P1`-`P6`) via `browser_file_upload`
4. Vérification côté client (`DATA`/`COLS`) : 166 lignes avec `articulation_def` renseigné, valeurs cohérentes avec le fichier source
5. Vérification indépendante côté serveur : requête REST directe sur `match_data` (clé publishable, hors app) confirmant les mêmes valeurs et les mêmes comptages (166/540 lignes taguées, `Content-Range` Supabase)

## Résultat par parcours

| # | Parcours | Résultat |
|---|---|---|
| 1 | Connexion + chargement boot | ✅ |
| 2 | Ouverture du sélecteur de fichier | ✅ |
| 3 | Upload et traitement du fichier | ✅ — 0 erreur console pendant tout le test |
| 4 | Données client cohérentes | ✅ |
| 5 | Données Supabase cohérentes (vérification indépendante hors app) | ✅ |

## Écart avec le verdict QA/Code Review

Aucun — les deux verdicts sont confirmés par ce test réel.

## Incident méthodologique (déjà documenté dans QA-20)

Un premier essai a montré 0 ligne taguée à cause d'un cache navigateur sur le document HTML principal (chargé avant le push du code). Résolu en rechargeant la page avec un paramètre d'URL anti-cache. N'affecte pas le verdict — un utilisateur réel visitant la page pour la première fois après un déploiement ne rencontre pas ce problème (seul un navigateur ayant déjà visité la page juste avant le push est concerné, et un rechargement simple suffit).

## Verdict

**CONFIRMÉ** — le parcours d'import fonctionne de bout en bout en conditions réelles, données vérifiées indépendamment côté serveur.
