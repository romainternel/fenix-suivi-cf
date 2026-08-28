# Architecture — Refonte Navigation & Design Visuel FENIX Stats CF

**Agent :** Architect
**Date :** 2026-08-28
**Input :** `docs/prd.md`, `docs/design/navigation-refonte.md`, code existant vérifié en direct (`FENIX-HANDBALL-CF-SUIVI.html`, `js/player-mode.js`, `js/page-analyse.js`)

**Contexte technique (pas de `CLAUDE.md` disponible, vérifié directement) :** monolithe `FENIX-HANDBALL-CF-SUIVI.html` + fichiers JS externes chargés en `<script src="...?v=NNN">` (versionnage manuel, pas de bundler), CSS vanilla dans `css/style.css`, hébergement statique GitHub Pages. Aucun framework front, aucun système de composants — tout est DOM direct + `innerHTML`.

---

## 1. Décision technique

### 1.1 F2 — Onglets Analyse : généraliser le pattern existant, ne rien réinventer

Le mode joueur a déjà exactement le mécanisme dont on a besoin (`pmTab()` dans `player-mode.js`) : bascule d'affichage entre conteneurs frères via `style.display`, ré-invocation de la fonction de rendu du conteneur qui devient visible, mémorisation de l'onglet actif en `sessionStorage`.

**Décision : répliquer ce pattern pour Analyse, sans le facteur en fonction partagée pour l'instant.** Deux options considérées :

- **(A) Factoriser un `_makeTabSystem()` générique réutilisé par mode joueur ET Analyse.** Rejeté pour cette itération : le mode joueur gère 3 onglets avec des cas particuliers propres (destruction de chart.js à la sortie de l'onglet fiche, gestion `orientationchange`) — le généraliser demanderait de toucher un code qui fonctionne et vient d'être audité sans régression. Le risque dépasse le bénéfice pour un gain de duplication somme toute modeste (~20 lignes).
- **(B) Nouvelle fonction `_analyseTab(tab)` dédiée à la page Analyse, calquée sur `pmTab()` mais indépendante.** **Retenue.** Simple, isolée, zéro risque sur le mode joueur existant. Si un 3e système d'onglets apparaît un jour, la factorisation redeviendra pertinente (cf. §7 critère de bascule).

**Implémentation :**
- 5 nouveaux conteneurs dans le HTML sous `#analyse-content`, après le bloc terrain+cartes (qui reste hors onglets, toujours visible) : `#an-tab-resume`, `#an-tab-timeline`, `#an-tab-enclenchements`, `#an-tab-gardien`, `#an-tab-chat`.
- Les sections existantes ne sont **pas réécrites** — elles sont déplacées (au sens HTML : coupées-collées) à l'intérieur du conteneur d'onglet qui leur correspond, avec leurs IDs internes intacts (`#enc-familles-section`, `#timeline-canvas`, `#chat-messages`, etc. ne changent pas).
- `updateAnalysePage()` **ne change pas** : il continue d'appeler `generateResume3Points()`, `generateIndicateurs()`, `drawTimeline()`, `renderBasculContext()`, `renderEncFamillesSection()`, `renderGardienEncSection()` exactement comme aujourd'hui, dans le même ordre, à chaque changement de match/filtre — qu'un onglet soit visible ou non. **Rendu eager, pas lazy** : le volume de données actuel (2-3 matchs, quelques centaines de lignes) ne justifie pas la complexité d'un rendu à la demande. À réévaluer si le volume de données change d'un ordre de grandeur (cf. §7).
- `_analyseTab(tab)` (nouvelle fonction, `js/page-analyse.js`) : bascule `display:none/block` sur les 5 conteneurs, gère l'état actif visuel des boutons d'onglet, sauvegarde dans `sessionStorage` (clé `an_active_tab`), restaure au chargement de `updateAnalysePage()`.

**Point d'attention technique identifié (pattern déjà connu dans ce projet) :** les canvas (`timeline-canvas`, `enc-pie-canvas`, `enc-radar-canvas`) lisent `clientWidth` pour se dimensionner. Si un onglet est masqué (`display:none`) au moment où sa section est (re)dessinée, `clientWidth` vaut 0 et le canvas se dessine à taille nulle — bug déjà rencontré et déjà traité ailleurs dans le code actuel via `requestAnimationFrame` différé (cf. `_drawEncChart()` existant). **Règle à appliquer :** `_analyseTab(tab)` doit ré-invoquer le draw du canvas concerné (`drawTimeline()` ou `_drawEncChart()`) juste après avoir rendu l'onglet visible, pas seulement au moment du calcul des données — même logique défensive que l'existant, appliquée au nouveau point d'entrée qu'est le changement d'onglet.

### 1.2 F1 — Menu "Outils" : changement additif, zéro risque sur l'existant

Vérifié dans le code : les boutons `🔑 Comptes` (`#btn-player-accounts`) et `👤 Vue joueur` (`#btn-preview-mode`) **n'ont pas** la classe `.nav-btn` et **ne passent pas** par `setupNavigation()` / le mécanisme de bascule de page (`.page.active`) — ce sont deux boutons autonomes avec un `onclick` direct (`openPlayerAccountsModal()`, `openPreviewModal()`). Ils sont donc déjà, techniquement, complètement découplés du système de pages.

**Implémentation :** les extraire visuellement de la barre de nav vers un composant dropdown (réutiliser le pattern déjà présent dans le code — `.multi-select-dropdown` du filtre RÉSULTAT de la barre sticky Analyse, même mécanique toggle-on-click). Les `onclick` des 2 actions ne changent pas d'une ligne — seul leur habillage visuel (bouton déclencheur + menu) change.

### 1.3 F5 — Modale → panneau latéral : nouveau composant, contenu inchangé

`#pa-modal` (Comptes) et `#preview-modal` (Vue joueur) sont deux implémentations séparées, chacune avec ses styles inline (`style="display:flex;position:fixed;inset:0;..."` en dur sur l'élément, pas de classe CSS partagée). C'est déjà une petite dette (duplication), indépendante de ce chantier mais qui va se voir en la traitant.

**Décision :** créer une classe CSS partagée `.slide-panel` (+ `.slide-panel-overlay`) dans `style.css`, et migrer les DEUX modales vers cette classe commune plutôt que de dupliquer le nouveau pattern deux fois. Le contenu interne de chaque modale (formulaire de compte, sélecteur de joueur) ne change pas — seul le conteneur change de `position:fixed;inset:0` (centré) à `position:fixed;top:0;right:0;height:100%` (glissant depuis la droite) + une classe `.open` pilotant la transition CSS plutôt que `style.display` direct (nécessaire pour que l'animation d'entrée/sortie fonctionne — un `display:none` ne peut pas être animé).

**Impact sur le JS existant :** `openPlayerAccountsModal()` / `openPreviewModal()` / leurs fonctions de fermeture doivent passer de `el.style.display = 'flex'` à `el.classList.add('open')` (et inversement à la fermeture). Changement mécanique, localisé à ces 4 fonctions dans `player-mode.js`.

---

## 2. Alternatives considérées et rejetées

- **Vrai routing (hash-based ou History API) pour transformer Comptes/Vue joueur en pages avec URL propre.** Rejeté pour ce cycle : réglerait proprement le point G6 (retour navigateur) de l'Audit Final, mais c'est un changement d'architecture de navigation globale (impacterait aussi Dashboard/Analyse/Joueurs pour rester cohérent), hors du scope "retouche" fixé par le PRD. À reconsidérer comme chantier séparé si G6 devient un vrai point de friction remonté par les utilisateurs.
- **Découpage de la page Analyse en vraies pages séparées (une route par section) plutôt qu'en onglets.** Rejeté : redondant avec le point précédent (pas de routing), et le PRD demande explicitement de garder le bloc terrain+cartes visible en permanence — un découpage en pages séparées le dupliquerait sur chaque page ou le sortirait du flux, ce que les onglets évitent naturellement.

## 3. Impact sur l'existant

| Fichier | Impact |
|---|---|
| `FENIX-HANDBALL-CF-SUIVI.html` | Restructuration de la nav (barre + dropdown Outils), déplacement des sections Analyse dans 5 conteneurs d'onglets, migration des 2 modales vers `.slide-panel` |
| `css/style.css` | Nouveaux tokens (`--gray-*`, `--surface-*`), nouvelle classe `.slide-panel`, classes d'onglets Analyse (réutilisation du style `.pm-tab-btn` existant, décliné) |
| `js/page-analyse.js` | Nouvelle fonction `_analyseTab()` ; **aucune** modification des fonctions de rendu existantes (`generateResume3Points`, `generateIndicateurs`, `drawTimeline`, `renderBasculContext`, `renderEncFamillesSection`, `renderGardienEncSection`) |
| `js/player-mode.js` | 4 fonctions modifiées mécaniquement (`style.display` → `classList`) pour les 2 modales — mode joueur lui-même non touché |
| `js/utils.js`, `js/page-joueurs.js`, `js/page-notes-graph.js` | **Aucun impact** |

Rien dans ce chantier ne touche à `COLS`, `DATA`, `TEMPS_JEU`, `JOUEURS_TERRAIN` ni à aucune logique de calcul — c'est un chantier de présentation pure, ce qui limite structurellement le risque de régression fonctionnelle (le Risk Analyst doit néanmoins vérifier le risque de régression *visuelle/interaction*, distinct du risque de calcul).

## 4. Nouvelles structures de données

Aucune. Une seule nouvelle clé `sessionStorage` (`an_active_tab`), même nature que `pm_active_tab` qui existe déjà.

## 5. Nouvelles fonctions/modules

- `_analyseTab(tab)` — `js/page-analyse.js`
- Extension mineure de `openPlayerAccountsModal()`, `closePlayerAccountsModal()`, `openPreviewModal()`, `closePreviewModal()` — `js/player-mode.js`

## 6. Risques

- **Déplacement de markup HTML volumineux (§1.1)** : couper-coller de larges blocs dans un fichier HTML monolithe de plusieurs milliers de lignes est le geste le plus mécaniquement risqué de ce chantier (un ID mal fermé, une balise orpheline). À faire section par section, avec vérification visuelle immédiate après chaque déplacement plutôt qu'en un seul gros commit.
- **Canvas masqués (§1.1)** : si la règle de ré-invocation du draw au changement d'onglet est oubliée sur un seul des 3 canvas concernés, régression silencieuse (canvas vide, pas d'erreur JS) — point de vigilance explicite pour le QA.
- **Divergence visuelle entre le nouveau composant `.slide-panel` et les modales existantes non migrées** (s'il en existe d'autres dans le code non identifiées ici) — à vérifier par un grep exhaustif `position:fixed` / `.modal` avant de livrer, pour ne pas laisser deux styles de "fenêtre par-dessus" coexister sans raison.

## 7. Critère de bascule

- Si un **3e système d'onglets** apparaît dans l'appli après celui-ci (mode joueur + Analyse), factoriser `pmTab()`/`_analyseTab()` en un composant partagé devient rentable — pas avant.
- Si le volume de données d'une saison dépasse largement l'ordre de grandeur actuel (ex. 20+ matchs, plusieurs milliers de lignes) au point que `updateAnalysePage()` devient perceptiblement lent sur mobile, repasser le rendu des onglets Analyse en lazy (ne calculer que l'onglet actif) — non nécessaire aujourd'hui, à surveiller.
- Si le point G6 (retour navigateur qui quitte l'app) remonte comme friction réelle de la part des utilisateurs, c'est le signal pour ouvrir un chantier de routing séparé plutôt que de continuer à le contourner écran par écran.
