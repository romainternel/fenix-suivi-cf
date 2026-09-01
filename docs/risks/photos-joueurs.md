# Risques — Photos joueurs (portrait + corps entier)

**Agent :** Risk Analyst
**Date :** 2026-09-01

---

## Tableau des risques

| # | Risque | Probabilité | Impact | Recommandation |
|---|---|---|---|---|
| R1 | **Poids des fichiers non maîtrisé** — les photos fournies en exemple sont en résolution très haute (le corps entier dépasse 5000×8000px) ; bundlées telles quelles, ~20 joueurs × 2 formats représenteraient plusieurs dizaines de Mo, dégradant le temps de chargement de l'app (contexte gymnase, connexion parfois faible) | Élevée (déjà constaté sur les 2 exemples fournis) | Moyen (dégrade l'expérience mais ne casse rien) | **P0** — critère d'acceptation obligatoire sur la story d'intégration : format WebP, portrait ≤ 300px de large, corps entier ≤ 500px de large, cible < 100 Ko/fichier. Prévoir une étape explicite de redimensionnement (outil externe) avant tout `git add` d'une photo |
| R2 | **Sensibilité à la casse des noms de fichiers** — Romain travaille sur Windows (insensible à la casse), l'app est servie par GitHub Pages sur un filesystem Linux (sensible à la casse) : un fichier référencé `Marius-Caujolle.webp` dans `PLAYER_PHOTOS` mais commité en `marius-caujolle.webp` fonctionnera en local et donnera un 404 silencieux en production | Moyenne (piège classique, déjà le type d'écart "marche en local, casse en prod" rencontré ce mois-ci sur ce projet) | Faible (repli initiales automatique — pas de crash) mais frustrant à déboguer | **P1** — imposer une convention stricte (tout en minuscules, kebab-case) documentée dans la story, et vérifier en E2E que la photo s'affiche bien **sur la prod déployée**, pas seulement en local |
| R3 | **Homonymes / doublons de nom** — l'app a déjà un mécanisme de warning pour les noms ambigus sur le terrain (`joueur-name-warnings`, bannière dupes) ; `getPlayerPhoto()` prend le **premier** nom de `PLAYER_PHOTOS` qui matche via `matchPlayerName()` — si deux joueurs ont un nom proche, le mauvais joueur peut hériter de la photo d'un autre | Faible à moyenne (dépend de l'effectif réel, mais le cas est déjà documenté comme survenu sur ce projet) | Moyen (erreur silencieuse, potentiellement gênante — mauvaise photo affichée à un joueur/parent) | **P1** — la clé de `PLAYER_PHOTOS` doit être le nom **exact** tel qu'il apparaît dans `JOUEURS_TERRAIN` (pas une approximation), et la story doit inclure une vérification manuelle croisée avec la bannière de doublons existante avant mise en prod |
| R4 | **État `_courtPhotoMode` non réinitialisé correctement** — si le terrain SVG est retiré du DOM (plutôt que simplement masqué) pendant le mode photo, un changement de filtre (match/bilan) pendant ce temps n'aurait plus de `#court-players` à mettre à jour ; `renderCourtPlayers()` a déjà un garde (`if (!g) return`) donc pas de crash, mais le terrain reviendrait **obsolète** (non rafraîchi) au retour | Faible | Faible (pas de crash, juste un affichage temporairement pas à jour) | **P2** — recommandation technique claire pour le Developer : basculer via `display:none`/`display:block` (CSS), **jamais** en retirant `#court-players` du DOM — ainsi `renderCourtPlayers()` continue de le maintenir à jour même masqué |
| R5 | **html2canvas et image non chargée au moment de la capture PPT** — `exportJoueurPPT()` capture chaque `.pdf-page` via `html2canvas`, qui peut produire une capture vide si une image n'est pas encore décodée | Faible — **déjà mitigé par le code existant** | — | **Aucune action requise** : `printFicheJoueur()` attend déjà `img.decode()` sur toutes les `<img>` du print zone avant `window.print()`/capture (mécanisme déjà en place pour le logo FENIX) — la photo corps entier en bénéficiera automatiquement sans changement supplémentaire. Confirmé en lisant le code, pas supposé |
| R6 | **Absence de texte alternatif** — un `<img>` sans `alt` pénalise l'accessibilité et n'affiche rien de significatif si le fallback JS (`onerror`) ne se déclenche pas dans un cas non prévu | Faible | Faible | **P3** — `alt="{nom du joueur}"` systématique sur chaque `<img>` de photo, coût nul à l'implémentation |
| R7 | **Cache navigateur sur un remplacement de photo** — si Romain remplace un fichier photo en gardant le même nom, un utilisateur ayant déjà chargé l'app peut voir l'ancienne version en cache | Faible | Très faible (cosmétique, se résout au prochain hard-refresh) | **P3** — accepté en l'état ; si ça devient gênant, ajouter un `?v=` sur les balises `<img>` comme déjà fait pour les scripts |

## Synthèse P0/P1 → à transformer en critères d'acceptation

- **R1 (P0)** : story bloquée tant que les fichiers ne respectent pas le budget de poids défini — critère d'acceptation binaire et vérifiable (taille de fichier).
- **R2 (P1)** : critère d'acceptation "vérifié sur la prod déployée (GitHub Pages), pas seulement en local".
- **R3 (P1)** : critère d'acceptation "clé `PLAYER_PHOTOS` croisée avec la liste réelle de `JOUEURS_TERRAIN`, aucun homonyme mal résolu".

## Ce qui n'est pas un risque ici (hors radar habituel)

- **Connectivité / offline** : fichiers statiques servis par GitHub Pages, mis en cache navigateur normalement — pas de dépendance réseau nouvelle par rapport à l'existant (contrairement à une solution Supabase Storage qui aurait introduit ce risque).
- **Concurrence multi-utilisateurs** : aucune écriture concurrente, les photos sont ajoutées par Romain seul, hors app.
- **Permissions/RLS** : aucune donnée sensible nouvelle, pas de nouvelle ressource backend — hors du périmètre du Security Auditor pour cette feature.
