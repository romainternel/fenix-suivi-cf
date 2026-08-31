# Audit sécurité — STORY-22 (Lecture depuis Supabase au démarrage)

**Agent :** Security Access Auditor
**Date :** 2026-08-31
**Déclenché car :** la story lit 4 ressources backend (`match_data`, `joueurs`, `tableau_match`, `bilan`) à chaque ouverture de l'app, sans plus aucun repli sur `localStorage`

---

## Périmètre

Aucune nouvelle table, aucune nouvelle policy. Cette story bascule le chemin de lecture initial de `localStorage` (local, sans accès réseau) vers les 4 tables déjà auditées en STORY-20/21, via la même clé publishable, sous les mêmes policies RLS permissives déjà acceptées par Romain.

## Vérifications

- **Surface d'exposition inchangée** : les 4 tables lues ne contiennent toujours aucune donnée d'authentification. Le fait que la lecture se produise désormais systématiquement à chaque chargement de page (au lieu de seulement après un import) ne change pas la nature des données exposées, seulement la fréquence des lectures — sans intérêt pour un attaquant (les données étaient déjà lisibles publiquement via la clé publishable depuis STORY-20).
- **Erreurs réseau ne fuient aucune information sensible** : `showSupabaseBootError()` affiche un message générique ("Impossible de contacter le serveur") — vérifié en conditions réelles (fetchAll patché pour lever une erreur), aucun détail d'erreur brut (stack, URL, clé) n'apparaît dans le DOM. Le message d'erreur détaillé reste uniquement dans la console du navigateur du poste local.
- **Pas de nouvelle donnée écrite** : story explicitement lecture seule, confirmé par lecture du code — `loadFromSupabase()` n'appelle que `fetchAll()`, jamais `replaceTable()`/`upsertRows()`.
- **Le finding Majeur de STORY-20** (R11, Edge Function sans vérification d'appelant) reste inchangé, hors scope de cette story.

## Verdict

Aucun nouveau finding.
