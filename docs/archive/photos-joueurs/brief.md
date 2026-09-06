# Brief — Photos joueurs (portrait + corps entier)

**Agent :** Analyst
**Date :** 2026-09-01

---

## 1. Contexte

L'appli affiche aujourd'hui chaque joueur uniquement via ses initiales dans un avatar rond texte (`.jp-avatar` sur la page Joueurs, `.pmf-avatar` en mode joueur mobile — vérifié dans le code, aucune photo nulle part). Romain a désormais des photos individuelles de plusieurs joueurs, dans deux formats : un **portrait** (tête, fond transparent) et un **corps entier** (joueur en pied, en maillot Fenix Toulouse complet, fond transparent, format vertical). Il veut les exploiter dans l'appli plutôt que de les laisser inutilisées.

## 2. Problème

L'appli est aujourd'hui 100% textuelle pour l'identification visuelle d'un joueur — un avatar avec 2 lettres. C'est fonctionnel mais impersonnel : sur la fiche joueur, dans les exports PDF/PPT (destinés à être montrés aux joueurs, aux parents, ou en réunion staff), et dans l'esprit général "outil de suivi pro" que Romain construit depuis plusieurs mois (charte visuelle Fenix, dégradés bleu club, Bebas Neue), l'absence de vraie photo est le dernier point qui fait "tableur amélioré" plutôt que "outil de club".

## 3. Utilisateurs

- **Romain (staff/coach)** — usage desktop principalement, consulte la fiche joueur en préparation de match ou d'entretien, exporte en PDF/PPT pour partager en réunion ou avec un joueur/parent.
- **Joueurs (mode lecture mobile)** — consultent leur propre fiche sur téléphone ; verraient leur propre avatar photo.
- Contrainte réaliste : toutes les photos ne sont pas encore disponibles pour tous les joueurs (déploiement progressif à mesure que Romain les récupère) — l'app doit rester cohérente avec un mélange joueurs-avec-photo / joueurs-sans-photo.

## 4. Vision

Chaque joueur avec une photo disponible est identifiable visuellement partout où son nom apparaît en position "carte d'identité" (fiche, export, connexion) — sans jamais casser l'affichage pour un joueur qui n'a pas encore de photo.

## 5. Scope

**Dans le scope :**
1. Portrait joueur en remplacement de l'avatar initiales sur la fiche joueur (`page-joueurs`) et en mode lecture joueur mobile (`player-mode`), avec repli propre sur les initiales si pas de photo.
2. Photo corps entier intégrée à l'export PDF/PPT du joueur (`printFicheJoueur()` / `exportJoueurPPT()`) — emplacement à définir par le Designer, la page de couverture existante (`pdf-slide-cover`, actuellement juste logo + nom) étant le candidat naturel.
3. Nouvelle interaction sur la page Joueurs : un clic sur l'avatar (portrait ou initiales) du joueur sélectionné bascule la colonne terrain (`court-container`) vers l'affichage de sa photo corps entier, avec un moyen évident de revenir au terrain.

**Hors scope (explicitement) :**
- Upload de photo depuis l'interface (Romain ajoute les fichiers lui-même, comme il le fait déjà pour le fichier Excel).
- Recadrage/édition d'image dans l'app.
- Photos pour les entités "Adversaire" (uniquement les joueurs Fenix).

## 6. Critères de succès

- Un joueur avec photo affiche sa vraie photo à la place des initiales, sur desktop staff ET mobile joueur, sans erreur console si le fichier est absent.
- Un joueur sans photo continue d'afficher les initiales exactement comme aujourd'hui — aucune régression visuelle.
- L'export PDF/PPT intègre la photo corps entier sans casser la mise en page existante (ni pour un joueur avec photo, ni pour un joueur sans photo).
- Le clic sur l'avatar bascule visuellement le terrain vers la photo corps entier et permet un retour simple.

## 7. Questions en suspens

- **Où stocker les fichiers photo** (Supabase Storage vs fichiers statiques bundlés dans le repo) → tranché en Architecture (voir `docs/arch/photos-joueurs.md`), car ça détermine largement l'implémentation.
- **Convention de nommage** des fichiers pour le mapping nom → photo → tranchée en Architecture.
- Romain fournira les fichiers progressivement : pas de liste figée du nombre de joueurs concernés au lancement de la feature.
