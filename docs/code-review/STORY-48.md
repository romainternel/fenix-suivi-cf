# Code Review — STORY-48 : Mode "Articulation" côté Attaque

**Agent :** Code Reviewer
**Date :** 2026-09-16

---

## Fichiers modifiés

- `js/page-analyse.js` : +constantes (`ARTIC_ATT_POSTES`, `ARTIC_ATT_9M_ARC`, `ARTIC_ATT_LAYOUT`, `ARTIC_ATT_BLOCKS`), +9 fonctions (`_articAttCounts`, `computeArticulationAttStats`, `_articAttPrimaryEntry`, `_articAttEffClass`, `_articAttBlockEff`, `_articAttBlockDetail`, `computeArticAttCombos`, `_articRankedAttCombos`, `_drawArticulationAttCourt`) + 5 handlers d'état (`_redrawArticAttCourt`, `_setArticAttWidth`, `_setArticAttManualJoueur`, `_setArticAttManualCombo`, `_toggleArticAttPosteEditor`), 3 modifications ciblées (bouton "🎯 Articulation", `_setEncTeamMode`, `_setEncGraphMode`).
- `FENIX-HANDBALL-CF-SUIVI.html` : bump `?v=283` → `?v=284` sur les 9 balises.
- `CLAUDE.md` : version bump, ligne d'avancement §9 ajoutée.

## Conformité Architecture (`docs/arch/articulation-attaque.md` §3-6)

Suivi à la lettre pour les constantes, les signatures de fonctions, l'état séparé (`_articAtt*` jamais lu ni écrit par le code défense — vérifié : `grep -n "_articAtt" js/page-analyse.js` ne fait ressortir aucune occurrence dans le bloc défense, et inversement `_articManualPoste`/`_articOpenPoste`/`_articWidth`/`_articDispositif` n'apparaissent nulle part dans le nouveau bloc attaque), et les 3 points d'intégration.

**Écart volontaire par rapport à l'Architecture, corrigé une seconde fois après retour de Romain (Risk R1)** : le §3.2 proposait un filtre `possession` strict identique à la défense, avec la seule instruction de le *vérifier* avant de le figer. Cette vérification (imposée par la story, §"⚠️ Vérification obligatoire") a été faite sur données réelles et a révélé un vrai écart, mais la première version du correctif (une "tolérance" ad hoc sur `Tir raté`) reposait sur le mauvais raisonnement — corrigée après une remarque de Romain :

- Sur les 120 lignes FENIX taguées `articulation_att`, 36 n'ont pas de tag `Possession` : `Jet franc`, `2' obt` (sous-événements déjà connus, STORY-44) — et **4 `Tir raté`**, un cas non prévu par le Brief/Architecture.
- Hypothèse initiale testée et écartée : ces 4 tirs seraient-ils en réalité des Pen (7m) ? Vérifié explicitement : `phase_att` de ces 5 lignes (dont 1 sans `articulation_att`) vaut "+", "-" ou "Att al", jamais "Pen" — et surtout, **aucune des 8 lignes FENIX `phase_att = "Pen"` de la saison n'a `articulation_att` rempli** (vérifié par requête directe). Un Pen ne peut donc structurellement jamais entrer dans ce calcul, avec ou sans filtre `Possession`.
- **Règle correcte (confirmée par Romain)** : le tag `Possession` sert à dédoublonner une séquence qui s'étale sur plusieurs lignes — il n'a de sens que pour les sous-événements qui prolongent une séquence déjà comptée ailleurs (`PB`/`PO`/`Jet franc`/`2' obt`/`Pen`). Un tir (`But`/`Tir raté`) est par nature un événement terminal et unique : pour un **% de réussite au tir** (`buts/(buts+tirs ratés)`, la formule choisie par cette story), la possession n'entre pas en jeu, qu'elle soit taguée ou non. La première version (tolérance limitée à `Tir raté` seul) produisait le bon chiffre par coïncidence mais aurait laissé passer un futur `But` sans tag `Possession` (0 cas aujourd'hui, mais non garanti).
- Correctif final (`_articAttCounts`) : un tir (`But`/`Tir raté`) est toujours compté dès que `articulation_att` est renseigné, indépendamment du tag `Possession` ; un sous-événement reste filtré par `Possession` comme avant.
- Impact numérique : **identique à la première version** (84 → 88 séquences comptées sur la saison, +4, exactement les 4 tirs ratés identifiés) — revérifié par script Node après correction, 0 divergence. Seul le raisonnement/l'implémentation change, pas le résultat affiché.

Documenté ici comme demandé par la story ("comme pour STORY-44"), pas une improvisation — c'est exactement le scénario que le Risk Analyst avait anticipé (R1) et que la story imposait de vérifier avant de figer le calcul.

## Scope

Diff limité aux 3 fichiers attendus. **Aucune fonction défense existante modifiée** — confirmé par `git diff` : les 3 seules lignes supprimées correspondent exactement aux 3 points d'intégration autorisés par l'Architecture (bouton, `_setEncTeamMode`, `_setEncGraphMode`), aucune ligne du bloc défense (`computeArticulationStats` → `_toggleArticPosteEditor`) n'apparaît dans le diff.

## CSS — zéro nouvelle classe (vérifié, pas supposé)

Extraction programmatique de toutes les classes référencées dans le nouveau bloc (`class="..."` + littéraux hors interpolation) : 32 classes, **toutes déjà définies dans `css/style.css`** (vérifié par grep croisé, aucune absente). Aucune modification de `style.css`.

**Point mineur, non bloquant** : la règle `.enc-pie-mode-btn.artic-disabled` (`css/style.css:2882`) devient CSS mort — plus aucun code JS ne pose cette classe (le bouton est cliquable dans les deux modes désormais). Conforme à l'Architecture §6 ("zéro modification de style.css") qui ne demandait pas son retrait ; à traiter un jour dans un nettoyage CSS général si besoin, pas dans le scope de cette story.

## Vérifications systématiques

- **Nommage** : `pKey` → libellé affiché via `_articAttPosteLabel` (`pk.replace(/^att_/, '').toUpperCase()`), conforme au Design (`ALG` affiché, pas `ATT_ALG`).
- **Résolution de nom joueur** : `_resolveArticJoueur` réutilisée telle quelle (générique, déjà éprouvée).
- **Cas vides** : `stats.total === 0` (aucune donnée) → message dédié ; `widthStat.incomplete` (poste manquant) → message dédié ; `widthStat.possessions === 0` (composition jamais observée) → message dédié. Les 3 chemins gérés explicitement, jamais de rendu silencieusement vide (critère d'acceptation 6).
- **État indépendant** : `window._articAttWidth`/`_articAttManualPoste`/`_articAttOpenPoste` distincts de `window._articWidth`/`_articManualPoste`/`_articOpenPoste` — vérifié par lecture croisée, aucune variable partagée (critère d'acceptation 7).
- **Cache-busting** : les 9 balises bumpées, vérifié par `grep -c`.
- **Syntaxe** : `node --check js/page-analyse.js` passe sans erreur.

## Vérification numérique (données réelles, script Node reproduisant les fonctions à l'identique)

- Saison entière (88 séquences comptées, tolérance incluse) : 31 buts / 28 tirs ratés / eff. globale 53%.
- Par poste (le plus utilisé) : ALG=Julien.L (41%), ARG=Marius.C (39%), DC=Issa.S (46%), ARD=Louis.M (53%), ALD=Zach.D (57%), PVT=Yoran.C (47%) — cohérent avec un secteur de jeu réel (aucune valeur aberrante >100% ni négative).
- Match unique (J01 BILLERE-FENIX, "6 complet") : 42 séquences, 11 buts, 13 tirs ratés, 46% — vérifié manuellement (critère d'acceptation 2).
- Classement "Base arrière" : composition la plus fiable observée "Issa.S / Siméo.R / Louis.M" à 75% (n=9), cohérent avec le classement Fiable/Faible attendu.

## Limite de cette review (transparence)

Le serveur MCP Playwright est indisponible (`CONNECT_TIMEOUT`) pendant tout ce cycle — impossible de vérifier par un vrai clic navigateur le rendu visuel (positionnement des 6 ronds sur le terrain, ouverture/fermeture du panneau d'édition, bascule Attaque↔Défense en direct). La logique de calcul et le câblage des handlers ont été vérifiés par lecture de code et par un script Node reproduisant fidèlement les fonctions sur données réelles, mais **le rendu visuel réel n'a pas été observé**. Signalé explicitement à l'étape QA/E2E de ce cycle plutôt que masqué.

## Verdict

**APPROUVÉ** — conforme à l'Architecture à un écart volontaire et documenté près (correctif R1, exactement dans l'esprit demandé par la story). Réserve non bloquante : vérification visuelle réelle non faite (Playwright indisponible), à couvrir manuellement par Romain avant mise en production complète.
