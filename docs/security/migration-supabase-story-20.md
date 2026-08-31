# Audit sécurité — STORY-20 (Setup Supabase + schéma de base)

**Agent :** Security Access Auditor
**Date :** 2026-08-31
**Déclenché car :** la story crée les premières ressources backend réelles du projet (base de données partagée, authentification, fonction serveur à privilèges) — le tout premier audit sur de l'infrastructure Supabase réelle, pas seulement sur un plan.

---

## Ressources auditées

1. Les 7 tables Postgres (`match_data`, `joueurs`, `tableau_match`, `bilan`, `famille_mapping`, `coach_analyses`, `player_profiles`) et leurs policies RLS
2. Le compte `auth.users` (Supabase Auth) pour les joueurs
3. L'Edge Function `create-player-account`
4. La présence de secrets dans le repo

## Méthode : simulation d'accès non autorisé, pas seulement lecture de policy

Chaque point ci-dessous a été vérifié par une requête réelle (avec uniquement la clé publishable, celle qui sera dans le code source public), pas supposé depuis la configuration seule.

## Findings

### 🟡 Majeur — L'Edge Function `create-player-account` n'a aucune vérification d'appelant
**Constat** : la fonction accepte n'importe quel appel HTTP portant `{nom, motDePasse}` avec la clé publishable (publique par nature, visible dans le code source de la page) — **sans passer par le mot de passe staff "Partage"**, sans aucune autre vérification d'identité. Confirmé en la déclenchant directement en ligne de commande, sans jamais ouvrir l'app.

**Ce que ça permet à un attaquant, concrètement** :
- La table `joueurs` est elle-même librement lisible (RLS permissive, décision PRD §0 déjà actée) — un attaquant peut donc lister tous les vrais noms de joueurs, puis appeler l'Edge Function pour créer un compte au nom d'un joueur **qui n'a pas encore de compte**, avant que le coach ne le fasse lui-même. Le joueur légitime se retrouverait alors bloqué (email déjà pris) le jour où le coach essaie de lui créer son vrai compte.
- Création de comptes en spam pour des noms arbitraires (moins grave, juste de la pollution de la base).

**Ce que ça ne permet PAS** : reprendre un compte déjà existant (`admin.createUser` échoue sur un email déjà pris), ni lire un mot de passe existant, ni accéder à `auth.users` (confirmé non exposé via l'API REST publique, cf. ci-dessous).

**Pourquoi Majeur et pas Critique** : aucune donnée sensible existante n'est exposée ou modifiable — c'est une nuisance/un vol d'opportunité sur un flux de création, pas une fuite. Le contexte d'usage réel (petite structure de handball jeunes, pas une cible à forte valeur) réduit encore la probabilité qu'il soit exploité.

**Recommandation** : à trancher avec Romain, pas décidé unilatéralement — deux options proportionnées, sans réintroduire de compte staff Supabase complet (hors scope PRD §0) :
1. **Accepter le risque tel quel** pour ce cycle, cohérent avec le niveau de sécurité "volontairement inchangé" déjà acté — le pire scénario reste un désagrément à corriger manuellement (supprimer un compte squatté), pas une fuite de données.
2. **Mitigation légère** : l'Edge Function exige un en-tête portant le mot de passe staff partagé ("Partage"), vérifié côté fonction avant de procéder. Coût de dev minime (quelques lignes), mais n'arrête pas un attaquant qui lirait aussi ce mot de passe dans le code source de l'app (il y est déjà, en clair, pour le gate actuel) — relève le niveau d'effort requis sans être une vraie barrière étanche.

Non bloquant pour cette story (scope explicitement limité par le PRD), mais à trancher **avant** que STORY-24 (rebranchement du panneau Comptes joueurs) ne soit considérée terminée.

### ✅ Confirmé sûr — Aucun secret exposé
- `service_role` : jamais présent dans le repo (recherche explicite), jamais manipulé manuellement (injection automatique Supabase, cf. Code Review). Vérifié aussi qu'il n'apparaît dans aucun log/sortie de commande conservé.
- Le jeton d'accès personnel utilisé pour le déploiement CLI n'a été utilisé qu'en variable d'environnement shell, jamais écrit sur disque dans le repo.

### ✅ Confirmé sûr — `auth.users` non exposée via l'API publique
Requête `GET /rest/v1/users` (et toute tentative d'accès au schéma `auth` via PostgREST) échoue avec "table not found" — comportement par défaut de Supabase (seul le schéma `public` est exposé via l'API REST). Les mots de passe joueurs (gérés par Supabase Auth) ne sont donc **jamais** accessibles, même en connaissant la clé publishable — c'est exactement l'objectif qui justifiait la révision d'architecture 1.2bis (abandon de la table en clair), confirmé effectif.

### ✅ Confirmé conforme à la décision produit — RLS permissive sur les 7 tables `public`
Lecture ET écriture confirmées ouvertes via la clé publishable sur `joueurs`/`player_profiles` (lecture) et `famille_mapping` (écriture testée : insert + delete réussis). C'est le modèle explicitement décidé par Romain (PRD §0, "accès staff mono-utilisateur, pas de nouveau modèle de permission") — non remis en cause ici, juste confirmé effectif et documenté.

## Verdict

**Aucun finding Critique.** Un finding Majeur (accès non authentifié à l'Edge Function de création de compte) documenté et transmis pour décision avant STORY-24 — **non bloquant pour STORY-20**.
