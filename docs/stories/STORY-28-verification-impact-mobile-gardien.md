# STORY-28 — Vérification de la page Impact mobile pour un gardien connecté

**En tant que** coach,
**Je veux** être certain qu'un gardien connecté lui-même (Mode Lecture Joueur) voit correctement ses zones d'arrêt sur mobile,
**Afin de** ne pas découvrir un écart en pleine saison sur un écran jamais vérifié en conditions réelles.

## Contexte technique
- Zone concernée : `renderPlayerZones()` (`js/player-mode.js`) — **aucun changement de code attendu** d'après l'analyse Architecture (déjà correcte, gère déjà `isGB` via `matchPlayerName()`)
- Cette story est une vérification, pas un développement — mais reste une story à part entière : "je ne fais pas confiance au code, je vérifie en conditions réelles" (principe déjà appliqué systématiquement sur ce projet)

## Critères d'acceptation
- [x] Connexion réelle avec le compte d'un gardien (Gabin.S, compte de test créé puis supprimé), onglet "Zones" du Mode Lecture Joueur (375px, mobile)
- [x] Stats et zones d'arrêt/encaissement affichées correctement : "6 arrêts / 16 tirs, 38%" — identique à la vue staff (STORY-27) et à la table GB (STORY-26/v246)
- [x] Libellés adaptatifs confirmés visuellement : "ARRÊTS ET BUTS CONCÉDÉS", légende "Arrêté"/"Encaissé" — `docs/e2e/screenshots/story-28-mobile-gardien-zones.png`
- [x] Aucun écart trouvé — le code (`renderPlayerZones()`) était déjà correct comme anticipé par l'Architecture, confirmé en conditions réelles plutôt que simplement supposé

## Hors scope
- Toute modification de la vue staff/desktop — STORY-27
- Toute nouvelle fonctionnalité côté mobile au-delà de la vérification

## Dépend de
- Aucune (indépendante de STORY-27, peut être faite avant, après ou en parallèle)

## Taille
S
