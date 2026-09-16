# QA-48 — Mode "Articulation" côté Attaque

**Agent :** QA
**Date :** 2026-09-16
**Méthode :** lecture de code + script Node reproduisant fidèlement les fonctions de calcul sur données Supabase réelles, **puis vérification complète par clics réels via MCP Playwright sur la production** (`docs/e2e/E2E-48-mode-articulation-attaque.md`) une fois le serveur redevenu disponible en cours de cycle.

---

## Critères d'acceptation (`docs/stories/STORY-48-mode-articulation-attaque.md`)

1. **Bouton cliquable en Attaque, terrain peuplé avec de vraies données** — ✅ vérifié par calcul (postes cohérents, ex. ALG=Julien.L/41%) **et par clic réel** (J01 BILLERE-FENIX, terrain affiché avec les 6 ronds ALG/ARG/DC/ARD/ALD/PVT et noms réels).

2. **Bascule "6 complet"/"Base arrière" → recalcul correct** — ✅ vérifié par calcul (46%/75% recoupés manuellement) **et par clic réel** (bascule LARGEUR testée en direct, résumé et classement recalculés).

3. **Clic sur un poste → panneau d'édition, changement reflété partout** — ✅ **vérifié par clic réel** : clic sur ALG (Julien.L) → panneau ouvert avec liste des joueurs observés (Julien.L 38, Roméo.G 4) + `<select>` "Auto" ; clic sur "Roméo.G (4)" → rond mis à jour immédiatement (icône ✎), récap et résumé recalculés dans la foulée.

4. **Clic sur une ligne du classement → place toute la composition d'un coup** — ✅ **vérifié par clic réel** : clic sur la ligne 67% (5 séq.) → les 6 postes replacés simultanément (`att_alg:'Julien.L', att_arg:'Issa.S', att_dc:'Idris.F', att_ard:'Louis.M', att_ald:'Roman.L', att_pvt:'Yoran.C'`), résumé affiche "67% de réussite offensive".

5. **Résumé "de réussite offensive", % = buts/(buts+tirs ratés), formule directe** — ✅ vérifié par calcul et lecture de code, **confirmé visuellement** (le combo classé 67% dans la liste affiche exactement "67%" une fois placé dans le résumé, aucune inversion).

6. **Cas vides gérés explicitement** — ✅ **rencontré en conditions réelles sans le provoquer** : le lineup "auto" (chaque poste pris isolément) n'avait été observé ensemble qu'une seule fois → message "Cette composition n'a jamais été observée ensemble sur cette période." affiché correctement.

7. **État Attaque/Défense indépendant en basculant plusieurs fois** — ✅ **vérifié par clic réel, critère le plus à risque (Risk R5)** : poste P3 ouvert côté Défense (Idris.F) → bascule vers Attaque (terrain propre, aucun poste ouvert) → retour vers Défense → l'éditeur P3 est resté ouvert, aucune réinitialisation, aucune confusion visuelle. Répété deux fois, résultat identique.

8. **Non-régression totale du mode Défense** — ✅ vérifié par `git diff` (zéro ligne des fonctions défense modifiée) **et par clic réel** (terrain défense — dispositif 0-6/1-5, largeur À6/À4/À2, classement — re-testé visuellement après le correctif v286, rendu identique à l'existant).

9. **Testé en conditions réelles sur au moins 2 matchs, y compris "peu de données"** — ✅ **vérifié par clic réel** sur J01 BILLERE-FENIX et J02 FENIX-LA CRAU (bascule de match testée explicitement pendant que le mode Articulation était actif). Cas "peu de données" rencontré et géré (critère 6).

## Bug réel trouvé et corrigé pendant ce cycle (v286)

Le tout premier test réel (avant même de couvrir les critères un par un) a révélé un bug bloquant pour le critère 7 : basculer Attaque↔Défense (ou changer de match) pendant que le mode Articulation était déjà actif laissait le panneau **complètement vide**, pas juste "non isolé" comme le redoutait le Risk R5 — carrément vide, sans terrain ni résumé. Cause : `renderEncFamillesSection()` reconstruit tout le HTML de la section à chaque changement de match/filtre/côté et recrée `#enc-articulation-wrap`, mais seul `_setEncGraphMode()` sait le repeupler — jamais appelé depuis `renderEncFamillesSection()`. Ce bug touchait **aussi le mode Défense depuis toujours** (STORY-34, v258) — jamais détecté car jamais testé dans cet ordre précis (Articulation actif, PUIS bascule ou changement de match) avant ce cycle. Corrigé en v286 (`js/page-analyse.js`, fin de `renderEncFamillesSection`), puis tous les critères ci-dessus rejoués et validés après correction. Détails complets : `docs/code-review/STORY-48.md`.

## Point vérifié — Risk R1 (obligatoire selon la story)

36 des 120 lignes `articulation_att` FENIX n'ont pas de tag `Possession` : majoritairement `Jet franc`/`2' obt` (sous-événements connus), mais 4 `Tir raté` authentiques (vérifiés non-doublons, et vérifié qu'aucun n'est un Pen — les 8 lignes FENIX `phase_att="Pen"` de la saison n'ont jamais `articulation_att` rempli). Règle de comptage affinée en v285 après clarification de Romain : un tir compte toujours indépendamment du tag `Possession` (sans objet pour un % de réussite au tir), un sous-événement reste filtré par ce tag. Détails dans `docs/code-review/STORY-48.md`.

## Verdict

**PASSED** — tous les critères d'acceptation vérifiés par calcul sur données réelles ET par clics réels sur la production (v286), y compris le critère 7 (le plus à risque). Un bug réel trouvé pendant la vérification a été corrigé et re-testé avant validation finale. Aucune réserve restante.
