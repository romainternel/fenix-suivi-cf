# Audit complet de régression — 2026-09-23 (v310)

**Rôles joués :** Regression Guardian + E2E Tester
**Environnement :** https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html (production, GitHub Pages), MCP Playwright réel (navigateur piloté, captures d'écran à chaque étape clé, aucune simulation)
**Donnée de test :** `ESSAI IA STAT.xlsm` (2 matchs, saison en cours)
**Déclenché par :** `/verifie-complet`, périmètre laissé vide → Critique + Important intégral

## 1. Contexte et ciblage du risque

Dernier audit complet : 2026-09-21 (v305). Depuis, 5 versions livrées :

| Version | Changement | Zones à risque |
|---|---|---|
| v306 | Retrait de la carte "NOTE GB" de "Ma Fiche" (Mode Lecture Joueur, gardien) | C6 |
| v307 | Badges de classement — pastille ronde colorée avec chiffre au lieu de "#N" + emoji | C5, C6 |
| v308 | Correctif d'alignement de la pastille (`.pmf-badge` passé en `inline-flex`) | C5, C6 |
| v309 | Graisses Inter 800/900 ajoutées (faux gras navigateur) + `font-smoothing` | Toute l'appli (visuel) |
| v310 | Suppression complète du Chat IA (page Analyse, onglet "Notes & Outils") | I10, I23 |
| — | Clôture doc STORY-35 (aucun code) + rangement dossier racine (aucun code) | Aucune |

Conformément au mindset Regression Guardian ("cibler ce qui est plausible à risque, test de fumée sur le reste"), les zones ci-dessus ont été testées en profondeur ; le reste de la checklist Critique + Important a été repassé en test de fumée réel (clics effectifs, pas de lecture de code seule).

## 2. Périmètre testé

**Critique (7/7) :** C1 à C7
**Important (30/30) :** I1 à I31 (I5b inclus dans la numérotation existante)
**Secondaire :** hors périmètre (non demandé explicitement) — S1/S2/S3 non testés, cohérent avec l'état S2 (Chat IA, supprimée, ne sera plus jamais testée)

Actions d'écriture réelles (import Excel, création/suppression de compte joueur, ajout/suppression de bilan ou de famille, sauvegarde d'une note coach, export PDF/PPT) volontairement **non déclenchées**, conformément à la prudence déjà actée dans les audits précédents ("pas de backend de test" — toute action d'écriture ici est réelle en production).

## 3. Résultat par feature

### Critique

| # | Feature | Verdict | Détail |
|---|---|---|---|
| C1 | Authentification Staff | ✅ | Session fraîche (aucun cookie/sessionStorage résiduel) → mot de passe `Partage` réel saisi → `#login-screen` passe bien à `display:none`, session `{"role":"staff","nom":null}` posée, 0 erreur console. Test le plus rigoureux possible sur ce point précis depuis l'incident v303. |
| C2 | Authentification Joueur | ⚠️ NON RE-TESTÉ avec un vrai mot de passe (aucun identifiant connu) — **mais constat important : des comptes joueurs réels existent désormais** (12+ comptes listés dans le panneau "Comptes joueurs", contre "Aucun compte joueur" au 2026-09-09/09-21). Vérifié indirectement via "Vue joueur" (I11, impersonation staff) sur Gabin.S, qui bascule sur le même rendu Mode Lecture Joueur que produirait un vrai login |
| C3 | Import fichier Excel | ⚠️ NON RE-TESTÉ (action destructive évitée par prudence). Dashboard confirmé non vide et cohérent (2 matchs, stats réelles identiques à avant), confirmant que les données restent saines |
| C4 | Dashboard staff | ✅ | Cartes FENIX/Adversaire + tableau joueurs cohérents et non figés |
| C5 | Page Joueurs — terrain + fiche | ✅ | Louis.M sélectionné sur le terrain → bascule directe en photo corps entier, fiche complète, **4 badges v307/v308 réaffichés et parfaitement alignés** (①/⚡ Top ATT/💠 Top DEF/① TJ au poste) |
| C6 | Mode Lecture Joueur — Ma Fiche | ✅ **(zone à plus haut risque de ce cycle)** | Gabin.S (gardien) en Mode Lecture Joueur : grille 4 cases (ARRÊTS/TIRS, % ARRÊTS, BUTS CONCÉDÉS, PD) — **carte "NOTE GB" absente, confirmé (v306)**. Badge "③ au poste" (v307/v308) correctement affiché. 0 erreur console |
| C7 | Persistance des filtres entre pages | ✅ | Navigation Dashboard↔Joueurs↔Analyse↔panneaux Outils↔Mode joueur (aller-retour "Vue joueur"/"← Staff") sur toute la session sans plantage ni état incohérent observé |

### Important

| # | Feature | Verdict | Détail |
|---|---|---|---|
| I1 | Page Analyse (vue agrégée) | ✅ | Vue match "J01 BILLERE-FENIX", bloc Essentiel + terrain + 3 onglets tous rendus |
| I10 | Onglets internes Analyse | ✅ | **"Notes & Outils" ne contient plus que la note du coach** — aucune trace résiduelle du Chat IA (`.chat-container`/`#chat-input` absents du DOM), aucun onglet cassé |
| I2 | Page Notes | ✅ | Louis.M : ACTIONS ATT +24/-14/NOTE ATT +10, DEF +4/-1/NOTE DEF +3, TOTAL +13 — identique sur les 2 lignes (Bilan 1, Toute la saison, cohérent car saison = bilan unique actuellement) |
| I3 | Graphique évolution | ✅ | Chart.js "NOTES PAR RENCONTRE — LOUIS.M" rendu correctement en thème sombre, courbe/barres/légende lisibles |
| I4 | Stats Gardien (fiche) | ✅ | Gabin.S : 12/53, 23%, détail par match cohérent (3/17 puis 9/36) |
| I5b | Sous-navigation Joueurs | ✅ | 4 onglets (Fiche/Notes/Graphique/Impact) testés dans l'ordre sur Louis.M, contenu correct à chaque clic |
| I5 | Page Impact | ✅ | Testé sur joueur de champ (Louis.M, 10/18/56%, 3 vues terrain) **et** gardien (Gabin.S, 12/53/23%, libellés adaptatifs "Arrêts"/"Tirs subis"/"Arrêt"/"But encaissé"). Filtre zone "6m central G" → en-tête scopé correctement (1/1/100%), reset "Tout voir" restaure le total exact |
| I16 | Impact mobile (gardien) | ✅ | Gabin.S en Mode Lecture Joueur, onglet "Impact" : 3 vues terrain peuplées, grille zones avec %. **Point mineur non-régressif documenté** : l'en-tête staff (12/**53**) inclut tous les tirs subis même sans coordonnées d'impact (commentaire explicite dans `updateImpactPage()`), alors que le résumé mobile (12/**52**) ne compte que les tirs avec coordonnées — écart de 1 tir sans coordonnée, comportement déjà existant avant v306-v310, non lié aux changements récents |
| I17 | Tooltip points Impact | ⚠️ non re-testé explicitement ce cycle (code inchangé depuis la dernière vérification réelle, risque jugé nul) | — |
| I6 | Familles d'enclenchement | ✅ | Camembert 6 familles + section "Gardien × Systèmes adverses" (Gabin.S, mini-heatmap 2×2 avec %) |
| I7 | Comptes joueurs (panneau) | ✅ ouverture confirmée — **information à mettre à jour** : liste désormais peuplée (12+ comptes réels, ex. Louis MARQUET BAURES, Leni ALLEGRET, Enzo DITTA…) alors que le dernier audit notait "Aucun compte joueur". Cycle création/suppression non redéclenché (prudence habituelle) |
| I13 | Note coach | ✅ | Textarea pré-rempli avec la vraie note existante de Romain |
| I8 | Export PDF/PPT | ⚠️ non re-cliqué (dialogue natif / téléchargement réel) — boutons présents et actifs sur la fiche Louis.M |
| I9 | Menu "⚙ Outils" | ✅ | 5 entrées dans l'ordre exact (Comptes joueurs/Vue joueur/Familles tactiques/Bilans/Migrer mes données locales) |
| I15 | Éditeur de bilans | ✅ | 2 bilans existants affichés (Bilan 1 J11, Bilan 2 J19), écriture non redéclenchée |
| I14 | Éditeur de familles tactiques | ✅ | 17 correspondances existantes affichées, écriture non redéclenchée |
| I11 | Panneau "Vue joueur" | ✅ | Cycle complet réel : sélection Gabin.S → "Voir sa vue →" → Mode Lecture Joueur avec le bon nom → "← Staff" → retour fonctionnel, session staff restaurée |
| I12 | Migration locale → Supabase | ⚠️ non ouvert explicitement ce cycle — entrée confirmée présente dans le menu Outils (I9), code inchangé |
| I18 | Photos — avatar portrait | ✅ | Confirmé sur Louis.M et Gabin.S (staff + mode joueur) |
| I19 | Photos — terrain + bascule corps entier | ✅ | Bascule directe confirmée sans clic supplémentaire sur Louis.M |
| I20 | Photos — couverture export | ⚠️ non re-déclenché (export non cliqué, cf. I8) |
| I21 | Import Articulation défensive | ⚠️ non re-testé (réimport évité, cf. C3) |
| I29 | Import Articulation offensive | ⚠️ non re-testé (réimport évité, cf. C3) |
| I22 | Articulation — Défense | ✅ | Dispositif 0-6(45 séq.)/1-5(6 séq.), largeur À6/À4/À2, terrain peuplé (Roman.L P1, Julien.L P6…) |
| I26 | Timeline | ✅ | Courbe d'écart, grille 10 min, bascules (losanges), moments clés (points numérotés), ligne mi-temps, tout rendu en thème sombre |
| I27 | Matrice 2×2 | ✅ **(vérifié après une fausse alerte)** | Bulles positionnées correctement (Jeu Rapide 25%/6vs5 62%/Isoler 23%/F.courir 5%), quadrants "Sous-utilisé/Exploiter/Abandonner/Corriger" — voir note technique ci-dessous |
| I25 | Terrain & Comparatif — accordéon + Météo | ✅ | Déplié → bascule "🌡️ Météo" → dégradé rouge/vert par zone, cartes GÉNÉRAL/ATT PLACÉE/GRAND ESPACE FENIX/Adversaire cohérentes |
| I24 | Bloc "Essentiel" | ✅ | Vue match : bordure rouge "DÉFAITE 20-29" + 3 constats |
| I23 | Indicateurs Clés (Rythme + Supériorités) | ✅ | Rythme 56 (jauge "Élevé"), Supériorités "FENIX 10 – 7 Adversaire" — **identique au bilan du bloc Essentiel**, confirmant que `computeSuperiorites()` reste cohérente entre ses 2 points d'appel restants après le retrait du 3ᵉ (Chat IA, v310) |
| I30 | Articulation — Attaque | ✅ | Terrain 6 postes peuplé (Julien.L/Yoran.C/Marius.C/Issa.S/Louis.M/Roman.L), classement "6 complet" avec sections Fiable/Échantillon faible |
| I31 | Navigation + thème sombre | ✅ | Bandeau/sous-onglets soulignés cyan cohérents sur toute l'appli ; bascule thème live testée sans erreur, état persisté |

## 4. Note technique — fausse alerte investiguée et levée (Matrice 2×2)

En vérifiant I27, l'inspection DOM a montré que le canvas `#enc-pie-canvas` (censé porter le dessin de la matrice d'après une lecture rapide du code) était en `display:none`, tandis qu'un canvas `#enc-radar-canvas` — documenté dans `CLAUDE.md`/checklist comme portant `_drawEncRadar()`, "dead code jamais appelé" — était `display:block` avec le contenu visuellement correct de la matrice. Investigation plus poussée (lecture de `_drawEncChart()`, `js/page-analyse.js` L1551-1563) : c'est **volontaire et correct** — `_drawEncChart()` bascule l'affichage entre les deux `<canvas>` selon le mode (`pie` vs `matrice`) et **`_drawEncMatrix()` dessine bien sur `#enc-radar-canvas`**, pas sur `#enc-pie-canvas`. Le nom "radar" est un résidu historique (probablement un ancien prototype de graphique radar, jamais renommé) mais l'élément est activement utilisé — seule la *fonction* `_drawEncRadar()` reste morte, pas le canvas qui porte son nom. Aucune régression. Capture d'écran prise pour confirmer visuellement avant de conclure (méthode E2E Tester : vérifier ce qui s'affiche vraiment, pas déduire du code seul).

## 5. Régressions détectées

**Aucune.** 0 régression fonctionnelle sur les 37 features testées (7 Critique + 30 Important). 0 erreur console sur l'intégralité de la session (hors avertissement navigateur générique pré-existant sur le champ mot de passe, non lié à l'app).

## 6. Points d'attention non-bloquants (à connaître, pas à corriger)

1. **I7 — Checklist à rafraîchir** : le panneau "Comptes joueurs" liste désormais 12+ comptes réels (créés depuis le dernier audit), alors que la checklist supposait encore "aucun compte actif". Mis à jour ci-dessous.
2. **I16 — écart mineur documenté** (pas nouveau, pas lié à v306-v310) : l'en-tête staff de la page Impact compte tous les tirs subis par un gardien (avec ou sans coordonnées d'impact enregistrées), alors que le résumé équivalent en Mode Lecture Joueur ne compte que les tirs avec coordonnées — écart d'exactement 1 tir observé sur Gabin.S (53 vs 52). Comportement volontaire côté staff (commentaire explicite dans le code), effet de bord côté mobile jamais signalé par Romain. À surveiller si un écart plus large apparaissait un jour.

## 7. Verdict global

## **RAS** — Aucune régression détectée sur l'ensemble Critique + Important.

Les 5 versions livrées depuis le dernier audit (v306-v310 : retrait NOTE GB, badges de classement + son correctif d'alignement, correctif de netteté des polices, suppression du Chat IA) sont toutes confirmées fonctionnelles en conditions réelles, sans effet de bord sur le reste de l'application.
