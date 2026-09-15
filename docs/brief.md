# Brief — Articulation offensive (mode "Articulation" côté Attaque)

**Agent :** Analyst
**Date :** 2026-09-15

---

## Origine de la demande

Romain a montré une capture d'écran du fichier Excel source (`IA STAT SAISON 26-27.xlsm`, onglet DATA) mettant en évidence 7 colonnes jusqu'ici jamais exploitées par l'application : **ARTICULATION ATT** (colonne AD) puis **ALG / ARG / DC / ARD / ALD / PVT** (colonnes AE à AJ). Sa demande, verbatim : *"penses-tu que tu peux me faire l'articulation attaque comme l'articulation défense [...] Tous les postes occupés sur ATT PLAC, j'aimerais bien avoir un visuel comme pour articulation def et avec % de réussite qui me donnerait le meilleur 6, la meilleure base arr[ière]"*.

La demande cite explicitement le mode **"Articulation" existant côté Défense** (livré STORY-33/34/36/37/38, v257-268) comme référence directe — ce n'est pas une nouvelle idée à explorer, mais une fonctionnalité miroir déjà validée à transposer côté attaque FENIX, avec les adaptations que la structure réelle des données impose.

## Vérification des données réelles (lecture directe des deux fichiers Excel du repo)

Avant de cadrer quoi que ce soit, les colonnes AD-AJ ont été inspectées directement (`IA STAT SAISON 26-27.xlsm`, 351 lignes DATA ; `ESSAI IA STAT.xlsm`, 702 lignes DATA — colonnes présentes mais vides sur ce fichier plus ancien, confirmant que la saisie de cette donnée est récente, saison 2026-2027 uniquement) :

- **ARTICULATION ATT** ne contient que 2 valeurs distinctes : `"ARTICULATION ATT"` et `"ARTICULATION ATT +"`. Le `"+"` coïncide exactement avec `Phase att = "+"` (séquence FENIX en supériorité numérique, cf. STORY-42) — ce n'est donc pas un descripteur de dispositif géométrique comme côté défense (`"ARTICULATION DEF 0-6"` / `"ARTICULATION DEF 1-5"` encodait directement la largeur défensive), juste un marqueur de contexte.
- Les 6 colonnes de poste (ALG/ARG/DC/ARD/ALD/PVT) sont remplies **ensemble, sur la même ligne que le résultat de l'action** (`Résultat`/`Finalité`), exactement comme `P1`-`P6` le sont côté défense sur les lignes adverses — chaque ligne FENIX en `GE = ATT PLAC` avec ARTICULATION ATT renseigné porte la composition offensive complète au moment de cette action précise.
- Remplissage : 120/227 lignes ATT PLAC sur la saison en cours (53%, cohérence de saisie comparable à ce qui avait été observé côté défense en son temps).
- Aucune ligne ATT PLAC hors club FENIX ne porte cette donnée (logique : c'est la composition offensive de FENIX, pas celle de l'adversaire).

## Différences structurelles avec l'articulation défensive — implications de cadrage

| Aspect | Défense (existant) | Attaque (à construire) |
|---|---|---|
| Dispositif géométrique | 2 valeurs (0-6 / 1-5), bascule le layout du terrain | Aucun — une seule disposition offensive standard (ALG-ARG-DC-ARD-ALD-PVT) |
| Marqueur texte | Encode le dispositif lui-même | Encode seulement normal vs supériorité (`+`) — **décision : les deux sont regroupés sans distinction pour cette v1**, la distinction +/- étant déjà couverte ailleurs (carte "Supériorités numériques", STORY-42) ; à revoir seulement si Romain demande explicitement un jour à isoler le rendement des compositions en supériorité |
| Club analysé | Adversaire (défense adverse vs attaque FENIX) | FENIX (attaque FENIX elle-même) |
| Résultat évalué | Taux de réussite **défensive** (inversion : but/PO adverse = échec défensif) — formule bespoke demandée explicitement par Romain (STORY-37) | **Efficacité standard de l'app** (buts / (buts+tirs ratés)) — même formule que partout ailleurs (dashboard, fiches joueurs, cartes familles) ; PB/PO/Jet franc affichés en détail mais hors du ratio principal, pas de formule inventée |
| Groupements ("Largeur") | 3 paliers géométriques (À6 / À4 centre / À2 centraux) | 2 groupements demandés explicitement par Romain : **6 complet** et **Base arrière** (ARG-DC-ARD) |

## Portée de ce cycle

1. **Import** : ajouter les 7 nouvelles colonnes Excel (`ARTICULATION ATT`, `ALG`, `ARG`, `DC`, `ARD`, `ALD`, `PVT`) au pipeline d'import → `match_data` (Supabase), sur le modèle exact de STORY-33 (colonnes `articulation_def`/P1-P6).
2. **Visuel** : dans l'onglet Tactique de la page Analyse, le bouton "🎯 Articulation" (aujourd'hui grisé en mode Attaque, actif seulement en mode Défense) devient disponible **dans les deux modes** — Défense affiche l'existant inchangé, Attaque affiche le nouveau mode miroir : demi-terrain avec les 6 postes offensifs, clic pour changer un joueur (identique au geste défense), % d'efficacité de la composition affichée pour le groupement actif, classement des compositions observées (Fiable ≥5 séq. / Échantillon faible), pour les 2 groupements "6 complet" et "Base arrière".

## Hors périmètre (explicitement, pour ce cycle)

- Distinction +/- (supériorité numérique) dans l'articulation attaque — regroupé, cf. tableau ci-dessus.
- Tout groupement autre que "6 complet" et "Base arrière" (ex. "Ailiers seuls") — non demandé, ajoutable trivialement plus tard si besoin (même pattern que `ARTIC_BLOCKS`).
- Édition/correction manuelle en masse de la donnée d'articulation dans l'Excel source — hors périmètre applicatif.

## Utilisateur et contexte d'usage

Identique à l'articulation défensive : Romain, en préparation de match ou en debrief post-match, sur desktop/iPad, cherchant à objectiver quelle composition offensive (ou quelle base arrière) produit le meilleur rendement réel plutôt que de se fier à l'impression de terrain.
