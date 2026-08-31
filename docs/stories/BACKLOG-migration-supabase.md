# Backlog — Migration Supabase

**Agent :** Scrum Master
**Date :** 2026-08-28

---

## Séquencement

```
STORY-20 (setup Supabase) — bloquée par la fourniture URL+clé anonyme par Romain
    │
    ▼
STORY-21 (import → Supabase)
    │
    ▼
STORY-22 (lecture ← Supabase au boot) ⚠️ story la plus sensible, mitigation R1
    │
    ▼
STORY-23 (migration locale + amorçage famille) ⚠️ clarifier R4 avec Romain avant de commencer
    │
    ▼
STORY-24 (rebranchement comptes/notes/famille en lecture) ⚠️ trancher R2 avec Romain avant mise en prod
    │
    ├──▶ STORY-25 (édition familles — Must Have)
    │
    └──▶ STORY-26 (édition bilans — Should Have, peut être repoussée)
```

Aucune parallélisation possible avant STORY-24 : chaque story dépend structurellement de la précédente (le socle doit exister avant l'import, l'import avant la lecture, la lecture avant la migration, la migration avant le rebranchement des écrans). STORY-25 et STORY-26 peuvent en revanche être développées dans n'importe quel ordre une fois STORY-24 livrée.

## Points de blocage à lever avec Romain avant de lancer `/verifie` sur les stories concernées

1. **Avant tout** : URL + clé anonyme du projet Supabase (bloque STORY-20 et donc tout le reste)
2. **Avant STORY-23** : sur combien d'appareils Romain a-t-il déjà des données locales (notes coach / comptes joueurs) différentes ? (risque R4)
3. **Avant la mise en production de STORY-24** : confirmation explicite que l'exposition de `player_accounts` via la clé anonyme est un risque accepté (risque R2) — sinon, une story de mitigation supplémentaire est à écrire avant de livrer

## Récapitulatif

| Story | Titre | Taille | Priorité PRD |
|---|---|---|---|
| STORY-20 | Setup projet Supabase + schéma | S | Must Have (F1) |
| STORY-21 | Import Excel → Supabase | M | Must Have (F1, F2) |
| STORY-22 | Lecture Supabase au boot | L | Must Have (F3) |
| STORY-23 | Migration locale + amorçage famille | M | Must Have (F4, F5) |
| STORY-24 | Rebranchement comptes/notes/famille | M | Must Have (F4) |
| STORY-25 | Éditeur de familles | M | Must Have (F6) |
| STORY-26 | Éditeur de bilans | S | Should Have (F7) |
