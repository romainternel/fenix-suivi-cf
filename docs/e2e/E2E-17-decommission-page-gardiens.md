# E2E-17 — Décommissionnement de la page orpheline `page-gardiens` (STORY-29)

**Agent :** E2E Tester
**Date :** 2026-09-01
**Outil :** MCP Playwright, serveur statique local (port 8982)

---

## Parcours testés

### 1. Chargement et navigation générale
1. Connexion staff, import de données réel (364 lignes)
2. 0 erreur console au chargement

### 2. Non-régression STORY-27 après suppression
1. Sélection de Gabin SALTEL → "🎯 Impact" → `page-impact` (toujours), 6/16, 38%
2. `_impactIsGB === true` confirmé

### 3. Bug tooltip découvert et corrigé — test explicite dans les deux sens
1. Simulation d'un `mousemove` sur un point réel du canvas (gardien, but encaissé) → tooltip affiche `✕` rouge
2. Même test sur un joueur de champ (but marqué) → tooltip affiche `●` vert
3. Les deux comportements corrects, confirmés par inspection du HTML généré du tooltip (pas juste visuel)

### 4. Navigation et changement de saison
1. Changement de saison via `#filter-saison`
2. Navigation Dashboard → Analyse → Joueurs
3. 0 erreur console dans tous les cas

## Résultat

Tous les parcours passent en conditions réelles. Le nettoyage n'a introduit aucune régression, et a permis de découvrir/corriger un vrai bug (tooltip) qui serait resté invisible sans ce passage.

---

## Verdict : ✅ PASSED
