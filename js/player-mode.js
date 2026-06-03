        // ── Session ─────────────────────────────────────────────────────────────
        let PLAYER_SESSION = null;
        let _pmfChart = null;
        let _pmmZoneFilter = '';
        let _pmmImpactRows = [];
        let _pmmIsGB = false;
        let _pmBilanFilter = '';
        let _cachedSeasonStats = null;

        function getPlayerSeasonStats(nom) {
            if (_cachedSeasonStats && _cachedSeasonStats._nom === nom) return _cachedSeasonStats;
            const rows = DATA.filter(r => r[COLS.club] === 'FENIX' && matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom));
            const buts  = rows.filter(r => r[COLS.resultat] === 'But').length;
            const tirs  = rows.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const pb    = rows.filter(r => r[COLS.resultat] === 'PB').length;
            const po    = rows.filter(r => r[COLS.resultat] === 'PO').length;
            const total = buts + tirs;
            const eff   = total > 0 ? Math.round(buts / total * 100) : 0;
            let pd = 0;
            DATA.forEach(row => {
                (row[COLS.action_joueur]||'').toString().split(';').forEach((j, i) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    const act = lastNonEmpty((row[COLS.action_att]||'').toString().split(';'), i);
                    if (act === 'PD' || act === 'PD DG') pd++;
                });
            });
            const matchSet = new Set(rows.map(r => r[COLS.rencontre]).filter(Boolean));
            _cachedSeasonStats = { _nom: nom, buts, tirs, total, eff, pb, po, pd, matchCount: matchSet.size };
            return _cachedSeasonStats;
        }

        function isPlayerMode() {
            return PLAYER_SESSION && PLAYER_SESSION.role === 'joueur';
        }

        function getSessionPlayerNom() {
            return PLAYER_SESSION ? PLAYER_SESSION.nom : null;
        }

        function playerLogout() {
            PLAYER_SESSION = null;
            sessionStorage.removeItem('fenix_session');
            sessionStorage.removeItem('fenix_auth');
            location.reload();
        }

        // ── Setup UI joueur ──────────────────────────────────────────────────────
        function setupPlayerUI() {
            document.body.classList.add('player-mode');

            ['header', 'nav', 'main'].forEach(sel => {
                const el = document.querySelector('.' + sel);
                if (el) el.style.setProperty('display', 'none', 'important');
            });

            const accountsBtn = document.getElementById('btn-player-accounts');
            if (accountsBtn) accountsBtn.style.display = 'none';

            const subnav = document.getElementById('joueurs-subnav');
            if (subnav) subnav.style.setProperty('display', 'none', 'important');

            const bar = document.getElementById('pm-bar');
            if (bar) {
                bar.style.display = 'flex';
                const nameEl = document.getElementById('pm-player-name');
                if (nameEl) nameEl.textContent = PLAYER_SESSION.nom;
            }

            if (typeof DATA !== 'undefined' && DATA.length > 0) pmTab('fiche');
        }

        // ── Navigation tabs ──────────────────────────────────────────────────────
        let _pmActiveTab = 'fiche';

        function pmTab(tab) {
            _pmActiveTab = tab;
            document.querySelectorAll('.pm-tab-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.tab === tab);
            });

            const mainEl = document.querySelector('.main');
            if (mainEl) mainEl.style.setProperty('display', 'none', 'important');

            const ficheEl = document.getElementById('pm-fiche-page');
            const matchEl = document.getElementById('pm-match-page');

            if (tab === 'fiche') {
                if (matchEl) matchEl.style.display = 'none';
                if (ficheEl) ficheEl.style.display = 'block';
                if (typeof DATA !== 'undefined' && DATA.length > 0) renderPlayerFiche();
            } else {
                if (_pmfChart) { _pmfChart.destroy(); _pmfChart = null; }
                if (ficheEl) ficheEl.style.display = 'none';
                if (matchEl) matchEl.style.display = 'block';
                renderPlayerMatchStats();
            }
        }

        // ── Fiche joueur ─────────────────────────────────────────────────────────
        function renderPlayerFiche() {
            const nom = getSessionPlayerNom();
            const page = document.getElementById('pm-fiche-page');
            if (!nom || !DATA.length) {
                if (page) page.innerHTML = '<div style="padding:40px;text-align:center;color:#64748B">Aucune donnée — veuillez réimporter le fichier Excel.</div>';
                return;
            }
            try {
                _renderPlayerFicheContent(nom, page);
            } catch(err) {
                if (page) page.innerHTML = `<div style="padding:40px;text-align:center;color:#EF4444;font-family:monospace;white-space:pre-wrap">Erreur fiche joueur :<br>${err.message}<br><br>${err.stack||''}</div>`;
                console.error('renderPlayerFiche error:', err);
            }
        }

        function _renderPlayerFicheContent(nom, page) {

            const tp        = (typeof JOUEURS_TERRAIN !== 'undefined') ? JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom)) : null;
            const posteCode = tp ? tp.poste : '';
            const isGB      = (typeof detectIsGB === 'function') ? detectIsGB(nom) : (posteCode === 'GB');
            const posteName = { GB:'Gardien de But', AG:'Ailier Gauche', AD:'Ailier Droit', ARG:'Arrière Gauche', ARD:'Arrière Droit', DC:'Demi-Centre', PIV:'Pivot' };
            const color     = (typeof POSTE_COLORS !== 'undefined' && POSTE_COLORS[posteCode]) ? POSTE_COLORS[posteCode] : '#0A2463';
            const initials  = nom.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

            const tjNom  = (typeof getTJData === 'function') ? getTJData(nom, MATCHS) : { matchs: 0, total: 0 };
            const tjStr  = tjNom.matchs ? `<span class="pmf-meta-item">⏱ ${tjNom.matchs} match${tjNom.matchs > 1 ? 's' : ''}</span><span class="pmf-meta-item">⌀ ${Math.round(tjNom.total / tjNom.matchs)} min/match</span>` : '';

            // ── Stats KPI ──
            const fenixRows = DATA.filter(r => r[COLS.club] === 'FENIX' && matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom));
            const buts  = fenixRows.filter(r => r[COLS.resultat] === 'But').length;
            const tirs  = fenixRows.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const pb    = fenixRows.filter(r => r[COLS.resultat] === 'PB').length;
            const po    = fenixRows.filter(r => r[COLS.resultat] === 'PO').length;
            const total = buts + tirs;
            const eff   = total > 0 ? Math.round(buts / total * 100) : 0;
            const effColor = (typeof getEffColor === 'function') ? getEffColor(eff, posteCode) : '#0A2463';

            let pd = 0;
            DATA.forEach(row => {
                (row[COLS.action_joueur]||'').toString().split(';').forEach((j, i) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    const act = (typeof lastNonEmpty === 'function') ? lastNonEmpty((row[COLS.action_att]||'').toString().split(';'), i) : '';
                    if (act === 'PD' || act === 'PD DG') pd++;
                });
            });

            let attPlus = 0, attMoins = 0, defPlus = 0, defMoins = 0;
            DATA.forEach(row => {
                const joueurs = (row[COLS.action_joueur]||'').toString().split(';');
                const atts   = (row[COLS.action_att]||'').toString().split(';');
                const defs   = (row[COLS.action_def]||'').toString().split(';');
                joueurs.forEach((j, idx) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    const att = lastNonEmpty(atts, idx);
                    const def = lastNonEmpty(defs, idx);
                    if (isPositiveATT(att)) attPlus++;
                    else if (isNegativeATT(att)) attMoins++;
                    if (isPositiveDEF(def)) defPlus++;
                    else if (isNegativeDEF(def)) defMoins++;
                });
            });
            const note = (attPlus - attMoins) + (defPlus - defMoins);
            const noteColor   = note > 0 ? '#10B981' : note < 0 ? '#EF4444' : '#64748B';
            const noteDisplay = (note > 0 ? '+' : '') + note;

            // GB stats
            let gbArrets = 0, gbButs = 0, gbEff = 0, gbEffColor = '#64748B';
            if (isGB) {
                const gbRows = DATA.filter(r => r[COLS.club] !== 'FENIX' && matchPlayerName((r[COLS.gardien]||'').toString().trim(), nom) && (r[COLS.resultat] === 'But' || r[COLS.finalite] === 'Tir arrêté'));
                gbArrets = gbRows.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
                gbButs   = gbRows.filter(r => r[COLS.resultat]  === 'But').length;
                const gbTot = gbArrets + gbButs;
                gbEff = gbTot > 0 ? Math.round(gbArrets / gbTot * 100) : 0;
                gbEffColor = (typeof getEffColor === 'function') ? getEffColor(gbEff, 'GB') : '#0A2463';
            }

            // ── Encart 1 : Stats KPI ──
            const statsHTML = isGB ? `
                <div class="pmf-kpi-grid pmf-kpi-5">
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val">${gbArrets}/${gbArrets+gbButs}</div><div class="pmf-kpi-lbl">ARRÊTS / TIRS</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:${gbEffColor}">${gbEff}%</div><div class="pmf-kpi-lbl">% ARRÊTS</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:#EF4444">${gbButs}</div><div class="pmf-kpi-lbl">BUTS CONCÉDÉS</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val">${pd}</div><div class="pmf-kpi-lbl">PD</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:${noteColor}">${noteDisplay}</div><div class="pmf-kpi-lbl">NOTE</div></div>
                </div>` : `
                <div class="pmf-kpi-grid">
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val">${buts}/${total}</div><div class="pmf-kpi-lbl">BUT / TIR</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:${effColor}">${eff}%</div><div class="pmf-kpi-lbl">EFFICACITÉ</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val">${pd}</div><div class="pmf-kpi-lbl">PD</div></div>
                    ${po > 0 ? `<div class="pmf-kpi-box"><div class="pmf-kpi-val">${po}</div><div class="pmf-kpi-lbl">PÉN. OBTENUS</div></div>` : ''}
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:#EF4444">${pb}</div><div class="pmf-kpi-lbl">PERTES BALLE</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:${noteColor}">${noteDisplay}</div><div class="pmf-kpi-lbl">NOTE</div></div>
                </div>`;

            // ── Encart 2 : Actions (joueur de champ) ou Zones % (GB) ──
            const actionsHTML = isGB ? _buildGbZoneTableHTML(nom) : _buildDetailedActionsHTML(nom);

            // ── Assemblage ──
            if (!page) return;

            page.innerHTML = `
                <div class="pmf-header" style="background:linear-gradient(135deg,${color} 0%,${color}cc 100%)">
                    <div class="pmf-avatar">${initials}</div>
                    <div>
                        <div class="pmf-player-name">${nom}</div>
                        <div class="pmf-player-poste">${posteCode} — ${posteName[posteCode]||posteCode}</div>
                        <div class="pmf-meta">${tjStr}</div>
                    </div>
                </div>

                <div id="pmf-badges"></div>

                <div class="pmf-card">
                    <div class="pmf-card-title">MA FICHE</div>
                    ${statsHTML}
                </div>

                <div class="pmf-card">
                    <div class="pmf-card-title">${isGB ? 'STATS PAR ZONE' : 'ACTIONS'}</div>
                    ${actionsHTML}
                </div>

                <div class="pmf-card">
                    <div class="pmf-card-title">${isGB ? 'PERFORMANCES PAR RENCONTRE' : 'PROGRESSION — SAISON'}</div>
                    <div class="pmf-graph-wrap" style="position:relative;height:340px">
                        <canvas id="pmf-graph-canvas"></canvas>
                    </div>
                </div>`;

            renderPmfGraph(nom);
            renderBadges(nom, posteCode);
        }

        // ── Badges joueur ────────────────────────────────────────────────────────
        function computePlayerRank(nom, posteCode) {
            if (!posteCode || !JOUEURS_TERRAIN) return null;
            const teammates = JOUEURS_TERRAIN.filter(p => p.poste === posteCode && p.nom !== nom);
            let rank = 1;
            const myEff = getPlayerSeasonStats(nom).eff;
            teammates.forEach(p => {
                const s = getPlayerSeasonStats(p.nom);
                if (s.eff > myEff) rank++;
            });
            return { rank, total: teammates.length + 1 };
        }

        function computeStreak(nom) {
            const matchStats = MATCHS.map(m => {
                const rows = DATA.filter(r => r[COLS.club] === 'FENIX' && r[COLS.rencontre] === m && matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom));
                if (!rows.length) return null;
                const buts = rows.filter(r => r[COLS.resultat] === 'But').length;
                const tirs = rows.filter(r => r[COLS.resultat] === 'Tir raté').length;
                const total = buts + tirs;
                return total > 0 ? Math.round(buts / total * 100) : null;
            }).filter(v => v !== null);
            if (matchStats.length < 2) return { streak: 0, dir: 0 };
            const last = matchStats[matchStats.length - 1];
            const prev = matchStats[matchStats.length - 2];
            let streak = 1;
            const dir = last >= prev ? 1 : -1;
            for (let i = matchStats.length - 2; i >= 0; i--) {
                if (dir === 1 && matchStats[i] <= (i > 0 ? matchStats[i-1] : -1)) { if (i < matchStats.length-2) break; }
                streak++;
                if (streak >= 3) break;
            }
            return { streak: Math.min(streak, matchStats.length), dir, last, prev };
        }

        function renderBadges(nom, posteCode) {
            const el = document.getElementById('pmf-badges');
            if (!el) return;
            const badges = [];
            const rank = computePlayerRank(nom, posteCode);
            if (rank && rank.total > 1) {
                const medal = rank.rank === 1 ? '🥇' : rank.rank === 2 ? '🥈' : rank.rank === 3 ? '🥉' : null;
                if (medal) badges.push(`<span class="pmf-badge pmf-badge-rank">${medal} #${rank.rank} au poste</span>`);
            }
            const str = computeStreak(nom);
            if (str.dir === 1 && str.streak >= 2) badges.push(`<span class="pmf-badge pmf-badge-up">↑ En progression (${str.streak} matchs)</span>`);
            else if (str.dir === -1 && str.streak >= 2) badges.push(`<span class="pmf-badge pmf-badge-down">↓ En baisse (${str.streak} matchs)</span>`);
            el.innerHTML = badges.length ? `<div class="pmf-badges-row">${badges.join('')}</div>` : '';
        }

        // ── Tableau zones de tir GB (remplace ACTIONS pour les gardiens) ────────
        function _buildGbZoneTableHTML(nom, matchFilter) {
            const DIFF_ORDER = ['Très difficile', 'Difficile', 'Moyen', 'Facile', 'Très facile', null];
            const DIFF_COLOR = {
                'Très difficile': '#FEE2E2',
                'Difficile':      '#FFEDD5',
                'Moyen':          '#FEF3C7',
                'Facile':         '#D1FAE5',
                'Très facile':    '#F1F5F9',
            };

            const zones = {};
            DATA.forEach(row => {
                if (row[COLS.club] === 'FENIX') return;
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                const g = (row[COLS.gardien]||'').toString().trim();
                if (!matchPlayerName(g, nom)) return;
                const isArret = row[COLS.finalite] === 'Tir arrêté';
                const isBut   = row[COLS.resultat] === 'But';
                if (!isArret && !isBut) return;
                const zone = (row[COLS.field_position]||'').toString().trim() || '(sans zone)';
                if (!zones[zone]) zones[zone] = { arrets: 0, buts: 0 };
                if (isArret) zones[zone].arrets++;
                if (isBut)   zones[zone].buts++;
            });

            const w = (typeof GB_ZONE_WEIGHTS !== 'undefined') ? GB_ZONE_WEIGHTS : {};
            const allZones = Object.keys(zones).sort((a, b) => {
                const da = w[a] ? DIFF_ORDER.indexOf(w[a].diff) : 99;
                const db = w[b] ? DIFF_ORDER.indexOf(w[b].diff) : 99;
                return da - db;
            });

            if (allZones.length === 0) return '<div style="text-align:center;color:#94a3b8;padding:1rem">Aucune donnée par zone</div>';

            const rows = allZones.map(zone => {
                const zd = zones[zone];
                const tirs = zd.arrets + zd.buts;
                const pct  = tirs > 0 ? Math.round(zd.arrets / tirs * 100) : 0;
                const wz   = w[zone] || {};
                const diff = wz.diff || '—';
                const bg   = DIFF_COLOR[diff] || '#ffffff';
                const pctColor = pct >= 40 ? 'var(--fenix-success)' : 'var(--fenix-danger)';
                return `<tr style="border-bottom:1px solid #F1F5F9">
                    <td style="padding:0.4rem 0.5rem;font-weight:600;font-size:0.82rem">${zone}</td>
                    <td style="padding:0.4rem 0.5rem"><span style="background:${bg};border-radius:4px;padding:0.1rem 0.35rem;font-size:0.75rem">${diff}</span></td>
                    <td style="padding:0.4rem 0.5rem;text-align:center;color:var(--fenix-success);font-weight:600">${zd.arrets}</td>
                    <td style="padding:0.4rem 0.5rem;text-align:center;color:var(--fenix-danger);font-weight:600">${zd.buts}</td>
                    <td style="padding:0.4rem 0.5rem;text-align:center;color:#64748b">${tirs}</td>
                    <td style="padding:0.4rem 0.5rem;text-align:center;font-weight:700;color:${pctColor}">${pct}%</td>
                </tr>`;
            }).join('');

            return `<div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
                    <thead>
                        <tr style="background:#F8FAFC">
                            <th style="padding:0.4rem 0.5rem;text-align:left;font-size:0.72rem;color:#475569;font-weight:700">ZONE</th>
                            <th style="padding:0.4rem 0.5rem;text-align:left;font-size:0.72rem;color:#475569;font-weight:700">DIFFICULTÉ</th>
                            <th style="padding:0.4rem 0.5rem;text-align:center;font-size:0.72rem;color:#059669;font-weight:700">ARRÊTS</th>
                            <th style="padding:0.4rem 0.5rem;text-align:center;font-size:0.72rem;color:#DC2626;font-weight:700">BUTS</th>
                            <th style="padding:0.4rem 0.5rem;text-align:center;font-size:0.72rem;color:#64748b;font-weight:700">TIRS</th>
                            <th style="padding:0.4rem 0.5rem;text-align:center;font-size:0.72rem;color:#475569;font-weight:700">%</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        }

        // ── Détail des actions (style modal photo 1) ─────────────────────────────
        function _buildDetailedActionsHTML(nom, matchFilter, bilanMatchs) {
            const ATT_PLUS  = (typeof ACTIONS_ATT_PLUS  !== 'undefined') ? ACTIONS_ATT_PLUS  : ['But', 'But DG', 'PD', 'PD DG', 'PO', "2' Obt", 'Duel gagné att', 'Bon choix', 'Bloc', 'Glissement', 'Écran'];
            const ATT_MOINS = (typeof ACTIONS_ATT_MOINS !== 'undefined') ? ACTIONS_ATT_MOINS : ['Tir raté', 'PB', 'PF', 'Neutralisé', 'Mauvais choix', 'Bloc -'];
            const DEF_PLUS  = (typeof ACTIONS_DEF_PLUS  !== 'undefined') ? ACTIONS_DEF_PLUS  : ['Duel gagné déf', 'Contre +', 'Récup', 'Intercep', 'Dissua', 'Entraide +', 'Impair +', 'Contournement pivot +'];
            const DEF_MOINS = (typeof ACTIONS_DEF_MOINS !== 'undefined') ? ACTIONS_DEF_MOINS : ['Duel perdu', '2 min', 'Entraide -', 'Impair -', 'Sortie de bloc -', 'Contre -', 'Inactif', 'Hs/Répart/Changmt', 'Toucher -', 'Contournement pivot -', 'replis -'];

            const counts = {};
            const matchSet = new Set();
            DATA.forEach(row => {
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                const joueurs = (row[COLS.action_joueur]||'').toString().split(';');
                const atts   = (row[COLS.action_att]||'').toString().split(';');
                const defs   = (row[COLS.action_def]||'').toString().split(';');
                joueurs.forEach((j, idx) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    if (row[COLS.rencontre]) matchSet.add(row[COLS.rencontre]);
                    const att = lastNonEmpty(atts, idx);
                    const def = lastNonEmpty(defs, idx);
                    if (att) counts[att] = (counts[att]||0) + 1;
                    if (def) counts[def] = (counts[def]||0) + 1;
                });
            });
            const nbM = matchSet.size || 1;

            const makeSection = (actions, headerColor, bgColor, isPos) => {
                const rows = actions.map(a => {
                    const cnt = counts[a] || 0;
                    const style = cnt === 0 ? 'color:#CBD5E1' : (isPos ? 'color:#059669;font-weight:700' : 'color:#DC2626;font-weight:700');
                    return `<tr>
                        <td style="padding:4px 8px;font-size:0.82rem;${cnt===0?'color:#CBD5E1':''}">${a}</td>
                        <td style="padding:4px 8px;text-align:right;${style}">${cnt > 0 ? cnt : '—'}</td>
                        <td style="padding:4px 8px;text-align:right;color:#94A3B8;font-size:0.78rem">${cnt > 0 ? (cnt/nbM).toFixed(1) : '—'}</td>
                    </tr>`;
                }).join('');
                return `<div style="flex:1;min-width:0">
                    <div style="background:${headerColor};color:#fff;padding:5px 10px;font-family:'Bebas Neue',sans-serif;font-size:0.9rem;letter-spacing:1px;border-radius:6px 6px 0 0">${isPos ? (actions === ATT_PLUS ? 'ATTAQUE +' : 'DÉFENSE +') : (actions === ATT_MOINS ? 'ATTAQUE −' : 'DÉFENSE −')}</div>
                    <div style="background:${bgColor};border-radius:0 0 6px 6px;overflow:hidden">
                        <table style="width:100%;border-collapse:collapse">
                            <thead><tr style="background:rgba(0,0,0,0.06)">
                                <th style="padding:4px 8px;text-align:left;font-size:0.7rem;color:#475569;font-weight:700">ACTION</th>
                                <th style="padding:4px 8px;text-align:right;font-size:0.7rem;color:#475569;font-weight:700">TOTAL</th>
                                <th style="padding:4px 8px;text-align:right;font-size:0.7rem;color:#94A3B8;font-weight:700">/MATCH</th>
                            </tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>`;
            };

            const attPlusTotal  = ATT_PLUS.reduce((s,a)  => s+(counts[a]||0), 0);
            const attMoinsTotal = ATT_MOINS.reduce((s,a) => s+(counts[a]||0), 0);
            const defPlusTotal  = DEF_PLUS.reduce((s,a)  => s+(counts[a]||0), 0);
            const defMoinsTotal = DEF_MOINS.reduce((s,a) => s+(counts[a]||0), 0);
            const totalAtt = attPlusTotal - attMoinsTotal;
            const totalDef = defPlusTotal - defMoinsTotal;
            const totalJoueur = totalAtt + totalDef;
            const sign = v => (v >= 0 ? '+' : '') + v;
            const vColor = v => v > 0 ? '#059669' : v < 0 ? '#DC2626' : '#64748B';

            const allPlus  = [...ATT_PLUS,  ...DEF_PLUS].filter(a => (counts[a]||0) > 0).sort((a,b) => (counts[b]||0)-(counts[a]||0));
            const allMoins = [...ATT_MOINS, ...DEF_MOINS].filter(a => (counts[a]||0) > 0).sort((a,b) => (counts[b]||0)-(counts[a]||0));
            const top3Plus  = allPlus.slice(0,3);
            const top3Moins = allMoins.slice(0,3);
            const top3HTML = `
                <div style="display:flex;gap:12px;margin-bottom:10px">
                    <div style="flex:1;background:#F0FDF4;border-radius:8px;padding:8px 10px">
                        <div style="font-size:0.7rem;font-weight:700;color:#059669;text-transform:uppercase;margin-bottom:6px">TOP POINTS FORTS</div>
                        ${top3Plus.length ? top3Plus.map(a=>`<div style="display:flex;justify-content:space-between;font-size:0.82rem;padding:2px 0"><span style="color:#1E293B">${a}</span><span style="font-weight:700;color:#059669">${counts[a]}</span></div>`).join('') : '<div style="font-size:0.8rem;color:#94a3b8">Aucune action</div>'}
                    </div>
                    <div style="flex:1;background:#FEF2F2;border-radius:8px;padding:8px 10px">
                        <div style="font-size:0.7rem;font-weight:700;color:#DC2626;text-transform:uppercase;margin-bottom:6px">TOP POINTS À CORRIGER</div>
                        ${top3Moins.length ? top3Moins.map(a=>`<div style="display:flex;justify-content:space-between;font-size:0.82rem;padding:2px 0"><span style="color:#1E293B">${a}</span><span style="font-weight:700;color:#DC2626">${counts[a]}</span></div>`).join('') : '<div style="font-size:0.8rem;color:#94a3b8">Aucune action</div>'}
                    </div>
                </div>
                <div style="text-align:right;margin-bottom:8px">
                    <button onclick="_pmToggleActions(this)" style="background:#0A2463;border:none;border-radius:8px;padding:7px 16px;font-size:0.82rem;font-weight:700;color:#fff;cursor:pointer;letter-spacing:0.5px">Voir tout ▼</button>
                </div>`;

            return `
                ${top3HTML}
                <div class="pmf-actions-detail" style="display:none">
                    <div class="pmf-actions-2col">
                        ${makeSection(ATT_PLUS,  '#059669', '#F0FDF4', true)}
                        ${makeSection(DEF_PLUS,  '#059669', '#EFF6FF', true)}
                    </div>
                    <div class="pmf-actions-2col">
                        ${makeSection(ATT_MOINS, '#DC2626', '#FEF2F2', false)}
                        ${makeSection(DEF_MOINS, '#DC2626', '#FEF9E7', false)}
                    </div>
                </div>
                <div class="pmf-actions-totals">
                    <div><div style="font-size:1.3rem;font-weight:800;color:${vColor(totalAtt)}">${sign(totalAtt)}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">TOTAL ATT</div><div style="font-size:0.7rem;color:#94A3B8">${(totalAtt/nbM).toFixed(1)}/match</div></div>
                    <div><div style="font-size:1.3rem;font-weight:800;color:${vColor(totalDef)}">${sign(totalDef)}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">TOTAL DEF</div><div style="font-size:0.7rem;color:#94A3B8">${(totalDef/nbM).toFixed(1)}/match</div></div>
                    <div><div style="font-size:1.5rem;font-weight:900;color:${vColor(totalJoueur)}">${sign(totalJoueur)}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">TOTAL JOUEUR</div><div style="font-size:0.7rem;color:#94A3B8">${(totalJoueur/nbM).toFixed(1)}/match</div></div>
                    <div><div style="font-size:1.5rem;font-weight:900;color:#0A2463">${nbM}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">MATCHS JOUÉS</div></div>
                </div>`;
        }

        function _pmToggleActions(btn) {
            const detail = btn.closest('.pmf-card')?.querySelector('.pmf-actions-detail');
            if (!detail) return;
            const open = detail.style.display !== 'none';
            detail.style.display = open ? 'none' : 'block';
            btn.textContent = open ? 'Voir tout ▼' : 'Réduire ▲';
        }

        // ── Graphique note progression (style photo 3) ────────────────────────────
        function renderPmfGraph(nom) {
            if (_pmfChart) { _pmfChart.destroy(); _pmfChart = null; }
            const canvas = document.getElementById('pmf-graph-canvas');
            if (!canvas || typeof Chart === 'undefined') return;

            const isGB = (typeof detectIsGB === 'function') ? detectIsGB(nom) : false;
            const isMobile = window.innerWidth < 520;

            if (isGB) {
                const gbMd = {};
                MATCHS.forEach(m => gbMd[m] = { arrets: 0, buts: 0, score: 0 });
                DATA.forEach(row => {
                    if (row[COLS.club] === 'FENIX') return;
                    const g = (row[COLS.gardien]||'').toString().trim();
                    if (!matchPlayerName(g, nom)) return;
                    const m = row[COLS.rencontre]; if (!m || !gbMd[m]) return;
                    const isArret = row[COLS.finalite] === 'Tir arrêté';
                    const isBut   = row[COLS.resultat]  === 'But';
                    if (!isArret && !isBut) return;
                    const zone = (row[COLS.field_position]||'').toString().trim();
                    const w = (typeof GB_ZONE_WEIGHTS !== 'undefined' && GB_ZONE_WEIGHTS[zone]) ? GB_ZONE_WEIGHTS[zone] : { arret:1, but:-1 };
                    if (isArret) { gbMd[m].arrets++; gbMd[m].score += w.arret; }
                    if (isBut)   { gbMd[m].buts++;   gbMd[m].score += w.but;   }
                });
                const played = MATCHS.filter(m => gbMd[m].arrets + gbMd[m].buts > 0);
                if (played.length === 0) return;

                const arrArr = played.map(m => gbMd[m].arrets);
                const scrArr = played.map(m => gbMd[m].score);
                const pctArr = played.map(m => {
                    const tot = gbMd[m].arrets + gbMd[m].buts;
                    return tot > 0 ? Math.round(gbMd[m].arrets / tot * 100) : 0;
                });
                const tjArr = played.map(m => {
                    const jnum = (m.match(/^(J\d+)/i)||[])[1];
                    if (!jnum) return null;
                    const entry = TEMPS_JEU[nom.toLowerCase()];
                    return (entry && entry[jnum] !== undefined) ? entry[jnum] : null;
                });

                const yMin = Math.min(0, ...scrArr);
                const yMax = Math.max(...arrArr, ...scrArr, 1) + 1;
                const y1Min = yMax > 0 ? Math.floor(100 * yMin / yMax) : 0;

                const tempsPlugin = {
                    id: 'pmfGbTemps',
                    afterDatasetsDraw(chart) {
                        const meta = chart.getDatasetMeta(0);
                        if (!meta || meta.type !== 'bar') return;
                        const { ctx: c } = chart;
                        meta.data.forEach((bar, i) => {
                            const tj = tjArr[i], nb = arrArr[i];
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

                _pmfChart = new Chart(canvas, {
                    plugins: [tempsPlugin],
                    data: {
                        labels: played,
                        datasets: [
                            { type:'bar',  label:'Arrêts',      data:arrArr, yAxisID:'y',  backgroundColor:'rgba(16,185,129,0.65)', borderColor:'#10B981', borderWidth:1, order:3 },
                            { type:'line', label:'Score Total', data:scrArr, yAxisID:'y',  borderColor:'#1E3A5F', backgroundColor:'#1E3A5F', borderWidth:2.5, pointRadius:5, pointBackgroundColor:'#1E3A5F', tension:0.3, order:1 },
                            { type:'line', label:'% Arrêts',   data:pctArr, yAxisID:'y1', borderColor:'#0EA5E9', backgroundColor:'rgba(14,165,233,0.1)', borderWidth:2, pointRadius:4, pointBackgroundColor:'#0EA5E9', tension:0.3, fill:false, order:2 },
                            { type:'line', label:'__zero__',   data:played.map(()=>0), yAxisID:'y', borderColor:'#1E3A5F', borderWidth:1, pointRadius:0, tension:0, order:6 },
                        ],
                    },
                    options: {
                        responsive:true, maintainAspectRatio:false,
                        interaction:{ mode:'index', intersect:false },
                        plugins: {
                            legend:  { position:'top', labels:{ font:{size:isMobile?9:11}, padding:isMobile?6:14, boxWidth:isMobile?10:14, usePointStyle:true, filter: item => item.text !== '__zero__' } },
                            tooltip: { filter: item => item.dataset.label !== '__zero__' },
                            title:   { display:false },
                        },
                        layout: { padding: { right: isMobile ? 4 : 8 } },
                        scales: {
                            x: {
                                ticks: { font:{size:8,weight:'700'}, maxRotation:90, minRotation:45,
                                    color: ctx => { const m=played[ctx.index]; if(!m) return '#334155'; const f=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]==='FENIX'&&r[COLS.resultat]==='But').length; const a=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]!=='FENIX'&&r[COLS.resultat]==='But').length; return f>a?'#16A34A':f<a?'#DC2626':'#1E293B'; }
                                },
                                grid: { display:false },
                            },
                            y:  { position:'left',  min:yMin, max:yMax, title:{ display:!isMobile, text:'Arrêts / Score', font:{size:11} }, ticks:{ font:{size:isMobile?9:11} }, grid:{ color:'#F1F5F9' } },
                            y1: { position:'right', min:y1Min, max:100,  title:{ display:!isMobile, text:'% Arrêts', font:{size:11} }, ticks:{ font:{size:isMobile?9:11}, callback: v => v>=0 ? v+'%':'' }, grid:{ drawOnChartArea:false } },
                        },
                    },
                });
                return;
            }

            const matchData = {};
            MATCHS.forEach(m => matchData[m] = { ap:0, am:0, dp:0, dm:0 });
            DATA.forEach(row => {
                const m = row[COLS.rencontre];
                if (!matchData[m]) return;
                const joueurs = (row[COLS.action_joueur]||'').toString().split(';');
                const atts    = (row[COLS.action_att]||'').toString().split(';');
                const defs    = (row[COLS.action_def]||'').toString().split(';');
                joueurs.forEach((j, idx) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    const att = lastNonEmpty(atts, idx);
                    const def = lastNonEmpty(defs, idx);
                    if (isPositiveATT(att)) matchData[m].ap++;
                    if (isNegativeATT(att)) matchData[m].am++;
                    if (isPositiveDEF(def)) matchData[m].dp++;
                    if (isNegativeDEF(def)) matchData[m].dm++;
                });
            });

            const played = MATCHS.filter(m => { const d=matchData[m]; return d.ap+d.am+d.dp+d.dm>0; });
            if (played.length === 0) return;

            const noteATT = played.map(m => matchData[m].ap - matchData[m].am);
            const noteDEF = played.map(m => matchData[m].dp - matchData[m].dm);
            const total   = played.map((_, i) => noteATT[i] + noteDEF[i]);

            const sorted = [...total].sort((a,b) => a-b);
            const mid    = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;

            const n = total.length, xMean = (n-1)/2, yMean = total.reduce((s,v)=>s+v,0)/n;
            let num=0, den=0;
            total.forEach((v,i) => { num+=(i-xMean)*(v-yMean); den+=(i-xMean)**2; });
            const slope = den===0?0:num/den;
            const trend = played.map((_,i) => +(slope*i+yMean-slope*xMean).toFixed(2));

            const medianPlugin = {
                id: 'pmfMedianLabel',
                afterDraw(chart) {
                    const { ctx, chartArea, scales } = chart;
                    if (!scales.y) return;
                    const yPx = scales.y.getPixelForValue(median);
                    ctx.save();
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.fillStyle = '#64748B';
                    ctx.textAlign = 'left';
                    ctx.fillText(median % 1 === 0 ? median : median.toFixed(1), chartArea.right + 4, yPx + 4);
                    ctx.restore();
                }
            };

            _pmfChart = new Chart(canvas, {
                plugins: [medianPlugin],
                data: {
                    labels: played,
                    datasets: [
                        { type:'bar',  label:'NOTE ATT',     data:noteATT, backgroundColor:'rgba(20,184,166,0.75)',  borderColor:'#14B8A6', borderWidth:1, order:4 },
                        { type:'bar',  label:'NOTE DEF',     data:noteDEF, backgroundColor:'rgba(245,158,11,0.75)', borderColor:'#F59E0B', borderWidth:1, order:5 },
                        { type:'line', label:'TOTAL JOUEUR', data:total,   borderColor:'#1E3A5F', backgroundColor:'#1E3A5F', borderWidth:2.5, pointRadius:5, pointBackgroundColor:'#1E3A5F', tension:0.3, order:1 },
                        { type:'line', label:'Médiane',      data:played.map(()=>median), borderColor:'#94A3B8', borderWidth:1.5, borderDash:[6,4], pointRadius:0, tension:0, order:2 },
                        { type:'line', label:'Tendance',     data:trend, borderColor:'#60A5FA', borderWidth:1.5, borderDash:[3,3], pointRadius:0, tension:0, order:3 },
                        { type:'line', label:'__zero__',     data:played.map(()=>0), borderColor:'#1E3A5F', borderWidth:1, pointRadius:0, tension:0, order:6 },
                    ],
                },
                options: {
                    responsive:true, maintainAspectRatio:false,
                    plugins: {
                        legend:  { position:'top', labels:{ font:{size:isMobile?9:11}, padding:isMobile?6:14, boxWidth:isMobile?10:14, usePointStyle:true, filter:item=>item.text!=='__zero__' } },
                        tooltip: { filter: item => item.dataset.label !== '__zero__' },
                        title:   { display:false },
                    },
                    layout: { padding: { right: isMobile ? 20 : 36 } },
                    scales: {
                        x: {
                            ticks: { font:{size:8,weight:'700'}, maxRotation:90, minRotation:45,
                                color: ctx => { const m=played[ctx.index]; if(!m) return '#334155'; const f=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]==='FENIX'&&r[COLS.resultat]==='But').length; const a=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]!=='FENIX'&&r[COLS.resultat]==='But').length; return f>a?'#16A34A':f<a?'#DC2626':'#1E293B'; }
                            },
                            grid: { display:false },
                        },
                        y: {
                            title: { display:!isMobile, text:'Note', font:{size:12} },
                            grid: { color:'#F1F5F9' },
                            ticks: { font:{size:isMobile?9:11} },
                            afterDataLimits(scale) { scale.max+=2; scale.min-=2; },
                        },
                    },
                },
            });
        }

        // ── Canvas draw helper (partagé fiche + match) ──────────────────────────
        function _drawImpactCanvas(canvasId, b64src, subset, isGB) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const W = canvas.parentElement.clientWidth || 300;
            const H = Math.round(W * 0.62);
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d');
            const paint = img => {
                if (img) ctx.drawImage(img, 0, 0, W, H);
                else { ctx.fillStyle = '#DBEAFE'; ctx.fillRect(0, 0, W, H); }
                subset.forEach(row => {
                    const p = String(row[COLS.impact]).split(';');
                    const x = parseFloat(p[0]), y = parseFloat(p[1]);
                    if (isNaN(x) || isNaN(y)) return;
                    const dotX = (x/100)*W, dotY = (y/100)*H, s = Math.max(5, W*0.022);
                    const isPos = isGB ? row[COLS.finalite] === 'Tir arrêté' : row[COLS.resultat] === 'But';
                    ctx.save(); ctx.lineCap = 'round';
                    if (isPos) {
                        ctx.beginPath(); ctx.arc(dotX, dotY, s, 0, Math.PI*2);
                        ctx.fillStyle = '#10B981'; ctx.fill();
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
                    } else {
                        const sc = s / Math.SQRT2;
                        ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.moveTo(dotX-sc, dotY-sc); ctx.lineTo(dotX+sc, dotY+sc);
                        ctx.moveTo(dotX+sc, dotY-sc); ctx.lineTo(dotX-sc, dotY+sc);
                        ctx.stroke();
                    }
                    ctx.restore();
                });
            };
            if (typeof IMPACT_B64 !== 'undefined' && b64src) {
                const img = new Image(); img.onload = () => paint(img); img.onerror = () => paint(null); img.src = b64src;
            } else { paint(null); }
        }

        function _drawMatchExtrasImpact(rows) {
            const b64 = (typeof IMPACT_B64 !== 'undefined') ? IMPACT_B64 : {};
            _drawImpactCanvas('pmm-canvas-alg',  b64.alg,  rows.filter(r => getImpactView(r) === 'alg'),  _pmmIsGB);
            _drawImpactCanvas('pmm-canvas-face', b64.face, rows.filter(r => getImpactView(r) === 'face'), _pmmIsGB);
            _drawImpactCanvas('pmm-canvas-ald',  b64.ald,  rows.filter(r => getImpactView(r) === 'ald'),  _pmmIsGB);
        }

        function _updatePmmImpactStats(rows) {
            const statsEl = document.getElementById('pmm-impact-stats');
            if (!statsEl) return;
            const nom = getSessionPlayerNom();
            if (_pmmIsGB) {
                const ar = rows.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
                const bu = rows.filter(r => r[COLS.resultat] === 'But').length;
                const tot = ar + bu;
                const eff = tot > 0 ? Math.round(ar / tot * 100) : 0;
                const ec  = (typeof getEffColor === 'function') ? getEffColor(eff, 'GB') : '#0A2463';
                statsEl.innerHTML = tot === 0 ? '' : `<div style="display:flex;gap:12px;align-items:center">
                    <span style="font-size:0.8rem;color:#64748B">${ar} arrêt${ar>1?'s':''} / ${tot} tir${tot>1?'s':''}</span>
                    <span style="font-size:1.1rem;font-weight:800;color:${ec}">${eff}%</span></div>`;
            } else {
                const bu  = rows.filter(r => r[COLS.resultat] === 'But').length;
                const ra  = rows.filter(r => r[COLS.resultat] === 'Tir raté').length;
                const tot = bu + ra;
                const eff = tot > 0 ? Math.round(bu / tot * 100) : 0;
                const tp  = (typeof JOUEURS_TERRAIN !== 'undefined') ? JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom)) : null;
                const ec  = (typeof getEffColor === 'function') ? getEffColor(eff, tp ? tp.poste : '') : '#0A2463';
                statsEl.innerHTML = tot === 0 ? '' : `<div style="display:flex;gap:12px;align-items:center">
                    <span style="font-size:0.8rem;color:#64748B">${bu} but${bu>1?'s':''} / ${tot} tir${tot>1?'s':''}</span>
                    <span style="font-size:1.1rem;font-weight:800;color:${ec}">${eff}%</span></div>`;
            }
        }

        function onPmmZoneClick(zone) {
            _pmmZoneFilter = (_pmmZoneFilter === zone) ? '' : zone;
            document.querySelectorAll('#pmm-zone-grid .zr-cell').forEach(cell => {
                cell.classList.toggle('zr-selected', cell.dataset.zone === _pmmZoneFilter && _pmmZoneFilter !== '');
            });
            const resetBtn = document.getElementById('pmm-zone-reset');
            if (resetBtn) resetBtn.style.display = _pmmZoneFilter ? 'inline' : 'none';
            const rows = _pmmZoneFilter ? _pmmImpactRows.filter(r => (r[COLS.field_position]||'').toString().trim() === _pmmZoneFilter) : _pmmImpactRows;
            _updatePmmImpactStats(rows);
            _drawMatchExtrasImpact(rows);
        }

        // ── Canvas terrain vu du dessus (positions de tir sur le terrain) ─────────
        function _drawPmTerrain(rows) {
            const canvas = document.getElementById('pmm-terrain-canvas');
            if (!canvas) return;
            const container = canvas.parentElement;
            canvas.width  = container.clientWidth  || 400;
            canvas.height = container.clientHeight || 220;
            const W = canvas.width, H = canvas.height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);
            rows.forEach(row => {
                const posStr = (row[COLS.position_terrain] || '').toString();
                if (!posStr.includes(';')) return;
                const [xs, ys] = posStr.split(';');
                const x = parseFloat(xs), y = parseFloat(ys);
                if (isNaN(x) || isNaN(y)) return;
                const cx = (x / 100) * W, cy = (y / 100) * H, s = Math.max(6, W * 0.018);
                const res = row[COLS.resultat];
                ctx.save(); ctx.lineCap = 'round';
                if (res === 'But') {
                    ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2);
                    ctx.fillStyle = '#10B981'; ctx.fill();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
                } else if (res === 'Tir raté') {
                    ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
                    ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
                    ctx.stroke();
                } else if (res === 'PB') {
                    ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2;
                    const sp = s * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(cx - sp, cy - sp); ctx.lineTo(cx + sp, cy + sp);
                    ctx.moveTo(cx + sp, cy - sp); ctx.lineTo(cx - sp, cy + sp);
                    ctx.stroke();
                }
                ctx.restore();
            });
        }

        // ── Extras Stats Match : terrain vu du dessus + impact but + actions ──────
        function renderPlayerMatchExtras(nom, isGB, matchFilter) {
            const wrap = document.getElementById('pm-match-extras');
            if (!wrap) return;

            _pmmZoneFilter = '';
            _pmmIsGB = isGB;
            const _bilanMF = _getPmBilanMatchs();
            _pmmImpactRows = isGB
                ? DATA.filter(r => r[COLS.club] !== 'FENIX' && (!matchFilter || r[COLS.rencontre] === matchFilter) && (!_bilanMF || _bilanMF.includes(r[COLS.rencontre])) && matchPlayerName((r[COLS.gardien]||'').toString().trim(), nom) && r[COLS.impact] && String(r[COLS.impact]).includes(';'))
                : DATA.filter(r => r[COLS.club] === 'FENIX'  && (!matchFilter || r[COLS.rencontre] === matchFilter) && (!_bilanMF || _bilanMF.includes(r[COLS.rencontre])) && matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom)   && r[COLS.impact] && String(r[COLS.impact]).includes(';'));

            // Lignes avec position terrain (pour canvas vu du dessus)
            const terrainRows = isGB ? [] : DATA.filter(r =>
                r[COLS.club] === 'FENIX' &&
                (!matchFilter || r[COLS.rencontre] === matchFilter) &&
                matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom) &&
                r[COLS.position_terrain] && String(r[COLS.position_terrain]).includes(';')
            );

            const impactTitle  = isGB ? 'ARRÊTS ET BUTS CONCÉDÉS' : 'ZONES DE TIR SUR LE BUT';
            const impactLegend = isGB
                ? `<span class="pmf-legend-dot pmf-legend-green">●</span> Tir arrêté <span class="pmf-legend-dot pmf-legend-red" style="margin-left:10px">✕</span> But encaissé`
                : `<span class="pmf-legend-dot pmf-legend-green">●</span> But <span class="pmf-legend-dot pmf-legend-red" style="margin-left:10px">✕</span> Tir raté`;

            const zones = [...new Set(_pmmImpactRows.map(r => (r[COLS.field_position]||'').toString().trim()).filter(Boolean))];
            const _zc = z => `<div class="zr-cell${zones.includes(z) ? '' : ' zr-empty'}" data-zone="${z}" onclick="onPmmZoneClick('${z}')">${z}</div>`;
            const zoneGridHTML = `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <span style="font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Zone</span>
                    <button id="pmm-zone-reset" onclick="onPmmZoneClick('')" style="display:none;font-size:0.7rem;color:#2563eb;background:none;border:none;cursor:pointer;text-decoration:underline;padding:0">✕ Tout voir</button>
                </div>
                <div id="pmm-zone-grid" style="display:flex;flex-direction:column;gap:4px">
                    <div class="zr-row">${_zc('6m ail G')}${_zc('6m ext G')}${_zc('6m central G')}${_zc('6m central D')}${_zc('6m ext D')}${_zc('6m ail D')}</div>
                    <div class="zr-row">${_zc('6-9 ext G')}${_zc('6-9 central G')}<div class="zr-cell zr-7m${zones.includes('7m') ? '' : ' zr-empty'}" data-zone="7m" onclick="onPmmZoneClick('7m')">7m</div>${_zc('6-9 central D')}${_zc('6-9 ext D')}</div>
                    <div class="zr-row">${_zc('9m ext G')}${_zc('9m Int G')}${_zc('9m Int D')}${_zc('9m ext D')}</div>
                </div>`;

            const actionsHTML  = isGB ? _buildGbZoneTableHTML(nom, matchFilter) : _buildDetailedActionsHTML(nom, matchFilter, _bilanMF);
            const actionsTitle = isGB ? 'STATS PAR ZONE' : 'ACTIONS';

            const terrainSection = (!isGB && terrainRows.length > 0) ? `
                <div class="pmf-card">
                    <div class="pmf-card-title">POSITIONS DE TIR SUR LE TERRAIN</div>
                    <div class="terrain-wrapper-small" id="pmm-terrain-wrapper" style="margin-bottom:8px">
                        <canvas id="pmm-terrain-canvas" class="terrain-canvas"></canvas>
                    </div>
                    <div class="pmf-legend" style="font-size:0.72rem;color:#64748B">
                        <span style="color:#10B981">●</span> But &nbsp;
                        <span style="color:#EF4444">✕</span> Tir raté &nbsp;
                        <span style="color:#8B4513">✕</span> Perte de balle
                    </div>
                </div>` : '';

            wrap.innerHTML = `
                ${terrainSection}
                <div class="pmf-card">
                    <div class="pmf-card-header-row">
                        <div class="pmf-card-title">${impactTitle}</div>
                        <div id="pmm-impact-stats"></div>
                    </div>
                    <div class="pmf-canvases">
                        <div class="pmf-canvas-wrap"><canvas id="pmm-canvas-alg"></canvas><div class="pmf-canvas-lbl">EXT GAUCHE</div></div>
                        <div class="pmf-canvas-wrap"><canvas id="pmm-canvas-face"></canvas><div class="pmf-canvas-lbl">CENTRAL</div></div>
                        <div class="pmf-canvas-wrap"><canvas id="pmm-canvas-ald"></canvas><div class="pmf-canvas-lbl">EXT DROIT</div></div>
                    </div>
                    ${_pmmImpactRows.length === 0 ? '<div class="pmf-no-impact">Aucune donnée de tir avec coordonnées</div>' : ''}
                    <div style="margin-top:12px">${zoneGridHTML}</div>
                    <div class="pmf-legend" style="margin-top:8px">${impactLegend}</div>
                </div>
                <div class="pmf-card">
                    <div class="pmf-card-title">${actionsTitle}</div>
                    ${actionsHTML}
                </div>`;

            _updatePmmImpactStats(_pmmImpactRows);
            _drawMatchExtrasImpact(_pmmImpactRows);
            if (!isGB && terrainRows.length > 0) {
                requestAnimationFrame(() => _drawPmTerrain(terrainRows));
            }
        }

        // ── Stats Match : équipes ────────────────────────────────────────────────
        function renderPlayerMatchStats() {
            const matchFilter = _pmCurrentMatchIdx >= 0 ? (MATCHS[_pmCurrentMatchIdx] || '') : '';
            const bilanMatchs = _getPmBilanMatchs();
            const filtered = DATA.filter(r => {
                if (matchFilter && r[COLS.rencontre] !== matchFilter) return false;
                if (bilanMatchs && !bilanMatchs.includes(r[COLS.rencontre])) return false;
                return true;
            });
            const uniq       = [...new Set(filtered.map(r=>r[COLS.rencontre]).filter(Boolean))];
            const matchCount = uniq.length || 1;
            const showAvg    = matchCount > 1;

            const fenix = filtered.filter(r=>r[COLS.club]==='FENIX');
            const adv   = filtered.filter(r=>r[COLS.club]!=='FENIX' && r[COLS.club]);

            const compute = rows => {
                const buts=rows.filter(r=>r[COLS.resultat]==='But').length;
                const rates=rows.filter(r=>r[COLS.resultat]==='Tir raté').length;
                const total=buts+rates;
                const pen=rows.filter(r=>r[COLS.ge]&&String(r[COLS.ge]).toLowerCase().includes('pen'));
                const penB=pen.filter(r=>r[COLS.resultat]==='But').length;
                const penT=penB+pen.filter(r=>r[COLS.resultat]==='Tir raté').length;
                const poss=rows.filter(r=>r[COLS.possession]&&String(r[COLS.possession]).trim()).length;
                const pb=rows.filter(r=>r[COLS.resultat]==='PB').length;
                const po=rows.filter(r=>r[COLS.resultat]==='PO').length;
                const eff=total>0?Math.round(buts/total*100):0;
                return {buts,rates,total,penB,penT,poss,pb,po,eff};
            };

            const rd=(n,d)=>Math.round(n/d);
            const fv=compute(fenix), av=compute(adv);
            const advName = matchFilter ? ([...new Set(adv.map(r=>r[COLS.club]).filter(Boolean))][0]||'ADVERSAIRE') : 'ADVERSAIRE';

            const card=(data,color,title)=>{
                const d=showAvg?{poss:rd(data.poss,matchCount),buts:`${rd(data.buts,matchCount)}/${rd(data.total,matchCount)}`,pen:`Pen: ${rd(data.penB,matchCount)}/${rd(data.penT,matchCount)}`,pb:rd(data.pb,matchCount),po:rd(data.po,matchCount)}:{poss:data.poss,buts:`${data.buts}/${data.total}`,pen:`Pen: ${data.penB}/${data.penT}`,pb:data.pb,po:data.po};
                return `<div class="pm-team-card" style="border-left:4px solid ${color}">
                    <div class="pm-team-title"><span class="pm-dot" style="background:${color}"></span><strong>${title}</strong>${showAvg?'<span class="pm-avg-lbl">(Moy./match)</span>':''}</div>
                    <div class="pm-stats-grid">
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.poss}</div><div class="pm-stat-lbl">POSSESSIONS</div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.buts}</div><div class="pm-stat-lbl">BUTS<br><small style="color:#94a3b8">${d.pen}</small></div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val" style="color:${data.eff>=60?'#10B981':data.eff>=45?'#2563eb':'#EF4444'}">${data.eff}%</div><div class="pm-stat-lbl">% RÉUSSITE</div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.pb}</div><div class="pm-stat-lbl">PERTES DE BALLE</div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.po}</div><div class="pm-stat-lbl">PEN. OBTENUS</div></div>
                    </div>
                </div>`;
            };

            const cardsEl = document.getElementById('pm-match-cards');
            if (cardsEl) cardsEl.innerHTML = card(fv,'#0A2463','FENIX TOULOUSE') + card(av,'#EF4444',advName);

            renderMatchSummaryBanner(matchFilter);
            renderAICard(matchFilter);

            // Table + extras personnels du joueur
            const nom = getSessionPlayerNom();
            if (nom) {
                const isGB = (typeof detectIsGB === 'function') ? detectIsGB(nom) : false;
                renderPlayerMatchTable(nom, isGB, matchFilter);
                renderPlayerMatchExtras(nom, isGB, matchFilter);
            }
        }

        // ── Table stats personnelles (onglet Stats Match) ────────────────────────
        function renderPlayerMatchTable(nom, isGB, matchFilter) {
            const wrap = document.getElementById('pm-match-player-table');
            if (!wrap) return;

            // Matches à afficher
            const matchesToShow = matchFilter
                ? (DATA.some(r=>r[COLS.rencontre]===matchFilter) ? [matchFilter] : [])
                : MATCHS;

            if (isGB) {
                const gbSbm = {};
                const initGb = () => ({ ac:0,bc:0,ap:0,bp:0,pd:0,pb:0,but:0 });

                DATA.forEach(row => {
                    if (row[COLS.club]==='FENIX') return;
                    if (matchFilter && row[COLS.rencontre]!==matchFilter) return;
                    const g=(row[COLS.gardien]||'').toString().trim();
                    if (!matchPlayerName(g, nom)) return;
                    const m=row[COLS.rencontre]; if (!m) return;
                    if (!gbSbm[m]) gbSbm[m]=initGb();
                    const isPen=(row[COLS.ge]||'').toString().toLowerCase().includes('pen');
                    const isArret=row[COLS.finalite]==='Tir arrêté';
                    const isBut=row[COLS.resultat]==='But';
                    if (!isArret&&!isBut) return;
                    if (isPen) { isArret?gbSbm[m].ap++:gbSbm[m].bp++; }
                    else       { isArret?gbSbm[m].ac++:gbSbm[m].bc++; }
                });
                DATA.forEach(row => {
                    if (row[COLS.club]!=='FENIX') return;
                    if (matchFilter && row[COLS.rencontre]!==matchFilter) return;
                    if (!matchPlayerName((row[COLS.joueur]||'').toString().trim(), nom)) return;
                    const m=row[COLS.rencontre]; if (!m) return;
                    if (!gbSbm[m]) gbSbm[m]=initGb();
                    if (row[COLS.resultat]==='But') gbSbm[m].but++;
                    if (row[COLS.resultat]==='PB')  gbSbm[m].pb++;
                });
                DATA.forEach(row => {
                    if (matchFilter && row[COLS.rencontre]!==matchFilter) return;
                    const m=row[COLS.rencontre]; if (!m) return;
                    (row[COLS.action_joueur]||'').toString().split(';').forEach((j,i)=>{
                        if (!matchPlayerName(j.trim(),nom)) return;
                        const act=lastNonEmpty((row[COLS.action_att]||'').toString().split(';'),i);
                        if (act==='PD'||act==='PD DG') { if(!gbSbm[m]) gbSbm[m]=initGb(); gbSbm[m].pd++; }
                    });
                });

                let gt=initGb(), rows='';
                matchesToShow.forEach(m => {
                    const s=gbSbm[m]; if(!s) return;
                    const tC=s.ac+s.bc,tP=s.ap+s.bp,tT=tC+tP,aT=s.ac+s.ap;
                    Object.keys(gt).forEach(k=>gt[k]+=s[k]);
                    const jnum=(m.match(/^(J\d+)/i)||[])[1];
                    const tjE=TEMPS_JEU[nom.toLowerCase()];
                    const tjMin=tjE&&jnum&&tjE[jnum]!==undefined?` <span style="color:#94A3B8;font-size:0.8em">(${tjE[jnum]} min)</span>`:'';
                    rows+=`<tr><td style="color:${matchResultColor(m)}">${m}${tjMin}</td><td>${aT}/${tT}</td><td>${tT>0?Math.round(aT/tT*100)+'%':'-'}</td><td>${s.ac}/${tC}</td><td>${tC>0?Math.round(s.ac/tC*100)+'%':'-'}</td><td>${s.ap}/${tP}</td><td>${tP>0?Math.round(s.ap/tP*100)+'%':'-'}</td><td>${s.but}</td><td>${s.pd}</td><td>${s.pb}</td></tr>`;
                });
                const gtC=gt.ac+gt.bc,gtP=gt.ap+gt.bp,gtT=gtC+gtP,gaT=gt.ac+gt.ap;
                rows+=`<tr class="jm-total-row"><td>TOTAL</td><td>${gaT}/${gtT}</td><td>${gtT>0?Math.round(gaT/gtT*100)+'%':'-'}</td><td>${gt.ac}/${gtC}</td><td>${gtC>0?Math.round(gt.ac/gtC*100)+'%':'-'}</td><td>${gt.ap}/${gtP}</td><td>${gtP>0?Math.round(gt.ap/gtP*100)+'%':'-'}</td><td>${gt.but}</td><td>${gt.pd}</td><td>${gt.pb}</td></tr>`;

                wrap.innerHTML=`<div class="pmf-card"><div class="pmf-card-title">MES STATS — ${nom}</div><div style="overflow-x:auto"><table class="jm-table"><thead><tr><th>Match</th><th>Total</th><th>%</th><th>Champ</th><th>%</th><th>Pen</th><th>%</th><th>But</th><th>PD</th><th>PB</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;

            } else {
                const sbm = {};
                DATA.forEach(row => {
                    if (row[COLS.club]!=='FENIX') return;
                    if (matchFilter && row[COLS.rencontre]!==matchFilter) return;
                    if (!matchPlayerName((row[COLS.joueur]||'').toString().trim(), nom)) return;
                    const m=row[COLS.rencontre]; if (!m) return;
                    if (!sbm[m]) sbm[m]={bc:0,tc:0,bp:0,tp:0,pb:0,po:0,pd:0};
                    const isPen=(row[COLS.ge]||'').toString().toLowerCase().includes('pen');
                    if (row[COLS.resultat]==='But')       { isPen?sbm[m].bp++:sbm[m].bc++; }
                    else if (row[COLS.resultat]==='Tir raté') { isPen?sbm[m].tp++:sbm[m].tc++; }
                    else if (row[COLS.resultat]==='PB')   sbm[m].pb++;
                    else if (row[COLS.resultat]==='PO')   sbm[m].po++;
                });
                DATA.forEach(row => {
                    if (matchFilter && row[COLS.rencontre]!==matchFilter) return;
                    const m=row[COLS.rencontre]; if (!m) return;
                    (row[COLS.action_joueur]||'').toString().split(';').forEach((j,i)=>{
                        if (!matchPlayerName(j.trim(),nom)) return;
                        const act=lastNonEmpty((row[COLS.action_att]||'').toString().split(';'),i);
                        if (act==='PD'||act==='PD DG') { if(!sbm[m]) sbm[m]={bc:0,tc:0,bp:0,tp:0,pb:0,po:0,pd:0}; sbm[m].pd++; }
                    });
                });

                let tot={bc:0,tc:0,bp:0,tp:0,pb:0,po:0,pd:0}, rows='';
                matchesToShow.forEach(m => {
                    const s=sbm[m]; if(!s) return;
                    const tC=s.bc+s.tc,tP=s.bp+s.tp,tT=tC+tP,tB=s.bc+s.bp;
                    Object.keys(tot).forEach(k=>tot[k]+=s[k]);
                    const jnum=(m.match(/^(J\d+)/i)||[])[1];
                    const tjE=TEMPS_JEU[nom.toLowerCase()];
                    const tjMin=tjE&&jnum&&tjE[jnum]!==undefined?` <span style="color:#94A3B8;font-size:0.8em">(${tjE[jnum]} min)</span>`:'';
                    rows+=`<tr><td style="color:${matchResultColor(m)}">${m}${tjMin}</td><td>${s.bc}/${tC}</td><td>${tC>0?Math.round(s.bc/tC*100)+'%':'-'}</td><td>${tP>0?s.bp+'/'+tP:'-'}</td><td>${tP>0?Math.round(s.bp/tP*100)+'%':'-'}</td><td>${tT>0?Math.round(tB/tT*100)+'%':'-'}</td><td>${s.pb}</td><td>${s.po}</td><td>${s.pd}</td></tr>`;
                });
                const tC=tot.bc+tot.tc,tP=tot.bp+tot.tp,tT=tC+tP,tB=tot.bc+tot.bp;
                rows+=`<tr class="jm-total-row"><td>TOTAL</td><td>${tot.bc}/${tC}</td><td>${tC>0?Math.round(tot.bc/tC*100)+'%':'-'}</td><td>${tP>0?tot.bp+'/'+tP:'-'}</td><td>${tP>0?Math.round(tot.bp/tP*100)+'%':'-'}</td><td>${tT>0?Math.round(tB/tT*100)+'%':'-'}</td><td>${tot.pb}</td><td>${tot.po}</td><td>${tot.pd}</td></tr>`;

                wrap.innerHTML=`<div class="pmf-card"><div class="pmf-card-title">MES STATS — ${nom}</div><div style="overflow-x:auto"><table class="jm-table"><thead><tr><th>Match</th><th>But/Tir</th><th>% Champ</th><th>Pen (B/T)</th><th>% Pen</th><th>% Total</th><th>PB</th><th>PO</th><th>PD</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
            }
        }

        // ── Sélecteur match (mode joueur) ────────────────────────────────────────
        let _pmCurrentMatchIdx = -1;

        function buildPmMatchNav() {
            const sel = document.getElementById('pm-match-sel');
            if (!sel) return;
            sel.innerHTML = '<option value="">Tous les matchs</option>'
                + (MATCHS || []).map(m => `<option value="${m}">${m}</option>`).join('');
            sel.value = '';
            _pmCurrentMatchIdx = -1;
            _pmBilanFilter = '';
            // Peupler bilan dropdown
            const bilanSel  = document.getElementById('pm-bilan-sel');
            const bilanWrap = document.getElementById('pm-bilan-wrap');
            if (bilanSel && typeof BILANS !== 'undefined') {
                bilanSel.innerHTML = '<option value="">Toute la saison</option>' + BILANS.map(b => `<option value="${b.nom}">${b.label}</option>`).join('');
                if (bilanWrap) bilanWrap.style.display = BILANS.length ? 'flex' : 'none';
            }
            renderPlayerMatchStats();
        }

        function pmBilanSelect() {
            _pmBilanFilter = document.getElementById('pm-bilan-sel')?.value || '';
            _pmCurrentMatchIdx = -1;
            const matchSel = document.getElementById('pm-match-sel');
            if (matchSel) matchSel.value = '';
            renderPlayerMatchStats();
        }

        function _getPmBilanMatchs() {
            if (!_pmBilanFilter || typeof BILANS === 'undefined') return null;
            return BILANS.find(b => b.nom === _pmBilanFilter)?.matchs || null;
        }

        function pmMatchSelect() {
            const sel = document.getElementById('pm-match-sel');
            const val = sel ? sel.value : '';
            _pmCurrentMatchIdx = val ? (MATCHS || []).indexOf(val) : -1;
            renderPlayerMatchStats();
        }

        // ── Analyse IA locale (match du joueur) ─────────────────────────────────
        function getPlayerMatchStats(nom, matchFilter) {
            const rows = DATA.filter(r =>
                r[COLS.club] === 'FENIX' &&
                matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom) &&
                (!matchFilter || r[COLS.rencontre] === matchFilter)
            );
            const buts  = rows.filter(r => r[COLS.resultat] === 'But').length;
            const tirs  = rows.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const total = buts + tirs;
            const pb    = rows.filter(r => r[COLS.resultat] === 'PB').length;
            const eff   = total > 0 ? Math.round(buts / total * 100) : 0;
            let attPlus = 0, attMoins = 0, defPlus = 0, defMoins = 0;
            DATA.filter(r => !matchFilter || r[COLS.rencontre] === matchFilter).forEach(row => {
                const joueurs = (row[COLS.action_joueur]||'').toString().split(';');
                const atts   = (row[COLS.action_att]||'').toString().split(';');
                const defs   = (row[COLS.action_def]||'').toString().split(';');
                joueurs.forEach((j, idx) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    const att = lastNonEmpty(atts, idx);
                    const def = lastNonEmpty(defs, idx);
                    if (isPositiveATT(att)) attPlus++;
                    else if (isNegativeATT(att)) attMoins++;
                    if (isPositiveDEF(def)) defPlus++;
                    else if (isNegativeDEF(def)) defMoins++;
                });
            });
            return { buts, tirs, total, eff, pb, attPlus, attMoins, defPlus, defMoins };
        }

        function generateLocalAI(nom, matchFilter) {
            const ms = getPlayerMatchStats(nom, matchFilter);
            const ss = getPlayerSeasonStats(nom);
            const lines = [];

            // Tirs
            if (ms.total > 0) {
                const effLabel = ms.eff >= 60 ? 'Bonne' : ms.eff >= 45 ? 'Moyenne' : 'Faible';
                const vsStr = ss.total > 0 ? ` (moy. saison : ${ss.eff}%)` : '';
                lines.push(`${effLabel} efficacité : ${ms.buts}/${ms.total} tirs réussis (${ms.eff}%)${vsStr}.`);
            } else {
                lines.push('Aucun tir enregistré sur ce match.');
            }

            // Actions offensives
            const noteAtm = ms.attPlus - ms.attMoins;
            if (ms.attPlus > 0 || ms.attMoins > 0) {
                if (noteAtm > 0) lines.push(`Bon impact offensif : ${ms.attPlus}+ / ${ms.attMoins}−.`);
                else if (noteAtm < 0) lines.push(`Côté offensif à travailler : ${ms.attPlus}+ / ${ms.attMoins}−.`);
                else lines.push(`Bilan offensif équilibré : ${ms.attPlus}+ / ${ms.attMoins}−.`);
            }

            // Actions défensives
            const noteDefm = ms.defPlus - ms.defMoins;
            if (ms.defPlus > 0 || ms.defMoins > 0) {
                if (noteDefm > 0) lines.push(`Bonne contribution défensive : ${ms.defPlus}+ / ${ms.defMoins}−.`);
                else if (noteDefm < 0) lines.push(`Points défensifs à corriger : ${ms.defPlus}+ / ${ms.defMoins}−.`);
            }

            // Pertes de balle
            if (ms.pb > 0) lines.push(`${ms.pb} perte${ms.pb > 1 ? 's' : ''} de balle.`);

            return lines.length ? lines.join(' ') : 'Données insuffisantes pour générer une analyse.';
        }

        function renderAICard(matchFilter) {
            const el = document.getElementById('pm-ai-card');
            if (!el) return;
            if (!matchFilter) { el.innerHTML = ''; return; }
            const nom = getSessionPlayerNom();
            if (!nom) { el.innerHTML = ''; return; }
            const text = generateLocalAI(nom, matchFilter);
            el.innerHTML = `
                <div class="pmf-card" style="padding:14px 16px;border-left:4px solid #0A2463">
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:0.95rem;letter-spacing:1.5px;color:#0A2463;margin-bottom:8px">ANALYSE DU MATCH</div>
                    <p style="margin:0;font-size:0.88rem;color:#1E293B;line-height:1.55">${text}</p>
                </div>`;
        }

        // ── Bannière résumé match (même style que page Analyse) ─────────────────
        function renderMatchSummaryBanner(matchFilter) {
            const el = document.getElementById('pm-match-banner');
            if (!el) return;
            if (!matchFilter) { el.innerHTML = ''; return; }

            const matchData = DATA.filter(r => r[COLS.rencontre] === matchFilter);
            if (!matchData.length) { el.innerHTML = ''; return; }

            const sortedGoals = getSortedGoals(matchData);
            if (!sortedGoals.length) { el.innerHTML = ''; return; }

            el.innerHTML = `
                <div class="pmf-card" style="padding:12px 16px">
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:0.95rem;letter-spacing:1.5px;color:#0A2463;margin-bottom:4px">
                        📈 ÉVOLUTION DU SCORE
                    </div>
                    <div id="pm-timeline-scores" style="text-align:center;font-size:0.82rem;color:#64748B;margin-bottom:6px"></div>
                    <div style="position:relative;height:220px">
                        <canvas id="pm-timeline-canvas"></canvas>
                    </div>
                </div>`;

            // Dessiner après que le DOM est mis à jour
            requestAnimationFrame(() => _drawPmTimeline(matchData, sortedGoals));
        }

        function _drawPmTimeline(matchData, sortedGoals) {
            const canvas = document.getElementById('pm-timeline-canvas');
            if (!canvas) return;
            const container = canvas.parentElement;
            canvas.width  = container.clientWidth;
            canvas.height = container.clientHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const g1Pos  = sortedGoals.filter(g => getPeriodeNum(g.row) === 1).map(g => g.pos);
            const g2Pos  = sortedGoals.filter(g => getPeriodeNum(g.row) === 2).map(g => g.pos);
            const max1   = g1Pos.length ? Math.max(...g1Pos) : 0;
            const maxAll = Math.max(...sortedGoals.map(g => g.pos), 1);
            const hasTwo = g1Pos.length > 0 && g2Pos.length > 0;

            function normPos(pos) {
                if (!hasTwo) return (pos / maxAll) * 60;
                if (pos <= max1) return max1 > 0 ? (pos / max1) * 30 : 0;
                return 30 + ((pos - max1) / Math.max(maxAll - max1, 1)) * 30;
            }

            let fenixScore = 0, advScore = 0;
            const scoreHistory = [{ pos: 0, fenix: 0, adv: 0 }];
            sortedGoals.forEach(({ row, pos }) => {
                if (row[COLS.club] === 'FENIX') fenixScore++; else advScore++;
                scoreHistory.push({ pos: normPos(pos), fenix: fenixScore, adv: advScore });
            });

            const fenixMT1 = sortedGoals.filter(g => getPeriodeNum(g.row) === 1 && g.row[COLS.club] === 'FENIX').length;
            const advMT1   = sortedGoals.filter(g => getPeriodeNum(g.row) === 1 && g.row[COLS.club] !== 'FENIX').length;
            const scoresEl = document.getElementById('pm-timeline-scores');
            if (scoresEl) {
                scoresEl.textContent = hasTwo
                    ? `MT1 : ${fenixMT1}-${advMT1} · Final : ${fenixScore}-${advScore}`
                    : `Score final : ${fenixScore}-${advScore}`;
            }

            const pad = { top: 36, right: 32, bottom: 38, left: 42 };
            const gW  = canvas.width  - pad.left - pad.right;
            const gH  = canvas.height - pad.top  - pad.bottom;
            const maxScore  = Math.max(fenixScore, advScore, 5);
            const roundedMax = Math.ceil(maxScore / 5) * 5;
            const maxPos = 60;
            const px = pos => pad.left + (pos / maxPos) * gW;
            const py = (score, max) => pad.top + gH - (score / max * gH);

            // Grille
            ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = pad.top + (gH * (5 - i) / 5);
                ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(canvas.width - pad.right, y); ctx.stroke();
            }

            // Mi-temps
            if (hasTwo) {
                const xH = px(30);
                ctx.save(); ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
                ctx.beginPath(); ctx.moveTo(xH, pad.top); ctx.lineTo(xH, pad.top + gH); ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#94A3B8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
                ctx.fillText('MI-TEMPS', xH, pad.top - 6);
            }

            // Axes
            ctx.fillStyle = '#6B7280'; ctx.font = '11px Inter'; ctx.textAlign = 'right';
            for (let i = 0; i <= 5; i++) {
                ctx.fillText(Math.round(roundedMax * i / 5), pad.left - 8, pad.top + gH * (5 - i) / 5 + 4);
            }
            ctx.font = '10px Inter'; ctx.textAlign = 'center';
            [0, 15, 30, 45, 60].forEach(min => ctx.fillText(min + "'", px(min), pad.top + gH + 14));

            // Courbe + points FENIX
            const drawLine = (color, key) => {
                ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
                scoreHistory.forEach((p, i) => {
                    const x = px(p.pos), y = py(p[key], roundedMax);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
                scoreHistory.forEach((p, i) => {
                    if (i === 0) return;
                    ctx.beginPath(); ctx.arc(px(p.pos), py(p[key], roundedMax), 4, 0, Math.PI * 2);
                    ctx.fillStyle = color; ctx.fill();
                });
            };
            drawLine('#0A2463', 'fenix');
            drawLine('#DC2626', 'adv');

            // Score final
            ctx.font = 'bold 16px Inter'; ctx.textAlign = 'right';
            ctx.fillStyle = '#0A2463'; ctx.fillText(fenixScore, canvas.width - pad.right - 30, pad.top - 14);
            ctx.fillStyle = '#6B7280'; ctx.fillText('-', canvas.width - pad.right - 20, pad.top - 14);
            ctx.fillStyle = '#DC2626'; ctx.fillText(advScore, canvas.width - pad.right, pad.top - 14);

            // Légende
            ctx.font = '12px Inter'; ctx.textAlign = 'left';
            ctx.fillStyle = '#0A2463'; ctx.fillRect(pad.left, canvas.height - 16, 12, 12);
            ctx.fillStyle = '#333'; ctx.fillText('FENIX', pad.left + 18, canvas.height - 6);
            ctx.fillStyle = '#DC2626'; ctx.fillRect(pad.left + 80, canvas.height - 16, 12, 12);
            ctx.fillStyle = '#333'; ctx.fillText('Adversaire', pad.left + 98, canvas.height - 6);
        }

        // ── Gestion comptes joueurs (staff only) ─────────────────────────────────
        function openPlayerAccountsModal() {
            const accounts = JSON.parse(localStorage.getItem('fenix_player_accounts')||'{}');
            const nomSel = document.getElementById('pa-nom-sel');
            if (nomSel && typeof JOUEURS_TERRAIN !== 'undefined') {
                const existing = Object.keys(accounts);
                nomSel.innerHTML = '<option value="">-- Choisir un joueur --</option>'
                    + JOUEURS_TERRAIN.filter(p=>!existing.includes(p.nom)).map(p=>`<option value="${p.nom}">${p.nom} (${p.poste})</option>`).join('');
            }
            const tbody = document.getElementById('pa-accounts-list');
            if (tbody) {
                tbody.innerHTML = Object.entries(accounts).length === 0
                    ? '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Aucun compte joueur</td></tr>'
                    : Object.entries(accounts).map(([nom,pwd])=>`<tr><td style="padding:6px 10px">${nom}</td><td style="padding:6px 10px">${'•'.repeat(Math.min(pwd.length,8))}</td><td style="padding:6px 10px;text-align:right"><button onclick="deletePlayerAccount('${nom}')" style="color:#EF4444;background:none;border:none;cursor:pointer;font-size:1rem" title="Supprimer">🗑</button></td></tr>`).join('');
            }
            const modal = document.getElementById('pa-modal');
            if (modal) modal.style.display = 'flex';
        }

        function closePlayerAccountsModal() {
            const modal = document.getElementById('pa-modal');
            if (modal) modal.style.display = 'none';
        }

        function savePlayerAccount() {
            const selEl = document.getElementById('pa-nom-sel');
            const pwdEl = document.getElementById('pa-pwd');
            const nom = selEl ? selEl.value.trim() : '';
            const pwd = pwdEl ? pwdEl.value.trim() : '';
            if (!nom || !pwd) { alert('Sélectionne un joueur et saisis un mot de passe'); return; }
            const accounts = JSON.parse(localStorage.getItem('fenix_player_accounts')||'{}');
            accounts[nom] = pwd;
            localStorage.setItem('fenix_player_accounts', JSON.stringify(accounts));
            if (pwdEl) pwdEl.value = '';
            openPlayerAccountsModal();
        }

        function deletePlayerAccount(nom) {
            if (!confirm(`Supprimer le compte de ${nom} ?`)) return;
            const accounts = JSON.parse(localStorage.getItem('fenix_player_accounts')||'{}');
            delete accounts[nom];
            localStorage.setItem('fenix_player_accounts', JSON.stringify(accounts));
            openPlayerAccountsModal();
        }

        // ── Preview mode (staff → simule vue joueur) ─────────────────────────────
        let _previewSavedNavPage = 'dashboard';
        let _previewSavedSubnavVisible = false;

        function openPreviewModal() {
            const sel = document.getElementById('preview-player-sel');
            if (sel && typeof JOUEURS_TERRAIN !== 'undefined' && JOUEURS_TERRAIN.length) {
                sel.innerHTML = '<option value="">— Sélectionner un joueur —</option>'
                    + JOUEURS_TERRAIN.map(p => `<option value="${p.nom}">${p.nom} (${p.poste})</option>`).join('');
            }
            const modal = document.getElementById('preview-modal');
            if (modal) modal.style.display = 'flex';
        }

        function closePreviewModal() {
            const modal = document.getElementById('preview-modal');
            if (modal) modal.style.display = 'none';
        }

        function startPreviewMode() {
            const sel = document.getElementById('preview-player-sel');
            const nom = sel ? sel.value.trim() : '';
            if (!nom) { alert('Sélectionne un joueur'); return; }

            closePreviewModal();

            // Sauvegarder l'état staff
            _previewSavedNavPage = document.querySelector('.nav-btn.active')?.dataset.page || 'dashboard';
            _previewSavedSubnavVisible = document.getElementById('joueurs-subnav')?.style.display === 'flex';

            // Démarrer la session preview
            PLAYER_SESSION = { nom, role: 'joueur', isPreview: true };
            setupPlayerUI();

            // Remplacer "Déconnexion" par "← Retour staff"
            const logoutBtn = document.querySelector('#pm-bar button[onclick="playerLogout()"]');
            if (logoutBtn) {
                logoutBtn.textContent = '← Retour staff';
                logoutBtn.style.background = 'rgba(255,255,255,0.15)';
                logoutBtn.style.borderColor = 'rgba(255,255,255,0.4)';
                logoutBtn.style.color = 'white';
                logoutBtn.setAttribute('onclick', 'exitPreviewMode()');
            }
        }

        function exitPreviewMode() {
            PLAYER_SESSION = null;

            // Restaurer l'interface staff
            ['header', 'nav', 'main'].forEach(sel => {
                const el = document.querySelector('.' + sel);
                if (el) el.style.removeProperty('display');
            });
            document.body.classList.remove('player-mode');

            // Masquer les pages joueur
            const bar = document.getElementById('pm-bar');
            if (bar) bar.style.display = 'none';
            const fichePage = document.getElementById('pm-fiche-page');
            if (fichePage) fichePage.style.display = 'none';
            const matchPage = document.getElementById('pm-match-page');
            if (matchPage) matchPage.style.display = 'none';

            // Remettre le bouton déconnexion d'origine
            const exitBtn = document.querySelector('#pm-bar button[onclick="exitPreviewMode()"]');
            if (exitBtn) {
                exitBtn.textContent = '🚪 Déconnexion';
                exitBtn.setAttribute('onclick', 'playerLogout()');
                exitBtn.style.background = 'rgba(239,68,68,.2)';
                exitBtn.style.borderColor = '#EF4444';
                exitBtn.style.color = '#FCA5A5';
            }

            // Restaurer les boutons staff de la nav
            const accountsBtn = document.getElementById('btn-player-accounts');
            if (accountsBtn) accountsBtn.style.removeProperty('display');
            const previewBtn = document.getElementById('btn-preview-mode');
            if (previewBtn) previewBtn.style.removeProperty('display');

            // Rétablir la page active
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const pageEl = document.getElementById('page-' + _previewSavedNavPage);
            if (pageEl) pageEl.classList.add('active');

            const subnav = document.getElementById('joueurs-subnav');
            if (subnav) subnav.style.display = _previewSavedNavPage === 'joueurs' ? 'flex' : 'none';

            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.page === _previewSavedNavPage);
            });
            if (typeof refreshPage === 'function' && typeof DATA !== 'undefined' && DATA.length > 0) {
                refreshPage(_previewSavedNavPage);
            }
        }

        // ── Init ─────────────────────────────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', function () {
            const stored = sessionStorage.getItem('fenix_session');
            if (stored) {
                try {
                    PLAYER_SESSION = JSON.parse(stored);
                    if (isPlayerMode()) setupPlayerUI();
                } catch (e) {}
            }

            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') {
                    const modal = document.getElementById('pm-player-modal');
                    if (modal && modal.style.display !== 'none') closePlayerModal();
                }
            });
        });
