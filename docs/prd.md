# PRD — Refonte Navigation & Design Visuel FENIX Stats CF

**Agent :** Product Manager
**Date :** 2026-08-28
**Input :** `docs/brief.md` (Analyst)
**Destinataires :** Designer · Visual Crafter · Architect

---

## 1. Objectif

Réorganiser la façon dont on accède au contenu de l'application (sans rien supprimer) et relever le niveau d'exécution visuelle sur l'ensemble des écrans, pour que l'appli soit aussi facile à parcourir qu'elle est riche en contenu.

Deux problèmes distincts, traités ensemble parce qu'ils se renforcent : une navigation confuse rend le manque de polish visuel plus visible (on a le temps de le remarquer en cherchant sa route), et un visuel plat rend la confusion de navigation plus pénible (rien ne guide l'œil vers la bonne sortie).

## 2. Features

### F1 — Clarification de la structure de navigation (Must Have)

**Description fonctionnelle :** Distinguer explicitement, dans la barre de navigation, ce qui est une **destination** (Dashboard, Analyse, Joueurs) de ce qui est une **action ponctuelle** (Comptes, Vue joueur) — aujourd'hui les 5 apparaissent comme 5 boutons de même poids visuel alors que 2 d'entre eux ouvrent une fenêtre par-dessus la page plutôt que d'y naviguer. Le Designer tranche la forme exacte (regroupement visuel, icône différente, position séparée...).

**Périmètre technique :** Uniquement la présentation et le regroupement des 5 entrées existantes. Aucune nouvelle destination.

### F2 — Découpage interne de la page Analyse (Must Have)

**Description fonctionnelle :** La page Analyse (8 sections empilées : terrain+cartes, timeline, moments clés, bascules, résumé/coach, indicateurs, enclenchements, gardien, chat IA) devient navigable sans long scroll. Direction retenue : **onglets internes**, sur le modèle déjà éprouvé et déjà familier aux joueurs du mode mobile (Ma Fiche / Stats Match / Impact) — réutiliser un pattern qui fonctionne déjà plutôt qu'en inventer un nouveau. Le Designer peut proposer une alternative (sommaire ancré, accordéon) s'il identifie un obstacle concret à la version onglets, mais doit justifier l'écart.

**Contrainte non négociable :** aucune des 8 sections ne disparaît, aucune n'est renommée au point de devenir introuvable pour quelqu'un qui connaît déjà l'appli.

### F3 — Passe de design visuel systémique (Must Have)

**Description fonctionnelle :** Relever l'exécution visuelle sur les 3 écrans staff clés (Dashboard, Analyse, Joueurs) et sur le mode joueur mobile, à contenu strictement identique :
- Hiérarchie typographique (tailles, poids, contrastes) cohérente entre sections critiques et secondaires
- Espacement et densité repensés (actuellement uniforme quelle que soit l'importance du bloc)
- Cohérence des composants transverses (cartes, badges, boutons, états — dont les nouveaux états vides livrés à l'Audit Final du 2026-08-28)
- Palette et usage de la couleur FENIX (#0A2463) affinés, pas remplacés

**Cadrage explicite (décision PM) :** c'est une **retouche approfondie**, pas une refonte totale du système de composants. On garde la stack technique actuelle (CSS vanilla, pas de framework de composants), on garde la charte de couleur FENIX, on garde la police Bebas Neue pour les titres. L'ambition est l'exécution (finitions, cohérence, hiérarchie), pas la réinvention. *Si le Designer ou le Visual Crafter estiment qu'une retouche ne suffit pas à combler l'écart d'exigence signalé par Romain, ils doivent le signaler explicitement avant de produire — ne pas trancher seuls dans le sens d'une refonte plus large.*

### F4 — Cohérence visuelle transverse staff / joueur (Should Have)

**Description fonctionnelle :** Le mode joueur mobile et l'interface staff desktop gardent des mécaniques de navigation différentes (contextes d'usage trop différents pour les unifier — cf. Brief), mais partagent une même identité visuelle affinée (mêmes tokens de couleur, même traitement des cartes/badges, même vocabulaire d'icônes) pour que l'appli se sente comme un seul produit vu de deux endroits différents.

### F5 — Traitement des actions "Comptes" et "Vue joueur" (Should Have)

**Description fonctionnelle :** Ces deux entrées ouvrent aujourd'hui une modale plein écran par-dessus la page active — sans historique de navigation cohérent (retour arrière du navigateur en sort complètement, déjà noté G6 dans l'Audit Final). Le Designer tranche : rester en modale mais avec une présentation plus assumée (moins "boîte de dialogue système", plus intégrée), ou devenir un vrai écran. Pas de contrainte d'implémentation imposée ici — c'est un arbitrage UX, pas technique.

### F6 — Repère de position ("où je suis") (Nice to Have)

**Description fonctionnelle :** Si le découpage en onglets (F2) ne suffit pas à lui seul à donner un repère clair de position dans l'appli, ajouter un fil d'Ariane léger ou un indicateur de section active plus visible. À évaluer une fois F1/F2 maquettés — peut s'avérer redondant si F1+F2 sont bien exécutés.

## 3. Priorités

| # | Feature | Priorité |
|---|---------|----------|
| F1 | Clarification structure de navigation | **Must Have** |
| F2 | Découpage interne page Analyse (onglets) | **Must Have** |
| F3 | Passe de design visuel systémique | **Must Have** |
| F4 | Cohérence visuelle staff / joueur | Should Have |
| F5 | Traitement modales Comptes/Vue joueur | Should Have |
| F6 | Repère de position | Nice to Have |

## 4. Critères d'acceptation

- **F1/F2 :** un utilisateur qui ne connaît pas l'appli peut, sans aide, dire sur quel écran il se trouve et atteindre n'importe laquelle des 8 sections de la page Analyse en au plus 2 clics/taps, sans scroll de découverte.
- **F2 :** le contenu de chaque section existante est intégralement conservé — vérifié section par section contre l'état actuel avant livraison (checklist du Regression Guardian).
- **F3 :** comparaison avant/après sur Dashboard, Analyse (vue d'ensemble + une section détaillée), Joueurs et mode joueur mobile — validée visuellement par Romain avant de considérer F3 "done". Pas de métrique automatisée possible ici, le critère est un jugement produit assumé.
- **F3 (mobile) :** aucune régression sur les correctifs mobiles déjà livrés cette semaine (canvas Impact pleine largeur, header sticky, états vides Analyse/Vue joueur) — à revérifier explicitement après la passe visuelle.
- **Global :** zéro fonctionnalité supprimée ou rendue inaccessible — recensement complet avant/après par le Scrum Master au moment du découpage en stories.

## 5. Hors scope

- Toute nouvelle donnée, nouveau calcul ou nouvelle vue analytique (ce cycle ne touche ni au contenu ni aux chiffres).
- Migration vers un framework front (React, Vue...) — la stack HTML/CSS/JS vanilla est conservée, sauf blocage réel identifié et validé par l'Architect.
- Les bugs G4-G8 de l'Audit Final du 2026-08-28 sans lien direct avec la navigation ou le visuel (doublon de nom Excel, position codes dans les listes joueurs, retour navigateur SPA, espacement mineur d'un libellé, message de mot de passe vide).
- Ajout de comptes/rôles/permissions au-delà de ce qui existe (staff / joueur).

## 6. Dépendances

- F2 (découpage Analyse) dépend d'un arbitrage Design ferme sur le mécanisme (onglets vs alternative) **avant** que le Visual Crafter ne commence l'habillage — un changement de structure après le polish visuel ferait recommencer le travail.
- F3 dépend de F1/F2 pour les écrans Dashboard/Analyse/Joueurs (on habille la structure une fois qu'elle est arrêtée), mais peut démarrer indépendamment sur le mode joueur mobile (structure de navigation déjà stable, à onglets, non remise en cause par ce cycle).
- L'Architect doit valider, avant le découpage en stories, que le pattern à onglets peut être répliqué pour la page Analyse sans réécriture lourde du système actuel (fichier HTML unique, JS vanilla par page) — sinon retour au PM pour arbitrer entre F2 tel que spécifié et une alternative moins coûteuse.

## 7. Risques

- **Dérive de scope vers une refonte complète** : le cadrage F3 est explicitement une retouche, pas une réécriture — le risque principal est que Designer/Visual Crafter, en voyant l'ampleur du chantier, proposent implicitement un système de composants entièrement neuf. À surveiller dès la revue du document Designer.
- **Incohérence d'exécution** : sur un chantier qui touche autant d'écrans, le risque est un résultat inégal (certains écrans magnifiquement retouchés, d'autres oubliés). Le Visual Crafter doit produire des règles réutilisables (pas des retouches écran par écran isolées) pour limiter ce risque.
- **Régression mobile** : plusieurs correctifs mobiles très récents (cette semaine même) sur le mode joueur — un remaniement visuel mal testé pourrait les défaire. Le Risk Analyst doit qualifier ce risque en P0/P1.
- **Sous-estimation de l'ampleur du découpage de la page Analyse** : 8 sections avec des comportements interactifs variés (drill-down enclenchements, chat IA, canvas timeline) — le passage à des onglets internes n'est pas qu'un habillage CSS, c'est un changement de structure DOM/état JS. À faire évaluer précisément par l'Architect avant le chiffrage du Scrum Master.
