# PRD — Photos joueurs (portrait + corps entier)

**Agent :** Product Manager
**Date :** 2026-09-01

---

## 1. Objectif

Remplacer l'identification textuelle (initiales) des joueurs par de vraies photos là où c'est pertinent, sans jamais dégrader l'expérience pour un joueur sans photo disponible.

## 2. Features

### F1 — Portrait sur l'avatar fiche joueur (staff + mobile joueur)
`.jp-avatar` (page Joueurs, `js/page-joueurs.js`) et `.pmf-avatar` (mode joueur, `js/player-mode.js`) affichent la photo portrait du joueur sélectionné si elle existe, sinon les initiales actuelles (comportement inchangé).

### F2 — Photo corps entier dans l'export PDF/PPT
La page de couverture de l'export (`pdf-slide-cover`, dans `printFicheJoueur()`) intègre la photo corps entier du joueur quand elle est disponible. Sans photo : la couverture reste strictement identique à aujourd'hui (logo + nom).

### F3 — Bascule terrain ↔ photo corps entier
Sur la page Joueurs, un clic sur l'avatar du joueur sélectionné (portrait ou initiales) remplace le terrain SVG (`court-container`) par la photo corps entier de ce joueur. Un second clic (ou un bouton retour) rebascule sur le terrain. Si le joueur sélectionné n'a pas de photo corps entier, le clic n'a pas d'effet visible (le terrain reste affiché) — pas d'état "cassé" ou d'espace vide.

## 3. Priorités

| Feature | Priorité | Justification |
|---|---|---|
| F1 — Portrait avatar | **Must Have** | Le changement le plus visible, le plus fréquemment vu (à chaque sélection de joueur), bénéfice immédiat |
| F2 — Photo export PDF/PPT | **Should Have** | Valeur réelle (documents partagés à l'extérieur) mais consulté moins souvent que F1 |
| F3 — Bascule terrain/photo | **Nice to Have** | Idée de Romain, séduisante visuellement, mais n'apporte pas d'info nouvelle (pur plaisir visuel) — peut attendre si l'Architecture ou les Risques la complexifient plus que prévu |

## 4. Critères d'acceptation

**F1**
- [ ] Joueur avec photo portrait disponible → avatar affiche la photo (fiche staff ET mode joueur mobile)
- [ ] Joueur sans photo → avatar affiche les initiales, identique à l'existant (aucune régression)
- [ ] Fichier photo manquant/cassé → repli automatique sur initiales, aucune icône "image cassée" visible, aucune erreur console bloquante

**F2**
- [ ] Joueur avec photo corps entier → visible sur la page de couverture de l'export PDF et PPT
- [ ] Joueur sans photo → couverture identique à l'actuelle
- [ ] Le texte existant (nom, poste, période) reste lisible, pas de chevauchement avec la photo

**F3**
- [ ] Clic sur l'avatar (joueur avec photo corps entier) → le terrain est remplacé par la photo
- [ ] Un contrôle visible permet de revenir au terrain
- [ ] Changer de joueur sélectionné pendant que la photo est affichée → comportement cohérent (retour auto au terrain, ou mise à jour de la photo — à trancher en Design)
- [ ] Joueur sans photo corps entier → le clic sur l'avatar ne fait rien de cassé

## 5. Hors scope

- Upload de photo via l'interface (fichiers ajoutés par Romain directement, hors app).
- Édition/recadrage d'image dans l'app.
- Photos des joueurs adverses.
- Généralisation du portrait à d'autres pages non listées ici (Dashboard, tableau Notes, etc.) — pourra faire l'objet d'un cycle futur si F1 est validé à l'usage.

## 6. Dépendances

- F1 et F2 dépendent tous deux de la même décision d'Architecture : où sont stockées les photos et comment le code les résout pour un nom de joueur donné (fonction de résolution commune, réutilisée par F1/F2/F3).
- F3 dépend de F1 (réutilise le même avatar comme déclencheur).
- Aucune dépendance sur le travail Supabase déjà en place (migration terminée, STORY-20→29) — cette feature est indépendante des tables `match_data`/`joueurs`/etc., sauf si l'Architecture choisit Supabase Storage comme solution de stockage.

## 7. Risques (aperçu — détaillés par le Risk Analyst)

- Couverture partielle des photos au lancement (la majorité des joueurs n'en auront pas encore) → le fallback doit être irréprochable, sinon la feature donne une impression de bug plutôt que de progressive rollout.
- Mapping nom → fichier photo : mêmes pièges de format de nom ("Prénom" vs "Prénom.Initiale") déjà rencontrés plusieurs fois cette saison sur ce projet — à sécuriser via `matchPlayerName()` comme partout ailleurs.
- Poids des fichiers photo (images haute résolution façon les 2 exemples fournis, plusieurs Mo chacune) → impact sur le temps de chargement de l'app si non maîtrisé.
