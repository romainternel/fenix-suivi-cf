# Design — Refonte Navigation FENIX Stats CF

**Agent :** Designer
**Date :** 2026-08-28
**Input :** `docs/prd.md` (F1, F2, F5) — composants et écrans existants audités en session le même jour

---

## 0. État actuel (rappel avant/après)

Nav actuelle (5 boutons de même poids) :
```
┌────────────────────────────────────────────────────────────────────┐
│ FENIX  📊 Dashboard  🔍 Analyse  👥 Joueurs  🔑 Comptes  👤Vue joueur │
└────────────────────────────────────────────────────────────────────┘
```
Dashboard/Analyse/Joueurs = vraies pages. Comptes/Vue joueur = ouvrent une modale par-dessus. Rien ne le distingue visuellement.

Page Analyse actuelle = 1 scroll vertical unique empilant : terrain+cartes → timeline → moments clés → bascules → résumé/coach → indicateurs → enclenchements → gardien → chat IA.

---

## 1. F1 — Nav principale : séparer pages et outils

**Décision :** 3 vraies pages à gauche, 1 entrée "Outils ▾" à droite qui regroupe Comptes et Vue joueur. Réduit la nav de 5 boutons à 4 éléments, et rend explicite que les deux dernières entrées ne sont pas des pages.

```
┌──────────────────────────────────────────────────────────────────┐
│ FENIX   📊 Dashboard   🔍 Analyse   👥 Joueurs      ⚙ Outils ▾  │
│         ───────────                                    ┌────────┤
│                                                          │ 🔑 Comptes joueurs
│                                                          │ 👤 Vue joueur
│                                                          └────────┤
└──────────────────────────────────────────────────────────────────┘
```

- Les 3 pages gardent le style "pill" plein existant, avec l'état actif souligné (déjà le cas — conservé).
- "Outils" a un style visuellement plus discret (contour, pas de fond plein) pour signaler "action", pas "destination".
- Au clic sur une entrée du menu Outils : comportement inchangé pour l'instant (ouverture modale) — voir §3 pour la proposition d'évolution.

**Composants réutilisés :** `.nav-btn` existant pour les 3 pages. Nouveau composant `.nav-dropdown` (pattern déjà utilisé ailleurs dans l'appli pour le multi-select RÉSULTAT de la barre sticky — même mécanique de dropdown à reprendre).

---

## 2. F2 — Page Analyse : découpage en onglets internes

**Décision :** le bloc "terrain + cartes FENIX/ADVERSAIRE" reste **toujours visible**, au-dessus des onglets — c'est le résumé instantané que le coach regarde en premier (confirmé explicitement par Romain plus tôt dans le projet : ce bloc ne doit jamais être caché derrière un clic). Tout le reste bascule dans 5 onglets.

```
┌──────────────────────────────────────────────────────────────────┐
│ MATCH [Saison complète ▾]  CLUB [Tous ▾]  RÉSULTAT [Tous ▾]  GE ▾│
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   FENIX              ADVERSAIRE                │
│  │   (terrain)  │   GÉNÉRAL             GÉNÉRAL                  │
│  │   nuage tirs │   POSS 74  BUT 32/52  POSS 73 ...               │
│  └──────────────┘   ...                                          │
├──────────────────────────────────────────────────────────────────┤
│  [Résumé]  [Timeline]  [Enclenchements]  [Gardien]  [Chat IA]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   (contenu de l'onglet actif)                                    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Répartition des 8 sections actuelles dans les 5 onglets :**

| Onglet | Contenu (inchangé, juste regroupé) |
|---|---|
| **Résumé** *(onglet par défaut)* | Résumé du match (IA) + Ton Analyse (Coach) + Indicateurs Clés |
| **Timeline** | Évolution du score + Moments clés + Bascules du match |
| **Enclenchements** | Cards familles + camembert/matrice + drill-down Intention→Enclenchement (inchangé, juste déplacé) |
| **Gardien** | Gardien × systèmes adverses (inchangé) |
| **Chat IA** | Chatbot (inchangé) |

Vue "Saison complète" (aucun match sélectionné) : les onglets Timeline/Chat IA n'ont pas de sens sans match → grisés/masqués, seuls Résumé (qui affiche alors "Tendances saison") et Enclenchements restent actifs. Comportement identique à aujourd'hui, juste réparti différemment.

**Interactions :**
- Clic sur un onglet → change le contenu affiché, sans recharger la page ni perdre les filtres du bandeau sticky.
- L'onglet actif se mémorise par session (comme le fait déjà le mode joueur avec `pm_active_tab`) — si le coach revient sur Analyse après être allé voir Joueurs, il retombe sur le dernier onglet consulté plutôt que de repartir à zéro.
- Le badge de couverture ("⚠ X% non classifiés") de l'onglet Enclenchements reste visible même onglet fermé, sous forme d'un petit point rouge sur le bouton d'onglet lui-même — pour ne pas perdre le signal d'alerte actuel simplement parce qu'on ne regarde pas cet onglet.

**États :**
- **Vide (aucune donnée importée)** : le message "Importe un fichier Excel..." déjà livré à l'Audit Final du jour s'affiche au-dessus des onglets, qui sont alors masqués entièrement (rien à onglet-er sans donnée).
- **Chargement** : inchangé, pas de comportement asynchrone particulier ici (tout est déjà en mémoire après import).

**Composants réutilisés :** le composant d'onglets existe déjà dans le code (mode joueur : `.pm-tab-btn`, `pmTab()`) — même mécanique visuelle à décliner pour la page Analyse plutôt que d'inventer un nouveau pattern.

---

## 3. F5 — Comptes / Vue joueur : de la modale au panneau latéral

**Décision :** garder le principe "ça reste une action ponctuelle, pas une page" (pas de nouvelle route), mais remplacer la modale centrée actuelle par un **panneau latéral (slide-over)** qui glisse depuis la droite — moins "boîte de dialogue système bloquante", plus intégré à l'appli, et surtout : le fond reste visible et cliquable pour fermer, ce qui donne une sensation de retour en arrière plus naturelle qu'un `X` unique en haut à droite.

```
Avant (modale centrée)         Après (panneau latéral)
┌─────────────────────┐        ┌─────────────────┬───────────────┐
│                     │        │                 │ 🔑 Comptes  ✕ │
│   ┌─────────────┐   │        │   (page visible │───────────────│
│   │  🔑 Comptes │   │   →    │    en fond,      │ [contenu]     │
│   │  [contenu]  │   │        │    assombrie)    │               │
│   └─────────────┘   │        │                 │               │
│                     │        │                 │               │
└─────────────────────┘        └─────────────────┴───────────────┘
```

Ne résout pas entièrement le point G6 de l'Audit Final (retour navigateur toujours pas géré par un vrai historique), mais réduit la sensation de "fenêtre qui saute" — à réévaluer si le sujet remonte après livraison.

**Composants réutilisés :** overlay semi-transparent déjà existant (modales actuelles). Nouveau : composant panneau latéral, réutilisable pour Comptes ET Vue joueur (même composant, contenu différent).

---

## 4. Cohérence avec le mode joueur mobile

Le mode joueur (Ma Fiche / Stats Match / Impact) n'est **pas modifié dans sa structure** par ce chantier — il fonctionne déjà bien et vient d'être audité sans régression. Seule sa nav à onglets sert de **référence de pattern** pour F2 (Analyse) : même composant visuel `.pm-tab-btn` étendu à un contexte desktop, pour que le geste "onglets horizontaux sous un bandeau de filtre" devienne un langage commun dans toute l'appli plutôt qu'une convention propre au mobile.

---

## 5. Questions ouvertes pour l'Architect

- Le pattern d'onglets du mode joueur (`pmTab()`) est écrit spécifiquement pour ce contexte (bascule d'affichage de 3 blocs, tout en JS inline). Peut-il être généralisé en une fonction réutilisable pour la page Analyse (5 onglets, contenus plus riches avec canvas/chat), ou faut-il une implémentation dédiée ? Impact direct sur le chiffrage.
- Le panneau latéral (§3) est un nouveau composant : combien d'écrans/fonctionnalités actuels utilisent la modale centrée générique (`#pa-modal`, `#preview-modal` et éventuellement d'autres) ? Si le pattern est déjà partagé ailleurs dans le code, le changer pour Comptes/Vue joueur seulement créerait une incohérence à surveiller.
