# E2E-48 — Mode "Articulation" côté Attaque

**Agent :** E2E Tester
**Date :** 2026-09-16

---

## Statut : SAUTÉ — MCP Playwright indisponible

Le serveur MCP Playwright a échoué à se connecter (`CONNECT_TIMEOUT`) pendant tout ce cycle `/verifie STORY-48`. Conformément à la consigne ("si le serveur MCP Playwright n'est pas disponible, dis-le clairement et saute l'étape plutôt que de simuler un test"), aucun parcours n'a été exécuté dans un vrai navigateur. Ce qui a pu être vérifié sans navigateur (calculs, câblage, CSS) est documenté dans `docs/qa/QA-48-mode-articulation-attaque.md`.

Cette story introduit une interface interactive (terrain cliquable, panneau d'édition, classement cliquable, état à préserver en basculant Attaque/Défense) — contrairement à STORY-47 (import pur, sans UI), le risque de laisser un défaut purement visuel ou d'interaction passer inaperçu est réel ici. **Un passage manuel par Romain est nécessaire avant de considérer cette story pleinement validée.**

## Script de vérification manuelle (5 minutes, à faire par Romain)

Sur https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html (après le déploiement de v284, ~1-2 min après le push) :

1. Page Analyse → onglet Tactique → ouvrir un match ayant des données (J01 BILLERE-FENIX ou J02 FENIX-LA CRAU).
2. Vérifier que "⚡ Attaque" est bien sélectionné, cliquer sur "🎯 Articulation" → **doit maintenant afficher un demi-terrain** (avant cette story, rien ne se passait en mode Attaque).
3. Vérifier que les 6 ronds affichent bien ALG/ARG/DC/ARD/ALD/PVT avec un nom de joueur chacun (pas de case vide "—" pour tous, sauf si vraiment aucune donnée sur ce poste).
4. Cliquer sur un rond (ex. PVT) → un panneau doit s'ouvrir sous le terrain avec la liste des joueurs déjà observés à ce poste + un menu déroulant. Choisir un autre joueur dans la liste → le rond doit se mettre à jour immédiatement avec le nouveau nom, et le résumé en dessous ("X% de réussite offensive") doit se recalculer.
5. Basculer "6 complet" ↔ "Base arrière" (en haut, ligne LARGEUR) → le résumé et le classement à droite doivent changer.
6. Dans le classement à droite, cliquer sur une ligne → les postes concernés doivent se mettre à jour d'un coup sur le terrain avec les joueurs de cette ligne.
7. **Test critique (Risk R5)** : avec "🎯 Articulation" toujours actif, cliquer sur "🛡 Défense" → le terrain défensif doit s'afficher (dispositif 0-6/1-5). Rouvrir un poste, changer un joueur manuellement. Puis recliquer sur "⚡ Attaque" → **le terrain offensif doit réapparaître avec l'état que vous aviez laissé côté Attaque** (même poste ouvert/même override manuel si vous en aviez fait un à l'étape 4), pas réinitialisé. Refaire l'aller-retour 2-3 fois.
8. Vérifier qu'aucune erreur n'apparaît dans la console navigateur (F12 → Console) pendant toute la manipulation.

Si tout se passe comme décrit, la story peut être considérée pleinement validée — dites-le moi et je referme la réserve dans la checklist (I30). Si un point coince, une capture d'écran suffit pour que je diagnostique.
