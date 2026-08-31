# STORY-24 — Rebranchement comptes joueurs / notes coach / lecture famille sur Supabase

**En tant que** coach,
**Je veux** que les comptes joueurs, mes notes de match et le rattachement des familles tactiques lisent et écrivent directement dans Supabase,
**Afin de** que ces données soient partagées entre appareils au quotidien, pas seulement au moment de la migration initiale.

## ⚠️ Point à trancher avec Romain avant de considérer cette story terminée (risque R2)
`docs/risks/migration-supabase.md` R2 : la table `player_accounts` (mots de passe joueurs en clair) devient accessible via la clé anonyme Supabase, publique par nature — un contournement possible du mot de passe applicatif. **Confirmer explicitement avec Romain que ce risque est accepté** avant la mise en production de cette story (pas juste documenté dans un fichier qu'il ne lira pas forcément). Si non accepté, ouvrir une story de mitigation séparée (ex. RPC dédiée pour la vérification de connexion plutôt qu'un accès table direct) avant de livrer.

## Contexte technique
- Zone concernée : `openPlayerAccountsModal()`/`savePlayerAccount()`/`deletePlayerAccount()` (`js/player-mode.js`), `saveCoachAnalyse()`/`coachAnalyses` (`js/page-analyse.js`), `getEncFamille()` (`js/page-analyse.js`)
- Spec exacte : `docs/arch/migration-supabase.md` §1.6, §4
- `getEncFamille()` se simplifie : plus besoin de vérifier `_ENC_FAMILLE_CUSTOM` puis `ENC_FAMILLE_MAP` dans l'ordre — une seule consultation de `FAMILLE_MAPPING` (chargée en mémoire au boot, STORY-22/23)

## Critères d'acceptation
- [ ] `openPlayerAccountsModal()` lit la liste des comptes depuis `player_accounts` (Supabase) au lieu de `localStorage`
- [ ] `savePlayerAccount()`/`deletePlayerAccount()` écrivent/suppriment dans `player_accounts` (Supabase)
- [ ] La connexion joueur (`checkLogin()` ou équivalent) vérifie le mot de passe contre `player_accounts` (Supabase) au lieu de `localStorage`
- [ ] `saveCoachAnalyse()` écrit dans `coach_analyses` (Supabase), la note s'affiche correctement au rechargement depuis un autre appareil
- [ ] `getEncFamille()` simplifiée, lit `FAMILLE_MAPPING` (objet en mémoire chargé au boot depuis `famille_mapping`)
- [ ] **Mitigation R6** : chaque action d'écriture (créer/supprimer un compte, sauvegarder une note) a son propre retour d'erreur visible en cas d'échec réseau — pas de silence en cas de panne
- [ ] Testé : création d'un compte joueur sur un appareil, connexion réussie avec ce compte depuis un deuxième appareil sans réimport
- [ ] Testé : note coach sauvegardée sur un appareil, visible sur un deuxième appareil après rechargement

## Hors scope
- Écran d'édition de `famille_mapping` (STORY-25) — cette story ne fait que lire/simplifier `getEncFamille()`, pas de CRUD
- Amélioration du niveau de sécurité (hash des mots de passe, RLS différenciée) — sauf si R2 impose une mitigation avant mise en production (à trancher séparément, voir ci-dessus)

## Dépend de
- STORY-20, STORY-22, STORY-23

## Taille
M
