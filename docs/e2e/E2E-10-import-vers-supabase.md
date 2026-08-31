# E2E-10 — STORY-21 : Import Excel → Supabase

**Agent :** E2E Tester
**Date :** 2026-08-31
**Environnement :** local, session Playwright fraîche — `localStorage`/`sessionStorage` vidés, login staff réel au clavier (`#login-input` + Enter)

---

## Parcours testé

| # | Parcours | Résultat | Preuve |
|---|---|---|---|
| 1 | Session fraîche (aucune donnée locale) → login réel → import réel `ESSAI IA STAT.xlsm` → Dashboard | ✅ | `01-dashboard-apres-import.png` |
| 2 | Vérification indépendante du comptage `match_data` après ce 3e import (les 2 premiers ayant été faits par le Developer) | ✅ | `364` lignes, identique aux imports précédents — confirme l'absence de duplication sur un troisième cycle complet, depuis une session qui n'a jamais touché le code |

## Constat
Le Dashboard affiche exactement les mêmes chiffres que lors des tests du Developer (27/48 buts FENIX, 30/54 Adversaire, etc.), confirmant que la synchronisation Supabase ne perturbe en rien le rendu local. Le comptage `match_data` (364 lignes) reste stable après ce troisième import consécutif du même fichier — la logique de remplacement complet de `replaceTable()` est robuste au-delà des deux essais initiaux du Developer.

## Écarts avec le verdict QA
Aucun.

## Verdict

**✅ CONFIRMÉ**
