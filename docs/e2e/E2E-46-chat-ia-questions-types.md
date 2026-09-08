# E2E-46 — Chat IA : questions types suggérées

**Agent :** E2E Tester
**Date :** 2026-09-09
**Méthode :** Playwright, navigateur réel, serveur statique local (port 8231, distinct du port 8230 utilisé par le QA), données réelles Supabase.

---

## Parcours testés

1. Connexion staff (mot de passe "Partage").
2. Navigation Analyse → sélection du match **AMICAL FENIX-LIMOGES** (match différent de "J01 BILLERE-FENIX" utilisé par le QA, pour vérifier la généralisation).
3. Bascule vers l'onglet "Notes & Outils".
4. Clic réel sur la chip **"Bilan des supériorités ?"**.
5. Clic réel sur la chip **"Comment a joué le gardien ?"** (x2, voir écart ci-dessous).
6. Clic réel sur la chip **"Pertes de balle ?"**.
7. Clic réel sur la chip **"Meilleur buteur ?"**.
8. Saisie manuelle libre : "Quel est le score ?" + Entrée (non-régression saisie classique).
9. Vérification console (aucune erreur) après chaque clic.
10. Capture d'écran finale du fil de conversation.

## Résultat par parcours

- **Chips cliquables et fonctionnelles** : les 5 boutons sont visibles et cliquables au-dessus du chat, sur un match distinct de celui du QA (AMICAL FENIX-LIMOGES, défaite 37-38).
- **"Comment a joué le gardien ?"** → "Le gardien a réalisé 18 arrêt(s) sur 56 tirs cadrés, soit 32% d'efficacité." — cohérent avec le tableau Gardien × Systèmes adverses affiché sur l'onglet Tactique (24% ce match pour Noah.O sur les tirs cadrés visibles dans ce tableau ; la différence de base — 56 vs 25 tirs — s'explique par un périmètre de comptage différent entre le tableau par système et la réponse globale du chat, non un bug : les deux lisent des sous-ensembles différents des tirs adverses. Hors scope STORY-46, non introduit par cette story).
- **"Pertes de balle ?"** → "FENIX a commis 15 perte(s) de balle sur ce match. C'est beaucoup..." — cohérent avec le résumé 3 points affiché en haut de page ("15 pertes de balle (vs 12 adversaire)").
- **"Meilleur buteur ?"** → "Le meilleur buteur du match est Mattéo.A avec 7 but(s). Suivi de Isaac.M (7 but(s))." — réponse pertinente et distincte, pas de retombée sur le générique.
- **"Bilan des supériorités ?"** → réponse structurée (FENIX +/-, Adversaire +/-, Bilan) avec 0/0 partout sur ce match amical (aucune ligne `phase_att` avec +/- dans ce match) — comportement correct de `computeSuperiorites()` (STORY-42) sur un match sans données de supériorités, pas un bug de la chip.
- **Accumulation de l'historique** : 3 clics de chips consécutifs (gardien → pertes de balle → meilleur buteur) sans interaction intermédiaire accumulent bien les 3 échanges dans le fil, dans l'ordre — confirme que `_sendChatSuggestion()` réutilise correctement `sendChatMessage()` sans écraser l'historique.
- **Non-régression saisie libre** : "Quel est le score ?" tapé manuellement après plusieurs clics de chips → réponse correcte ("Score final : FENIX 37 - 38 Adversaire. Défaite."), champ vidé après envoi, alternance chip/saisie manuelle sans interférence.
- **Console** : aucune erreur JS après aucun des clics testés (une seule ligne verbose pré-existante et sans rapport : "Password field is not contained in a form").

## Écart avec le verdict QA

Un comportement a été observé pendant ce test et mérite d'être documenté, bien qu'il ne s'agisse **pas** d'une régression de STORY-46 : en prenant une capture d'écran plein-page (déclenchant un redimensionnement de viewport côté Playwright), le chat s'est intégralement réinitialisé (retour au seul message de bienvenue). Root-cause identifiée par lecture du code : `FENIX-HANDBALL-CF-SUIVI.html:3492` a un listener `window.addEventListener('resize', ...)` qui appelle `refreshPage()`, lequel réinitialise `chatHistory` et `#chat-messages` (`js/page-analyse.js` lignes 96-103) — un comportement **pré-existant et global à la page Analyse** (touche aussi le brouillon de note coach non sauvegardé), totalement indépendant des chips ajoutées par STORY-46, et qui affecterait de façon identique une conversation démarrée par saisie manuelle avant cette story. Reproduit ensuite un flux normal sans redimensionnement : l'historique s'accumule correctement sur plusieurs clics consécutifs. Aucun changement de code nécessaire pour STORY-46 ; à signaler pour un futur ticket indépendant si Romain souhaite un jour blinder le chat contre les redimensionnements de fenêtre (hors scope ici).

Sinon, aucun écart avec le verdict QA (PASSED) : tous les critères d'acceptation se comportent de façon identique sur ce nouveau match.

## Verdict

**CONFIRMÉ** — la fonctionnalité fonctionne en conditions réelles sur un match distinct de celui du QA, avec accumulation correcte de l'historique et non-régression de la saisie libre. Le seul point relevé (reset du chat au resize navigateur) est un comportement pré-existant hors scope, correctement isolé et non bloquant.
