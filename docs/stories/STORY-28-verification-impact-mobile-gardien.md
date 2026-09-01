# STORY-28 — Vérification de la page Impact mobile pour un gardien connecté

**En tant que** coach,
**Je veux** être certain qu'un gardien connecté lui-même (Mode Lecture Joueur) voit correctement ses zones d'arrêt sur mobile,
**Afin de** ne pas découvrir un écart en pleine saison sur un écran jamais vérifié en conditions réelles.

## Contexte technique
- Zone concernée : `renderPlayerZones()` (`js/player-mode.js`) — **aucun changement de code attendu** d'après l'analyse Architecture (déjà correcte, gère déjà `isGB` via `matchPlayerName()`)
- Cette story est une vérification, pas un développement — mais reste une story à part entière : "je ne fais pas confiance au code, je vérifie en conditions réelles" (principe déjà appliqué systématiquement sur ce projet)

## Critères d'acceptation
- [ ] Connexion réelle avec le compte d'un des 3 gardiens (Gabin.S, Noah.O ou Enzo.D), onglet "Zones" du Mode Lecture Joueur (375px, mobile)
- [ ] Stats et zones d'arrêt/encaissement affichées correctement, cohérentes avec la fiche du même gardien côté staff
- [ ] Libellés adaptatifs déjà en place ("ARRÊTS ET BUTS CONCÉDÉS", "Arrêté"/"Encaissé") confirmés visuellement, pas juste lus dans le code
- [ ] Si un écart réel est trouvé (contrairement à l'attendu de l'Architecture) : le documenter et le corriger dans cette story, ne pas le reporter silencieusement

## Hors scope
- Toute modification de la vue staff/desktop — STORY-27
- Toute nouvelle fonctionnalité côté mobile au-delà de la vérification

## Dépend de
- Aucune (indépendante de STORY-27, peut être faite avant, après ou en parallèle)

## Taille
S
