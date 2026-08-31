# QA-15 — Rebranchement comptes joueurs / notes coach / lecture famille sur Supabase (STORY-24)

**Agent :** QA
**Date :** 2026-08-31

---

## Critères d'acceptation testés

| # | Critère | Résultat |
|---|---|---|
| 1 | `openPlayerAccountsModal()` lit `player_profiles`, plus de mot de passe visible | ✅ Panneau affiche nom complet + poste, aucun mot de passe |
| 2 | `savePlayerAccount()` via Edge Function | ✅ Compte créé via le panneau réel, apparaît immédiatement dans la liste |
| 3 | `deletePlayerAccount()` supprime `auth.users` + `player_profiles` | ✅ Nouvelle Edge Function déployée et testée, suppression confirmée en base |
| 4 | Connexion joueur via `signInWithPassword` + email interne | ✅ Connexion réelle réussie avec le menu déroulant + mot de passe |
| 5 | `saveCoachAnalyse()` écrit dans Supabase, visible cross-device | ✅ Testé explicitement avec 2 "appareils" (origines) différents |
| 6 | `getEncFamille()` lit `FAMILLE_MAPPING` | ✅ Vérifié par lecture de code + comportement Analyse déjà validé (STORY-22/23) |
| 7 | Mitigation R6 — erreur visible par action | ✅ Testé explicitement (échec réseau simulé avant déploiement) |
| 8 | Compte créé sur un appareil → connexion depuis un second appareil | ✅ |
| 9 | Note sauvegardée sur un appareil → visible sur un second appareil | ✅ |
| 10 | Compte supprimé → connexion refusée | ✅ `Invalid login credentials` confirmé |

## Scénarios testés en conditions réelles

1. **Cycle complet compte joueur** : création via le panneau (sélection réelle dans le menu, mot de passe saisi) → connexion réussie avec ce compte → suppression via le bouton 🗑 réel → nouvelle tentative de connexion refusée.
2. **Cross-device** (deux origines de serveur de test simulant deux appareils) :
   - Compte créé sur l'appareil A → connexion réussie depuis l'appareil B sans aucun réimport.
   - Note de coach sauvegardée sur l'appareil A → visible sur l'appareil B après rechargement de la page Analyse.
3. **Connexion sans nom sélectionné** : message "Choisis ton nom dans la liste" affiché, pas de tentative Supabase inutile.
4. **Mauvais mot de passe** : "Mot de passe incorrect" affiché, aucune session créée.
5. **Connexion staff** ("Partage") : comportement inchangé, toujours instantané, non affecté par les changements de connexion joueur.
6. **Échec réseau sur la suppression de compte** (avant déploiement de la nouvelle Edge Function) : erreur explicitement propagée (`Failed to fetch`), pas de silence — confirme la mitigation R6 dans un cas réel, pas seulement simulé artificiellement.

## Bugs trouvés

Aucun.

## Points remontés en cours de story (voir Code Review / story elle-même)

- Absence de champ "nom" sur l'écran de connexion : problème d'architecture non anticipé, remonté à Romain avant développement, résolu par un menu déroulant.
- `getEncFamille()` : écart volontaire vs. l'Architecture (garde `_ENC_FAMILLE_CUSTOM` en premier filet) pour ne pas casser une fonctionnalité déjà livrée avant que STORY-25 ne la rebranche formellement.

---

## Verdict : ✅ PASSED
