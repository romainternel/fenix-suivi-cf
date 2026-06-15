        // NOTE_GROUPS défini dans utils.js (chargé en premier)

        function openNotesDetail(joueur, filter = 'all') {
            const matchFilter = document.getElementById('filter-note-match')?.value || '';
            const bilanVal = document.getElementById('filter-notes-bilan')?.value || '';
            const bilanMatchs = bilanVal && typeof BILANS !== 'undefined'
                ? (BILANS.find(b => b.nom === bilanVal)?.matchs || null) : null;
            const counts = {};
            const matchSet = new Set();

            DATA.forEach(row => {
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                const joueurs = (row[COLS.action_joueur] || '').toString().split(';');
                const atts    = (row[COLS.action_att]    || '').toString().split(';');
                const defs    = (row[COLS.action_def]    || '').toString().split(';');
                joueurs.forEach((j, idx) => {
                    if (!matchPlayerName(j.trim(), joueur)) return;
                    if (row[COLS.rencontre]) matchSet.add(row[COLS.rencontre]);
                    const att = lastNonEmpty(atts, idx);
                    const def = lastNonEmpty(defs, idx);
                    if (att) counts[att] = (counts[att] || 0) + 1;
                    if (def) counts[def] = (counts[def] || 0) + 1;
                });
            });

            const nb = matchSet.size || 1;
            const gc = g => {
                const total = g.main.reduce((s,a) => s + (counts[a] || 0), 0);
                return { total, sub: g.sub ? (counts[g.sub] || 0) : null };
            };
            const sign = v => (v > 0 ? '+' : '') + v;
            const nc   = v => v > 0 ? 'var(--fenix-success)' : v < 0 ? 'var(--fenix-danger)' : '#64748B';

            const buildTable = (groups, colorVar) => groups.map(g => {
                const { total, sub } = gc(g);
                const cTxt = sub !== null
                    ? `${total} <span style="color:#94A3B8;font-size:0.82em">(${sub})</span>`
                    : (total || '-');
                const avg  = total > 0 ? (total / nb).toFixed(1) : '-';
                return `<tr class="${total === 0 ? 'nd-zero' : ''}">
                    <td class="nd-action">${g.label}</td>
                    <td class="nd-count" style="color:${total > 0 ? colorVar : '#CBD5E1'}">${cTxt}</td>
                    <td class="nd-avg">${avg}</td>
                </tr>`;
            }).join('');

            const ap = NOTE_GROUPS.attPlus.reduce((s,g)=>s+gc(g).total,0);
            const am = NOTE_GROUPS.attMoins.reduce((s,g)=>s+gc(g).total,0);
            const dp = NOTE_GROUPS.defPlus.reduce((s,g)=>s+gc(g).total,0);
            const dm = NOTE_GROUPS.defMoins.reduce((s,g)=>s+gc(g).total,0);
            const nA = ap - am, nD = dp - dm, nT = nA + nD;

            const tb = (label, val, color, avg, highlight) =>
                `<div class="nd-total-block${highlight ? ' nd-total-main' : ''}">
                    <span class="nd-total-label">${label}</span>
                    <span class="nd-total-val" style="color:${color}">${val}</span>
                    ${avg !== null ? `<span class="nd-total-avg">${avg}/match</span>` : ''}
                </div>`;

            const thead = `<thead><tr><th></th><th class="nd-th-count">Total</th><th class="nd-th-avg">/Match</th></tr></thead>`;
            const qd = (header, groups, colorVar, cls) =>
                `<div class="nd-quadrant">
                    <div class="nd-q-header ${cls}">${header}</div>
                    <div class="nd-q-body"><table class="nd-table">${thead}<tbody>${buildTable(groups, colorVar)}</tbody></table></div>
                </div>`;

            const showAP = ['all','att','attPlus'].includes(filter);
            const showAM = ['all','att','attMoins'].includes(filter);
            const showDP = ['all','def','defPlus'].includes(filter);
            const showDM = ['all','def','defMoins'].includes(filter);
            const visCount = [showAP,showAM,showDP,showDM].filter(Boolean).length;
            const cols = visCount === 1 ? '1fr' : '1fr 1fr';

            let quads = '';
            if (showAP) quads += qd('ATTAQUE +', NOTE_GROUPS.attPlus, 'var(--fenix-success)', 'nd-positive');
            if (showDP) quads += qd('DÉFENSE +', NOTE_GROUPS.defPlus, 'var(--fenix-success)', 'nd-positive');
            if (showAM) quads += qd('ATTAQUE −', NOTE_GROUPS.attMoins, 'var(--fenix-danger)', 'nd-negative');
            if (showDM) quads += qd('DÉFENSE −', NOTE_GROUPS.defMoins, 'var(--fenix-danger)', 'nd-negative');

            let totals = '';
            const matchBlock = tb('Matchs joués', matchSet.size, 'var(--fenix-blue)', null, false);
            if (filter === 'attPlus')  totals = tb('Actions ATT +', ap, 'var(--fenix-success)', (ap/nb).toFixed(1), true) + matchBlock;
            else if (filter === 'attMoins') totals = tb('Actions ATT −', am, 'var(--fenix-danger)', (am/nb).toFixed(1), true) + matchBlock;
            else if (filter === 'att')  totals = tb('ATT +', ap, 'var(--fenix-success)', (ap/nb).toFixed(1), false) + tb('ATT −', am, 'var(--fenix-danger)', (am/nb).toFixed(1), false) + tb('Total ATT', sign(nA), nc(nA), (nA/nb).toFixed(1), true) + matchBlock;
            else if (filter === 'defPlus')  totals = tb('Actions DEF +', dp, 'var(--fenix-success)', (dp/nb).toFixed(1), true) + matchBlock;
            else if (filter === 'defMoins') totals = tb('Actions DEF −', dm, 'var(--fenix-danger)', (dm/nb).toFixed(1), true) + matchBlock;
            else if (filter === 'def')  totals = tb('DEF +', dp, 'var(--fenix-success)', (dp/nb).toFixed(1), false) + tb('DEF −', dm, 'var(--fenix-danger)', (dm/nb).toFixed(1), false) + tb('Total DEF', sign(nD), nc(nD), (nD/nb).toFixed(1), true) + matchBlock;
            else totals = tb('Total ATT', sign(nA), nc(nA), (nA/nb).toFixed(1), false) + tb('Total DEF', sign(nD), nc(nD), (nD/nb).toFixed(1), false) + tb('Total Joueur', sign(nT), nc(nT), (nT/nb).toFixed(1), true) + matchBlock;

            const titles = { all:'Détail Notes', attPlus:'Actions ATT +', attMoins:'Actions ATT −', att:'Total ATT', defPlus:'Actions DEF +', defMoins:'Actions DEF −', def:'Total DEF' };

            document.getElementById('nd-title').textContent = `${titles[filter] || 'Détail Notes'} — ${joueur}`;
            document.getElementById('nd-graph-btn').onclick = () => { closeNotesDetail(); goToNoteGraph(joueur); };
            document.getElementById('nd-body').innerHTML = `
                <div class="nd-grid" style="grid-template-columns:${cols}">${quads}</div>
                <div class="nd-totals">${totals}</div>`;
            const modal = document.getElementById('notes-detail-modal');
            modal.classList.remove('nd-view-1', 'nd-view-2');
            if (visCount === 1) modal.classList.add('nd-view-1');
            else if (visCount === 2) modal.classList.add('nd-view-2');
            modal.style.display = 'flex';
        }

        function closeNotesDetail() {
            document.getElementById('notes-detail-modal').style.display = 'none';
        }

        // ACTIONS_ATT_PLUS / MOINS / DEF_PLUS / MOINS sont définis dans utils.js (chargé en premier)

        const GB_ZONE_WEIGHTS = {
            '6m central G':  { diff: 'Très difficile', arret: 3, but: -1 },
            '6m central D':  { diff: 'Très difficile', arret: 3, but: -1 },
            '7m':            { diff: 'Difficile',       arret: 3, but: -1 },
            '6m ext G':      { diff: 'Difficile',       arret: 2, but: -1 },
            '6m ext D':      { diff: 'Difficile',       arret: 2, but: -1 },
            '6m ail G':      { diff: 'Moyen',           arret: 2, but: -1 },
            '6m ail D':      { diff: 'Moyen',           arret: 2, but: -1 },
            '6-9 central G': { diff: 'Moyen',           arret: 2, but: -1 },
            '6-9 central D': { diff: 'Moyen',           arret: 2, but: -1 },
            '6-9 ext G':     { diff: 'Facile',          arret: 1, but: -1 },
            '6-9 ext D':     { diff: 'Facile',          arret: 1, but: -1 },
            '9m Int G':      { diff: 'Facile',          arret: 1, but: -1 },
            '9m Int D':      { diff: 'Facile',          arret: 1, but: -1 },
            '9m ext G':      { diff: 'Très facile',     arret: 1, but: -1 },
            '9m ext D':      { diff: 'Très facile',     arret: 1, but: -1 },
            'But à but':     { diff: null,              arret: 0, but:  0 },
        };

        function calculatePlayerNotes(matchFilter, joueurFilter) {
            const playerNotes = {};
            // matchFilter peut être une liste séparée par des virgules ou vide
            const selectedMatchesList = matchFilter ? matchFilter.split(',') : [];
            
            DATA.forEach(row => {
                // Si matchFilter est défini, vérifier si le match est dans la liste
                if (selectedMatchesList.length > 0 && !selectedMatchesList.includes(row[COLS.rencontre])) return;
                
                const actionJoueurs = (row[COLS.action_joueur] || '').toString().split(';');
                const actionsAtt = (row[COLS.action_att] || '').toString().split(';');
                const actionsDef = (row[COLS.action_def] || '').toString().split(';');
                
                actionJoueurs.forEach((joueur, idx) => {
                    joueur = joueur.trim();
                    if (!joueur) return;
                    if (joueurFilter && !matchPlayerName(joueur, joueurFilter)) return;
                    // Exclure les gardiens — leur score est calculé via calculateGardienNotes
                    if (!joueurFilter && typeof GARDIENS_FENIX !== 'undefined' && GARDIENS_FENIX.length &&
                        GARDIENS_FENIX.some(g => matchPlayerName(g, joueur))) return;
                    
                    if (!playerNotes[joueur]) {
                        playerNotes[joueur] = { attPlus: 0, attMoins: 0, defPlus: 0, defMoins: 0 };
                    }
                    
                    const actionAtt = lastNonEmpty(actionsAtt, idx);
                    const actionDef = lastNonEmpty(actionsDef, idx);
                    
                    if (actionAtt) {
                        if (isPositiveATT(actionAtt)) playerNotes[joueur].attPlus++;
                        else if (isNegativeATT(actionAtt)) playerNotes[joueur].attMoins++;
                    }
                    
                    if (actionDef) {
                        if (isPositiveDEF(actionDef)) playerNotes[joueur].defPlus++;
                        else if (isNegativeDEF(actionDef)) playerNotes[joueur].defMoins++;
                    }
                });
            });
            
            return playerNotes;
        }

        function renderNotesTable(playerNotes, tbodyId, bilanMatchs) {
            const tbody = document.getElementById(tbodyId);
            tbody.innerHTML = '';
            const bilanArg = bilanMatchs ? `'${bilanMatchs.join(',')}'` : 'null';

            Object.entries(playerNotes)
                .filter(([joueur]) => {
                    if (typeof GARDIENS_FENIX === 'undefined' || !GARDIENS_FENIX.length) return true;
                    return !GARDIENS_FENIX.some(g => matchPlayerName(g, joueur));
                })
                .sort((a, b) => {
                    const totalA = (a[1].attPlus - a[1].attMoins) + (a[1].defPlus - a[1].defMoins);
                    const totalB = (b[1].attPlus - b[1].attMoins) + (b[1].defPlus - b[1].defMoins);
                    return totalB - totalA;
                })
                .forEach(([joueur, notes]) => {
                    const noteAtt = notes.attPlus - notes.attMoins;
                    const noteDef = notes.defPlus - notes.defMoins;
                    const noteTotal = noteAtt + noteDef;

                    const tr = document.createElement('tr');
                    const j = joueur.replace(/'/g, "\\'");
                    tr.innerHTML = `
                        <td><strong class="nd-clickable" onclick="openNotesDetail('${j}')">${joueur}</strong><button class="ng-shortcut" onclick="goToNoteGraph('${j}',${bilanArg})" title="Voir le graphe">📈</button></td>
                        <td class="nd-clickable" style="color:var(--fenix-success)" onclick="openNotesDetail('${j}','attPlus')">+${notes.attPlus}</td>
                        <td class="nd-clickable" style="color:var(--fenix-danger)" onclick="openNotesDetail('${j}','attMoins')">-${notes.attMoins}</td>
                        <td class="nd-clickable" onclick="openNotesDetail('${j}','att')"><strong>${noteAtt >= 0 ? '+' : ''}${noteAtt}</strong></td>
                        <td class="nd-clickable" style="color:var(--fenix-success)" onclick="openNotesDetail('${j}','defPlus')">+${notes.defPlus}</td>
                        <td class="nd-clickable" style="color:var(--fenix-danger)" onclick="openNotesDetail('${j}','defMoins')">-${notes.defMoins}</td>
                        <td class="nd-clickable" onclick="openNotesDetail('${j}','def')"><strong>${noteDef >= 0 ? '+' : ''}${noteDef}</strong></td>
                        <td class="nd-clickable" onclick="openNotesDetail('${j}','all')"><strong style="color:${noteTotal >= 0 ? 'var(--fenix-success)' : 'var(--fenix-danger)'};font-size:1.1em">${noteTotal >= 0 ? '+' : ''}${noteTotal}</strong></td>
                    `;
                    tbody.appendChild(tr);
                });
        }

        let _lastGbNotes = {};

        function calculateGardienNotes(matchFilter) {
            const gbNotes = {};
            const selectedMatchesList = matchFilter ? matchFilter.split(',') : [];

            // Passe 1 : tirs adverses (arrêts + buts encaissés, par zone)
            DATA.forEach(row => {
                if (row[COLS.club] === 'FENIX') return;
                if (selectedMatchesList.length > 0 && !selectedMatchesList.includes(row[COLS.rencontre])) return;

                const gardien = (row[COLS.gardien] || '').toString().trim();
                if (!gardien) return;
                // Si la feuille Joueurs est chargée, ne garder que les vrais GB
                if (GARDIENS_FENIX.length > 0 && !GARDIENS_FENIX.includes(gardien)) return;

                const finalite = (row[COLS.finalite] || '').toString();
                const resultat  = (row[COLS.resultat]  || '').toString();
                const isArret = finalite === 'Tir arrêté';
                const isBut   = resultat === 'But';
                if (!isArret && !isBut) return;

                if (!gbNotes[gardien]) gbNotes[gardien] = { arrets: 0, buts: 0, scoreArrets: 0, scoreButs: 0, bonus: 0, matchSet: new Set(), zones: {} };

                const match = row[COLS.rencontre];
                if (match) gbNotes[gardien].matchSet.add(match);

                const zone = (row[COLS.field_position] || '').toString().trim();
                const w = GB_ZONE_WEIGHTS[zone] || { arret: 1, but: -1 };

                if (!gbNotes[gardien].zones[zone]) gbNotes[gardien].zones[zone] = { arrets: 0, buts: 0 };

                if (isArret) { gbNotes[gardien].arrets++;  gbNotes[gardien].scoreArrets += w.arret; gbNotes[gardien].zones[zone].arrets++; }
                if (isBut)   { gbNotes[gardien].buts++;    gbNotes[gardien].scoreButs   += w.but;   gbNotes[gardien].zones[zone].buts++;   }
            });

            // Passe 2 : actions offensives du GB (But +1, PB -1 dans action_att)
            // Initialiser les GB sans tirs adverses pour ne pas perdre leur bonus offensif
            GARDIENS_FENIX.forEach(g => {
                if (!gbNotes[g]) gbNotes[g] = { arrets: 0, buts: 0, scoreArrets: 0, scoreButs: 0, bonus: 0, matchSet: new Set(), zones: {} };
            });
            DATA.forEach(row => {
                if (selectedMatchesList.length > 0 && !selectedMatchesList.includes(row[COLS.rencontre])) return;
                const joueurs = (row[COLS.action_joueur] || '').toString().split(';');
                const atts    = (row[COLS.action_att]    || '').toString().split(';');
                joueurs.forEach((j, idx) => {
                    const nom = j.trim();
                    if (!nom || !gbNotes[nom]) return;
                    const att = lastNonEmpty(atts, idx);
                    if (!att) return;
                    if (att === 'But' || att === 'But DG') gbNotes[nom].bonus += 1;
                    else if (att === 'PB')                 gbNotes[nom].bonus -= 1;
                });
            });

            _lastGbNotes = gbNotes;
            return gbNotes;
        }

        function renderGardienNotesTable(gbNotes, tbodyId) {
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;
            tbody.innerHTML = '';

            const entries = Object.entries(gbNotes);
            if (entries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:1rem">Aucune donnée gardien</td></tr>';
                return;
            }

            const sign = v => (v >= 0 ? '+' : '') + v;

            entries
                .sort((a, b) => (b[1].scoreArrets + b[1].scoreButs + b[1].bonus) - (a[1].scoreArrets + a[1].scoreButs + a[1].bonus))
                .forEach(([gardien, n]) => {
                    const tirsCadres = n.arrets + n.buts;
                    const pct = tirsCadres > 0 ? Math.round(n.arrets / tirsCadres * 100) : 0;
                    const scoreTotal = n.scoreArrets + n.scoreButs + n.bonus;
                    const nbMatchs = n.matchSet.size || 1;
                    const parMatch = (scoreTotal / nbMatchs).toFixed(1);
                    const bonusStr = n.bonus !== 0 ? ` <span style="font-size:0.75em;color:#94a3b8">(actions ${n.bonus > 0 ? '+' : ''}${n.bonus})</span>` : '';

                    const tjData = (typeof getTJData === 'function') ? getTJData(gardien, [...n.matchSet]) : { total: null, matchs: null };
                    const tjTotal = tjData.total !== null ? `${tjData.total} min` : '—';
                    const tjMoy   = (tjData.total !== null && tjData.matchs > 0) ? `${Math.round(tjData.total / tjData.matchs)} min` : '—';

                    const g = gardien.replace(/'/g, "\\'");
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${gardien}</strong><button class="ng-shortcut" onclick="goToGbGraph('${g}')" title="Voir le graphe">📈</button><button class="ng-shortcut" onclick="openGbZoneModal('${g}')" title="Voir par zone">📍</button></td>
                        <td style="color:var(--fenix-success);font-weight:600">${n.arrets}</td>
                        <td style="color:var(--fenix-danger);font-weight:600">${n.buts}</td>
                        <td>${pct}%</td>
                        <td style="color:var(--fenix-success)">${sign(n.scoreArrets)}</td>
                        <td style="color:var(--fenix-danger)">${sign(n.scoreButs)}</td>
                        <td><strong style="color:${scoreTotal >= 0 ? 'var(--fenix-success)' : 'var(--fenix-danger)'};font-size:1.1em">${sign(scoreTotal)}</strong>${bonusStr}</td>
                        <td style="color:#64748b">${parseFloat(parMatch) >= 0 ? '+' : ''}${parMatch}</td>
                        <td style="color:#64748b">${tjTotal}</td>
                        <td style="color:#94a3b8">${tjMoy}</td>
                    `;
                    tbody.appendChild(tr);
                });
        }

        let noteGraphChart = null;
        let _ngFromDetail = null;

        function goToNoteGraph(joueur, bilanCsv) {
            _ngFromDetail = joueur;
            // bilanCsv peut être une chaîne CSV de matchs ou null
            if (typeof _ngBilanMatches !== 'undefined')
                _ngBilanMatches = bilanCsv ? bilanCsv.split(',') : null;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-notegraph').classList.add('active');
            document.getElementById('ng-joueur').value = joueur;
            updateNoteGraph();
        }

        function ngGoBack() {
            const joueur = _ngFromDetail;
            _ngFromDetail = null;
            if (joueur) {
                // came from Notes detail → back to Notes
                switchJoueursTab('notes');
                if (typeof openNotesDetail === 'function') openNotesDetail(joueur);
            } else {
                // came from Joueurs contextual button → back to Fiche
                switchJoueursTab('joueurs');
            }
        }

        function _updateNgEmptyState() {
            const hasJoueur  = !!(document.getElementById('ng-joueur')?.value);
            const hasGardien = !!(document.getElementById('gbg-gardien')?.value);
            const empty = document.getElementById('ng-empty-state');
            if (empty) empty.style.display = (hasJoueur || hasGardien) ? 'none' : 'flex';
        }

        function updateNoteGraph() {
            const joueur = document.getElementById('ng-joueur').value;
            if (noteGraphChart) { noteGraphChart.destroy(); noteGraphChart = null; }
            const sec = document.getElementById('ng-section-joueur');
            if (sec) sec.style.display = joueur && DATA.length > 0 ? 'block' : 'none';
            _updateNgEmptyState();
            if (!joueur || DATA.length === 0) return;

            const matchData = {};
            const _ngBilan = (typeof _ngBilanMatches !== 'undefined' && _ngBilanMatches) ? _ngBilanMatches : null;
            const matchsToUse = _ngBilan || MATCHS;
            matchsToUse.forEach(m => matchData[m] = { ap: 0, am: 0, dp: 0, dm: 0 });
            DATA.forEach(row => {
                const m = row[COLS.rencontre];
                if (!matchData[m]) return;
                const joueurs = (row[COLS.action_joueur] || '').toString().split(';');
                const atts    = (row[COLS.action_att]    || '').toString().split(';');
                const defs    = (row[COLS.action_def]    || '').toString().split(';');
                joueurs.forEach((j, idx) => {
                    if (!matchPlayerName(j.trim(), joueur)) return;
                    const att = lastNonEmpty(atts, idx);
                    const def = lastNonEmpty(defs, idx);
                    if (isPositiveATT(att)) matchData[m].ap++;
                    if (isNegativeATT(att)) matchData[m].am++;
                    if (isPositiveDEF(def)) matchData[m].dp++;
                    if (isNegativeDEF(def)) matchData[m].dm++;
                });
            });

            const played = matchsToUse.filter(m => {
                const d = matchData[m];
                return d.ap + d.am + d.dp + d.dm > 0;
            });
            if (played.length === 0) return;

            const noteATT = played.map(m => matchData[m].ap - matchData[m].am);
            const noteDEF = played.map(m => matchData[m].dp - matchData[m].dm);
            const total   = played.map((_, i) => noteATT[i] + noteDEF[i]);

            // Deuxième joueur pour comparaison
            const joueur2 = document.getElementById('ng-joueur-2')?.value || '';
            let total2 = null;
            if (joueur2) {
                const md2 = {};
                matchsToUse.forEach(m => md2[m] = { ap: 0, am: 0, dp: 0, dm: 0 });
                DATA.forEach(row => {
                    const m = row[COLS.rencontre]; if (!md2[m]) return;
                    const js = (row[COLS.action_joueur] || '').toString().split(';');
                    const as = (row[COLS.action_att]    || '').toString().split(';');
                    const ds = (row[COLS.action_def]    || '').toString().split(';');
                    js.forEach((j, idx) => {
                        if (!matchPlayerName(j.trim(), joueur2)) return;
                        const att = lastNonEmpty(as, idx); const def = lastNonEmpty(ds, idx);
                        if (isPositiveATT(att)) md2[m].ap++; if (isNegativeATT(att)) md2[m].am++;
                        if (isPositiveDEF(def)) md2[m].dp++; if (isNegativeDEF(def)) md2[m].dm++;
                    });
                });
                total2 = played.map(m => { const d = md2[m] || {}; return (d.ap-d.am||0) + (d.dp-d.dm||0); });
            }

            // Médiane
            const sorted = [...total].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

            // Tendance (régression linéaire)
            const n = total.length;
            const xMean = (n - 1) / 2;
            const yMean = total.reduce((s, v) => s + v, 0) / n;
            let num = 0, den = 0;
            total.forEach((v, i) => { num += (i - xMean) * (v - yMean); den += (i - xMean) ** 2; });
            const slope = den === 0 ? 0 : num / den;
            const intercept = yMean - slope * xMean;
            const trend = played.map((_, i) => +(slope * i + intercept).toFixed(2));

            const ctx = document.getElementById('ng-canvas').getContext('2d');
            noteGraphChart = new Chart(ctx, {
                data: {
                    labels: played,
                    datasets: [
                        {
                            type: 'bar', label: 'NOTE ATT', data: noteATT,
                            backgroundColor: 'rgba(20,184,166,0.75)', borderColor: '#14B8A6', borderWidth: 1, order: 4,
                        },
                        {
                            type: 'bar', label: 'NOTE DEF', data: noteDEF,
                            backgroundColor: 'rgba(245,158,11,0.75)', borderColor: '#F59E0B', borderWidth: 1, order: 5,
                        },
                        {
                            type: 'line', label: `TOTAL ${joueur}`, data: total,
                            borderColor: '#1E3A5F', backgroundColor: '#1E3A5F',
                            borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#1E3A5F',
                            tension: 0.3, order: 1,
                        },
                        ...(total2 ? [{
                            type: 'line', label: `TOTAL ${joueur2}`, data: total2,
                            borderColor: '#E11D48', backgroundColor: '#E11D48',
                            borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#E11D48',
                            borderDash: [5, 3], tension: 0.3, order: 0,
                        }] : []),
                        {
                            type: 'line', label: 'Médiane TOTAL', data: played.map(() => median),
                            borderColor: '#94A3B8', borderWidth: 1.5, borderDash: [6, 4],
                            pointRadius: 0, tension: 0, order: 2,
                        },
                        {
                            type: 'line', label: 'Tendance', data: trend,
                            borderColor: '#60A5FA', borderWidth: 1.5, borderDash: [3, 3],
                            pointRadius: 0, tension: 0, order: 3,
                        },
                        {
                            type: 'line', label: '__zero__', data: played.map(() => 0),
                            borderColor: '#1E3A5F', borderWidth: 1, borderDash: [],
                            pointRadius: 0, tension: 0, order: 6,
                        },
                    ],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { right: 36 } },
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        title: {
                            display: true,
                            text: joueur2 ? `Notes par rencontre — ${joueur}  vs  ${joueur2}` : `Notes par rencontre — ${joueur}`,
                            font: { size: 18, weight: 'bold', family: 'Bebas Neue' },
                            color: '#1E3A5F', padding: { bottom: 14 },
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 13 }, padding: 18, usePointStyle: true,
                                filter: item => item.text !== '__zero__',
                            },
                        },
                        tooltip: { filter: item => item.dataset.label !== '__zero__' },
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: { size: 12, weight: '700' },
                                maxRotation: 45,
                                color: ctx => {
                                    const m = played[ctx.index];
                                    if (!m) return '#334155';
                                    const fenix = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] === 'FENIX' && r[COLS.resultat] === 'But').length;
                                    const adv   = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] !== 'FENIX' && r[COLS.resultat] === 'But').length;
                                    if (fenix > adv) return '#16A34A';
                                    if (fenix < adv) return '#DC2626';
                                    return '#1E293B';
                                },
                            },
                            grid: { display: false },
                        },
                        y: {
                            title: { display: true, text: 'Note', font: { size: 13 } },
                            grid: { color: '#F1F5F9' },
                            ticks: { font: { size: 12 } },
                            afterDataLimits(scale) { scale.max += 2; scale.min -= 2; },
                        },
                    },
                },
                plugins: [{
                    id: 'medianLabel',
                    afterDraw(chart) {
                        const { ctx: dc, chartArea, scales } = chart;
                        if (!scales.y) return;
                        const yPx = scales.y.getPixelForValue(median);
                        dc.save();
                        dc.font = 'bold 13px Inter, sans-serif';
                        dc.fillStyle = '#1E3A5F';
                        dc.textAlign = 'left';
                        dc.fillText(median % 1 === 0 ? String(median) : median.toFixed(1), chartArea.right + 4, yPx + 4);
                        dc.restore();
                    }
                }]
            });
        }

        function openGbZoneModal(gardien) {
            let n = _lastGbNotes[gardien];
            if (!n) {
                const fresh = calculateGardienNotes('');
                n = fresh[gardien];
                if (!n) return;
            }

            document.getElementById('gb-zone-modal-title').textContent = `📍 Zones — ${gardien}`;

            const DIFF_ORDER = ['Très difficile', 'Difficile', 'Moyen', 'Facile', 'Très facile', null];
            const DIFF_COLOR = {
                'Très difficile': '#FEE2E2',
                'Difficile':      '#FFEDD5',
                'Moyen':          '#FEF3C7',
                'Facile':         '#D1FAE5',
                'Très facile':    '#F1F5F9',
            };

            // Agréger toutes les zones connues + les zones présentes dans les données
            const allZones = Object.keys(GB_ZONE_WEIGHTS).filter(z => GB_ZONE_WEIGHTS[z].diff !== null || n.zones[z]);
            const allZonesWithData = [...new Set([...allZones, ...Object.keys(n.zones)])];

            allZonesWithData.sort((a, b) => {
                const da = GB_ZONE_WEIGHTS[a] ? DIFF_ORDER.indexOf(GB_ZONE_WEIGHTS[a].diff) : 99;
                const db = GB_ZONE_WEIGHTS[b] ? DIFF_ORDER.indexOf(GB_ZONE_WEIGHTS[b].diff) : 99;
                return da - db;
            });

            const tbody = document.getElementById('gb-zone-tbody');
            tbody.innerHTML = '';

            allZonesWithData.forEach(zone => {
                const zd = n.zones[zone] || { arrets: 0, buts: 0 };
                if (zd.arrets === 0 && zd.buts === 0) return;
                const w = GB_ZONE_WEIGHTS[zone] || {};
                const tirs = zd.arrets + zd.buts;
                const pct = tirs > 0 ? Math.round(zd.arrets / tirs * 100) : 0;
                const diff = w.diff || '—';
                const bg = DIFF_COLOR[diff] || '#ffffff';

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #F1F5F9';
                tr.innerHTML = `
                    <td style="padding:0.45rem 0.5rem;font-weight:600">${zone}</td>
                    <td style="padding:0.45rem 0.5rem"><span style="background:${bg};border-radius:4px;padding:0.1rem 0.4rem;font-size:0.78rem">${diff}</span></td>
                    <td style="padding:0.45rem 0.5rem;text-align:center;color:var(--fenix-success);font-weight:600">${zd.arrets}</td>
                    <td style="padding:0.45rem 0.5rem;text-align:center;color:var(--fenix-danger);font-weight:600">${zd.buts}</td>
                    <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748b">${tirs}</td>
                    <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:700;color:${pct >= 40 ? 'var(--fenix-success)' : 'var(--fenix-danger)'}">${pct}%</td>
                `;
                tbody.appendChild(tr);
            });

            document.getElementById('gb-zone-modal').style.display = 'flex';
        }

        function closeGbZoneModal() {
            document.getElementById('gb-zone-modal').style.display = 'none';
        }

        let gbGraphChart = null;
        let _gbgFromNotes = null;

        function goToGbGraph(gardien) {
            _gbgFromNotes = gardien;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-notegraph').classList.add('active');
            document.getElementById('gbg-gardien').value = gardien;
            updateGbGraph();
        }

        function updateGbGraph() {
            const gardien = document.getElementById('gbg-gardien').value;
            if (gbGraphChart) { gbGraphChart.destroy(); gbGraphChart = null; }
            const sec = document.getElementById('ng-section-gb');
            if (sec) sec.style.display = gardien && DATA.length > 0 ? 'block' : 'none';
            _updateNgEmptyState();
            if (!gardien || DATA.length === 0) return;

            const matchData = {};
            MATCHS.forEach(m => matchData[m] = { arrets: 0, buts: 0, score: 0 });

            DATA.forEach(row => {
                if (row[COLS.club] === 'FENIX') return;
                if ((row[COLS.gardien] || '').toString().trim() !== gardien) return;
                const m = row[COLS.rencontre];
                if (!matchData[m]) return;

                const finalite = (row[COLS.finalite] || '').toString();
                const resultat  = (row[COLS.resultat]  || '').toString();
                const isArret = finalite === 'Tir arrêté';
                const isBut   = resultat === 'But';
                if (!isArret && !isBut) return;

                const zone = (row[COLS.field_position] || '').toString().trim();
                const w = GB_ZONE_WEIGHTS[zone] || { arret: 1, but: -1 };

                if (isArret) { matchData[m].arrets++; matchData[m].score += w.arret; }
                if (isBut)   { matchData[m].buts++;   matchData[m].score += w.but;   }
            });

            const played = MATCHS.filter(m => matchData[m].arrets + matchData[m].buts > 0);
            if (played.length === 0) return;

            const arrets  = played.map(m => matchData[m].arrets);
            const scores  = played.map(m => matchData[m].score);
            const pcts    = played.map(m => {
                const t = matchData[m].arrets + matchData[m].buts;
                return t > 0 ? Math.round(matchData[m].arrets / t * 100) : 0;
            });
            const tempsJeu = played.map(m => {
                const jnum = (m.match(/^(J\d+)/i) || [])[1];
                if (!jnum) return null;
                const entry = TEMPS_JEU[gardien.toLowerCase()];
                return (entry && entry[jnum] !== undefined) ? entry[jnum] : null;
            });

            // Limites axe gauche (scores peuvent être négatifs)
            const yMin = Math.min(0, ...scores);
            const yMax = Math.max(...arrets, ...scores, 1) + 1;
            // Aligner 0% (axe droit) avec 0 (axe gauche) : y1Min = 100 * yMin / yMax
            const y1Min = yMax > 0 ? Math.floor(100 * yMin / yMax) : 0;

            const tempsPlugin = {
                id: 'gbTempsJeu',
                afterDatasetsDraw(chart) {
                    const meta = chart.getDatasetMeta(0); // dataset Arrêts (index 0)
                    if (!meta || meta.type !== 'bar') return;
                    const { ctx: c } = chart;
                    meta.data.forEach((bar, i) => {
                        const tj = tempsJeu[i];
                        const nb = arrets[i];
                        if (nb === 0) return;
                        c.save();
                        c.font = 'bold 11px Inter, sans-serif';
                        c.fillStyle = '#065f46';
                        c.textAlign = 'center';
                        c.textBaseline = 'bottom';
                        c.fillText(nb + (tj !== null ? ' | ' + tj + "'" : ''), bar.x, bar.y - 3);
                        c.restore();
                    });
                }
            };

            const ctx = document.getElementById('gbg-canvas').getContext('2d');
            gbGraphChart = new Chart(ctx, {
                data: {
                    labels: played,
                    datasets: [
                        {
                            type: 'bar', label: 'Arrêts', data: arrets, yAxisID: 'y',
                            backgroundColor: 'rgba(16,185,129,0.65)', borderColor: '#10B981', borderWidth: 1, order: 3,
                        },
                        {
                            type: 'line', label: 'Score Total', data: scores, yAxisID: 'y',
                            borderColor: '#1E3A5F', backgroundColor: '#1E3A5F',
                            borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#1E3A5F',
                            tension: 0.3, order: 1,
                        },
                        {
                            type: 'line', label: '% Arrêts', data: pcts, yAxisID: 'y1',
                            borderColor: '#0EA5E9', backgroundColor: 'rgba(14,165,233,0.1)',
                            borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#0EA5E9',
                            tension: 0.3, fill: false, order: 2,
                        },
                        {
                            type: 'line', label: '__zero__', data: played.map(() => 0), yAxisID: 'y',
                            borderColor: '#1E3A5F', borderWidth: 1, borderDash: [],
                            pointRadius: 0, tension: 0, order: 6,
                        },
                    ],
                },
                plugins: [tempsPlugin],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        title: {
                            display: true,
                            text: `Performances par rencontre — ${gardien}`,
                            font: { size: 18, weight: 'bold', family: 'Bebas Neue' },
                            color: '#1E3A5F', padding: { bottom: 14 },
                        },
                        legend:  { position: 'bottom', labels: { font: { size: 13 }, padding: 18, usePointStyle: true, filter: item => item.text !== '__zero__' } },
                        tooltip: { filter: item => item.dataset.label !== '__zero__' },
                    },
                    scales: {
                        x: { ticks: { font: { size: 12, weight: '700' }, maxRotation: 45 } },
                        y: {
                            position: 'left', min: yMin, max: yMax,
                            title: { display: true, text: 'Arrêts / Score', font: { size: 11 } },
                            ticks: { font: { size: 12 } },
                        },
                        y1: {
                            position: 'right', min: y1Min, max: 100,
                            title: { display: true, text: '% Arrêts', font: { size: 11 } },
                            ticks: { font: { size: 12 }, callback: v => v >= 0 ? v + '%' : '' },
                            grid: { drawOnChartArea: false },
                        },
                    },
                },
            });
        }

        function updateNotesPage() {
            const joueurFilter = document.getElementById('filter-note-joueur').value;
            const matchFilter  = document.getElementById('filter-note-match').value;

            // Périodes à afficher : bilans disponibles + Toute la saison
            const hasBilans = typeof BILANS !== 'undefined' && BILANS && BILANS.length > 0;
            const periods = hasBilans
                ? [...BILANS.map(b => ({ label: b.label, matchs: b.matchs })), { label: 'Toute la saison', matchs: null }]
                : [{ label: 'Toute la saison', matchs: null }];

            const container = document.getElementById('notes-periods-container');
            if (container) {
                container.innerHTML = '';
                const thead = `<thead><tr>
                    <th>Joueur</th><th>Actions ATT +</th><th>Actions ATT -</th><th>Note ATT</th>
                    <th>Actions DEF +</th><th>Actions DEF -</th><th>Note DEF</th><th>Note Total</th>
                </tr></thead>`;

                periods.forEach((period, i) => {
                    const effectiveFilter = buildEffectiveMatchFilter(matchFilter, period.matchs);
                    const playerNotes = calculatePlayerNotes(effectiveFilter, joueurFilter);
                    const tbodyId = `notes-table-${i}`;

                    const headerHTML = hasBilans
                        ? `<div style="font-size:0.8rem;font-weight:700;color:#1E3A8A;margin:${i > 0 ? '1.2rem' : '0'} 0 0.4rem;text-transform:uppercase;letter-spacing:0.05em;border-left:3px solid var(--fenix-accent);padding-left:8px;">${period.label}</div>`
                        : '';

                    const block = document.createElement('div');
                    block.innerHTML = `${headerHTML}<div class="table-container"><table>${thead}<tbody id="${tbodyId}"></tbody></table></div>`;
                    container.appendChild(block);
                    renderNotesTable(playerNotes, tbodyId, period.matchs);
                });
            }

            // Section GB : visible uniquement si le joueur sélectionné est gardien
            const isGB = joueurFilter
                && typeof GARDIENS_FENIX !== 'undefined' && GARDIENS_FENIX.length > 0
                && GARDIENS_FENIX.some(g => matchPlayerName(g, joueurFilter));
            const gbSection = document.getElementById('section-notes-gb');
            if (gbSection) {
                gbSection.style.display = isGB ? '' : 'none';
                if (isGB) {
                    const gbNotes = calculateGardienNotes(buildEffectiveMatchFilter(matchFilter, null));
                    renderGardienNotesTable(gbNotes, 'notes-gb-table');
                }
            }
        }

        function updateNotesRecapTable() {
            const selectedMatches = getSelectedMatches();
            const matchFilterValue = selectedMatches.length === MATCHS.length ? '' : selectedMatches.join(',');
            const playerNotes = calculatePlayerNotes(matchFilterValue, '');
            renderNotesTable(playerNotes, 'notes-recap-table');
        }
