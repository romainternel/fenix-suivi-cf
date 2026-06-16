# Audit Nuit — 2026-06-16

> Rapport produit par analyse statique complète du code source (sans exécution).
> Fichiers lus : `FENIX-HANDBALL-CF-SUIVI.html`, `js/utils.js`, `js/player-mode.js`, `js/page-analyse.js`, `js/page-joueurs.js`, `js/page-notes-graph.js`, `css/style.css`.

---

## PARTIE 1 — Bugs détectés

### 1.1 Dead code / fonctions orphelines

---

**Bug #1 — `getPlayerPoste()` inutilisée**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, ligne ~998
- Description : La fonction `getPlayerPoste(nomJoueur)` compare les noms en `.toLowerCase()` strict, sans passer par `matchPlayerName()`. Elle n'est jamais appelée ailleurs dans le code (les consommateurs utilisent directement `JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom))`).
- Sévérité : 🟢 (pas de bug actif, juste du bruit)
- Fix : Supprimer ou remplacer l'implémentation par un appel à `matchPlayerName`.

---

**Bug #2 — `openPlayerModal()` / `closePlayerModal()` : vue modale dupliquée**
- Fichier : `js/page-joueurs.js`, lignes ~509–638
- Description : `openPlayerModal()` reconstruit des stats par match sans filtre bilan ni filtre match actif (contrairement à `selectJoueur()`). Le modal ignore les filtres `filter-joueur-bilan` et `filter-joueur-match`. Les données affichées peuvent donc diverger du panneau principal.
- Sévérité : 🟡 (incohérence d'affichage visible pour l'utilisateur)
- Fix : Passer `matchFilter` et `bilanMatchs` en argument ou les lire depuis le DOM, comme le fait `selectJoueur()`.

---

**Bug #3 — `_effInfoPoste` déclaré hors indentation (`let _effInfoPoste = null`)**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, ligne ~1004
- Description : La variable `_effInfoPoste` est déclarée à la racine du script avec une mauvaise indentation (pas de `var`/`let` dans le bloc du script principal). Son usage dans `openEffInfoModal` est valide, mais si le linter ou un bundler est ajouté, cela produira une erreur de portée.
- Sévérité : 🟢
- Fix : Rentrer la déclaration dans le bloc `<script>` ou la convertir en variable locale de la fonction.

---

**Bug #4 — Variable `showPlayerAverages` et `showMatchCardAvg` jamais modifiées après init**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, lignes ~969–970
- Description : `let showPlayerAverages = false` et `let showMatchCardAvg = false` sont déclarées mais aucune recherche ne révèle de setter dans les fichiers JS analysés. Si les toggles UI correspondants ont été supprimés lors d'un refactor, ces variables sont du dead state.
- Sévérité : 🟢
- Fix : Vérifier si un bouton UI les modifie encore, sinon nettoyer.

---

**Bug #5 — `impactZoneFilter`, `impactBilanFilter`, `impactEfficaciteMode`, `gardienZoneFilter` : état global partagé entre pages**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, lignes ~978–981
- Description : Ces variables sont des `let` globaux. Si l'utilisateur navigue entre la page Impact et la page Joueurs sans réinitialiser les filtres, les états persistent de façon invisible. Pas de reset automatique lors du changement de page détecté.
- Sévérité : 🟡
- Fix : Réinitialiser ces variables dans `refreshPage()` lors de l'activation de la page Impact.

---

### 1.2 Edge cases non gérés

---

**Bug #6 — `computeStreak()` : accès à `MATCHS` qui peut être vide**
- Fichier : `js/player-mode.js`, ligne ~353
- Description : `MATCHS.map(m => { ... })` est appelé sans vérifier que `MATCHS` est défini et non vide. Si `MATCHS = []`, `matchStats` sera vide et la fonction retourne `{ streak: 0, dir: 0 }` sans crash — comportement acceptable. Mais si `MATCHS` est `undefined` (avant chargement), `.map()` plantera.
- Sévérité : 🟡 (possible en mode joueur si les données ne sont pas encore chargées)
- Fix : Ajouter `if (!MATCHS || !MATCHS.length) return { streak: 0, dir: 0 };` en tête de fonction.

---

**Bug #7 — `getPlayerSeasonStats()` : boucle sur DATA pour les PD sans filtre `club`**
- Fichier : `js/player-mode.js`, lignes ~36–44
- Description : La boucle qui compte les `PD` sur `action_joueur / action_att` n'applique aucun filtre `row[COLS.club] === 'FENIX'`. Si une ligne adverse contient le même nom de joueur dans `action_joueur`, le PD est compté deux fois.
- Sévérité : 🟡 (pollution statistique possible)
- Fix : Ajouter `if (row[COLS.club] !== 'FENIX') return;` au début de la boucle forEach de la section PD.

---

**Bug #8 — `drawTimeline()` : `canvas.parentElement.clientWidth` peut être 0**
- Fichier : `js/page-analyse.js`, lignes ~234–236
- Description : `canvas.width = container.clientWidth` est appelé sans vérifier que `clientWidth > 0`. Si le canvas est dans un élément hidden (display:none), `clientWidth = 0` → canvas 0×0 → `ctx.clearRect` OK mais le dessin produit un canvas vide sans erreur. Lors du premier affichage après changement d'onglet, la timeline reste vide jusqu'au prochain appel.
- Sévérité : 🟡
- Fix : Conditionner le dessin : `if (!container.clientWidth) return;` ou utiliser un `requestAnimationFrame` après que l'élément soit visible.

---

**Bug #9 — `_drawImpactCanvas()` : `String(row[COLS.impact]).split(';')` sans garde**
- Fichier : `js/player-mode.js`, ligne ~886
- Description : Le filtre préalable vérifie `r[COLS.impact] && String(r[COLS.impact]).includes(';')` — c'est bien. Mais en interne, `paint()` lit `String(row[COLS.impact]).split(';')` après le filtre. Si jamais `row[COLS.impact]` vaut `'50'` sans `;`, `parseFloat(p[1])` donne `NaN` et le point n'est pas dessiné (le `isNaN` check le protège). Pas de crash, mais un warning silencieux.
- Sévérité : 🟢 (géré proprement)

---

**Bug #10 — `processBilans()` : accès DOM (`document.getElementById('filter-saison')`) au moment du chargement localStorage**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, ligne ~1572
- Description : `processBilans()` lit `document.getElementById('filter-saison')?.value` pour filtrer les bilans par saison. Lors de l'appel depuis `loadFromLocalStorage()` → `processBilans()`, le DOM est disponible car on est dans `DOMContentLoaded`. Mais si les données sont rechargées via un autre chemin avant DOMContentLoaded, la valeur sera `null` (pas de crash grâce au `?.`). Risque faible mais couplage DOM/logique indésirable.
- Sévérité : 🟢

---

**Bug #11 — `generateSeasonCorrelations()` : MIN 3 matchs requis mais pas documenté**
- Fichier : `js/page-analyse.js`, lignes ~641–643
- Description : La fonction retourne silencieusement si `MATCHS.length < 3`. En début de saison (J1, J2), le bloc "Tendances saison" disparaît sans message d'explication pour le coach.
- Sévérité : 🟢 (UX mineure)
- Fix : Afficher un message "Minimum 3 matchs nécessaires pour calculer les corrélations".

---

**Bug #12 — `findMomentsCles()` : la dernière séquence en cours n'est pas poussée si count < 3**
- Fichier : `js/page-analyse.js`, lignes ~417–427
- Description : La logique détecte les runs de 3 buts consécutifs ou plus. La dernière séquence en cours est vérifiée (`if (currentSeq.count >= 3)`). C'est correct. Mais la variable `currentSeq.start` est initialisée à `0` et jamais utilisée dans la détection — elle est donc un artefact sans effet.
- Sévérité : 🟢 (dead field, pas de bug)

---

**Bug #13 — `sendChatMessage()` : injection XSS possible via le message utilisateur**
- Fichier : `js/page-analyse.js`, ligne ~465
- Description : Le message de l'utilisateur (`message`) est injecté via `innerHTML` sans échappement HTML :
  ```js
  chatMessages.innerHTML += `<div class="chat-content">${message}</div>`
  ```
  Un utilisateur malveillant pourrait injecter du HTML/JS. Le vecteur est local (pas de réseau), mais si l'app est un jour partagée en réseau local ou iframe, c'est une vraie vulnérabilité XSS.
- Sévérité : 🟡 (risque faible en standalone, modéré si déployé)
- Fix : Utiliser `textContent` ou un helper `escapeHtml()` avant l'injection.

---

**Bug #14 — `renderPmfGraph()` : `_pmfChart` détruit dans `pmTab('zones')` mais le canvas `pmf-graph-canvas` est recréé via `innerHTML` dans `_renderPlayerFicheContent()`**
- Fichier : `js/player-mode.js`, lignes ~135–138 et ~310–316
- Description : Quand l'utilisateur bascule en onglet "zones" puis revient sur "fiche", `_pmfChart` est détruit (`_pmfChart.destroy(); _pmfChart = null;`). Puis `renderPlayerFiche()` → `_renderPlayerFicheContent()` reconstruit le `innerHTML` de la page, recréant un canvas `pmf-graph-canvas` frais — `renderPmfGraph()` recrée le chart. Le cycle est correct, mais si l'utilisateur change d'onglet très rapidement (double-tap), la destruction et la recréation peuvent se chevaucher car `renderPlayerFiche()` est asynchrone sur le DOM. Risque de chart orphelin.
- Sévérité : 🟡
- Fix : Ajouter un `if (_pmfChart) { _pmfChart.destroy(); _pmfChart = null; }` en tête de `renderPmfGraph()` (déjà présent — OK). Vérifier que le debounce est suffisant sur les events de navigation.

---

**Bug #15 — `computePlayerRank()` : appelle `_computeNoteScore()` pour chaque coéquipier au même poste, sans cache**
- Fichier : `js/player-mode.js`, lignes ~342–348
- Description : `computePlayerRank()` itère sur tous les coéquipiers du même poste et appelle `_computeNoteScore()` pour chacun. `_computeNoteScore()` lui-même itère sur DATA complet. Si JOUEURS_TERRAIN a 5 ARG et DATA a 5000 lignes, on fait 5 × 5000 passes. Appelé depuis `renderBadges()` (mode joueur) ET depuis `selectJoueur()` (mode staff), c'est potentiellement une O(n²) visible sur mobile.
- Sévérité : 🟡 (performance sur grands jeux de données)
- Fix : Mémoïser `_computeNoteScore()` par joueur (Map clé = nom, invalidée au changement de filtre).

---

### 1.3 Problèmes de performance

---

**Bug #16 — Triple boucle DATA dans `selectJoueur()` (PD / Notes / Stats)**
- Fichier : `js/page-joueurs.js`, lignes ~109–153
- Description : `selectJoueur()` effectue **trois boucles complètes sur DATA** en séquence :
  1. `DATA.filter(...)` pour les stats de tir
  2. `DATA.forEach(...)` pour les PD
  3. `DATA.forEach(...)` pour les notes ATT/DEF
  En plus, deux autres boucles dans le bloc GB. Avec 10 000 lignes de DATA (une saison complète), c'est ~50 000 itérations à chaque clic sur un joueur.
- Sévérité : 🟡 (perceptible sur tablette/mobile ancienne)
- Fix : Fusionner en un seul `DATA.forEach()` qui cumule toutes les stats en même temps.

---

**Bug #17 — `renderCourtPlayers()` : DATA filtré deux fois pour l'efficacité de chaque joueur**
- Fichier : `js/page-joueurs.js`, lignes ~15–39
- Description : Pour chaque joueur de `JOUEURS_TERRAIN`, la fonction appelle `DATA.filter()` à l'intérieur d'un `forEach`. Avec 15 joueurs et 5000 lignes, c'est 75 000 itérations avant même de toucher le SVG.
- Sévérité : 🟡
- Fix : Précalculer un Map `{nom -> stats}` en une seule passe sur DATA, puis l'utiliser dans le forEach joueurs.

---

**Bug #18 — Canvas `timeline-canvas` dans `drawTimeline()` non redimensionné si la fenêtre change**
- Fichier : `js/page-analyse.js`, ligne ~234
- Description : Le canvas est redimensionné à `container.clientWidth` une seule fois lors de l'appel. Il n'y a pas de `ResizeObserver` ni de listener `resize` sur la page Analyse. Si l'utilisateur tourne son mobile, la timeline reste au mauvais ratio.
- Sévérité : 🟡 (mobile/tablette)
- Fix : Ajouter un `ResizeObserver` sur le container de la timeline, ou re-appeler `drawTimeline()` dans un listener `orientationchange` / `resize` (comme le fait le mode joueur avec `_pmfChart.resize()`).

---

### 1.4 Bugs mobiles

---

**Bug #19 — `min-height: 100vh` sur `body` (iOS Safari instable)**
- Fichier : `css/style.css`, ligne ~23
- Description : Sur iOS Safari, `100vh` inclut la barre d'adresse et provoque un scroll vertical parasite. Le contenu peut être partiellement caché sous la barre de navigation Safari.
- Sévérité : 🟡
- Fix : Utiliser `min-height: 100dvh` (dynamic viewport height) avec fallback `100vh` pour les anciens navigateurs :
  ```css
  min-height: 100vh;
  min-height: 100dvh;
  ```

---

**Bug #20 — `position: fixed` + formulaire texte (clavier virtuel iOS)**
- Fichier : `css/style.css`, lignes ~370, ~1397, ~1509, ~1592
- Description : Plusieurs éléments en `position: fixed` coexistent avec `#chat-input` (la zone de saisie du chat analyse). Sur iOS, l'ouverture du clavier virtuel provoque un redimensionnement de la viewport qui peut déplacer les éléments fixed de façon erratique et cacherie la zone de saisie sous le clavier.
- Sévérité : 🟡 (page Analyse, saisie du chat)
- Fix : Sur le chat, utiliser `position: sticky` pour la zone de saisie et s'assurer que le scroll se fait bien dans le conteneur de messages, pas sur le body.

---

**Bug #21 — Absence de gestion d'événements `touch` sur les tooltips canvas Impact**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, lignes ~1073–1145
- Description : Les tooltips de survol sur les canvases gardien écoutent `mousemove`. Sur mobile (touch), cet événement n'est pas déclenché. L'utilisateur ne peut pas lire les infos détaillées d'un tir en tapant dessus.
- Sévérité : 🟡
- Fix : Ajouter un listener `touchstart` qui calcule les coordonnées de `e.touches[0]` et affiche le tooltip pendant 3 secondes.

---

### 1.5 Cohérence des données

---

**Bug #22 — `COLS.score_fenix` / `COLS.score_adv` absents du mapping COLS**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, ligne ~1044–1050
- Description : La description métier mentionne `score_fenix` et `score_adv` comme colonnes disponibles, mais le mapping `COLS` ne les contient pas (colonnes 0 à 20 mappées, aucune mention de score instantané). Si ces colonnes existent dans l'Excel et qu'on veut les exploiter (momentum, retournement de score), elles sont inaccessibles.
- Sévérité : 🟡 (fonctionnalité manquante implicite)
- Fix : Ajouter `score_fenix: X, score_adv: Y` dans COLS si les colonnes existent dans l'Excel source.

---

**Bug #23 — `defense_attaquee` absente du mapping COLS**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, ligne ~1044–1050
- Description : La colonne métier `defense_attaquee` (indiquant la défense sur laquelle l'action a lieu) n'est **pas du tout mappée** dans COLS. Le champ `COLS.defense: 5` correspond visiblement à autre chose (probablement le type de défense adverse en général). Aucune analyse sur `defense_attaquee` n'est donc possible avec le code actuel.
- Sévérité : 🔴 (données importantes non exploitées)
- Fix : Identifier la colonne Excel correspondant à `defense_attaquee` et l'ajouter à COLS. Si `defense: 5` EST `defense_attaquee`, le renommer pour clarifier.

---

**Bug #24 — `BILANS = []` quand les matchs ne matchent pas les journées de la feuille Bilan**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, lignes ~1589–1599
- Description : L'algorithme `processBilans()` fait correspondre les matchs par leur numéro `J\d+`. Si un match est nommé différemment (ex: "Match Amical 1" ou "Quart de finale"), il est ignoré du calcul et les bilans peuvent être vides ou tronqués silencieusement. Aucun warning n'est affiché.
- Sévérité : 🟡
- Fix : Logger un warning dans la console si des matchs de DATA ne correspondent à aucune journée du bilan.

---

**Bug #25 — `detectIsGB()` peut retourner `true` à tort pour un joueur qui a tiré sur la même ligne qu'un gardien**
- Fichier : `js/utils.js`, lignes ~87–98
- Description : Le fallback de détection compare `asGardien >= asJoueur`. Si un joueur de champ a très peu de tirs (ex: 1 tir raté) et apparaît une fois dans une colonne `gardien` par erreur de saisie, il peut être considéré comme GB. Ce bug est particulièrement trompeur sur des joueurs polyvalents.
- Sévérité : 🟡 (masqué si la feuille Joueurs est bien remplie)
- Fix : Renforcer la condition avec un minimum absolu : `asGardien >= 5 && asGardien >= asJoueur`.

---

### 1.6 Régressions inter-fonctions

---

**Bug #26 — `setupPlayerUI()` cache `.main` via `style.setProperty('display','none','important')` mais `pmTab()` tente aussi de le cacher**
- Fichier : `js/player-mode.js`, lignes ~67–77 et ~122–124
- Description : `setupPlayerUI()` cache `.nav`, `.header`, `.main` avec `!important`. Ensuite, `pmTab()` fait `mainEl.style.setProperty('display', 'none', 'important')` à chaque appel d'onglet — redondant mais sans danger. Le risque est si un autre code essaie de ré-afficher `.main` sans `!important` : il serait bloqué silencieusement.
- Sévérité : 🟢 (redondant mais pas de bug actif)

---

**Bug #27 — `populateFilters()` reconstruit les selects (innerHTML) sans vérifier si la valeur sélectionnée existait avant**
- Fichier : `FENIX-HANDBALL-CF-SUIVI.html`, lignes ~1640–1714
- Description : Si l'utilisateur sélectionne un match dans `filter-joueur-match` puis importe un nouveau fichier, `populateFilters()` recrée les options et la sélection précédente est perdue (le select revient à "Tous les matchs"). Aucun mécanisme de restauration n'existe. C'est un comportement attendu lors d'un re-import, mais peut surprendre lors d'un simple refresh de filtre saison.
- Sévérité : 🟢 (comportement discutable mais pas un bug)

---

**Bug #28 — `_cachedSeasonStats` dans `getPlayerSeasonStats()` : cache invalidé seulement par nom**
- Fichier : `js/player-mode.js`, lignes ~27–45
- Description : Le cache `_cachedSeasonStats` est invalidé uniquement si le nom de joueur change (`_cachedSeasonStats._nom !== nom`). Si les données DATA changent (nouveau fichier importé), le cache n'est pas vidé. La session joueur est toutefois rechargée entièrement (`location.reload()`) en cas de logout, donc le risque est limité à la session courante.
- Sévérité : 🟢 (risque faible car le cas est théorique en production)
- Fix : Appeler `_cachedSeasonStats = null` dans `processFile()` / `loadFromLocalStorage()`.

---

## PARTIE 2 — Analyse handball : angles et fonctionnalités

### 2A — Analyse match (vue instantanée)

#### Lire un match : momentum et séquences

Un match de handball se joue en séquences de 3 à 7 possessions consécutives. Le **momentum** se lit comme la différence d'écart de score entre deux instants de temps. La donnée disponible dans l'app (colonne `position` = timecode, `resultat` = But, club) permet de reconstruire l'évolution du score seconde par seconde — la timeline actuelle fait déjà cela.

Ce qui manque : mesurer non pas les **runs de buts** mais les **runs de décisions**. Un run n'est réellement dangereux que s'il s'accompagne d'une dégradation des indicateurs (augmentation PB, baisse efficacité, changement de gardien). L'app actuelle détecte les runs de 3 buts consécutifs (`findMomentsCles()`), mais ne croise pas avec la colonne `enclenchement` ni `gardien`.

**Axes à exploiter :**
- Différence de score toutes les 5 minutes — courbe de momentum relative (écart FENIX − ADV normalisé)
- Identification des séquences : quel enclenchement a initié un run positif FENIX ? Quel enclenchement a précédé un run négatif ?
- Corrélation période (MT1/MT2) × run : FENIX décroche-t-il systématiquement en fin de MT2 ?

#### Enclenchements FENIX en attaque

La colonne `enclenchement` (COLS index 9) contient le système offensif utilisé (1-5, 2-4, jeu rapide, GE, etc.). Pour chaque match, on peut calculer :

| Enclenchement | Tirs | Buts | Efficacité | PB associés |
|---|---|---|---|---|
| 1-5 | X | Y | Y/X % | Z |
| Jeu rapide | X | Y | ... | ... |

La question clé pour le coach : **quel enclenchement donne le plus de buts par possession ?** (pas seulement le taux de réussite sur tir, mais aussi la capacité à créer un tir). Si FENIX tente 10 fois en 1-5 et marque 6, c'est 60% — mais si sur ces 10 possessions, 4 se sont terminées en PB sans tir, l'efficacité réelle sur possession est 6/14 = 43%.

Il faut donc définir une métrique "efficacité possession" = Buts / (Tirs + PB) par enclenchement.

#### Défense attaquée

La colonne `defense` (COLS index 5) encode la défense adverse / défense sur laquelle FENIX attaque. Elle permet deux analyses duales :

**En attaque FENIX :** Quand l'adversaire défend en 0-6, FENIX marque combien ? En 1-5 aggressive ? En 2-4 ? Cela permet d'identifier quelle défense pose le plus problème à l'attaque FENIX.

**En défense FENIX :** Quand FENIX défend en 0-6 (lignes club = adversaire), quels résultats subit-il ? Quel enclenchement adverse perfore le plus souvent la défense FENIX ?

La **corrélation triplette** `enclenchement × defense_attaquee × resultat` est le cœur analytique du handball moderne. Exemple : "quand l'adversaire attaque en jeu rapide contre notre 1-5, il marque 70% du temps" — information immédiatement actionnable tactiquement.

#### Gardiens

Les données disponibles (`gardien`, `field_position`, `finalite`, `enclenchement`, `periode`) permettent :
- Carte de chaleur arrêts/buts par zone — déjà implémentée
- **% arrêts par enclenchement adverse** : le gardien est-il plus vulnérable sur jeu rapide ? Sur tir à 9m ext G ? Sur pénalty ?
- **% arrêts par période** : le gardien décroche-t-il en fin de match ?
- **Comparaison gardiens** sur mêmes tirs (si deux gardiens ont joué) : à zone égale, lequel performe mieux ?

---

### 2B — Analyse saison (vue longue)

#### Tendances et progression globale

L'outil BILANS permet de segmenter la saison en périodes. Les KPI à suivre période par période :
- Efficacité tir FENIX (% buts/tirs)
- % arrêts du/des gardien(s)
- Pertes de balle par match
- Buts marqués / concédés moyens

La question centrale : **les écarts inter-bilans sont-ils significatifs ?** Une simple comparaison de moyennes n'est pas robuste si les bilans ont 3–4 matchs. Il faudrait afficher un intervalle de confiance ou, plus pragmatiquement, un indicateur coloré "tendance claire" vs "échantillon insuffisant".

#### Corrélations KPI → victoire/défaite/nul

La vue `generateSeasonCorrelations()` existe déjà et est pertinente. Elle compare les moyennes V/D/N sur 6 KPI. Ce qui manque :
- **Enclenchement × résultat sur la saison** : quel enclenchement FENIX utilise-t-il dans ses victoires vs ses défaites ? La force offensive de la saison est-elle concentrée sur un seul système ? Si oui, l'adversaire peut s'y préparer.
- **Défense adverse × résultat** : contre quelles défenses FENIX perd-il toujours ? C'est une information directe pour la préparation des matchs suivants.

#### Force / faiblesse des enclenchements sur la saison

Un tableau "radar des enclenchements" donnerait pour chaque système : efficacité saison × fréquence d'utilisation × tendance (croissante/décroissante sur la saison). Un enclenchement très efficace mais de moins en moins utilisé est une anomalie à investiguer avec le staff.

#### Profil statistique joueur (signature S-11)

La fonctionnalité `computePlayerSignature()` est déjà implémentée et compare le joueur à la moyenne équipe sur les actions positives. Elle produit un label unique. Ce qui pourrait l'enrichir : une **"empreinte joueur"** sur 5 dimensions normalisées (efficacité tir, note ATT, note DEF, PB/match, PO/match) affichée en radar chart — directement comparable entre joueurs du même poste.

---

### 2C — Analyse joueur (vue individuelle)

#### Actions positives/négatives par période de temps

La colonne `periode` (MT1/MT2) croisée avec les colonnes `action_att` et `action_def` permettrait de savoir si un joueur est plus fort en MT1 (frais) ou en MT2 (en confiance ou fatigué). C'est une information capitale pour la gestion du temps de jeu.

#### Contribution aux enclenchements

En croisant `action_joueur` (présence du joueur dans l'action) avec `enclenchement` et `resultat`, on peut calculer : "dans quel système ce joueur est-il impliqué ? Avec quel résultat ?" Un arrière gauche qui apparaît dans 80% des actions en 2-4 FENIX est clairement le pivot tactique de ce système.

#### Comparer un joueur à la moyenne équipe

La vue notes actuelle compare déjà un joueur à ses coéquipiers du même poste (`computePlayerRank()`). Ce qui manque : une **vue radar multi-dimensionnelle** (efficacité / note ATT / note DEF / PD / PB) avec la médiane équipe superposée. En un coup d'oeil, le coach voit où le joueur surperforme et où il doit progresser.

#### Gardien : carte de chaleur évoluée

La carte actuelle montre arrêts et buts par zone. Ce qui l'enrichirait :
- **Comparaison vs match précédent** : les zones vulnérables ont-elles changé ?
- **Zone critique** : quelle zone concentre le plus de buts concédés en proportion des tirs reçus dans cette zone ?
- **Enclenchement adverse par zone** : les buts en 6m central viennent-ils surtout de jeu rapide ou de pénalty raté ?

---

### 2D — Instants courts vs instants longs

#### Instant court (1 match) : focus décision tactique

Un match est un événement unique et contextuel. L'analyse doit être **orientée action** : pas des moyennes, mais des **séquences**. Questions pertinentes pour un coach pendant ou après un match :
- Quelle est notre efficacité sur les 10 dernières possessions ? (momentum récent)
- Depuis le début de la 2e mi-temps, quel gardien adverse arrête le plus ? Dans quelle zone ?
- Notre enclenchement 1-5 ne fonctionne pas ce soir : combien de possessions sans but ?
- Quelles rotations défensives adverses ont stoppé notre jeu rapide ?

L'instant court demande des **stats cumulées glissantes** (fenêtre de 5, 10, 15 possessions) plutôt que des stats globales.

#### Instant long (saison / multi-bilans) : focus tendances

Sur une saison, les biais individuels s'estompent et les patterns structurels émergent. Questions pertinentes :
- Notre efficacité tir sur les 5 premiers matchs était X, sur les 5 derniers elle est Y : tendance confirmée ou fluctuation ?
- Le joueur A progresse-t-il ? Sa courbe de note par match est-elle croissante sur plusieurs bilans ?
- Notre gardien principal arrête mieux en MT2 sur la saison entière : est-ce reproductible ?

L'instant long demande des **moyennes pondérées par le volume** (un match de 50 tirs compte plus qu'un match de 15 tirs) et des **intervalles de confiance** pour distinguer signal et bruit.

#### La transition entre les deux

Le module BILANS est le pont entre les deux instants. Un bilan = un groupe de matchs = un instant de durée intermédiaire. La puissance de l'analyse serait de pouvoir zoomer de la saison vers un bilan, puis vers un match, vers une période du match — **navigation hiérarchique drill-down**.

---

### 2E — Propositions de fonctionnalités pour le module Analyse

| # | Fonctionnalité | Valeur coach | Données nécessaires | Complexité | Priorité |
|---|---|---|---|---|---|
| 1 | **Tableau enclenchements × résultat (match + saison)** | Savoir quel système d'attaque choisir face à une défense donnée. Actionnable en temps réel et en préparation. | `enclenchement`, `resultat`, `club` | S | P1 |
| 2 | **Matrice défense attaquée × résultat FENIX** | Identifier quelle défense adverse pose problème. Préparer les semaines d'entraînement. | `defense` (COLS.5), `resultat`, `club` | S | P1 |
| 3 | **Efficacité possession par enclenchement** (buts / tirs + PB) | Vrai indicateur d'efficacité offensive — pas biaisé par les tirs faciles. | `enclenchement`, `resultat`, `club` | M | P1 |
| 4 | **Timeline momentum (courbe d'écart relatif glissant sur 5 possessions)** | Voir visuellement les renversements de match. Identifier les moments où FENIX "lâche". | `position` (timecode), `resultat`, `club`, `periode` | M | P2 |
| 5 | **Gardien : % arrêts par enclenchement adverse** | Comprendre les points faibles du gardien selon le type d'attaque adverse. Préparer les confrontations. | `enclenchement`, `gardien`, `finalite`, `resultat` | M | P1 |
| 6 | **Radar joueur multi-dimensionnel (5 axes vs médiane poste)** | Vue synthétique du profil d'un joueur. Facilite les décisions de composition et de suivi individuel. | `action_joueur`, `action_att`, `action_def`, `resultat`, `joueur` | M | P2 |
| 7 | **Comparaison enclenchements saison V vs D** | Savoir quels systèmes sont associés aux victoires sur la saison entière. | `enclenchement`, `resultat` (agrégé par match), `rencontre` | M | P2 |
| 8 | **Gardien : comparaison match précédent / match actuel par zone** | Voir si un gardien a progressé ou régressé sur ses zones vulnérables d'un match à l'autre. | `gardien`, `field_position`, `finalite`, `resultat`, `rencontre` | M | P2 |
| 9 | **Évolution KPI par bilan (graphique progression multi-bilans)** | Voir la progression de l'équipe sur la saison en comparant les bilans bout à bout. | `BILANS[]`, tous KPI agrégés par période | L | P2 |
| 10 | **Drill-down saison → bilan → match → période** | Navigation hiérarchique unifiée. Le coach peut zoomer depuis la vue saison jusqu'à une séquence précise. | Architecture de filtres imbriqués | L | P3 |
| 11 | **Corrélation défense × gardien adverse** | Quand l'adversaire défend en X, quel est le % arrêts de notre gardien ? Utile si FENIX adapte sa zone de tir en fonction de la défense. | `defense`, `gardien`, `finalite`, `resultat` | M | P2 |
| 12 | **Action joueur × enclenchement** (dans quel système ce joueur est-il le plus impliqué ?) | Connaître le rôle tactique réel d'un joueur, pas seulement ses stats brutes. | `action_joueur`, `enclenchement`, `resultat` | M | P3 |
| 13 | **Détection automatique du "pattern perdant"** | Alerte quand les KPI d'un match en cours ressemblent aux KPI des matchs perdus en saison. | Toutes corrélations V/D, DATA live ou post-match | XL | P4 |
| 14 | **Export tableau enclenchements (CSV/Excel)** | Partager les données brutes d'analyse avec d'autres membres du staff ou des scouts. | Toute la couche de filtrage existante | S | P3 |
| 15 | **Notation pression du score** (action positive/négative quand FENIX est mené de 3+) | Savoir quel joueur performe sous pression. Utilise `score_fenix` / `score_adv` si colonnes disponibles. | `score_fenix`, `score_adv`, `action_att`, `action_def` | M | P3 |

---

## Synthèse des priorités — PARTIE 1

| Sévérité | Bugs | Action recommandée |
|---|---|---|
| 🔴 Critique | #23 (`defense_attaquee` non mappée) | Corriger avant toute fonctionnalité d'analyse défense |
| 🟡 Modéré | #6, #7, #13, #15, #16, #17, #18, #19, #20, #21, #22, #24, #25 | Sprint de stabilisation court |
| 🟢 Mineur | #1, #2, #3, #4, #5, #8, #9, #10, #11, #12, #14, #26, #27, #28 | Backlog de nettoyage |

---

*Rapport rédigé le 2026-06-16 — Analyse statique uniquement, sans exécution du code.*
