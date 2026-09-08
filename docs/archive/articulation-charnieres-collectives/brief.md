# Brief — Recentrage collectif du mode Articulation (charnières défensives)

**Agent :** Analyst
**Date :** 2026-09-07

---

## 1. Contexte

STORY-36 (v261) a réorganisé la présentation du mode Articulation autour d'un principe implicite hérité de STORY-34 : évaluer la défense poste par poste, joueur par joueur (liseré de couleur individuel sur chaque rond, détail par joueur au clic). Romain vient de corriger ce principe de fond, après avoir eu le temps d'utiliser la v261/v262 : ce n'est pas la performance d'un joueur isolé à un poste qui l'intéresse, mais la performance d'un **groupe de joueurs qui défendent ensemble** — ce qu'il appelle une "charnière défensive", à 6 (toute la ligne), à 4 (le bloc central) ou à 2 (les deux postes les plus centraux). Ce concept existe déjà dans le code (`ARTIC_BLOCKS`/`_articBlockEff`, ajouté en v260) mais reste aujourd'hui relégué en bas d'écran, sous un terrain qui met en avant l'évaluation individuelle — l'inverse de la priorité réelle de Romain.

Romain a aussi identifié une ambiguïté de lecture qu'il ne pouvait pas trancher lui-même dans l'instant : le % actuellement affiché est une "efficacité de l'attaque adverse" (plus bas = meilleure défense), une convention déjà inversée par rapport au reste de l'application. Interrogé directement avant ce cycle, il a choisi de basculer vers un **% de réussite défensive** (plus haut = meilleure défense) pour tout ce qui concerne les charnières — décision actée, pas un point à re-challenger en conception.

## 2. Problème

Ce que Romain ne peut pas faire aujourd'hui avec l'écran actuel :
- **Juger un groupe de joueurs comme un tout.** L'écran met en avant 6 évaluations individuelles (un liseré par rond) alors que la question qu'il se pose est "est-ce que CETTE charnière (ces joueurs ensemble) défend bien ?" — une question à laquelle les cartes Bloc répondent déjà, mais noyées en bas de page après le terrain.
- **Lire le pourcentage sans effort mental.** "37% d'efficacité adverse" oblige à se souvenir que plus bas est meilleur — une convention à contre-sens de tout le reste de l'appli, qu'il a lui-même signalée comme source de confusion.
- **Ignorer l'individuel quand il n'en a pas besoin.** Le détail par joueur et le liseré individuel occupent une place centrale à l'écran alors qu'ils répondent à une question secondaire (qui a joué là, pas comment défend-il seul).

## 3. Utilisateurs

Romain, staff/coach, en préparation ou débrief tactique, desktop. Inchangé par rapport aux cycles précédents (cf. `docs/archive/articulation-lisibilite/brief.md`).

## 4. Vision

Le mode Articulation devient un outil de lecture des **charnières défensives collectives** : le terrain sert uniquement à voir qui occupe quel poste (identification, pas d'évaluation individuelle visible), et l'évaluation de performance se fait exclusivement à travers 3 indicateurs de groupe — à 6, à 4 (bloc central), à 2 (les deux centraux) — exprimés en % de réussite défensive lu dans le sens normal : plus haut, meilleure est la défense.

## 5. Scope

**Dans le scope :**
- Retirer tout affichage d'efficacité individuelle : liseré de couleur sur les ronds-poste, % individuel dans le panneau de détail par joueur.
- Repenser la hiérarchie visuelle pour que les 3 charnières (6/4/2) deviennent l'élément central de l'écran, pas un ajout sous le terrain.
- Basculer le calcul et l'affichage vers un "% de réussite défensive" (`(possessions − buts − PO) / possessions`), y compris pour la carte Référence, avec une sémantique de couleur normale (vert = haut = bon).
- Réévaluer la fonction du toggle "Top Def" : décider s'il reste comme heuristique interne de suggestion de composition (sans jamais afficher de chiffre individuel à l'écran) ou s'il doit disparaître.
- Réévaluer ce que garde le panneau de détail par poste (probablement : liste des joueurs vus à ce poste + nombre de séquences, comme repère descriptif pour la sélection manuelle — sans % individuel).

**Hors scope :**
- Le calcul sous-jacent des séquences/possessions/buts/PO (`computeArticulationStats`, filtre dispositif, résolution de nom) reste inchangé — seule la métrique dérivée et sa mise en avant changent.
- Le tracé du terrain et le placement géométrique des postes sur la courbe du 6m (STORY-36) restent inchangés.
- Aucune nouvelle donnée Excel/Supabase.

## 6. Critères de succès

- Un utilisateur regardant l'écran comprend immédiatement, sans lire de tooltip, qu'un pourcentage haut = bonne défense.
- Les 3 charnières (6/4/2) sont la première chose que l'œil rencontre après le terrain, avant tout retour à l'individuel.
- Aucun chiffre d'efficacité individuelle n'apparaît plus nulle part sur l'écran (ronds, badges, panneau de détail).
- Les chiffres de séquences/possessions restent identiques à avant (seule la métrique de réussite change de sens et de mise en avant).

## 7. Questions en suspens

- Le devenir exact de "Top Def" (le conserver comme suggestion silencieuse de composition vs le retirer entièrement) est tranché en conception par le Designer/PM plutôt que re-demandé à Romain — la relation entre STORY-35 (classement des charnières centrales, jamais démarré) et ce recentrage doit aussi être clarifiée : STORY-35 pourrait devenir largement redondante avec ce cycle.
- Le contenu exact conservé dans le panneau de détail par poste (juste la liste des joueurs + fréquence, ou autre chose) est laissé à la conception — le principe (pas de % individuel) est acquis, la forme ne l'est pas encore.
