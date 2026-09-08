# STORY-46 — Chat IA : questions types suggérées

**En tant que** Romain (staff),
**Je veux** des questions pré-écrites cliquables au-dessus du Chat IA,
**Afin de** l'utiliser sans devoir deviner quelles formulations il comprend.

## Contexte technique

- Zone concernée : interface du Chat IA (rule-based, non connecté à l'API Claude — cf. CLAUDE.md §9, hors scope de ce cycle) dans `js/page-analyse.js`.
- Purement additif : une rangée de boutons ("chips") au-dessus de la zone de conversation, chacun pré-remplissant le champ de saisie avec une question type et déclenchant l'envoi comme si l'utilisateur l'avait tapée elle-même — aucune modification du moteur de réponse.
- Les questions types doivent correspondre à des patterns que le moteur rule-based sait déjà traiter aujourd'hui (à vérifier par le Developer avant de figer la liste finale) — ex. "Quelle famille est la plus efficace ?", "Quel est notre point faible défensif ?", "Meilleure charnière défensive ?".
- Ajouter un commentaire dans le code reliant les chips aux patterns du moteur qu'elles déclenchent (Risk R8) — pour qu'un futur changement du moteur de réponse pense à revoir cette liste.

## Critères d'acceptation

- [ ] Au moins 4 questions types sont affichées sous forme de boutons cliquables au-dessus de la conversation.
- [ ] Cliquer une question type déclenche la même réponse que si Romain l'avait tapée lui-même mot pour mot.
- [ ] Les questions types choisies obtiennent toutes une réponse pertinente du moteur actuel (pas de question suggérée qui tombe sur une réponse générique/hors-sujet).
- [ ] Non-régression : la saisie libre dans le Chat IA continue de fonctionner normalement en plus des chips.

## Hors scope

- Toute connexion du Chat IA à l'API Claude ou à un vrai moteur de compréhension du langage — reste rule-based.
- La mise en avant réduite du Chat IA dans la nouvelle structure d'onglets (propriété de STORY-40).

## Dépend de

- Aucune.

## Taille

S
