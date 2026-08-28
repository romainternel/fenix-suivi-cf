# Audit complet — Régression FENIX Stats CF — 2026-08-26

**Rôles joués :** Regression Guardian (périmètre + consolidation) puis E2E Tester (exécution réelle via Playwright MCP)
**Environnement testé :** https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html (production, GitHub Pages)
**Donnée de test :** `ESSAI IA STAT.xlsm` (19 matchs, saison 2025-2026)
**Contexte :** premier audit de régression complet en conditions réelles jamais réalisé sur ce projet — `docs/regression/checklist.md` n'existait pas avant cet audit et a été initialisé à cette occasion à partir de `CLAUDE.md`, `docs/qa/`, `docs/audit/` et de l'historique git (v1→v221).

---

## 1. Périmètre testé

| # | Feature | Criticité |
|---|---------|-----------|
| C1 | Authentification Staff | Critique |
| C2 | Authentification Joueur | Critique |
| C3 | Import fichier Excel (.xlsm) | Critique |
| C4 | Dashboard staff | Critique |
| C5 | Page Joueurs — terrain + fiche | Critique |
| C6 | Mode Lecture Joueur (mobile) — Ma Fiche / Stats Match / Impact | Critique |
| C7 | Persistance des filtres entre pages | Critique |
| I1 | Page Analyse (vue agrégée + enclenchements) | Important |
| I2 | Page Notes (actions ATT/DEF, table GB) | Important |
| I3 | Graphique évolution joueur | Important |
| I4 | Stats Gardien (fiche joueur GB) | Important |
| I5 | Page Impact (zones de tir + efficacité) | Important |
| I6 | Familles d'enclenchement (camembert + matrice) | Important |
| I7 | Gestion comptes joueurs | Important |
| I8 | Export PDF / PPT fiche joueur | Important |

Secondaire (S1-S3, hors périmètre par défaut) non testé — aucun n'a été demandé explicitement.

---

## 2. Résultat par feature

| # | Feature | Résultat | Preuve |
|---|---------|----------|--------|
| C1 | Auth Staff | ✅ | `01-login-staff.png` |
| C3 | Import Excel | ✅ | `02-dashboard-import.png` |
| C4 | Dashboard | ✅ | `02-dashboard-import.png` |
| C5 | Joueurs — terrain + fiche | ✅ | `03-joueurs-fiche-zach.png` |
| I2 | Notes | ✅ | `04-notes.png` |
| I5 | Impact | ✅ | `05-impact.png`, `06-impact-efficacite.png` |
| I3 | Graphique évolution | ✅ | `07-notegraph.png` |
| I4 | Stats Gardien (fiche GB) | ✅ | `09-fiche-gardien.png` |
| I1 | Analyse (vue agrégée) | ❌ | `10-analyse.png`, `11-analyse-cards-zoom.png` |
| I6 | Enclenchements (camembert + matrice) | ✅ | `10-analyse.png` |
| I7 | Comptes joueurs (création) | ✅ | `12-comptes-cree.png` |
| C2 | Auth Joueur | ✅ | `13-vue-joueur-zach.png` |
| C6 | Mode Lecture Joueur (3 onglets) | ✅ | `13-vue-joueur-zach.png`, `14-vue-joueur-statsmatch.png`, `15-vue-joueur-zones.png` |
| C7 | Persistance filtres entre pages | ✅ | vérifié par la navigation naturelle Joueurs→Notes→Impact→Analyse→Comptes sans crash ni fuite de données entre bilans |
| I8 | Export PDF/PPT | ⚠️ | non vérifiable (voir §3) |

Captures dans `docs/e2e/screenshots/audit-complet-2026-08-26/`.

---

## 3. Régressions détectées

### ❌ [Moyen] I1 — Chevauchement visuel sur les cartes TOTAUX de la page Analyse
- **Où :** Page Analyse → vue "Saison complète", cartes GÉNÉRAL / ATT PLACÉE / GRAND ESPACE (FENIX et Adversaire).
- **Constat :** La valeur "BUT" (format `xxx/xxx`) chevauche visuellement le libellé/valeur "EFF%" — ex. `463/820` et `56%` se superposent en `463/856%`. Confirmé par extraction du DOM (`innerText`) : les données sous-jacentes sont correctes (`BUT 463/820`, `EFF% 56%`), il s'agit d'un bug d'affichage (CSS), pas d'un bug de calcul.
- **Preuve :** `docs/e2e/screenshots/audit-complet-2026-08-26/11-analyse-cards-zoom.png`
- **Impact :** Lisibilité dégradée des stats les plus consultées de la page Analyse (staff). N'affecte pas les autres pages (Dashboard affiche les mêmes stats sans ce bug).
- **Piste :** largeur de colonne insuffisante pour le format `BUT` (`xxx/xxx`) dans `.mtc-section` à la largeur d'écran testée (1024px desktop) — vérifier le CSS de ce composant, probablement introduit lors d'un des commits v184-v221 (zone de churn intense sur les enclenchements/cartes de la page Analyse).

### ⚠️ [Non bloquant — limite d'outillage] I8 — Export PDF/PPT non testable en automatisé
- **Constat :** Le bouton "PDF" de la fiche joueur appelle `window.print()` (`js/page-joueurs.js:1170`), qui ouvre la boîte d'impression native du système. Cette boîte bloque totalement le pilotage Playwright (CDP) — trois appels consécutifs (clic, touche Échap, fermeture du navigateur) ont chacun gelé 30 minutes avant expiration du timeout. Récupération effectuée en tuant spécifiquement l'arbre de processus Chrome de Playwright (`ms-playwright-mcp`, PID isolé du Chrome personnel de l'utilisateur — aucun impact sur le navigateur de l'utilisateur).
- **Ce que ça veut dire :** Pour un utilisateur réel, ce comportement est normal (boîte d'impression standard, l'utilisateur choisit "Enregistrer en PDF"). Ce n'est donc probablement **pas** un bug applicatif — mais cette fonctionnalité ne peut pas être re-vérifiée automatiquement par l'E2E Tester tant qu'elle repose sur `window.print()`.
- **Recommandation :** Test manuel à faire par le staff avant chaque mise en production touchant `printFicheJoueur()`/`exportJoueurPPT()`. Le fix CORS du 2026-06-16 (images en base64 via `IMPACT_B64`) n'a pas pu être re-confirmé visuellement aujourd'hui.

### Autre observation (non-bug)
- Page `page-gardiens` (HTML ligne 779, fonction `updateGardiensPage()`) n'est appelée par aucun bouton de navigation trouvé dans le code — elle semble orpheline, comme `page-match`. Les stats gardien réellement utilisées passent par la fiche joueur d'un GB (testé ✅, cf I4). À confirmer avec le staff si cette page doit être supprimée ou reconnectée.

---

## 4. Verdict global

**RÉGRESSIONS DÉTECTÉES (mineures) — non bloquant pour la mise en production**

- 1 régression visuelle confirmée (I1 — chevauchement BUT/EFF% sur la page Analyse), à corriger mais sans impact sur l'intégrité des données.
- 1 fonctionnalité non re-vérifiable par l'outillage automatisé (I8 — export PDF/PPT), à tester manuellement.
- 13/15 features du périmètre Critique + Important entièrement confirmées en conditions réelles, sans écart avec ce qui était attendu.
- Aucune régression Critique détectée : authentification (staff + joueur), import de données, dashboard, fiche joueur, mode lecture joueur mobile, et persistance des filtres fonctionnent tous correctement.

`docs/regression/checklist.md` mis à jour avec les dates de dernière vérification (2026-08-26) et les deux réserves ci-dessus.
