# STORY-40 — Regroupement des onglets (5→3 en vue match, structure commune en vue saison)

**En tant que** Romain (staff),
**Je veux** moins de sections de même rang (3 au lieu de 5 en vue match, une ossature commune entre vue match et vue saison),
**Afin de** m'y retrouver plus vite sans changer de logique de navigation selon le contexte.

## Contexte technique

- Zone concernée : `updateAnalysePage()` (`js/page-analyse.js:58-118`), `_analyseTab()` et le HTML des 5 panneaux `#an-tab-*` (`FENIX-HANDBALL-CF-SUIVI.html`, structure décrite dans le contexte de session — lignes ~307-590 avant ce cycle).
- Nouveaux ids d'onglet, déclarés en constantes plutôt qu'en dur dans le HTML : `AN_TABS_MATCH = ['overview', 'tactique', 'notes']`, `AN_TABS_SAISON = ['tactique', 'tendances']`.
- Regroupement de contenu **existant**, pas de réécriture : `#an-tab-overview` = ancien contenu de l'onglet Résumé (moins le bloc résumé IA, remonté en STORY-39) + ancien contenu de l'onglet Timeline. `#an-tab-tactique` = ancien onglet "Intention attaque" + ancien onglet Gardien. `#an-tab-notes` = ancien onglet Coach + ancien onglet Chat IA (ce dernier moins mis en avant visuellement, cf. `docs/visual/reorganisation-page-analyse.md`).
- En vue saison : `#an-tab-tactique` = cartes familles (déjà affichées aujourd'hui hors onglet en vue saison) ; `#an-tab-tendances` = tableau de `generateSeasonCorrelations()` (déjà existant, simplement déplacé dans un onglet nommé au lieu d'un bloc brut en bas de page).
- `sessionStorage.an_active_tab` (déjà utilisé) continue de fonctionner avec les nouveaux ids comme valeurs — `_analyseTab()` doit vérifier que l'id lu en `sessionStorage` existe bien dans `AN_TABS_MATCH`/`AN_TABS_SAISON` avant de l'activer, et retomber sur le premier onglet sinon (cf. Risk R2, cas d'un ancien id `resume`/`gardien`/`chat` laissé par une session précédente).

## Critères d'acceptation

- [ ] En vue match, 3 onglets exactement sont visibles : "Vue d'ensemble", "Tactique", "Notes & Outils" — plus aucun des 5 anciens noms n'apparaît.
- [ ] "Vue d'ensemble" contient la Timeline (score, moments clés, bascules) et le reste de l'ancien contenu Résumé (hors bloc IA, remonté en STORY-39) — rien n'a disparu, juste regroupé.
- [ ] "Tactique" contient les cartes familles (Vue générale/Matrice 2×2/Articulation, inchangées dans ce regroupement) et la section Gardien × Intentions, dans cet ordre.
- [ ] "Notes & Outils" contient le textarea Coach et le Chat IA, tous deux fonctionnels à l'identique (sauvegarde coach, envoi/réception chat).
- [ ] En vue saison, 2 onglets exactement : "Tactique" (cartes familles) et "Tendances" (tableau de corrélations, contenu strictement identique à l'actuel bloc bas de page).
- [ ] Le premier onglet reste sélectionné par défaut à l'ouverture d'un nouveau match/de la vue saison, comme aujourd'hui.
- [ ] `sessionStorage.an_active_tab` restauré correctement au rechargement de la page pour un onglet valide, et sans erreur JS pour un ancien id (`resume` par exemple, injecté manuellement en test) — retombe sur le premier onglet.
- [ ] Non-régression stricte de toutes les fonctionnalités déplacées : rien ne doit être perdu (chat, notes coach, familles, gardien, timeline, moments clés, bascules, corrélations).

## Hors scope

- Le contenu du bloc Essentiel (STORY-39, déjà remonté hors onglet avant cette story ou en parallèle).
- L'accordéon terrain replié (STORY-41) — cette story ne touche que le système d'onglets sous le terrain/Essentiel, pas le bloc terrain lui-même.
- Tout changement de calcul dans les sections déplacées.

## Dépend de

- Aucune techniquement, mais à séquencer après ou avec STORY-39 (le bloc Essentiel retire du contenu de l'ancien onglet Résumé que cette story regroupe par ailleurs — éviter de développer les deux en parallèle sur des branches qui divergent sur le même HTML).

## Taille

L
