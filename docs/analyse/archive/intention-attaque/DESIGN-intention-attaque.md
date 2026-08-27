# Design — Intention attaque (classification dynamique des enclenchements)

**Agent :** Designer
**Date :** 2026-08-26
**Input :** `docs/analyse/PRD-intention-attaque.md`
**Existant réutilisé :** section "⚡ ENCLENCHEMENTS OFFENSIFS" (cards familles, camembert, matrice 2×2), panneau "non classifiés" (v169/v170)

---

## 0. Principe

Cette feature ne crée quasiment aucun nouvel écran — elle change la **donnée** qui alimente des écrans existants (cards, camembert, matrice) et enrichit le mécanisme déjà présent de gestion des enclenchements non classifiés. Le travail de design se concentre donc sur trois points : (1) rendre visible et actionnable le cas orphelin (`BLOC` et futurs cas), (2) donner à Romain un signal rapide de couverture de la classification, (3) s'assurer que l'apparition/disparition de familles (Jeu rapide entre, Bloc PVT/Rebond sortent selon le format des données) ne casse pas la lisibilité du camembert/cards.

---

## 1. Maquette ASCII — Bandeau de couverture (F5)

Ajouté juste sous le titre de section, avant les cards familles. Visible seulement si couverture < 100% (sinon, pas de bruit visuel inutile — cf. mindset "moins c'est mieux").

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚡ ENCLENCHEMENTS OFFENSIFS FENIX      [⚡ Attaque] [○ Défense]    │
├──────────────────────────────────────────────────────────────────┤
│ ⚠ 4 tirs sur 187 (2%) avec une intention non reconnue —          │
│   voir "Non classifié" ci-dessous                    [Résoudre →]│
├──────────────────────────────────────────────────────────────────┤
│ FAMILLES                                    [Vue générale][Matrice]│
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ ISOLER   │ │ JEU PVT  │ │ 7VS6     │ │JEU RAPIDE│  ← nouvelle  │
│  │  34%     │ │  16%     │ │  10%     │ │  16%     │              │
```

- Le bandeau `⚠` n'apparaît que s'il existe au moins une ligne "Non classifié" issue d'une `Intention attaque` absente du catalogue (F4) — pas pour les enclenchements legacy déjà tolérés aujourd'hui en `Autre` (comportement historique inchangé pour ne pas alarmer sur de l'existant connu).
- `[Résoudre →]` scrolle/ouvre directement la card "Non classifié" existante, en surbrillance 1.5s (réutilise le pattern de scroll déjà présent ailleurs dans l'app pour les ancres).

---

## 2. Maquette ASCII — Card "Non classifié" enrichie (F4)

La card existe déjà (v176 : "carte Non classifié visible"). Elle gagne juste une distinction visuelle entre valeurs legacy et valeurs `Intention attaque` orphelines, et le clic ouvre le même dropdown de réassignation qu'aujourd'hui (`enc_famille_custom`).

```
┌────────────────────────────┐
│ NON CLASSIFIÉ          17% │
│ UTILISATION                │
│                             │
│ 50% encl. · 64% tir         │
│ 193p                        │
│                             │
│ [Voir le détail ▾]          │
└────────────────────────────┘
        │ (clic "Voir le détail")
        ▼
┌──────────────────────────────────────────────┐
│ Valeurs non reconnues                         │
├──────────────────────────────────────────────┤
│ BLOC                    4 tirs   [Assigner ▾] │  ← nouveau : Intention attaque
│ Bidasoa                 1 tir    [Assigner ▾] │  ← existant : texte libre legacy
│ SCHNITZY                1 tir    [Assigner ▾] │  ← existant : texte libre legacy
└──────────────────────────────────────────────┘
```

- Pas de badge "legacy" vs "nouveau" superflu — Romain n'a pas besoin de savoir par quel mécanisme la valeur a été détectée, seulement qu'elle attend une décision. Le libellé brut suffit à le distinguer lui-même.
- `[Assigner ▾]` = dropdown existant listant les familles actives (issues de F3, donc à jour automatiquement : "Jeu rapide" y figure si présente dans les données chargées).

---

## 3. État — Classeur sans feuille `Enclenchements`/`Intention attaque` (F1 fallback)

Aucun changement visuel par rapport à aujourd'hui : l'app doit se comporter *exactement* comme avant ce chantier. Pas de bandeau d'avertissement ("fichier ancien format") — ajouter un message ici créerait de l'inquiétude pour un cas parfaitement normal (toutes les saisons avant 2026-2027). Seule exception : si un futur usage montre que Romain confond les deux formats, on pourra reconsidérer (cf. Q4 du Brief — non tranché, pas de design préventif pour une confusion hypothétique).

---

## 4. Camembert et matrice — familles variables

Pas de changement structurel : le camembert et la matrice 2×2 continuent d'itérer sur la liste de familles active (désormais dynamique, F3). Seule règle de design à respecter par le Visual Crafter : chaque nouvelle famille doit recevoir une couleur cohérente avec la palette existante (pas de gris/couleur par défaut visible en prod — cf. doc Visual Crafter), et l'ordre d'affichage reste trié par utilisation décroissante comme aujourd'hui (aucune règle de tri à changer).

---

## 5. Interactions

- Clic sur `[Résoudre →]` → scroll fluide vers la card "Non classifié" + halo 1.5s (déjà utilisé ailleurs dans l'app pour guider l'œil).
- Clic sur `[Voir le détail ▾]` → expand/collapse existant (A-02), pas de nouveau composant.
- Clic sur `[Assigner ▾]` → dropdown existant, sélection → `enc_famille_custom` mis à jour dans localStorage → re-render immédiat des cards/camembert (comportement déjà en place, juste appliqué à une nouvelle catégorie de valeurs).

---

## 6. États

| État | Comportement |
|---|---|
| Import sans feuille Enclenchements/Intention attaque | Identique à l'existant, aucun changement visuel |
| Import avec feuille, 0 orphelin | Pas de bandeau ⚠, cards/camembert affichent les nouvelles familles normalement |
| Import avec feuille, ≥1 orphelin | Bandeau ⚠ visible + card "Non classifié" enrichie |
| Réassignation manuelle effectuée | Bandeau ⚠ recalculé immédiatement (disparaît si 0 orphelin restant) |

---

## 7. Responsive

Aucun nouveau composant large — le bandeau ⚠ et la card enrichie héritent du même comportement responsive que la section enclenchements existante (déjà validée tablette ≥768px lors du cycle A-00→A-08). Sur mobile (hors scope produit — le bloc Analyse n'est pas exposé côté Vue Joueur), pas de contrainte supplémentaire.

---

## 8. Composants réutilisés vs nouveaux

| Composant | Statut |
|---|---|
| Cards familles, camembert, matrice 2×2 | Réutilisés tels quels (données dynamiques) |
| Card "Non classifié" + dropdown d'assignation | Réutilisée, alimentée par une source élargie (legacy + Intention attaque orpheline) |
| Bandeau ⚠ de couverture (F5) | **Nouveau**, minimal, conditionnel |
| Distinction visuelle legacy/nouveau dans le détail | **Volontairement absente** (cf. §2) |

---

*Design — pipeline BMAD FENIX — Designer 2026-08-26*
