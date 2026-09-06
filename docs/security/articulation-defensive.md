# Security Audit — Articulation défensive (STORY-33 : colonnes Supabase)

**Agent :** Security Access Auditor
**Date :** 2026-09-02

---

## Ressource backend concernée

7 nouvelles colonnes (`articulation_def`, `p1`...`p6`) sur la table `match_data` existante, projet Supabase `oamldfduxwsghrxdsaxy`.

## Vérification policy par policy

- `match_data` a une seule policy RLS : `for all using (true) with check (true)` — s'applique **au niveau de la ligne**, pas de la colonne. Les 7 nouvelles colonnes héritent automatiquement de la même policy que le reste de la ligne, sans configuration supplémentaire nécessaire ni possible à contourner différemment.
- Cette policy permissive est une **décision déjà actée** (CLAUDE.md §6 : "RLS permissive assumée... décision actée dès STORY-20, pas un TODO") — hors du périmètre de cette story, je ne la remets pas en cause, je vérifie seulement que rien de nouveau ne l'aggrave.

## Séparation des rôles

- `loadFromSupabase()` charge `match_data` intégralement pour **toute** session (staff et joueur), avant même la détermination du rôle — comportement préexistant, inchangé par cette story.
- Conséquence : un joueur connecté verra, comme pour `intention_attaque`/`enclenchement` déjà en place, les nouvelles colonnes d'articulation défensive de toute l'équipe (qui a défendu où, sur quelle séquence). C'est une extension de la **même catégorie** de donnée tactique déjà pleinement partagée avec les joueurs (pas une nouvelle catégorie de donnée sensible type coordonnées personnelles ou identifiants) — cohérent avec le modèle mono-niveau déjà en place, pas une régression.
- Écriture : uniquement via réimport Excel, déclenché uniquement côté staff (`processFile()`, jamais appelé depuis une session joueur) — aucun nouveau chemin d'écriture introduit pour le rôle joueur.

## Fuite via le front / clés

Aucun secret nouveau. Clé publishable déjà documentée comme non sensible par conception (protection réelle = RLS, pas la clé).

## Traçabilité

Inchangée — `match_data` n'a jamais eu de suivi par utilisateur (remplacement intégral à chaque import), pas une caractéristique propre à cette story.

## Verdict

**Aucun finding** — ni Critique, ni Majeur, ni Mineur. Les nouvelles colonnes s'inscrivent exactement dans le modèle d'accès déjà en vigueur et déjà accepté pour le reste de `match_data`. Feu vert sans réserve.
