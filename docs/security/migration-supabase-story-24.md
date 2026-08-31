# Audit sécurité — STORY-24 (Rebranchement comptes joueurs / notes coach / lecture famille)

**Agent :** Security Access Auditor
**Date :** 2026-08-31
**Déclenché car :** la story touche l'authentification joueur (bascule complète vers Supabase Auth) et ajoute une nouvelle ressource backend privilégiée (`delete-player-account`, Edge Function avec droits admin)

---

## Nouvelle Edge Function `delete-player-account` — même modèle que `create-player-account`

- Utilise `SUPABASE_SERVICE_ROLE_KEY` exclusivement côté serveur (auto-injectée par Supabase, jamais manipulée manuellement) — vérifié, aucune clé secrète dans le code déployé ni dans le repo (grep sur le diff complet).
- **Même finding Majeur R11 que `create-player-account`, non aggravé** : aucune vérification d'appelant — n'importe qui avec la clé publishable peut supprimer le compte de n'importe quel joueur en connaissant son nom. Impact : déni de service ciblé sur un joueur (il ne peut plus se connecter), pas de fuite de données. **Romain a déjà tranché ce point pour l'ensemble du cycle** (accepté tel quel, 2026-08-31, cf. STORY-24 et note de risque R11) — pas un nouveau blocage, la même décision s'applique.
- Ordre de suppression (`player_profiles` puis `auth.users`) vérifié : ne laisse jamais un `player_profiles` orphelin pointant vers un `auth.users` supprimé, ni l'inverse un compte Auth sans profil (le seul état transitoire possible en cas d'échec à la 2e étape est : profil supprimé + compte Auth encore présent — un problème de nettoyage, pas de sécurité, rattrapable manuellement).

## Authentification joueur — bascule vers Supabase Auth réelle

- **Amélioration de sécurité nette** par rapport à l'ancien système : les mots de passe joueurs ne transitent plus jamais par un stockage en clair côté client (`localStorage`) — ils sont désormais gérés entièrement par Supabase Auth (hashés côté serveur, jamais lisibles même avec la clé publishable). C'est la résolution effective de l'ancien risque R2, déjà actée en Architecture §1.2bis mais concrètement livrée avec cette story.
- **Émail interne jamais exposé** : `toInternalEmailClient()` génère l'email uniquement pour l'appel `signInWithPassword()`, jamais affiché à l'écran ni stocké séparément — le joueur continue de ne connaître que son nom et son mot de passe.
- **Énumération de noms** : le nouveau menu déroulant liste tous les joueurs ayant un compte (`player_profiles`, lisible via la clé publishable) — c'était déjà le cas avant cette story pour toute personne ayant accès à `localStorage` sur l'appareil, et le panneau staff "Comptes joueurs" exposait déjà cette liste. Pas une nouvelle surface d'exposition : les noms de l'effectif ne sont pas une donnée sensible dans ce contexte (équipe amateur, pas d'anonymat recherché).
- **Tentatives de connexion invalides** : gérées par le rate-limiting natif de Supabase Auth (comportement par défaut de la plateforme, non configuré spécifiquement par cette story) — suffisant pour ce contexte d'usage (une seule équipe, pas de cible à haute valeur).

## Notes de coach (`coach_analyses`)

- Aucune donnée sensible (analyse tactique de match) — RLS permissive déjà acceptée, pas de changement de surface d'exposition en passant du stockage local au stockage partagé.

## Verdict

Aucun nouveau finding bloquant. Le finding Majeur R11 (Edge Functions sans vérification d'appelant) s'étend à la nouvelle fonction mais a déjà été explicitement accepté par Romain pour l'ensemble du cycle — pas de blocage sur cette story.
