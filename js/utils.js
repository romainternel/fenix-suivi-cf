        function syncBilanFilters(sourceId) {
            const BILAN_PAIR = { 'filter-joueur-bilan': 'filter-notes-bilan', 'filter-notes-bilan': 'filter-joueur-bilan' };
            const targetId = BILAN_PAIR[sourceId];
            if (!targetId) return;
            const src = document.getElementById(sourceId);
            const tgt = document.getElementById(targetId);
            if (src && tgt) tgt.value = src.value;
        }

        function getEffColor(pct, poste) {
            if (pct === null) return '#94a3b8';
            const s = EFF_SEUILS[poste] || { hi: 55, mid: 38 };
            return pct >= s.hi ? '#7C3AED' : pct >= s.mid ? '#16a34a' : '#dc2626';
        }

        function getMatchPageSelected() {
            return getSelectedMatches();
        }

        // TEMPS_JEU est keyé sur le nom de la feuille "Tableau_MATCH" (format "Prénom.Initiale").
        // Certains appelants (dashboard, sélecteur gardien graphique) ne connaissent que le prénom DATA
        // (ex: "Lucas") : on retombe sur matchPlayerName si la clé exacte n'existe pas.
        function findTJEntry(nom) {
            if (!nom) return null;
            const direct = TEMPS_JEU[nom.toLowerCase()];
            if (direct) return direct;
            const key = Object.keys(TEMPS_JEU).find(k => matchPlayerName(nom, k));
            return key ? TEMPS_JEU[key] : null;
        }

        function getTJData(joueur, selectedMatches) {
            const entry = findTJEntry(joueur);
            if (!entry) return { total: null, matchs: null };
            let total = 0, matchs = 0;
            selectedMatches.forEach(m => {
                const v = entry[m];
                if (v !== undefined) { total += v; matchs++; }
            });
            return { total, matchs };
        }

        function getSelectedMatch() {
            return (document.getElementById('filter-match-global') || {}).value || '';
        }

        function getSelectedMatches() {
            const val = getSelectedMatch();
            return val ? [val] : MATCHS.slice();
        }

        function lastNonEmpty(arr, idx) {
            for (let i = idx; i >= 0; i--) {
                const v = (arr[i] || '').trim();
                if (v) return v;
            }
            return '';
        }

        function matchResultColor(m) {
            const fenix = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] === 'FENIX' && r[COLS.resultat] === 'But').length;
            const adv   = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] !== 'FENIX' && r[COLS.resultat] === 'But').length;
            if (fenix > adv) return 'var(--fenix-success)';
            if (fenix < adv) return 'var(--fenix-danger)';
            return 'var(--fenix-dark)';
        }

        function effColor(posteCode, eff, total) {
            if (total === 0) return '#94A3B8';
            return getEffColor(eff, posteCode);
        }

        function _matchPlayerNameCore(excelName, terrainName) {
            const en = excelName.toLowerCase().trim();
            const tn = terrainName.toLowerCase().trim();
            if (en === tn) return true;
            // Excel name is an exact known player → require exact match, no prefix
            if (JOUEURS_TERRAIN.some(p => p.nom.toLowerCase().trim() === en)) return false;
            // Excel longer than terrain : "Jules Fernandez" matches terrain "Jules F"
            // Direction inverse (terrain plus long qu'Excel) supprimée : trop ambiguë avec homonymes
            if (en.startsWith(tn + ' ')) return true;
            // Format "Prénom.Initiale" (saison 2026-2027, ex: "Lucas.G") : comparer sur le prénom (avant le point),
            // avec tolérance de préfixe pour les surnoms saisis différemment entre feuilles (ex: "Zach" / "Zacharie")
            const enPrenom = en.split('.')[0];
            const tnPrenom = tn.split('.')[0];
            if (enPrenom.length >= 3 && tnPrenom.length >= 3 &&
                (enPrenom === tnPrenom || enPrenom.startsWith(tnPrenom) || tnPrenom.startsWith(enPrenom))) return true;
            return false;
        }
        // Cache : same (excelName, terrainName) pairs called thousands of times per player selection
        const _mpnCache = new Map();
        function matchPlayerName(excelName, terrainName) {
            const k = excelName + '\x01' + terrainName;
            let r = _mpnCache.get(k);
            if (r === undefined) { r = _matchPlayerNameCore(excelName, terrainName); _mpnCache.set(k, r); }
            return r;
        }
        function clearMatchPlayerNameCache() { _mpnCache.clear(); }

        function detectIsGB(nom) {
            // 1. Depuis la feuille Joueurs (si chargée)
            if (typeof JOUEURS_TERRAIN !== 'undefined' && JOUEURS_TERRAIN.length) {
                const tp = JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom));
                if (tp) return tp.poste === 'GB';
            }
            // 2. Fallback auto : si le joueur apparaît comme gardien dans les lignes adverses
            const asGardien = DATA.filter(r =>
                r[COLS.club] !== 'FENIX' &&
                matchPlayerName((r[COLS.gardien]||'').toString().trim(), nom) &&
                (r[COLS.resultat] === 'But' || r[COLS.finalite] === 'Tir arrêté')
            ).length;
            const asJoueur = DATA.filter(r =>
                r[COLS.club] === 'FENIX' &&
                matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom) &&
                ['But','Tir raté'].includes(r[COLS.resultat])
            ).length;
            return asGardien >= 5 && asGardien >= asJoueur;
        }

        function checkDuplicateNames() {
            const seen = {};
            const dupes = [];
            JOUEURS_TERRAIN.forEach(p => {
                const key = p.nom.toLowerCase().trim();
                if (seen[key]) dupes.push(p.nom);
                seen[key] = true;
            });
            return dupes;
        }

        function getPlayersInData() {
            const matchFilter = document.getElementById('filter-joueur-match')?.value || '';
            const rows = DATA.filter(row => {
                if (row[COLS.club] !== 'FENIX') return false;
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return false;
                return true;
            });
            return new Set(rows.map(r => (r[COLS.joueur] || '').toString().trim()).filter(Boolean));
        }

        // ── Référence unique des groupes d'actions (source of truth) ────────────
        const NOTE_GROUPS = {
            attPlus: [
                { label: 'But (But DG)',          main: ['But', 'But DG'],               sub: 'But DG'  },
                { label: 'PD (PD DG)',            main: ['PD', 'PD DG'],                 sub: 'PD DG'   },
                { label: 'PO',                    main: ['PO'],                           sub: null       },
                { label: "2' Obt",                main: ["2' Obt"],                       sub: null       },
                { label: 'Duel gagné att',        main: ['Duel gagné att'],               sub: null       },
                { label: 'Bon choix',             main: ['Bon choix'],                    sub: null       },
                { label: 'Bloc',                  main: ['Bloc'],                         sub: null       },
                { label: 'Glissement',            main: ['Glissement'],                   sub: null       },
                { label: 'Écran',                 main: ['Écran'],                        sub: null       },
            ],
            attMoins: [
                { label: 'Tir raté',              main: ['Tir raté'],                     sub: null       },
                { label: 'PB (PF)',               main: ['PB', 'PF'],                    sub: 'PF'       },
                { label: 'Neutralisé',            main: ['Neutralisé'],                   sub: null       },
                { label: 'Mauvais choix',         main: ['Mauvais choix'],                sub: null       },
                { label: 'Bloc -',                main: ['Bloc -'],                       sub: null       },
            ],
            defPlus: [
                { label: 'Duel gagné déf',        main: ['Duel gagné déf'],               sub: null       },
                { label: 'Toucher +',             main: ['Toucher +'],                    sub: null       },
                { label: 'Récup/Intercep/Dissua', main: ['Récup', 'Intercep', 'Dissua'], sub: null       },
                { label: 'Entraide +',            main: ['Entraide +'],                   sub: null       },
                { label: 'Contournement pivot +', main: ['Contournement pivot +'],        sub: null       },
                { label: 'Impair +',              main: ['Impair +'],                     sub: null       },
                { label: 'Contre +',              main: ['Contre +'],                     sub: null       },
            ],
            defMoins: [
                { label: 'Duel perdu (2 min)',    main: ['Duel perdu', '2 min'],          sub: '2 min'   },
                { label: 'Toucher -',             main: ['Toucher -'],                    sub: null       },
                { label: 'Hs/Répart/Changmt',     main: ['Hs/Répart/Changmt'],            sub: null       },
                { label: 'Entraide -',            main: ['Entraide -'],                   sub: null       },
                { label: 'Contournement pivot -', main: ['Contournement pivot -'],        sub: null       },
                { label: 'Sortie de bloc -',      main: ['Sortie de bloc -'],             sub: null       },
                { label: 'Impair -',              main: ['Impair -'],                     sub: null       },
                { label: 'Contre -',              main: ['Contre -'],                     sub: null       },
                { label: 'Inactif (Replis -)',    main: ['Inactif', 'replis -'],          sub: 'replis -' },
            ],
        };

        // Libellé de famille sans le détail entre parenthèses (ex: "But (But DG)" → "But") —
        // utilisé partout où le total affiché est celui de la famille combinée, pas du détail seul.
        function noteGroupBaseLabel(label) {
            return label.replace(/\s*\([^)]*\)\s*$/, '');
        }

        // Dérivés automatiquement — ne jamais modifier directement
        var ACTIONS_ATT_PLUS  = NOTE_GROUPS.attPlus.flatMap(g => g.main);
        var ACTIONS_ATT_MOINS = NOTE_GROUPS.attMoins.flatMap(g => g.main);
        var ACTIONS_DEF_PLUS  = NOTE_GROUPS.defPlus.flatMap(g => g.main);
        var ACTIONS_DEF_MOINS = NOTE_GROUPS.defMoins.flatMap(g => g.main);

        // Combine filtre match + filtre bilan en un seul filtre CSV pour calculatePlayerNotes / calculateGardienNotes
        function buildEffectiveMatchFilter(matchFilter, bilanMatchs) {
            if (!bilanMatchs) return matchFilter || '';
            if (matchFilter) return bilanMatchs.includes(matchFilter) ? matchFilter : '__none__';
            return bilanMatchs.join(',');
        }

        function isPositiveATT(action) {
            return ACTIONS_ATT_PLUS.includes(action);
        }

        function isNegativeATT(action) {
            return ACTIONS_ATT_MOINS.includes(action);
        }

        function isPositiveDEF(action) {
            return ACTIONS_DEF_PLUS.includes(action);
        }

        function isNegativeDEF(action) {
            return ACTIONS_DEF_MOINS.includes(action);
        }

        // ── Fonctions partagées timeline (utilisées par page-analyse.js ET player-mode.js) ──
        function parseTimecode(tc) {
            if (!tc) return 0;
            const s = tc.toString().trim();
            const parts = s.split(':');
            if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            return parseFloat(s) || 0;
        }

        function getPeriodeNum(row) {
            const p = (row[COLS.periode] || '').toString().trim();
            if (/^2/.test(p)) return 2;
            return 1;
        }

        function getSortedGoals(matchData) {
            const goals = matchData.filter(r => r[COLS.resultat] === 'But');
            const g1 = goals.filter(r => getPeriodeNum(r) === 1);
            const g2 = goals.filter(r => getPeriodeNum(r) === 2);
            const max1 = g1.length ? Math.max(...g1.map(r => parseTimecode(r[COLS.position]))) : 0;
            const min2 = g2.length ? Math.min(...g2.map(r => parseTimecode(r[COLS.position]))) : Infinity;
            const offset = (g2.length > 0 && min2 < max1) ? max1 : 0;
            return [
                ...g1.map(r => ({ row: r, pos: parseTimecode(r[COLS.position]) })),
                ...g2.map(r => ({ row: r, pos: parseTimecode(r[COLS.position]) + offset }))
            ].sort((a, b) => a.pos - b.pos);
        }
