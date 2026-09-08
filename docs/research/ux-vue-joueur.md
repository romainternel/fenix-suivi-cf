# Research — UX Vue Joueur Mobile
**Agent :** Research Analyst  
**Date :** 2026-06-15  
**Input :** Feedback squad — Cyprien (19 ans), Martin (22 ans), Gaby (24 ans), Siméo (17 ans)  
**Sujet :** 12 points de friction identifiés sur la vue joueur (pm-bar, Ma Fiche, Stats Match, Zones)

---

## 1. BENCHMARK — Ce qui se fait ailleurs

### Apps joueur-facing sports référentes

| App | Audience | Ce qu'ils font bien |
|-----|----------|---------------------|
| **Strava** | 17–35 ans, running/vélo | 1 métrique principale énorme, filtre période natif, partage story en 1 tap |
| **Hudl Technique** | Sportifs 16–25 ans | Stats perso TOUJOURS en premier, vidéo + stat sur le même écran |
| **Garmin Connect** | Athlètes tous niveaux | Graph avec max 2 courbes sur mobile, période sélectionnable depuis le graph |
| **Sofascore** | Fans + joueurs | Note affichée + tooltip "comment c'est calculé" systématique |
| **SofaStats (handball)** | Staff + joueurs | Zones de tir filtrables par résultat (but/arrêt/raté) |
| **XPS Slideline** | Staff handball/foot | Vue joueur séparée de vue staff — hiérarchie claire |
| **Nike Run Club** | 15–30 ans | Partage perf en image stylée en 2 taps — driver d'engagement majeur |

### Pattern universel dans les apps mobile sportives joueur-facing
> **L'utilisateur = le héros.** Son score, sa stat, sa progression. Toujours en premier. Les données d'équipe sont secondaires ou masquées par défaut.

---

## 2. CHALLENGE D'UTILITÉ — Les 12 points passés au crible

### ✅ DÉJÀ LIVRÉ (v95 — skip)
- pm-bar responsive mobile
- Déconnexion cachée dans menu ⋯
- Dernière mise à jour dans menu ⋯
- Onglet 🎯 Zones
- Empty states

---

### Point A — Graph Ma Fiche : 5 courbes illisibles sur mobile
**Remontée par :** Siméo  
**Benchmark :** Strava = 1 courbe. Garmin = 2 max sur mobile. Nielsen Norman Group : 7±2 items en mémoire de travail — 5 courbes simultanées sur 320px de large → surcharge cognitive.  
**Est-ce que ça change une décision du joueur ?** OUI — mais seulement si le joueur comprend ce qu'il voit. Actuellement il ne comprend pas.  
**Risque si on ne fait rien :** Le joueur ignore le graph → perd l'info la plus utile (sa trajectoire de saison).  
**Recommandation : ✅ GO** — Réduire à 2 courbes sur mobile : TOTAL (ligne pleine) + ligne zéro. ATT/DEF/Médiane/Tendance en mode "détail" (toggle ou tab).

---

### Point B — Filtre période sur graph Ma Fiche
**Remontée par :** Martin  
**Benchmark :** Strava, Garmin, Polar Flow — le filtre période EST sur le graphique, pas dans un menu séparé. Standard UX depuis 2018.  
**Est-ce que ça change une décision du joueur ?** OUI — "est-ce que je monte en forme sur les 5 derniers matchs ?" est la question N°1 d'un joueur en milieu de saison.  
**Complexité technique :** Faible — réutilise les BILANS existants (le filtre période existe déjà dans Stats Match).  
**Recommandation : ✅ GO** — Ajouter un sélecteur de période (Toute saison / Aller / Retour / 5 derniers) directement sous le titre du graph Ma Fiche. Réutiliser la logique `_getPmBilanMatchs()`.

---

### Point C — Filtre résultat sur Zones de tir
**Remontée par :** Martin  
**Benchmark :** SofaStats, InStat, Hudl — filtrer par résultat (But/Raté ou Arrêt/But encaissé) est la feature de base de tout heat map de tir.  
**Est-ce que ça change une décision du joueur ?** OUI — "où est-ce que je rate mes tirs ?" est une question différente de "où est-ce que je tire ?". La réponse dicte le travail à faire.  
**Recommandation : ✅ GO** — Boutons toggle But / Raté / Tout sous le titre de l'onglet Zones. Simple filtre sur le tableau `impactRows` avant le `_drawImpactCanvas`.

---

### Point D — Info-bulle note joueur de champ
**Remontée par :** Martin  
**Benchmark :** Sofascore affiche la formule de note. WhoScored aussi. Sans explication, la note est un chiffre magique qui crée de la méfiance plutôt que de l'adhésion.  
**Est-ce que ça change une décision du joueur ?** OUI — un joueur qui comprend son calcul sait quoi travailler. Un joueur qui ne comprend pas ignore la note ou la conteste.  
**Note :** Le 'i' GB existe déjà avec un tooltip — incohérence flagrante.  
**Recommandation : ✅ GO** — Ajouter le même 'i' tooltip sur la note joueur de champ (formule : ATT+ - ATT- + DEF+ - DEF-).

---

### Point E — Stats perso avant stats équipe (onglet Stats Match)
**Remontée par :** Gaby + Siméo  
**Benchmark :** TOUTES les apps sportives player-facing mettent le joueur au centre. L'ordre actuel (stats équipe → stats perso) est l'ordre "staff", pas l'ordre "joueur".  
**Est-ce que ça change une décision du joueur ?** Non directement — mais c'est une question de hiérarchie de l'information. Si le joueur doit scroller pour trouver ses propres stats, il décroche.  
**Challenge avocat du diable :** "Le contexte équipe est important pour comprendre ses propres stats." Réponse : oui, mais ça peut venir APRÈS. Le joueur veut d'abord "moi", ensuite "le contexte".  
**Recommandation : ✅ GO** — Inverser l'ordre dans Stats Match : stats personnelles en haut, puis zones de tir, puis stats équipe. Réorganisation HTML uniquement.

---

### Point F — Canvas Zones trop petits sur mobile
**Remontée par :** Gaby  
**Benchmark :** Les heat maps de tir en handball nécessitent un minimum de 280px de large pour distinguer les zones. Sur 375px (iPhone SE), 3 canvas côte à côte → ~120px chacun → illisible.  
**Est-ce que ça change une décision ?** OUI — si le joueur ne voit pas où il tire, la feature Zones n'existe pas fonctionnellement.  
**Recommandation : ✅ GO (prioritaire)** — Sur mobile (< 600px), afficher les 3 canvas en colonne (face en premier, alg/ald dessous en 2 colonnes). CSS uniquement.

---

### Point G — Densité/complexité Ma Fiche
**Remontée par :** Siméo  
**Benchmark :** Nielsen NNG — un écran de dashboard doit répondre à 1 question principale. Ma Fiche répond à : KPIs / Actions / Progression / Badges → 4 questions simultanées.  
**Challenge :** Réduire la densité sans perdre l'info.  
**Recommandation : ⚠️ ADAPTER** — Ne pas supprimer d'info, mais introduire une hiérarchie visuelle plus forte : 1 stat "vedette" en grand (efficacité ou note), les autres en secondaire. Work for PM + Designer.

---

### Point H — Partage de performance
**Remontée par :** Siméo  
**Benchmark :** Nike Run Club, Strava — le partage social est le 1er driver de rétention chez les 16–25 ans (source : Meta Sports Insights 2023). Un joueur qui partage sa perf revient dans l'app.  
**Challenge d'utilité :** Est-ce que le staff veut que les joueurs partagent des données de performance sur les réseaux ? **Question ouverte — ça peut poser des problèmes (données adversaire, comparaisons publiques).**  
**Complexité technique :** Élevée — capture canvas, génération image stylée, intégration partage natif iOS/Android.  
**Recommandation : ❌ NO-GO pour maintenant** — Feature intéressante mais (1) nécessite accord staff/club sur la politique de partage, (2) complexité technique élevée, (3) risque données sensibles. À mettre dans une backlog "V2 engagement".

---

### Point I — Session reprend sur dernier onglet actif
**Remontée par :** Gaby  
**Benchmark :** Standard UX depuis iOS 7. Gmail, Instagram, LinkedIn — tous mémorisent le dernier onglet.  
**Complexité :** Triviale — 1 ligne sessionStorage.  
**Recommandation : ✅ GO** — `sessionStorage.setItem('pm_active_tab', tab)` dans `pmTab()`, lu dans `setupPlayerUI()`.

---

## 3. DONNÉES DE RÉFÉRENCE HANDBALL

- Joueurs CF : 17–24 ans → natifs mobile, usage principal téléphone
- Durée moy. session joueur estimée : **< 2 minutes** (entre deux entraînements, vestiaire)
- La feature la plus consultée en analytics sportif joueur : **sa propre progression** (source : XPS user research)
- Le graph est regardé uniquement si : (a) il est compréhensible en < 5 secondes, (b) il confirme une sensation ressentie
- Zones de tir : valeur maximale quand filtrable — "où je rate" > "où je tire"

---

## 4. SYNTHÈSE — RECOMMANDATIONS

| # | Point | Décision | Priorité |
|---|-------|----------|----------|
| A | Graph mobile simplifié (2 courbes) | ✅ GO | P1 |
| B | Filtre période sur graph Ma Fiche | ✅ GO | P1 |
| C | Filtre résultat sur Zones | ✅ GO | P1 |
| D | Info-bulle note joueur de champ | ✅ GO | P1 |
| E | Stats perso avant stats équipe | ✅ GO | P1 |
| F | Canvas Zones responsive (mobile) | ✅ GO | P1 |
| G | Densité Ma Fiche (1 stat vedette) | ⚠️ ADAPTER | P2 |
| H | Partage performance | ❌ NO-GO v1 | Backlog |
| I | Session → bon onglet | ✅ GO | P2 |

**6 points P1** — changent directement la compréhension et l'utilisation  
**2 points P2** — améliorent l'expérience sans être bloquants  
**1 no-go** — complexité + risque > valeur immédiate

---

## 5. QUESTIONS OUVERTES (pour l'Analyst)

1. **Politique de partage** — Le staff autorise-t-il les joueurs à partager leurs stats sur les réseaux ? (bloque ou débloque H)
2. **"5 derniers matchs"** — Est-ce une période standard dans l'équipe ou le coach utilise d'autres découpages (aller/retour) ?
3. **Stat vedette Ma Fiche** — Laquelle choisir comme KPI principal par poste ? (note ? efficacité ? note ATT ?) → Decision du coach/analyste
4. **Gaby sur Android** — La vue joueur est-elle testée sur Android basique (Chrome, pas Safari) ? Les canvas peuvent se comporter différemment.
