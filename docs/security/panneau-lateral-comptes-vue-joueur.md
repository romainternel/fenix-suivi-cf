# Audit sécurité — STORY-19 : Panneau latéral Comptes joueurs / Vue joueur

**Agent :** Security Access Auditor
**Date :** 2026-08-28
**Déclenché car :** la story touche l'interface de gestion des comptes joueurs (authentification)

---

## Périmètre de l'audit

STORY-19 est une story de présentation (modale centrée → panneau latéral). Le diff ne touche **ni** la logique de création/suppression de compte (`savePlayerAccount()`, `deletePlayerAccount()`), **ni** le mécanisme de session (`PLAYER_SESSION`, `fenix_session`), **ni** le stockage (`localStorage['fenix_player_accounts']`) — uniquement le conteneur DOM et son animation d'ouverture/fermeture. L'audit se concentre donc sur : est-ce que la restructuration introduit une nouvelle fuite ou un nouveau contournement ?

## Vérifications effectuées

- **Exposition du mot de passe dans le DOM** : la liste des comptes affiche toujours le mot de passe masqué (`'•'.repeat(...)`), jamais en clair — comportement identique à avant, non modifié par cette story.
- **Nouveaux attributs DOM** (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) : aucun ne porte de donnée sensible, purs marqueurs d'accessibilité.
- **Focus trap / gestion clavier** : le piège à focus est un filtre sur les éléments *déjà présents* dans le panneau (`querySelectorAll('button, input, select, ...')`) — n'expose ni ne rend accessible aucun élément supplémentaire du reste de la page pendant que le panneau est ouvert.
- **Overlay cliquable pour fermer** : ferme uniquement le panneau (`_closeSlidePanel`), ne déclenche aucune action de lecture/écriture de données.
- **Déclencheur** : toujours derrière le bouton "⚙ Outils", lui-même toujours visible uniquement en session `role:'staff'` (vérifié : aucune condition d'affichage du bouton Outils ou de ses entrées n'a été modifiée par cette story ni par STORY-12).

## Constat pré-existant (hors scope de cette story, non aggravé)

Le mécanisme de comptes joueurs repose sur `localStorage` en clair (mots de passe non hashés, aucune vérification serveur — l'application n'a pas de backend) et sur un mot de passe staff partagé unique ("Partage"). C'est une caractéristique de fond de l'application entière, pas quelque chose que cette story introduit, modifie ou aggrave. Elle est cohérente avec la nature de l'outil (outil interne de centre de formation, pas une application manipulant des données personnelles sensibles au sens réglementaire). Signalé pour mémoire, **non bloquant pour cette story**.

## Findings

Aucun. Ni Critique, ni Majeur, ni Mineur imputable à cette story.

---

## Verdict : ✅ AUCUN FINDING — non bloquant
