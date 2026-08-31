# Design — Migration Supabase

**Agent :** Designer
**Date :** 2026-08-28

---

## Contexte d'usage

Romain travaille assis devant un écran (PC principal) pour l'analyse de fond, et consulte potentiellement l'app au gymnase sur téléphone/tablette (mode joueur déjà pensé pour ça). Les nouveaux écrans de ce cycle (F3 chargement, F5 migration, F6/F7 édition) sont des écrans **staff**, utilisés occasionnellement, pas quotidiennement — la priorité est la clarté et la sécurité (ne pas perdre de données), pas la vitesse d'usage.

Composants existants réutilisés : `.slide-panel`/`.slide-panel-overlay` (panneau latéral, STORY-19), menu "⚙ Outils" (STORY-12), `.surface-card` (STORY-13-19), palette de tokens couleur/ombre déjà en place.

---

## 1. État de chargement au démarrage (F3)

L'app dépend maintenant du réseau dès l'ouverture (décision PRD §0 : pas de mode hors-ligne). Aujourd'hui, l'écran d'import ("IMPORTER LES DONNÉES") s'affiche instantanément si `localStorage` est vide, ou les données apparaissent instantanément si `localStorage` est plein. Avec Supabase, il y a désormais un instant de latence réseau à couvrir.

```
┌─────────────────────────────────────────┐
│  FENIX HANDBALL CF SUIVI                 │
│  ┌─────────────────────────────────┐    │
│  │                                   │   │
│  │        ⏳  (spinner léger)        │   │
│  │                                   │   │
│  │   Chargement des données…         │   │
│  │                                   │   │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Règle** : ne jamais laisser un écran blanc pendant la requête initiale — même bref, un état de chargement explicite est obligatoire (contrairement à avant, où `localStorage` était instantané et ne nécessitait aucun état de ce type).

### État d'erreur réseau
```
┌─────────────────────────────────────────┐
│           📡  ⚠️                          │
│                                           │
│   Impossible de contacter le serveur     │
│   Vérifie ta connexion et réessaie       │
│                                           │
│   [ 🔄 Réessayer ]                       │
└─────────────────────────────────────────┘
```
Pas de contenu partiel/incohérent affiché en cas d'échec — soit tout est chargé, soit l'erreur claire ci-dessus est montrée. Le bouton "Réessayer" relance simplement la même requête, pas de logique de retry automatique cachée (l'utilisateur doit comprendre ce qui se passe).

---

## 2. Migration unique des données locales (F5)

Déclenchement : au premier chargement de la version connectée à Supabase, **si** l'app détecte des données `localStorage` existantes (notes coach / comptes joueurs / assignations famille) qui n'ont pas encore de marqueur "migré", elle propose la migration avant toute autre chose — pas de mode silencieux qui pourrait perdre des données sans que Romain le sache.

```
┌─────────────────────────────────────────┐
│  🔄  MIGRATION VERS SUPABASE              │
│                                           │
│  Des données existent sur cet appareil   │
│  et pas encore sur le serveur partagé :  │
│                                           │
│   ✓ 4 notes de coach                     │
│   ✓ 12 comptes joueurs                   │
│   ✓ 3 assignations de famille manuelles  │
│                                           │
│  Elles vont être copiées vers Supabase.  │
│  Rien n'est supprimé de cet appareil.    │
│                                           │
│  [ Annuler ]        [ Migrer maintenant ]│
└─────────────────────────────────────────┘
```
- Décompte réel des éléments trouvés (pas un texte générique) — Romain doit pouvoir juger si ça correspond à ce qu'il attend avant de valider.
- "Annuler" ferme sans rien migrer (l'utilisateur sera re-sollicité au prochain chargement tant que ce n'est pas fait — pas de perte silencieuse d'opportunité).
- Après succès : confirmation brève ("✅ Migration terminée") puis enchaînement normal vers l'app.
- **Filet de sécurité permanent** : en plus de ce prompt automatique, une entrée "🔄 Migrer mes données locales" reste disponible dans le menu "⚙ Outils" à tout moment, au cas où Romain aurait fermé le prompt initial ou migré depuis un autre appareil entretemps.

---

## 3. Éditeur de familles tactiques (F6)

Nouvelle entrée dans le menu "⚙ Outils" existant, à la suite de "Comptes joueurs" / "Vue joueur" :

```
⚙ Outils ▾
├─ 🔑 Comptes joueurs
├─ 👤 Vue joueur
└─ 🏷️ Familles tactiques        ← nouveau
```

Ouvre un panneau latéral (`.slide-panel`, identique au pattern Comptes joueurs / Vue joueur — STORY-19, glisse depuis la droite, overlay, Échap, focus trap) :

```
┌──────────────────────────────────────┐
│ 🏷️ FAMILLES TACTIQUES            ✕  │
├──────────────────────────────────────┤
│ AJOUTER UNE CORRESPONDANCE            │
│ ┌────────────────────────────────┐   │
│ │ Intention attaque (ex: ISO 4)  │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ Famille          [ Isoler  ▾ ] │   │
│ └────────────────────────────────┘   │
│ [       ✅ AJOUTER            ]      │
│                                        │
│ CORRESPONDANCES EXISTANTES (18)       │
│ ┌────────────────────────────────┐   │
│ │ ISO 2      → Isoler        🗑  │   │
│ │ ISO 3      → Isoler        🗑  │   │
│ │ RENTREE    → Rentrée       🗑  │   │
│ │ 1&2        → Jeu Pivot     🗑  │   │
│ │ ...                              │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

- Le sélecteur "Famille" est une liste déroulante fermée sur les 8 familles déjà connues (`ENC_FAMILLES_ORDRE`) — pas un champ texte libre, pour éviter une faute de frappe qui créerait une 9e famille fantôme non gérée par le reste de l'app (couleurs, camemberts, etc. sont tous calibrés sur exactement 8 familles).
- Suppression avec confirmation native (`confirm()`, cohérent avec `deletePlayerAccount()` déjà en place) — pas de nouvelle modale de confirmation à construire.
- Liste triée alphabétiquement par "Intention attaque" pour repérer vite une entrée existante avant d'en ajouter une nouvelle par erreur.

### État vide
Si aucune correspondance personnalisée n'existe encore (juste après la migration, avant que Romain n'édite quoi que ce soit) : le panneau affiche quand même les correspondances **par défaut** actuellement câblées en dur dans le JS (pré-remplies dans Supabase lors de la migration initiale, cf. Architect pour le detail), avec un message discret en haut : *"Ces correspondances viennent de la configuration initiale — modifie-les librement."* — pas un écran vide qui donnerait l'impression que rien n'existe.

---

## 4. Éditeur de bilans (F7 — Should Have, même schéma que F6)

Non détaillé en maquette complète ici tant que la priorité n'est pas confirmée (PRD §3) — si retenu, reprend exactement le même pattern que F6 (panneau latéral, liste + formulaire d'ajout, entrée "📅 Bilans" dans le menu Outils), avec 3 champs (Saison / Nom / Journée de fin) au lieu de 2.

---

## 5. Responsive

Tous les nouveaux écrans (chargement, erreur, migration, éditeur Famille) sont **staff-only** — jamais affichés en mode joueur. Ils suivent la règle déjà actée en STORY-19 : panneau latéral à largeur fixe (`min(480px, 92vw)`) sur desktop, pleine largeur sous 480px. L'écran de chargement/erreur (F3, plein écran, pas un panneau) est centré verticalement et horizontalement quelle que soit la taille d'écran — pas de layout différent à concevoir entre mobile et desktop pour cet état transitoire.
