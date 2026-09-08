# QA-46 — Chat IA : questions types suggérées

**Agent :** QA
**Date :** 2026-09-09
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8230), données réelles Supabase.

---

## Critères d'acceptation

- [x] 5 questions types affichées en boutons cliquables au-dessus de la conversation (≥ 4 requis) — `docs/regression/screenshots/story46-chips-full.png`.
- [x] Cliquer une question type déclenche la même réponse qu'une saisie manuelle — vérifié pour "Bilan des supériorités numériques ?" : réponse identique (texte, formatage) à un appel direct de `generateChatResponse()` avec la même chaîne exacte.
- [x] Les 5 questions types obtiennent chacune une réponse pertinente et distincte, testées une par une par clic réel : Enclenchements (buts par type), Supériorités (bilan agrégé STORY-42), Meilleur buteur (Issa.S, 6 buts), Gardien (12 arrêts/41 tirs, 29%), Pertes de balle (18, "c'est beaucoup"). Aucune ne tombe sur la réponse par défaut générique.
- [x] Non-régression saisie libre : "Quel est le score ?" tapé manuellement après avoir utilisé plusieurs chips → réponse correcte ("FENIX 20 - 29 Adversaire. Défaite."), le champ se comporte normalement en alternance avec les chips.
- [x] Champ de saisie vidé après un clic sur une chip (comme après un envoi manuel) — cohérent avec la réutilisation de `sendChatMessage()`.

## Vérification indépendante des exemples de la story (au-delà des critères formels)

Testé les 2 exemples cités dans le texte de la story ("Quelle famille est la plus efficace ?", "Meilleure charnière défensive ?") pour confirmer qu'ils auraient été de mauvais choix : le premier tombe sur la branche "meilleur buteur" (réponse hors-sujet par rapport à l'intitulé), le second sur la réponse par défaut générique. Confirme que le Developer a eu raison de s'écarter des exemples illustratifs et de vérifier empiriquement avant de figer la liste.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation validés en conditions réelles, avec vérification indépendante que les questions choisies (différentes des exemples illustratifs de la story) sont bien les bonnes.
