# E2E-15 — Écran d'édition des bilans (STORY-26)

**Agent :** E2E Tester
**Date :** 2026-09-01
**Outil :** MCP Playwright, serveur statique local (port 8979), API REST Supabase pour vérification indépendante

---

## Parcours testés

### 1. Ouverture depuis le menu Outils
1. Connexion staff → "⚙ Outils" → 5 entrées visibles (Comptes joueurs / Vue joueur / Familles tactiques / Bilans / Migrer mes données locales)
2. Capture : `docs/e2e/screenshots/story-26-outils-menu.png`
3. Clic "📅 Bilans" → panneau affiche les 2 bilans réels existants (Bilan 1/J11, Bilan 2/J19)
4. Capture : `docs/e2e/screenshots/story-26-panel.png`

### 2. Découverte et correction d'un bug latent en cours de test
1. Test initial du critère "effet visible sur le filtre Période" avec le jeu de données de test réel (matchs amicaux sans format "JXX") → `BILANS` reste à 0 par construction (aucun match ne peut être positionné dans une plage), comportement préexistant sans rapport avec cette story
2. Simulation d'un jeu de matchs au format attendu (`J01`...`J20`) pour isoler le comportement de l'éditeur lui-même → ajout d'un bilan avec une journée de fin **antérieure** au dernier bilan existant → absent de `BILANS` malgré une écriture Supabase réussie (vérifié via API REST : la ligne existe bien en base)
3. Root cause identifiée : `processBilans()` traite les bilans dans l'ordre reçu, pas trié par journée de fin
4. Fix appliqué (tri des données sources avant traitement, `_sortRawBilanRows()`) → re-testé : les 3 bilans (dont celui ajouté hors ordre) apparaissent désormais correctement dans `BILANS` et dans le dropdown `#filter-notes-bilan`

### 3. Suppression + restauration
1. Suppression du bilan de test via `deleteBilan(id)` (bouton réel équivalent) → disparaît de `BILANS`
2. Retour au jeu de matchs réel → `BILANS` recalculé
3. Vérification indépendante via API REST : table `bilan` revenue à exactement 2 lignes, identiques à l'état d'avant les tests

### 4. Cas limites
1. Formulaire vide → `alert("Renseigne au moins un nom et une journée de fin")`, aucun appel réseau
2. Échec réseau simulé (mock de `upsertRows`) → `alert("Erreur lors de l'ajout : Simulated network failure")`
3. Échap → panneau fermé, focus rendu à `#nav-tools-btn`

## Nettoyage effectué

Toutes les données de test retirées ; `bilan` vérifiée strictement identique à son état d'avant les tests (2 lignes, `Bilan 1`/J11 et `Bilan 2`/J19).

## Résultat

Tous les parcours passent en conditions réelles après correction du bug latent découvert pendant les tests. Le test le plus significatif (bilan intentionnellement mal ordonné) a directement empêché la livraison d'une story qui aurait semblé fonctionner en usage normal mais aurait échoué silencieusement dès que Romain ajouterait un bilan dans un ordre inattendu.

---

## Verdict : ✅ PASSED
