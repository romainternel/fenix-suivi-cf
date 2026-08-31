# STORY-24 — Rebranchement comptes joueurs / notes coach / lecture famille sur Supabase

**En tant que** coach,
**Je veux** que les comptes joueurs, mes notes de match et le rattachement des familles tactiques lisent et écrivent directement dans Supabase,
**Afin de** que ces données soient partagées entre appareils au quotidien, pas seulement au moment de la migration initiale.

## Révisé le 2026-08-28 — comptes joueurs via Supabase Auth
L'ancien risque R2 (mots de passe joueurs en clair exposés via la clé anonyme) est résolu par un changement d'architecture demandé par Romain : les comptes joueurs passent par Supabase Auth + l'Edge Function `create-player-account` (déployée en STORY-20), pas par une table en clair. Voir `docs/arch/migration-supabase.md` §1.2bis.

## ⚠️ Point à trancher avec Romain avant de considérer cette story terminée (risque R11)
`docs/security/migration-supabase-story-20.md` : l'Edge Function `create-player-account` n'a aucune vérification d'appelant — n'importe qui avec la clé publishable peut créer un compte joueur en contournant le mot de passe staff, avec un risque de squatting de compte (pas de fuite de données sensibles, impact borné). **Demander à Romain s'il veut une mitigation légère** (ex. vérification du mot de passe staff "Partage" côté Edge Function) **avant de livrer cette story**, ou s'il accepte le risque tel quel pour ce cycle.

**Réponse de Romain (2026-08-31)** : accepté tel quel. Usage mono-équipe, effectif restreint, risque jugé très faible. Aucune mitigation supplémentaire développée.

## ⚠️ Point d'architecture découvert pendant le développement — connexion joueur
Aucun document du cycle `/construire` n'avait remarqué que l'écran de connexion actuel n'a **qu'un seul champ** (mot de passe) — le joueur ne saisit jamais son nom, l'app le retrouve en comparant le mot de passe à tous les comptes locaux. Avec Supabase Auth, il faut connaître l'email (donc le nom) **avant** de tenter la connexion : ce mécanisme de "recherche par mot de passe" n'est plus possible. Soumis à Romain (2026-08-31), qui a choisi : **ajouter un menu déroulant "Choisis ton nom"** sur l'écran de connexion (même pattern que le sélecteur de joueur du panneau "Comptes joueurs" staff), rempli dynamiquement depuis `player_profiles` au démarrage.

## Contexte technique
- Zone concernée : `openPlayerAccountsModal()`/`savePlayerAccount()`/`deletePlayerAccount()` (`js/player-mode.js`), `checkLogin()` côté joueur, `saveCoachAnalyse()`/`coachAnalyses` (`js/page-analyse.js`), `getEncFamille()` (`js/page-analyse.js`)
- Spec exacte : `docs/arch/migration-supabase.md` §1.2bis, §1.6, §4
- `getEncFamille()` se simplifie : plus besoin de vérifier `_ENC_FAMILLE_CUSTOM` puis `ENC_FAMILLE_MAP` dans l'ordre — une seule consultation de `FAMILLE_MAPPING` (chargée en mémoire au boot, STORY-22/23)

## Critères d'acceptation
- [x] `openPlayerAccountsModal()` lit la liste des comptes depuis `player_profiles` (Supabase) au lieu de `localStorage` — affiche nom/poste, plus de mot de passe visible ni même stocké en clair nulle part. Testé : panneau affiche "Roman LAFON / AD" après création, aucune trace de mot de passe dans le DOM.
- [x] `savePlayerAccount()` appelle l'Edge Function `create-player-account` (nom + mot de passe saisis) au lieu d'écrire dans `localStorage` ou une table directe. Testé via le panneau réel.
- [x] `deletePlayerAccount()` supprime le compte (`auth.users` + `player_profiles`) — nouvelle Edge Function `delete-player-account` (supprime `player_profiles` puis `auth.users`, ordre nécessaire pour respecter la contrainte de clé étrangère), déployée avec un Personal Access Token généré et fourni par Romain pour cette seule commande (non conservé). Testé de bout en bout via le bouton 🗑 réel du panneau.
- [x] La connexion joueur (`checkLogin()`) génère l'email interne à partir du nom **choisi dans le nouveau menu déroulant** et appelle `supabase.auth.signInWithPassword({email, password})` au lieu de comparer contre une table en clair. `toInternalEmailClient()` (miroir exact de la fonction Deno) vérifié en conditions réelles — connexion réussie avec le bon compte.
- [x] `saveCoachAnalyse()` écrit dans `coach_analyses` (Supabase), la note s'affiche correctement au rechargement depuis un autre appareil. **Testé explicitement multi-origine** (simulateur de 2 appareils différents) : note écrite sur l'un, visible sur l'autre après rechargement.
- [x] `getEncFamille()` simplifiée, lit `FAMILLE_MAPPING` (objet en mémoire chargé au boot depuis `famille_mapping`) — `_ENC_FAMILLE_CUSTOM` (localStorage) conservé en premier filet de sécurité pour ne pas casser la classification manuelle existante avant que STORY-25 ne la rebranche à son tour (écart documenté vs. l'Architecture, justifié en Code Review).
- [x] **Mitigation R6** : chaque action d'écriture a son propre retour d'erreur visible (`alert()` pour comptes, message inline pour notes) — testé explicitement en simulant un échec réseau avant le déploiement de la nouvelle Edge Function (erreur "Failed to fetch" correctement propagée, pas de silence).
- [x] Testé : création d'un compte joueur sur un "appareil" (origine de test), connexion réussie avec ce compte depuis un second "appareil" (autre origine) sans réimport.
- [x] Testé : note coach sauvegardée sur un appareil, visible sur un deuxième appareil après rechargement.
- [x] Testé : un compte supprimé ne peut plus se connecter (`Invalid login credentials` confirmé après suppression).

## Hors scope
- Écran d'édition de `famille_mapping` (STORY-25) — cette story ne fait que lire/simplifier `getEncFamille()`, pas de CRUD
- Authentification staff (reste le mot de passe partagé "Partage", non concerné par ce changement)

## Dépend de
- STORY-20, STORY-22, STORY-23

## Taille
M
