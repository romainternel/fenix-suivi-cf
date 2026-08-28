# Code Review — STORY-14 (Découpage Analyse en 5 onglets)

**Agent :** Code Reviewer
**Date :** 2026-08-28
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` (+137/-78 lignes, essentiellement du déplacement de blocs), `css/style.css` (+12), `js/page-analyse.js` (+27)

---

## Conformité Architecture/Design
- `_analyseTab()` réplique fidèlement le mécanisme de `pmTab()` (bascule `display`, classe active, `sessionStorage`) sans le factoriser — conforme à la décision explicite de l'Architecture (§1.1 : facteurisation rejetée pour cette itération).
- `updateAnalysePage()` n'a **aucune ligne de logique métier modifiée** — les 6 fonctions de rendu existantes sont appelées à l'identique, dans le même ordre. Seul un appel à `_analyseTab(...)` a été ajouté en toute fin de fonction. Conforme au critère "aucune modification de leur code interne".
- Canvas (R1) : `_analyseTab()` redessine `drawTimeline()`/`_drawEncChart()` à l'ouverture des onglets concernés. Vérifié par le Developer que le canvas Gardien (`_drawMiniZoneCanvas`) n'a pas ce besoin — il utilise des dimensions fixes (`canvas.width`/`canvas.height` en attributs HTML), pas `clientWidth` — donc pas affecté par le masquage `display:none`. Raisonnement correct et vérifié dans le code (`_drawMiniZoneCanvas` ne lit jamais `clientWidth`).

## Déviation notable (justifiée)
- **`.pm-tab-btn` non réutilisé littéralement.** La story le suggérait, mais cette classe est conçue pour un fond sombre (`.pm-bar` du mode joueur) — illisible telle quelle sur le fond blanc de la page Analyse (texte blanc à faible opacité sur fond blanc). Le Developer a créé `.an-tab-btn`, calquée en taille/structure sur `.pm-tab-btn` mais avec les couleurs de `.enc-team-btn` (pattern pill déjà utilisé ailleurs sur cette même page, fond clair). Décision techniquement justifiée et documentée en commentaire CSS directement dans le code — je la valide : c'était soit ça, soit livrer des boutons invisibles, ce qui aurait fait échouer le critère "5 boutons d'onglet **visibles**".

## R3 (vue Saison) — interprétation à noter
- Le critère littéral de la story ("les onglets Timeline et Chat IA sont désactivés/grisés en vue Saison") ne correspond pas à l'architecture réelle : `#analyse-content` (qui contient les 5 onglets) et `#analyse-empty` (vue saison, sans onglets) sont deux blocs mutuellement exclusifs et déjà distincts avant cette story. Les 5 onglets ne sont donc **jamais visibles** sans qu'un match soit sélectionné — il n'existe structurellement aucun état où "Timeline" pourrait être un onglet vide à griser. Le Developer a donc implémenté le filet de sécurité réel derrière ce critère (repli sur "resume" si `sessionStorage` contient une valeur invalide) sans ajouter de logique de griséification qui n'aurait jamais eu l'occasion de se déclencher. Comportement vérifié en test (transition Saison → Match re-sélectionné → tab bar restaurée sans état invalide). Je considère l'intention du critère satisfaite ; à signaler au Scrum Master pour ajuster le libellé du critère dans une future révision de story, mais ce n'est pas un manque du Developer.

## Scope
- Fichiers touchés strictement conformes à la story. Aucune modification des fonctions de rendu, aucun débordement vers l'habillage visuel final (réservé à STORY-16) au-delà du minimum nécessaire pour que les onglets soient utilisables.

## Non-régression (R2)
- 12 IDs critiques du contenu déplacé vérifiés présents exactement une fois chacun (aucune perte, aucun doublon) via recherche exhaustive dans le fichier.
- Dashboard, Joueurs (clic terrain), Comptes, Vue joueur testés fonctionnels sans erreur JS après la restructuration.

## Sécurité basique
- Non applicable (aucune donnée sensible, aucune requête).

---

## Verdict : ✅ APPROUVÉ
