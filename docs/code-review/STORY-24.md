# Code Review — STORY-24 (Rebranchement comptes joueurs / notes coach / lecture famille sur Supabase)

**Agent :** Code Reviewer
**Date :** 2026-08-31
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` (`loadFromSupabase()` étendue à 7 tables, écran de connexion + `checkLogin()` révisés, globales `PLAYER_PROFILES`/`FAMILLE_MAPPING`), `js/player-mode.js` (`openPlayerAccountsModal()`/`savePlayerAccount()`/`deletePlayerAccount()` réécrites), `js/page-analyse.js` (`getEncFamille()`, `saveCoachAnalyse()`, suppression de `ENC_FAMILLE_MAP`), `js/supabase-client.js` (+`callDeletePlayerAccount()`, `toInternalEmailClient()`, `populateLoginPlayerDropdown()`), nouveau `supabase/functions/delete-player-account/index.ts`

---

## Point d'architecture non anticipé, découvert et résolu pendant le développement

Aucun document du cycle `/construire` n'avait remarqué que l'écran de connexion actuel n'a qu'un seul champ (mot de passe) — la "recherche par mot de passe" utilisée aujourd'hui (comparer le mot de passe saisi à tous les comptes locaux) est structurellement incompatible avec Supabase Auth, qui exige l'email **avant** la tentative de connexion. Plutôt que de contourner ça par une solution fragile (essayer `signInWithPassword` sur chaque email possible jusqu'à succès — risque réel de déclencher le rate-limiting anti-abus de Supabase Auth sur des tentatives légitimes), le Developer a remonté le problème à Romain avant de coder. Décision : menu déroulant "Choisis ton nom", peuplé depuis `player_profiles`. Bon réflexe — un problème bloquant et structurant pour l'UX de tous les joueurs de l'équipe n'est pas le genre de décision qu'un agent doit trancher seul.

## `toInternalEmailClient()` — miroir exact de la fonction serveur, point de fragilité identifié

Le point le plus risqué de cette story : `toInternalEmailClient()` (`js/supabase-client.js`) doit produire *exactement* le même email que `toInternalEmail()` côté Edge Function (`supabase/functions/create-player-account/index.ts`), sinon toute tentative de connexion échouerait silencieusement avec "mot de passe incorrect" (message trompeur, le vrai problème serait un email mal formé). Comparaison caractère par caractère faite entre les deux implémentations — normalisation NFD, suppression des diacritiques, minuscules, filtre `[a-z0-9.]` : identiques. **Vérifié empiriquement, pas seulement en lecture de code** : connexion réelle réussie avec un compte créé via l'Edge Function, confirmant que les deux fonctions convergent bien vers le même email en pratique.

## `getEncFamille()` — écart volontaire et documenté vs. l'Architecture

L'Architecture (§1.6) prévoyait de retirer entièrement la vérification `_ENC_FAMILLE_CUSTOM`. Le Developer a choisi de la garder en premier filet, avec `FAMILLE_MAPPING` (Supabase) en repli à la place de l'ancien `ENC_FAMILLE_MAP` (JS hardcodé, supprimé). Raison : le panneau "assigner une famille" (`_assignEncFamille()`) écrit encore dans `_ENC_FAMILLE_CUSTOM`/localStorage — ce rebranchement n'est prévu qu'en STORY-25. Suivre l'Architecture à la lettre aurait rendu cette fonctionnalité déjà livrée totalement inerte entre STORY-24 et STORY-25, une régression fonctionnelle réelle pour un gain de simplicité de code qui peut attendre une story de plus. Documenté explicitement plutôt que silencieux — jugement correct.

## `openPlayerAccountsModal()` devient asynchrone

Changement de signature (synchrone → async) qui se propage à ses appelants (`onclick="openPlayerAccountsModal()"` dans le HTML fonctionne tel quel, une fonction async appelée sans `await` depuis un attribut `onclick` est un pattern valide en JS). Le panneau s'ouvre immédiatement avec un état "Chargement…" avant que les données arrivent — évite un panneau visuellement figé pendant l'attente réseau, cohérent avec le principe déjà établi en STORY-22 (jamais d'écran figé sans indication).

## `deletePlayerAccount()` — ordre de suppression critique respecté

`supabase/functions/delete-player-account/index.ts` supprime `player_profiles` **avant** `auth.users` — l'inverse violerait la contrainte de clé étrangère (`player_profiles.user_id references auth.users(id)`, sans `on delete cascade` dans le schéma). Vérifié dans le schéma SQL existant, pas supposé.

## Mitigation R6 — retour d'erreur visible

Chaque action d'écriture (`savePlayerAccount`, `deletePlayerAccount`, `saveCoachAnalyse`) a son propre `try/catch` avec un message d'erreur explicite (`alert()` pour les comptes, cohérent avec le pattern déjà en place dans l'app pour ce type d'erreur ; message inline existant réutilisé pour les notes). Bouton désactivé pendant la requête dans les 3 cas — évite les double-clics.

## Non-régression

`loadFromSupabase()` passe de 4 à 7 fetches en parallèle (`Promise.all`) — un échec sur l'une des 3 nouvelles tables déclenche le même écran d'erreur global qu'avant, cohérent avec le comportement "tout ou rien" déjà en place, pas de traitement spécial nécessaire.

## Scope

Conforme — aucun écran d'édition de `famille_mapping` créé (STORY-25), authentification staff inchangée (toujours "Partage").

---

## Verdict : ✅ APPROUVÉ
