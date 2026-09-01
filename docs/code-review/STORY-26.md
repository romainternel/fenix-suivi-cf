# Code Review — STORY-26 (Écran d'édition des bilans)

**Agent :** Code Reviewer
**Date :** 2026-09-01
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` (entrée menu, markup `.slide-panel` `#bilan-modal`/`#bilan-overlay`, +7 fonctions près de `processBilans()`, tri ajouté dans `loadFromSupabase()`), `js/player-mode.js` (Escape handler +1 branche)

---

## Bug latent préexistant trouvé et corrigé — le point le plus important de cette review

Le Developer a découvert que `processBilans()` traite les bilans dans l'ordre reçu (pas trié par journée de fin) — un bilan ajouté avec une date antérieure au dernier existant est silencieusement absent des filtres, sans erreur. Ce n'était pas un risque avant cette story (l'Excel produit toujours des lignes déjà en ordre chronologique), mais devient un risque réel dès qu'un formulaire permet d'ajouter un bilan dans n'importe quel ordre.

**Bonne discipline de scope** : plutôt que de modifier `processBilans()` (explicitement hors scope de la story), le Developer a corrigé le problème en triant les **données d'entrée** (`_rawBilanRows`) avant qu'elles n'atteignent la fonction de calcul — `_sortRawBilanRows()`, appliquée à la fois dans le nouvel éditeur ET dans `loadFromSupabase()` (où le même risque latent existait déjà, juste jamais déclenché faute de scénario de test). C'est la bonne frontière : "éditer les données sources" (dans scope) vs "changer la logique de calcul des bornes" (hors scope) — trier n'est pas une logique de calcul, c'est une garantie sur la forme des données en entrée.

**Vérifié en conditions réelles, pas supposé** : test explicite avec un bilan intentionnellement mal ordonné (journée de fin antérieure au dernier bilan existant) — confirmé invisible sans le fix, correctement pris en compte avec.

## Conformité au modèle STORY-25

Structure identique : ouverture immédiate du panneau avec état "Chargement…", fetch async, formulaire avec le même style visuel, bouton supprimer avec `confirm()` natif, rafraîchissement complet après écriture plutôt que manipulation DOM ciblée.

## Choix de rafraîchissement — `processBilans()` seul, pas `populateFilters()`

Bon réflexe repéré en amont du code (commenté explicitement) : `processBilans()` peuple déjà lui-même les 3 dropdowns "Période" concernés (lignes juste avant sa fermeture) — appeler `populateFilters()` en plus aurait reconstruit inutilement les filtres match/joueur/saison sans rapport, et **effacé leur sélection en cours** (un vrai bug UX si ça avait été fait). Le Developer a vérifié le code existant avant de choisir la fonction à rappeler plutôt que de copier le pattern d'une autre story sans vérifier.

## PK utilisée correctement

`bilan` a un PK auto-généré (`id bigserial`), pas une clé naturelle — `addBilan()` n'inclut jamais `id` dans l'upsert (chaque ajout crée systématiquement une nouvelle ligne, pas d'écrasement accidentel), et `deleteBilan(id)` cible bien par `id` (converti en nombre avant la requête). Cohérent avec l'asymétrie de clé déjà documentée depuis STORY-20 (`TABLE_PK`).

## Non-régression

Seule modification de code existant : une ligne dans `loadFromSupabase()` (ajout du tri) et une branche `else if` dans le handler `Escape` — le reste est additif.

---

## Verdict : ✅ APPROUVÉ
