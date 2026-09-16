# E2E-48 — Mode "Articulation" côté Attaque

**Agent :** E2E Tester
**Date :** 2026-09-16
**Méthode :** MCP Playwright réel (redevenu disponible en cours de cycle, après un premier passage sauté faute de connexion), sur la production déployée (`https://romainternel.github.io/fenix-suivi-cf/`, v286).

---

## Bug réel trouvé pendant ce test (avant tout autre critère)

Premier test réel : match J01 BILLERE-FENIX, mode ⚡ Attaque, clic sur "🎯 Articulation" → le bouton passait actif mais **le panneau restait complètement vide** dès qu'on changeait de match ou qu'on basculait Attaque/Défense pendant que le mode était déjà actif. Diagnostiqué en direct (`window._encGraphMode`/`window._encCurrentMatchData` corrects, mais `#enc-articulation-wrap` recréé vide par `renderEncFamillesSection()` sans jamais rappeler la fonction de dessin). Corrigé en v286 (voir `docs/code-review/STORY-48.md` et le commit `59f76cf`), puis **tous les parcours ci-dessous ont été rejoués après correction et validés**.

## Parcours testés en conditions réelles (v286)

1. **Sélection match J01 BILLERE-FENIX → clic "🎯 Articulation" en mode Attaque** — ✅ terrain peuplé (6 postes ALG/ARG/DC/ARD/ALD/PVT avec noms réels : Julien.L, Marius.C, Issa.S, Louis.M, Roman.L, Yoran.C).
2. **Bascule LARGEUR "6 complet" ↔ "Base arrière"** — ✅ résumé et classement recalculés (vérifié aussi côté Défense : "À 6"/"À 4"/"À 2").
3. **Clic sur un poste (ALG) → panneau d'édition** — ✅ liste des joueurs déjà observés (Julien.L 38, Roméo.G 4) + `<select>` "Auto" affichés. Clic sur "Roméo.G (4)" → rond ALG mis à jour immédiatement (icône ✎, nom changé), récap et résumé recalculés dans la foulée (`Roméo.G / Marius.C / Issa.S / Louis.M / Roman.L / Yoran.C`).
4. **Clic sur une ligne du classement (67%, 5 séq.)** — ✅ les 6 postes replacés d'un coup (`att_alg:'Julien.L', att_arg:'Issa.S', att_dc:'Idris.F', att_ard:'Louis.M', att_ald:'Roman.L', att_pvt:'Yoran.C'`), résumé affiche "67% de réussite offensive".
5. **Formule directe** — ✅ confirmé : le résumé affiche littéralement "67% de réussite offensive" (pas de mot "défensive", pas d'inversion — le combo classé 67% dans la liste s'affiche à l'identique dans le résumé une fois placé).
6. **Cas vides** — ✅ rencontré en conditions réelles sans le provoquer artificiellement : le lineup composé des postes "les plus utilisés" pris isolément (Julien.L/Marius.C/Issa.S/Louis.M/Roman.L/Yoran.C) n'avait été observé ensemble qu'une seule fois → message "Cette composition n'a jamais été observée ensemble sur cette période." affiché correctement, terrain non cassé.
7. **Bascule ⚡ Attaque ↔ 🛡 Défense avec Articulation actif** — ✅ **critère le plus à risque (Risk R5), testé explicitement** : poste P3 ouvert côté Défense (Idris.F) → bascule vers Attaque (terrain attaque s'affiche normalement, aucun poste ouvert côté attaque) → retour vers Défense → **l'éditeur P3 est resté ouvert**, aucune réinitialisation, aucune confusion visuelle. Répété une deuxième fois avec le même résultat.
8. **Changement de match pendant Articulation actif** — ✅ re-testé explicitement après le correctif v286 (c'est le scénario exact qui avait révélé le bug) : bascule J01 → J02 FENIX-LA CRAU avec le mode déjà actif → terrain redessiné correctement pour J02 (8595 caractères de HTML, contre 0 avant le correctif).
9. **Testé sur 2 matchs différents** — ✅ J01 BILLERE-FENIX (56 séquences) et J02 FENIX-LA CRAU, tous deux avec des données suffisantes.
10. **Console navigateur** — ✅ zéro erreur, zéro avertissement sur toute la session de test (vérifié `browser_console_messages` à plusieurs reprises).
11. **Non-régression Défense** — ✅ terrain défense (dispositif 0-6/1-5, largeur À6/À4/À2, classement) re-testé visuellement après le correctif, rendu identique à l'existant.

## Verdict

**PASSED** — tous les critères d'acceptation de STORY-48 vérifiés par de vrais clics Playwright sur la production, y compris le critère 7 (le plus à risque) et un bug réel trouvé et corrigé en cours de route (v286). Aucune réserve restante.
