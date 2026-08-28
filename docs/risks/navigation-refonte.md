# Risques — Refonte Navigation & Design Visuel FENIX Stats CF

**Agent :** Risk Analyst
**Date :** 2026-08-28
**Input :** `docs/arch/navigation-refonte.md`

---

## Tableau des risques

| # | Risque | Probabilité | Impact | Priorité | Recommandation |
|---|--------|-------------|--------|----------|-----------------|
| R1 | Canvas (timeline, camembert, matrice) dessiné une seule fois pendant que son onglet est masqué (`display:none`, `clientWidth=0`) → canvas vide sans erreur JS visible, en particulier au tout premier chargement d'un match si l'onglet par défaut n'est pas celui du canvas. | Élevée | Élevé | **P0** | Critère d'acceptation explicite : ouvrir chaque onglet contenant un canvas (Timeline, Enclenchements) au moins une fois par cycle de test, sur un match fraîchement sélectionné, sans jamais passer par l'onglet au préalable. Le Developer doit ré-invoquer le draw correspondant à l'ouverture de l'onglet, pas seulement au chargement des données (déjà noté par l'Architect — élevé ici en critère de test explicite). |
| R2 | Le déplacement de blocs HTML volumineux dans un fichier monolithique unique (partagé par Dashboard/Analyse/Joueurs/Comptes/Vue joueur) casse silencieusement une balise ailleurs dans le fichier (ID dupliqué, `div` mal refermé) — l'erreur peut apparaître sur une page qui n'a rien à voir avec Analyse. | Moyenne | Critique | **P0** | Déplacer section par section (pas en un seul geste), avec un contrôle visuel de **toutes** les pages (pas seulement Analyse) après chaque déplacement. Un simple `open FENIX-HANDBALL-CF-SUIVI.html` + parcours des 3 pages principales avant de committer suffit à attraper l'essentiel — pas besoin d'outillage lourd, juste de la discipline vu l'absence de tests automatisés sur ce fichier. |
| R3 | En vue "Saison complète" (aucun match sélectionné), les onglets Timeline et Chat IA n'ont pas de contenu pertinent. Si l'utilisateur était sur l'un des deux et repasse en vue saison (ou l'inverse), rien ne garantit qu'il retombe sur un onglet cohérent — risque de se retrouver sur un onglet grisé ou vide sans redirection. | Moyenne | Modéré | **P1** | Critère d'acceptation à ajouter à la story concernée : si l'onglet actif mémorisé n'est pas disponible dans le contexte courant (saison vs match), basculer automatiquement sur "Résumé" plutôt que d'afficher un onglet vide ou désactivé sans action. |
| R4 | L'état du drill-down Enclenchements (famille → intention → enclenchement, stocké dans des variables globales type `window._encSelectedFamille`) n'est pas explicitement remis à zéro ni revalidé lors d'un changement d'onglet suivi d'un changement de match. Risque de revenir sur l'onglet Enclenchements et de voir un détail affiché qui ne correspond plus au match actuellement sélectionné. | Faible | Modéré | **P1** | Vérifier que `updateAnalysePage()` réinitialise bien cet état à chaque changement de match (comportement qui semble déjà exister d'après le code actuel, à reconfirmer) — critère d'acceptation : changer de match pendant que l'onglet Enclenchements est fermé, puis le rouvrir, ne doit jamais montrer un détail obsolète. |
| R5 | Le remaniement visuel (nouveaux tokens de couleur, ombres, radius) touche potentiellement les mêmes zones CSS que les correctifs mobiles livrés le jour même de ce brief (états vides Analyse/Vue joueur, canvas Impact pleine largeur sur mobile, header sticky mode joueur) — une régression y serait particulièrement mal venue vu qu'elle vient d'être vérifiée sans faute. | Moyenne | Élevé | **P1** | Repasser explicitement la checklist mobile (375px) de `docs/audit-final/AUDIT-2026-08-28.md` §3 après implémentation de la passe visuelle — pas seulement les nouveaux écrans de ce chantier, aussi les correctifs récents qui n'en font pas partie. |
| R6 | Ni le Design ni le Visual n'ont spécifié le comportement clavier du nouveau menu "Outils" (dropdown) et du panneau latéral (Échap pour fermer, piège de focus dans le panneau, retour du focus au déclencheur à la fermeture). Sans ça, un panneau qui glisse mais ne se ferme qu'à la souris est un recul d'accessibilité par rapport aux modales actuelles (qui ont probablement déjà ce comportement basique du navigateur). | Moyenne | Faible | **P2** | Ajouter en critère d'acceptation de la story F5 : Échap ferme le panneau, le focus revient sur le bouton déclencheur, la navigation clavier (Tab) reste piégée dans le panneau tant qu'il est ouvert. |
| R7 | L'Architect note l'existence possible d'autres modales dans le code non migrées vers le nouveau composant `.slide-panel` — si elles restent au pattern centré pendant que Comptes/Vue joueur passent au panneau latéral, l'appli aura deux langages de "fenêtre par-dessus" différents sans raison, ce qui va à l'encontre de l'objectif même de cohérence visuelle du chantier. | Faible | Modéré | **P2** | Avant de livrer F5, recenser toutes les modales existantes (`grep` sur `position:fixed` + `z-index` élevé dans le HTML) — décider explicitement lesquelles migrent et lesquelles restent en l'état, plutôt que de laisser la question ouverte. |

---

## Risques P0/P1 → stories de mitigation

- **R1** → critère d'acceptation explicite ajouté à la story de découpage en onglets Analyse (re-draw canvas à l'ouverture d'onglet).
- **R2** → pas une story séparée, mais une consigne de méthode pour le Developer sur la story de découpage (déplacement section par section + vérification croisée des autres pages).
- **R3** → critère d'acceptation ajouté à la story des onglets Analyse (fallback sur "Résumé" si l'onglet mémorisé n'est pas disponible).
- **R5** → story de vérification transversale dédiée après implémentation de la passe visuelle, réutilisant explicitement la checklist mobile de l'Audit Final du 2026-08-28 plutôt que d'en réécrire une nouvelle.

---

## Ce qui n'est PAS un risque de cette feature (rappel de périmètre)

- Aucune donnée n'est déplacée, recalculée ou re-mappée — ce chantier est strictement présentation. Les risques de calcul (familles, temps de jeu, matching de noms) sont hors périmètre, déjà couverts par les cycles précédents.
- La connectivité et la concurrence multi-utilisateurs ne sont pas des sujets pertinents ici : l'app reste mono-utilisateur local, sans backend, comme pour tous les chantiers précédents.
- Les bugs G4-G8 de l'Audit Final (doublon Excel, position codes, retour navigateur SPA global, espacement mineur, message mot de passe vide) restent hors scope — déjà actés par le PM.
