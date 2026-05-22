        function getEffColor(pct, poste) {
            if (pct === null) return '#94a3b8';
            const s = EFF_SEUILS[poste] || { hi: 55, mid: 38 };
            return pct >= s.hi ? '#16a34a' : pct >= s.mid ? '#2563eb' : '#dc2626';
        }

        function getMatchPageSelected() {
            return [...document.querySelectorAll('.match-page-checkbox:checked')].map(cb => cb.value);
        }

        function getTJData(joueur, selectedMatches) {
            const entry = TEMPS_JEU[joueur.toLowerCase()];
            if (!entry) return { total: null, matchs: null };
            let total = 0, matchs = 0;
            selectedMatches.forEach(m => {
                const jnum = (m.match(/^(J\d+)/i) || [])[1];
                if (!jnum) return;
                const v = entry[jnum];
                if (v !== undefined) { total += v; matchs++; }
            });
            return { total, matchs };
        }

        function getSelectedMatches() {
            const checkboxes = document.querySelectorAll('.match-checkbox');
            return [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);
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

        function matchPlayerName(excelName, terrainName) {
            const en = excelName.toLowerCase().trim();
            const tn = terrainName.toLowerCase().trim();
            if (en === tn) return true;
            // Excel name is an exact known player → require exact match
            if (JOUEURS_TERRAIN.some(p => p.nom.toLowerCase().trim() === en)) return false;
            // Excel longer than terrain (e.g. Excel="Jules Ferrer", terrain="Jules F")
            if (en.startsWith(tn + ' ')) return true;
            // Terrain longer than Excel: only if terrain name is NOT itself an exact known player
            // (prevents "Jules" matching "Jules F" when "Jules F" is a distinct player)
            if (tn.startsWith(en + ' ') && !JOUEURS_TERRAIN.some(p => p.nom.toLowerCase().trim() === tn)) return true;
            return false;
        }

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
            return asGardien > 0 && asGardien >= asJoueur;
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

        var ACTIONS_ATT_PLUS  = ['But', 'But DG', 'PD', 'PD DG', 'PO', "2' Obt", 'Duel gagné att', 'Bon choix', 'Bloc', 'Glissement', 'Écran'];
        var ACTIONS_ATT_MOINS = ['Tir raté', 'PB', 'PF', 'Neutralisé', 'Mauvais choix', 'Bloc -'];
        var ACTIONS_DEF_PLUS  = ['Duel gagné déf', 'Contre +', 'Récup', 'Intercep', 'Dissua', 'Entraide +', 'Impair +', 'Contournement pivot +'];
        var ACTIONS_DEF_MOINS = ['Duel perdu', '2 min', 'Entraide -', 'Impair -', 'Sortie de bloc -', 'Contre -', 'Inactif', 'Hs/Répart/Changmt', 'Toucher -', 'Contournement pivot -', 'replis -'];

        function isPositiveATT(action) {
            return ACTIONS_ATT_PLUS.some(a => action.includes(a));
        }

        function isNegativeATT(action) {
            return ACTIONS_ATT_MOINS.some(a => action.includes(a));
        }

        function isPositiveDEF(action) {
            return ACTIONS_DEF_PLUS.some(a => action.includes(a));
        }

        function isNegativeDEF(action) {
            return ACTIONS_DEF_MOINS.some(a => action.includes(a));
        }
