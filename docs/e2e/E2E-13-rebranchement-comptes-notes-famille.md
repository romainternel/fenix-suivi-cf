# E2E-13 — Rebranchement comptes joueurs / notes coach / lecture famille sur Supabase (STORY-24)

**Agent :** E2E Tester
**Date :** 2026-08-31
**Outil :** MCP Playwright, deux serveurs statiques locaux sur des ports différents (8975/8976) simulant deux appareils distincts (origines séparées ⇒ `localStorage`/`sessionStorage` non partagés, seul Supabase relie les deux), API REST Supabase pour vérification indépendante

---

## Parcours testés

### 1. Menu déroulant de connexion — peuplement au boot
1. Chargement de la page (appareil A, port 8975)
2. `#login-nom-sel` peuplé automatiquement depuis `player_profiles` après résolution de `loadFromSupabase()`

### 2. Connexion joueur réelle — cas nominal
1. Sélection du nom dans le menu, mot de passe correct
2. `supabaseClient.auth.signInWithPassword()` réussit, session `{role: 'joueur', nom}` créée, écran de connexion masqué

### 3. Connexion joueur — mauvais mot de passe
1. Nom sélectionné, mot de passe incorrect
2. Message "Mot de passe incorrect" affiché, aucune session créée, écran de connexion reste visible (vérifié explicitement, pas juste supposé — un premier test avait donné un faux positif à cause d'une session restante d'un test précédent, corrigé en vidant `sessionStorage` avant navigation)

### 4. Connexion joueur — aucun nom sélectionné
1. Menu laissé sur "-- Choisis ton nom --", mot de passe rempli
2. Message "Choisis ton nom dans la liste" affiché, aucun appel réseau inutile déclenché

### 5. Connexion staff — non-régression
1. Mot de passe "Partage"
2. Comportement inchangé, session staff créée normalement

### 6. Panneau Comptes joueurs — lecture Supabase
1. Ouverture du panneau → état "Chargement…" bref → liste réelle affichée
2. Aucun mot de passe visible dans le DOM (colonne "POSTE" à la place)

### 7. Cycle complet compte joueur via l'UI réelle
1. Sélection de "Roman.L" dans le menu du panneau, mot de passe de test saisi, clic "CRÉER LE COMPTE"
2. Ligne "Roman LAFON — AD" apparaît dans le tableau
3. `signInWithPassword()` réussit avec ce compte (vérifié indépendamment de l'UI)
4. Clic sur 🗑 → confirmation → compte disparaît de la liste
5. Nouvelle tentative de connexion avec ce compte → `Invalid login credentials`

### 8. Suppression de compte — déploiement réel de la nouvelle Edge Function
1. Nouvelle fonction `delete-player-account` déployée en conditions réelles (`supabase functions deploy`, Personal Access Token généré par Romain pour cette seule commande, jamais écrit dans un fichier, effacé de l'environnement immédiatement après)
2. Avant déploiement : appel de la fonction échoue proprement avec `Failed to fetch`, capturé et remonté (confirme la mitigation R6 dans un cas réel)
3. Après déploiement : suppression réelle vérifiée via l'API REST (`player_profiles` vide après coup)

### 9. Notes de coach — cross-appareil
1. Sur l'appareil A : sélection d'un match réel, saisie d'une note de test, "💾 Sauvegarder mon analyse"
2. Vérification indépendante via l'API REST : ligne présente dans `coach_analyses`
3. Sur l'appareil B (origine différente, jamais synchronisée avant) : connexion staff, navigation Analyse, sélection du même match → note affichée immédiatement, sans aucune action de synchronisation manuelle

## Nettoyage effectué

Tous les comptes de test supprimés (via l'UI réelle et la nouvelle Edge Function), note de test retirée de `coach_analyses` via l'API REST. Vérification finale : `player_profiles` et `coach_analyses` vides en fin de session de test.

## Résultat

Tous les parcours passent en conditions réelles, avec de vraies requêtes réseau vers Supabase Auth et PostgREST — pas de simulation. Le critère le plus important de la story (partage réel des données entre appareils, sans réimport) est confirmé positivement à deux reprises (compte joueur, note de coach).

---

## Verdict : ✅ PASSED
