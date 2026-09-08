# Design — Réorganisation de la page Analyse

**Agent :** Designer
**Date :** 2026-09-08

---

## 1. Principe général

Trois mouvements, tous à partir de contenu déjà généré (aucun nouveau calcul) :
1. **Promouvoir** le résumé IA (`generateResume3Points`, déjà résultat + top 3 constats triés par importance) hors de l'onglet "Résumé", en bloc "Essentiel" toujours visible en haut de page.
2. **Regrouper** les 5 onglets en 3, selon la logique retenue en Brief : Vue d'ensemble (Indicateurs + Timeline), Tactique (Intention attaque + Gardien), Notes & Outils (Coach + Chat IA).
3. **Replier** par défaut le bloc terrain/nuage de tirs, lourd visuellement et pas systématiquement consulté.

Choix explicitement écarté : le scroll continu sans onglets (idée du Brainstorm). Passer de 5 à 3 sections résout déjà la meilleure partie du problème de clutter, avec un risque d'implémentation beaucoup plus faible qu'une refonte complète du modèle de navigation — à reconsidérer seulement si 3 onglets s'avèrent encore trop après ce cycle.

## 2. Maquette ASCII — vue d'un match sélectionné

```
┌─────────────────────────────────────────────────────────────────┐
│ MATCH [AMICAL FENIX-BILLERE ▾]  CLUB[Tous▾]  RÉSULTAT[Tous▾] GE[▾]│ ← barre sticky, inchangée
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐   │
│ │  ✅ VICTOIRE 30-28                                          │   │ ← ESSENTIEL (nouveau,
│ │  🎯 Bonne efficacité FENIX : 58% vs 51%                     │   │   toujours visible,
│ │  ✅ Maîtrise du ballon : seulement 12 PB (vs 19)             │   │   = ancien résumé IA
│ │  🧤 Gardien en difficulté : 38% d'arrêts (vs 45%)            │   │   promu, contenu
│ └───────────────────────────────────────────────────────────┘   │   identique)
│                                                                   │
│ ▸ 🏟️ Terrain & Comparatif FENIX/Adversaire        [Déplier ▾]    │ ← replié par défaut
│                                                                   │
│  [Vue d'ensemble]   [Tactique]   [Notes & Outils]                │ ← 3 sections (était 5)
│  ───────────────                                                 │
│  📊 INDICATEURS CLÉS                                             │
│  [Efficacité 58%-51%] [PB 12-19] [Possessions ...] [Sup. ...]    │
│                                                                   │
│  📈 ÉVOLUTION DU SCORE                    🔵 MOMENTS CLÉS         │
│  [graphique]                              [liste]                │
│                                                                   │
│  ⚡ BASCULES DU MATCH                                             │
│  [liste]                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Onglet Tactique** (fusion Intention attaque + Gardien) :
```
  [Vue d'ensemble]   [Tactique]   [Notes & Outils]
                     ─────────
  🛡 DÉFENSE FENIX — INTENTION ATTAQUE ADVERSES     [Attaque][Défense]
  [Vue générale][Matrice 2×2][🎯 Articulation]
  FAMILLES
  [cartes...]

  🧤 GARDIEN × INTENTIONS ADVERSES                   ← anciennement onglet séparé,
  [tableau/heatmap gardien]                            maintenant juste en dessous
```

**Onglet Notes & Outils** (fusion Coach + Chat, contenu secondaire/interactif) :
```
  [Vue d'ensemble]   [Tactique]   [Notes & Outils]
                                  ─────────────────
  👨‍🏫 TON ANALYSE (COACH)                🤖 CHAT IA
  [textarea + bouton sauvegarder]        [conversation]
```

## 3. Maquette ASCII — vue "Saison complète"

Même ossature (bloc de synthèse en tête + sections en dessous), pas de page à part :

```
┌─────────────────────────────────────────────────────────────────┐
│ MATCH [Saison complète ▾]  CLUB[Tous▾]  RÉSULTAT[Tous▾]  GE[▾]   │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐   │
│ │  📊 3 MATCHS ANALYSÉS CETTE SAISON                          │   │ ← ESSENTIEL SAISON
│ │  🔑 Pertes de balle : signal fort — 22 en victoire vs 17    │   │   (nouveau, condense
│ │     en défaite (+26%)                                       │   │   les signaux les plus
│ │  🔑 % Arrêts GB : 42% en victoire vs 25% en défaite (+51%)  │   │   forts déjà calculés
│ └───────────────────────────────────────────────────────────┘   │   par generateSeason-
│                                                                   │   Correlations())
│  [Tactique]   [Tendances]                                        │ ← 2 sections (pas de
│  ──────────                                                      │   Vue d'ensemble/Notes,
│  🛡 DÉFENSE FENIX — INTENTION ATTAQUE ADVERSES                   │   qui n'ont pas de sens
│  [cartes familles, mêmes composants que la vue match]            │   sans un match précis)
└─────────────────────────────────────────────────────────────────┘
```

**Onglet Tendances** = le tableau de corrélations existant (`generateSeasonCorrelations`), inchangé — devient un onglet nommé plutôt qu'un bloc brut en bas de page.

## 4. Contenu exact du bloc "Essentiel" (pas de nouveau calcul)

- **Vue match** : reprend tel quel le HTML déjà produit par `generateResume3Points()` (résultat coloré + top 3 constats triés par magnitude) — seul son emplacement change (hors de l'onglet Résumé, toujours visible).
- **Vue saison** : construit à partir des lignes déjà marquées "🔑 Signal fort" par `generateSeasonCorrelations()` (déjà calculées, déjà triées par écart) — prendre les 1-2 signaux forts les plus importants, même logique de sélection que le top 3 du résumé match (pas de nouveau seuil à inventer).

## 5. États

- **Bloc terrain replié** : chevron "▾ Déplier" / "▴ Replier", état non persisté entre sessions (revient replié à chaque nouvelle visite — cohérent avec l'idée qu'il n'est pas consulté systématiquement).
- **Essentiel sans assez de données** : garde le message existant ("Pas assez de données pour générer un résumé") — comportement inchangé.
- **Section active** : la 1ʳᵉ section (Vue d'ensemble / Tactique en vue saison) reste sélectionnée par défaut à l'ouverture d'un match, comme aujourd'hui.

## 6. Responsive

Inchangé dans son principe (desktop/iPad, cf. CLAUDE.md §8) : le bloc Essentiel reste pleine largeur sur petit écran, les indicateurs clés et cartes de familles gardent leur `flex-wrap` déjà en place.

## 7. Composants réutilisés vs nouveaux vs déplacés

**Réutilisés à l'identique :** tout le calcul (`generateResume3Points`, `generateIndicateurs`, `computeEncStats`/`computeEncStatsSaison`, `drawTimeline`, `findMomentsCles`, `detectAllBascules`, `renderEncFamillesSection`, `renderGardienEncSection`, `generateSeasonCorrelations`) — zéro changement de donnée.

**Nouveaux :** le conteneur "Essentiel" (structure autour du contenu existant), l'accordéon du bloc terrain, la sélection des 1-2 signaux forts pour l'Essentiel saison.

**Déplacés (HTML existant, changement d'emplacement seulement) :** résumé IA (hors onglet, vers Essentiel), indicateurs clés (dans Vue d'ensemble avec Timeline), gardien (dans Tactique avec Intention attaque), coach (dans Notes & Outils avec Chat).
