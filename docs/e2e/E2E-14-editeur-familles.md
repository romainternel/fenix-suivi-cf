# E2E-14 — Écran d'édition des familles tactiques (STORY-25)

**Agent :** E2E Tester
**Date :** 2026-09-01
**Outil :** MCP Playwright, serveur statique local (port 8978), API REST Supabase pour vérification indépendante

---

## Parcours testés

### 1. Ouverture depuis le menu Outils
1. Connexion staff → "⚙ Outils" → 4 entrées visibles dans le bon ordre (Comptes joueurs / Vue joueur / Familles tactiques / Migrer mes données locales)
2. Capture : `docs/e2e/screenshots/story-25-outils-menu.png`
3. Clic "🏷️ Familles tactiques" → panneau `.slide-panel` s'ouvre, bandeau "configuration initiale" visible (17/17 valeurs par défaut, jamais éditées), liste triée alphabétiquement
4. Capture : `docs/e2e/screenshots/story-25-panel-etat-initial.png`

### 2. Effet immédiat sur la page Analyse — test numérique, pas visuel
1. Navigation Analyse, sélection du match "AMICAL FENIX-L'UNION"
2. Relevé des stats de référence via `window._encCurrentStatsMatch` : Jeu Pivot 9 possessions, Isoler 26 possessions
3. Réassignation de "BLOC" (Jeu Pivot → Isoler) via le panneau, sans quitter la page Analyse
4. Stats immédiatement recalculées : Jeu Pivot 7, Isoler 28 (écart de 2, cohérent) — bandeau "configuration initiale" disparu
5. Réassignation inverse (BLOC → Jeu Pivot) → stats exactement restaurées (9/26)
6. Vérification indépendante via API REST : `famille_mapping` contient bien `BLOC → Jeu Pivot` après restauration

### 3. Ajout + suppression d'une correspondance de test
1. Ajout de "TEST_STORY25" → "Spéciaux" via le formulaire réel → apparaît dans la liste, correctement trié
2. Suppression via le bouton 🗑 réel (avec `confirm()` mocké à `true`) → disparaît de la liste
3. Vérification indépendante via API REST : table revenue à exactement 17 lignes, identiques à l'amorçage initial (STORY-23)

### 4. Cas limites
1. Formulaire vide → `alert("Renseigne une intention attaque et choisis une famille")`, aucun appel réseau
2. Échec réseau simulé (mock de `upsertRows`) → `alert("Erreur lors de l'ajout : Simulated network failure")`, comportement non silencieux confirmé
3. Échap → panneau fermé, focus rendu à `#nav-tools-btn` (cohérent avec les autres panneaux du cycle)

## Nettoyage effectué

Toutes les données de test retirées ; `famille_mapping` vérifiée strictement identique à son état d'avant les tests (17 lignes, `BLOC → Jeu Pivot` inclus).

## Résultat

Tous les parcours passent en conditions réelles. Le test le plus significatif (réassignation d'une vraie correspondance et mesure du déplacement exact des possessions entre cartes) prouve que la chaîne complète fonctionne — pas seulement l'affichage de l'écran.

---

## Verdict : ✅ PASSED
