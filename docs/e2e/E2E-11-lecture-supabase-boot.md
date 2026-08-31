# E2E-11 — Lecture depuis Supabase au démarrage de l'app (STORY-22)

**Agent :** E2E Tester
**Date :** 2026-08-31
**Outil :** MCP Playwright, serveur statique local (port 8972)

---

## Parcours testés

### 1. Chargement complet depuis un device "vierge"
1. `localStorage.clear()` + `sessionStorage.clear()` (simulation d'un appareil n'ayant jamais importé de fichier)
2. Rechargement de la page, connexion réelle
3. Dashboard : chiffres identiques aux valeurs de référence établies dans la session sur `ESSAI IA STAT.xlsm` — 0 erreur console
4. Capture : `docs/e2e/screenshots/story-22-boot-supabase.png`

### 2. Fiche joueur — cas nominal
- Navigation Joueurs → clic sur "AV" (Antonin Vache) → fiche affichée : 2/4 but/tir, 50% efficacité, détail par match cohérent
- Capture : `docs/e2e/screenshots/story-22-joueurs-page.png`

### 3. Fiche joueur — cas "Jules F" (le scénario que cette story doit corriger)
- Clic sur "JG" → **Jules Gougeon**, DC, 0/0, 0%, 0 partout — joueur réel actuel sans données de match, affiché correctement sans confusion avec l'ancien "Jules F" (joueur retiré la saison passée)
- Capture : `docs/e2e/screenshots/story-22-jules-g.png`

### 4. Page Analyse — camembert enclenchements
- Navigation Analyse : 8 familles affichées (Isoler 31%, Jeu Pivot 17%, Jeu Rapide 15%, 6vs5 13%, Non classifié 15%, Faire courir 5%, Rentrée 4%), somme = 100%, n=131 possessions, couverture 85%
- Capture : `docs/e2e/screenshots/story-22-analyse-page.png`

### 5. Page Notes & Actions Joueurs
- 12 joueurs listés, NOTE TOTAL = NOTE ATT + NOTE DEF vérifié ligne par ligne (ex. Isaac.M : +10 + -3 = +7 ✓, Marius.C : -4 + -8 = -12 ✓)
- Capture : `docs/e2e/screenshots/story-22-notes-page.png`

### 6. État d'erreur + récupération
1. `fetchAll` intercepté pour lever une erreur (simulation panne réseau)
2. Appel de `loadFromSupabase()` → écran "Impossible de contacter le serveur" + bouton "Réessayer" affiché — capture `docs/e2e/screenshots/story-22-error-state.png`
3. Réseau restauré, clic sur "Réessayer" → overlay masqué, `DATA.length` = 364, 0 erreur console

## Résultat

Tous les parcours passent en conditions réelles de navigateur. Le scénario "Jules F" original (donnée périmée sur un device n'ayant pas réimporté) ne se reproduit plus — confirmé positivement (pas juste l'absence de l'ancien bug, mais l'affichage correct du joueur réel actuel).

## Non testé

- État "Chargement…" transitoire en screenshot direct (fenêtre trop courte pour être capturée de façon fiable via les round-trips MCP même avec un délai artificiel de 1,5s) — compensé par une vérification de code (Code Review STORY-22) confirmant que l'appel est synchrone et systématique.
- Test sur un vrai réseau mobile dégradé (seulement simulé via interception JS) — hors de portée de l'environnement de test local.

---

## Verdict : ✅ PASSED
