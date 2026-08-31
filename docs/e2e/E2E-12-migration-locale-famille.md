# E2E-12 — Migration des données locales existantes + amorçage des familles (STORY-23)

**Agent :** E2E Tester
**Date :** 2026-08-31
**Outil :** MCP Playwright, serveur statique local (port 8973), API REST Supabase pour vérification indépendante

---

## Parcours testés

### 1. Prompt de migration — cas nominal
1. `localStorage` peuplé avec 1 note de coach, 1 compte joueur test (`Test.Migration23`), 1 assignation de famille manuelle ; flag `fenix_supabase_migrated` absent
2. Connexion staff (mot de passe "Partage")
3. Overlay affiché immédiatement après connexion, décompte exact ("1 note de coach", "1 compte joueur", "1 assignation de famille manuelle")
4. Capture : `docs/e2e/screenshots/story-23-migration-prompt.png`

### 2. Migration réelle — les 3 types de données
1. Clic "Migrer maintenant"
2. Résultat affiché : `✓ 1 note(s) de coach`, `✓ 1 assignation(s) de famille`, `✓ Compte Test.Migration23`
3. Vérification indépendante via API REST (clé publishable, hors app) :
   - `coach_analyses?match_key=eq.AMICAL FENIX-TEST` → ligne présente, `contenu` exact
   - `famille_mapping?intention_attaque=eq.TEST_INTENTION` → `{famille: "Isoler"}` exact
   - `player_profiles?nom=eq.Test.Migration23` → ligne présente avec un `user_id` réel (compte Supabase Auth effectivement créé, pas juste un profil orphelin)
4. Overlay se ferme automatiquement (~2,5s) après le bandeau "✅ Migration terminée"
5. Capture : `docs/e2e/screenshots/story-23-migration-done.png`

### 3. Retry — mitigation R10 (statut par compte)
1. Flag `fenix_supabase_migrated` retiré manuellement, prompt réactivé (mêmes données locales, pas encore effacées)
2. Clic "Migrer maintenant" une seconde fois
3. Résultat : `✓ 1 note(s) de coach`, `✓ 1 assignation(s) de famille` (upsert idempotent, succès à nouveau), `✗ Compte Test.Migration23 — A user with this email address has already been registered` — l'échec du compte n'empêche ni n'affecte l'affichage des deux succès

### 4. Aucune donnée locale (déclenchement manuel forcé)
1. Les 3 clés `localStorage` vidées
2. `checkAndOfferLocalMigration(true)` (équivalent de l'entrée menu "🔄 Migrer mes données locales")
3. Liste : "Aucune donnée locale à migrer sur cet appareil.", bouton "Migrer maintenant" absent, bouton secondaire affiché "Fermer" (au lieu de "Annuler")

### 5. Annulation
1. Données locales présentes, flag absent, connexion staff → overlay affiché
2. Clic "Annuler" → overlay fermé, flag toujours absent (`localStorage.getItem('fenix_supabase_migrated') === null`)
3. Rechargement de la page (session staff restaurée automatiquement) → overlay réaffiché, confirmant le reprompt

### 6. Étanchéité staff / joueur (sécurité)
1. Données locales non migrées présentes + un compte joueur test valide
2. Connexion **joueur** (mot de passe du compte, pas "Partage") → session `role: 'joueur'` confirmée → overlay jamais affiché
3. Rechargement de la page (session joueur restaurée automatiquement, sans repasser par l'écran de connexion) → overlay toujours jamais affiché

### 7. Amorçage `famille_mapping` (mécanisme B)
1. Table nettoyée des lignes de test, puis amorcée avec les 17 correspondances de `ENC_FAMILLE_MAP` via l'API REST (upsert, clé publishable)
2. Lecture complète de la table après amorçage : 17/17 lignes exactes, comparées une à une au littéral JS source

## Nettoyage effectué

Lignes de test supprimées de `coach_analyses`/`famille_mapping` après vérification. Le compte Supabase Auth de test (`Test.Migration23`) n'a pas pu être supprimé (nécessiterait le jeton d'accès personnel, non conservé par choix de sécurité depuis STORY-20) — laissé en base, sans impact (nom fictif ne correspondant à aucun joueur réel de l'effectif, `poste: null`).

## Résultat

Tous les parcours passent en conditions réelles, y compris la vérification indépendante des données en base (pas seulement l'affichage côté app).

---

## Verdict : ✅ PASSED
