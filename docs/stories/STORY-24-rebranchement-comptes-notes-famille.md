# STORY-24 — Rebranchement comptes joueurs / notes coach / lecture famille sur Supabase

**En tant que** coach,
**Je veux** que les comptes joueurs, mes notes de match et le rattachement des familles tactiques lisent et écrivent directement dans Supabase,
**Afin de** que ces données soient partagées entre appareils au quotidien, pas seulement au moment de la migration initiale.

## Révisé le 2026-08-28 — comptes joueurs via Supabase Auth
L'ancien risque R2 (mots de passe joueurs en clair exposés via la clé anonyme) est résolu par un changement d'architecture demandé par Romain : les comptes joueurs passent par Supabase Auth + l'Edge Function `create-player-account` (déployée en STORY-20), pas par une table en clair. Voir `docs/arch/migration-supabase.md` §1.2bis.

## Contexte technique
- Zone concernée : `openPlayerAccountsModal()`/`savePlayerAccount()`/`deletePlayerAccount()` (`js/player-mode.js`), `checkLogin()` côté joueur, `saveCoachAnalyse()`/`coachAnalyses` (`js/page-analyse.js`), `getEncFamille()` (`js/page-analyse.js`)
- Spec exacte : `docs/arch/migration-supabase.md` §1.2bis, §1.6, §4
- `getEncFamille()` se simplifie : plus besoin de vérifier `_ENC_FAMILLE_CUSTOM` puis `ENC_FAMILLE_MAP` dans l'ordre — une seule consultation de `FAMILLE_MAPPING` (chargée en mémoire au boot, STORY-22/23)

## Critères d'acceptation
- [ ] `openPlayerAccountsModal()` lit la liste des comptes depuis `player_profiles` (Supabase) au lieu de `localStorage` — affiche nom/poste, plus de mot de passe visible ni même stocké en clair nulle part
- [ ] `savePlayerAccount()` appelle l'Edge Function `create-player-account` (nom + mot de passe saisis) au lieu d'écrire dans `localStorage` ou une table directe
- [ ] `deletePlayerAccount()` supprime le compte (`auth.users` + `player_profiles`) — via une seconde Edge Function ou une fonction Postgres `SECURITY DEFINER` équivalente (la suppression d'un utilisateur Auth nécessite aussi les droits admin, même contrainte que la création)
- [ ] La connexion joueur (`checkLogin()` ou équivalent) génère l'email interne à partir du nom saisi et appelle `supabase.auth.signInWithPassword({email, password})` au lieu de comparer contre une table en clair
- [ ] `saveCoachAnalyse()` écrit dans `coach_analyses` (Supabase), la note s'affiche correctement au rechargement depuis un autre appareil
- [ ] `getEncFamille()` simplifiée, lit `FAMILLE_MAPPING` (objet en mémoire chargé au boot depuis `famille_mapping`)
- [ ] **Mitigation R6** : chaque action d'écriture (créer/supprimer un compte, sauvegarder une note) a son propre retour d'erreur visible en cas d'échec réseau — pas de silence en cas de panne
- [ ] Testé : création d'un compte joueur sur un appareil, connexion réussie avec ce compte depuis un deuxième appareil sans réimport
- [ ] Testé : note coach sauvegardée sur un appareil, visible sur un deuxième appareil après rechargement
- [ ] Testé : un compte supprimé ne peut plus se connecter

## Hors scope
- Écran d'édition de `famille_mapping` (STORY-25) — cette story ne fait que lire/simplifier `getEncFamille()`, pas de CRUD
- Authentification staff (reste le mot de passe partagé "Partage", non concerné par ce changement)

## Dépend de
- STORY-20, STORY-22, STORY-23

## Taille
M
