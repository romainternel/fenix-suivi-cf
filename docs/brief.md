# Brief — Refonte Navigation & Design Visuel FENIX Stats CF

**Agent :** Analyst
**Date :** 2026-08-28
**Input :** Demande directe de Romain Ternel (coach, propriétaire produit) + connaissance directe de l'application acquise en session (Superviseur, Audit Final du même jour)
**Note :** `CLAUDE.md` est absent du projet (aucune trace, confirmé par le Superviseur cette même session) — ce brief s'appuie donc sur l'audit direct de l'appli en conditions réelles plutôt que sur un état d'avancement déclaré.

---

## 1. Contexte

FENIX Stats CF est utilisée depuis plusieurs saisons par le staff du Centre de Formation (analyse de matchs, suivi joueurs) et, depuis la refonte "Vue Joueur Mobile v2" (juin 2026), par les joueurs eux-mêmes sur leur téléphone. L'application a grandi feature par feature au fil des saisons — chaque nouveau besoin (enclenchements, gardien, impact, notes, comptes joueurs...) a été ajouté comme une nouvelle section ou un nouvel onglet, sans reprise d'ensemble de la façon dont tout ça s'articule.

Romain constate aujourd'hui, avec le recul, que :
- La navigation est devenue complexe — pas parce qu'une fonctionnalité est inutile (il insiste : "tout est important"), mais parce que le nombre de destinations et de sous-destinations a grossi sans structure d'ensemble repensée.
- Le niveau d'exigence visuelle a évolué de son côté (il parle de "ma BMAD" qui a évolué — sa propre exigence produit/design s'est affinée), et l'appli, elle, n'a pas suivi ce même niveau : elle reste fonctionnelle mais visuellement plate.

Ce chantier n'est pas un ajout de fonctionnalité — c'est une passe de réorganisation (information architecture) et de polish visuel sur l'existant.

## 2. Problème

**Ce que l'utilisateur ne peut pas faire aujourd'hui :**
- Se repérer rapidement dans l'appli sans connaître par cœur où se trouve chaque chose. La navigation actuelle mélange plusieurs mécanismes différents pour accéder au contenu :
  - 3 vraies pages avec navigation dans l'URL/état (Dashboard, Analyse, Joueurs)
  - 2 fonctionnalités déclenchées en **modale par-dessus** la page courante (Comptes, Vue joueur) plutôt qu'en page à part entière
  - La page Joueurs a elle-même un sous-menu à 4 onglets (Fiche / Notes / Graphique / Impact)
  - La page Analyse est un unique et long scroll vertical empilant 8 blocs différents (terrain+cartes, timeline, moments clés, bascules, résumé/coach, indicateurs, enclenchements avec camembert/matrice, gardien, chat IA) sans sommaire ni ancres pour sauter directement à une section
  - Le mode joueur mobile a sa **propre** navigation à 3 onglets (Ma Fiche / Stats Match / Impact), complètement indépendante de celle du staff
- Trouver une information précise sans scroller longuement sur mobile (la cible prioritaire du mode joueur, 375-430px, avec un usage annoncé "en 2 minutes max" dans le brief historique de juin) — le scroll vertical de la page Analyse en particulier est long même sur desktop.
- Percevoir une hiérarchie visuelle claire entre ce qui est important et ce qui est secondaire : les blocs sont globalement traités de la même façon (carte blanche, titre, contenu), avec un usage du bleu FENIX (#0A2463) et de la police Bebas Neue pour les titres, mais peu de variation de densité, d'espacement ou de mise en avant entre les sections critiques et les sections annexes.

**Ce qui se passe aujourd'hui sans ce travail :** l'appli continue de fonctionner (aucun bug bloquant identifié à l'Audit Final du 2026-08-28), mais chaque nouvelle fonctionnalité ajoutée aggrave la dette de navigation, et l'écart entre l'exigence visuelle de Romain et le rendu réel de l'appli continue de se creuser.

## 3. Utilisateurs

| Profil | Contexte d'usage | Appareil | Contrainte |
|---|---|---|---|
| Coach / staff (Romain + adjoints) | Préparation de séance, analyse post-match, entre deux entraînements | Desktop principalement, tablette parfois | Doit retrouver une info précise vite, sans se souvenir "où" elle se trouve |
| Joueur de champ (17-24 ans) | Vestiaire, bus, entre deux séances | iPhone/Android, tactile uniquement | Max ~2 min d'attention, zéro tolérance à la friction |
| Gardien (17-24 ans) | Idem joueur de champ | Android basique | Cherche ses stats d'arrêts en priorité |

(Reprend les personas déjà validés dans le brief historique de juin 2026 — toujours d'actualité, non remis en cause ici.)

## 4. Vision

> Un utilisateur — staff ou joueur — sait toujours où il est et où aller ensuite sans réfléchir, et chaque écran donne une impression de soin et de clarté à la hauteur du sérieux du travail d'analyse qu'il contient.

## 5. Scope

### Dans le périmètre
- **Réorganisation de l'information architecture** : repenser la structure de navigation (quelles destinations, quelle hiérarchie entre elles, quel mécanisme pour y accéder — page, onglet, modale) sans supprimer une seule fonctionnalité existante.
- **Découpage de la page Analyse** : cette page concentre à elle seule la majorité de la complexité perçue (8 sections empilées). Trouver une structure qui garde tout le contenu mais le rend navigable (sommaire, onglets internes, ancrage, ou autre — à trancher en Design).
- **Cohérence entre navigation staff et navigation joueur** : les deux existent aujourd'hui de façon complètement indépendante (deux systèmes de "tabs" différents, deux logiques). Voir s'il y a une cohérence de principe à établir, même si les deux publics restent distincts.
- **Passe de design visuel** sur l'ensemble de l'appli : hiérarchie typographique, densité, usage de la couleur, traitement des états (vide, chargement, erreur — dont plusieurs viennent d'être corrigés côté fonctionnel lors de l'Audit Final du jour), cohérence des composants (cartes, badges, boutons) sur desktop et mobile.

### Hors scope (pour ce cycle)
- Ajout de nouvelles fonctionnalités d'analyse (aucune nouvelle donnée, aucun nouveau calcul).
- Migration technique (le stack reste HTML/JS vanilla + Chart.js + SheetJS — pas de framework front à ce stade, sauf si l'Architect identifie un blocage réel).
- Les bugs mineurs déjà identifiés dans `docs/audit-final/AUDIT-2026-08-28.md` (G4-G8) qui n'ont pas de lien direct avec la navigation ou le visuel (ex. doublon Isaac Maurice/Julien.L — c'est une correction de donnée Excel, pas un sujet de ce cycle).

## 6. Critères de succès

- Un nouveau staff (ou Romain lui-même, à froid) peut dire en un coup d'œil sur quelle page/section il se trouve et comment revenir en arrière ou changer de destination — sans avoir à faire défiler pour comprendre où il est.
- La page Analyse n'exige plus un long scroll pour accéder à une section précise (ex. directement aux enclenchements, ou directement au gardien) — un utilisateur peut y aller directement.
- Un examen visuel côte à côte de 3 écrans clés (Dashboard, Analyse, Joueurs) avant/après donne une impression nette de montée en gamme, sans avoir changé une seule donnée affichée.
- Sur mobile (375-430px), le mode joueur reste utilisable en moins de 2 minutes pour une consultation typique (retrouver sa fiche, son temps de jeu, sa progression).
- Zéro fonctionnalité perdue — chaque chose qui existait avant le chantier doit rester accessible après, potentiellement ailleurs mais jamais supprimée.

## 7. Questions en suspens

- **Découpage interne de la page Analyse** : onglets internes (comme le mode joueur), sommaire cliquable en haut de page, ou pages séparées à part entière ? À trancher en Design — c'est la décision structurante de ce chantier.
- **Faut-il rapprocher la logique de navigation staff (nav horizontale + modales) et joueur (onglets pleine page)**, ou les deux publics sont-ils suffisamment différents (desktop vs. mobile, staff vs. joueur) pour justifier deux systèmes distincts en toute légitimité ?
- **"Comptes" et "Vue joueur" en modale ou en page à part entière** : les modales cassent le flux de navigation standard (pas de retour arrière navigateur cohérent — déjà noté comme point de vigilance G6 dans l'Audit Final). Est-ce que ça reste acceptable pour des actions ponctuelles (gérer des comptes, prévisualiser), ou est-ce que ça mérite de devenir une page comme les autres ?
- **Amplitude du changement visuel souhaitée** : retouche (mêmes composants, meilleure exécution : espacements, contrastes, hiérarchie) ou refonte plus profonde (nouveau système de composants, nouvelle palette) ? Le Designer et le Visual Crafter devront cadrer ça avec Romain avant de produire, pour éviter un aller-retour coûteux.
- **Contrainte technique à vérifier avec l'Architect** : le fichier est un monolithe HTML unique avec CSS/JS externes chargés par balises `<script>`/`<link>` versionnées manuellement (`?v=`). Une réorganisation de navigation ambitieuse (ex. vrai routing, layout partagé) doit rester compatible avec cette architecture sans forcer une migration non désirée.
