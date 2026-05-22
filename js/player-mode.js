        // ── Session ─────────────────────────────────────────────────────────────
        let PLAYER_SESSION = null;
        let _pmfChart = null;
        let _pmfZoneFilter = '';
        let _pmmZoneFilter = '';
        let _pmmImpactRows = [];
        let _pmmIsGB = false;

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

            // ── Impact data ──
            const impactRowsAll = isGB
                ? DATA.filter(r => r[COLS.club] !== 'FENIX' && matchPlayerName((r[COLS.gardien]||'').toString().trim(), nom) && r[COLS.impact] && String(r[COLS.impact]).includes(';'))
                : DATA.filter(r => r[COLS.club] === 'FENIX' && matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom) && r[COLS.impact] && String(r[COLS.impact]).includes(';'));
            const zones = [...new Set(impactRowsAll.map(r => (r[COLS.field_position]||'').toString().trim()).filter(Boolean))].sort();

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
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val">${po}</div><div class="pmf-kpi-lbl">PÉN. OBTENUS</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:#EF4444">${pb}</div><div class="pmf-kpi-lbl">PERTES BALLE</div></div>
                    <div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:${noteColor}">${noteDisplay}</div><div class="pmf-kpi-lbl">NOTE</div></div>
                </div>`;

            // ── Encart 2 : Actions (joueur de champ) ou Zones % (GB) ──
            const actionsHTML = isGB ? _buildGbZoneTableHTML(nom) : _buildDetailedActionsHTML(nom);

            // ── Encart 3 : Impact ──
            _pmfZoneFilter = '';
            const impactTitle  = isGB ? 'ARRÊTS ET BUTS CONCÉDÉS' : 'ZONES DE TIR';
            const impactLegend = isGB
                ? `<span class="pmf-legend-dot pmf-legend-green">●</span> Tir arrêté <span class="pmf-legend-dot pmf-legend-red" style="margin-left:10px">✕</span> But encaissé`
                : `<span class="pmf-legend-dot pmf-legend-green">●</span> But <span class="pmf-legend-dot pmf-legend-red" style="margin-left:10px">✕</span> Tir raté`;

            const _zrCell = (z) => `<div class="zr-cell${zones.includes(z) ? '' : ' zr-empty'}" data-zone="${z}" onclick="onPmfZoneClick('${z}')">${z}</div>`;
            const zoneGridHTML = `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <span style="font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Zone</span>
                    <button id="pmf-zone-reset" onclick="onPmfZoneClick('')" style="display:none;font-size:0.7rem;color:#2563eb;background:none;border:none;cursor:pointer;text-decoration:underline;padding:0">✕ Tout voir</button>
                </div>
                <div id="pmf-zone-grid" style="display:flex;flex-direction:column;gap:4px">
                    <div class="zr-row">${_zrCell('6m ail G')}${_zrCell('6m ext G')}${_zrCell('6m central G')}${_zrCell('6m central D')}${_zrCell('6m ext D')}${_zrCell('6m ail D')}</div>
                    <div class="zr-row">${_zrCell('6-9 ext G')}${_zrCell('6-9 central G')}<div class="zr-cell zr-7m${zones.includes('7m') ? '' : ' zr-empty'}" data-zone="7m" onclick="onPmfZoneClick('7m')">7m</div>${_zrCell('6-9 central D')}${_zrCell('6-9 ext D')}</div>
                    <div class="zr-row">${_zrCell('9m ext G')}${_zrCell('9m Int G')}${_zrCell('9m Int D')}${_zrCell('9m ext D')}</div>
                </div>`;

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
                    <div class="pmf-graph-wrap" style="position:relative;height:280px">
                        <canvas id="pmf-graph-canvas"></canvas>
                    </div>
                </div>`;

            renderPmfGraph(nom);
            addFSButtons(page);
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
        function _buildDetailedActionsHTML(nom, matchFilter) {
            const ATT_PLUS  = (typeof ACTIONS_ATT_PLUS  !== 'undefined') ? ACTIONS_ATT_PLUS  : ['But', 'But DG', 'PD', 'PD DG', 'PO', "2' Obt", 'Duel gagné att', 'Bon choix', 'Bloc', 'Glissement', 'Écran'];
            const ATT_MOINS = (typeof ACTIONS_ATT_MOINS !== 'undefined') ? ACTIONS_ATT_MOINS : ['Tir raté', 'PB', 'PF', 'Neutralisé', 'Mauvais choix', 'Bloc -'];
            const DEF_PLUS  = (typeof ACTIONS_DEF_PLUS  !== 'undefined') ? ACTIONS_DEF_PLUS  : ['Duel gagné déf', 'Contre +', 'Récup', 'Intercep', 'Dissua', 'Entraide +', 'Impair +', 'Contournement pivot +'];
            const DEF_MOINS = (typeof ACTIONS_DEF_MOINS !== 'undefined') ? ACTIONS_DEF_MOINS : ['Duel perdu', '2 min', 'Entraide -', 'Impair -', 'Sortie de bloc -', 'Contre -', 'Inactif', 'Hs/Répart/Changmt', 'Toucher -', 'Contournement pivot -', 'replis -'];

            const counts = {};
            const matchSet = new Set();
            DATA.forEach(row => {
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
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

            return `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                    ${makeSection(ATT_PLUS,  '#059669', '#F0FDF4', true)}
                    ${makeSection(DEF_PLUS,  '#059669', '#EFF6FF', true)}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
                    ${makeSection(ATT_MOINS, '#DC2626', '#FEF2F2', false)}
                    ${makeSection(DEF_MOINS, '#DC2626', '#FEF9E7', false)}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding-top:10px;border-top:1px solid #E2E8F0;text-align:center">
                    <div><div style="font-size:1.3rem;font-weight:800;color:${vColor(totalAtt)}">${sign(totalAtt)}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">TOTAL ATT</div><div style="font-size:0.7rem;color:#94A3B8">${(totalAtt/nbM).toFixed(1)}/match</div></div>
                    <div><div style="font-size:1.3rem;font-weight:800;color:${vColor(totalDef)}">${sign(totalDef)}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">TOTAL DEF</div><div style="font-size:0.7rem;color:#94A3B8">${(totalDef/nbM).toFixed(1)}/match</div></div>
                    <div><div style="font-size:1.5rem;font-weight:900;color:${vColor(totalJoueur)}">${sign(totalJoueur)}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">TOTAL JOUEUR</div><div style="font-size:0.7rem;color:#94A3B8">${(totalJoueur/nbM).toFixed(1)}/match</div></div>
                    <div><div style="font-size:1.5rem;font-weight:900;color:#0A2463">${nbM}</div><div style="font-size:0.65rem;font-weight:700;color:#64748B;text-transform:uppercase">MATCHS JOUÉS</div></div>
                </div>`;
        }

        // ── Graphique note progression (style photo 3) ────────────────────────────
        function renderPmfGraph(nom) {
            if (_pmfChart) { _pmfChart.destroy(); _pmfChart = null; }
            const canvas = document.getElementById('pmf-graph-canvas');
            if (!canvas || typeof Chart === 'undefined') return;

            const isGB = (typeof detectIsGB === 'function') ? detectIsGB(nom) : false;

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
                            legend:  { position:'bottom', labels:{ font:{size:11}, padding:14, usePointStyle:true, filter: item => item.text !== '__zero__' } },
                            tooltip: { filter: item => item.dataset.label !== '__zero__' },
                            title:   { display:false },
                        },
                        scales: {
                            x: {
                                ticks: { font:{size:10,weight:'700'}, maxRotation:45,
                                    color: ctx => { const m=played[ctx.index]; if(!m) return '#334155'; const f=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]==='FENIX'&&r[COLS.resultat]==='But').length; const a=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]!=='FENIX'&&r[COLS.resultat]==='But').length; return f>a?'#16A34A':f<a?'#DC2626':'#1E293B'; }
                                },
                                grid: { display:false },
                            },
                            y:  { position:'left',  min:yMin, max:yMax, title:{ display:true, text:'Arrêts / Score', font:{size:11} }, ticks:{ font:{size:11} }, grid:{ color:'#F1F5F9' } },
                            y1: { position:'right', min:y1Min, max:100,  title:{ display:true, text:'% Arrêts', font:{size:11} }, ticks:{ font:{size:11}, callback: v => v>=0 ? v+'%':'' }, grid:{ drawOnChartArea:false } },
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
                        legend:  { position:'bottom', labels:{ font:{size:11}, padding:14, usePointStyle:true, filter:item=>item.text!=='__zero__' } },
                        tooltip: { filter: item => item.dataset.label !== '__zero__' },
                        title:   { display:false },
                    },
                    layout: { padding: { right: 36 } },
                    scales: {
                        x: {
                            ticks: { font:{size:10,weight:'700'}, maxRotation:45,
                                color: ctx => { const m=played[ctx.index]; if(!m) return '#334155'; const f=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]==='FENIX'&&r[COLS.resultat]==='But').length; const a=DATA.filter(r=>r[COLS.rencontre]===m&&r[COLS.club]!=='FENIX'&&r[COLS.resultat]==='But').length; return f>a?'#16A34A':f<a?'#DC2626':'#1E293B'; }
                            },
                            grid: { display:false },
                        },
                        y: {
                            title: { display:true, text:'Note', font:{size:12} },
                            grid: { color:'#F1F5F9' },
                            ticks: { font:{size:11} },
                            afterDataLimits(scale) { scale.max+=2; scale.min-=2; },
                        },
                    },
                },
            });
        }

        // ── Zone impact (fiche) ──────────────────────────────────────────────────
        function onPmfZoneClick(zone) {
            // Toggle : re-clic sur zone sélectionnée = tout voir
            _pmfZoneFilter = (_pmfZoneFilter === zone) ? '' : zone;

            // Mise à jour visuelle des cellules
            document.querySelectorAll('#pmf-zone-grid .zr-cell').forEach(cell => {
                cell.classList.toggle('zr-selected', cell.dataset.zone === _pmfZoneFilter && _pmfZoneFilter !== '');
            });
            const resetBtn = document.getElementById('pmf-zone-reset');
            if (resetBtn) resetBtn.style.display = _pmfZoneFilter ? 'inline' : 'none';

            const nom  = getSessionPlayerNom();
            const tp   = (typeof JOUEURS_TERRAIN !== 'undefined') ? JOUEURS_TERRAIN.find(p=>p.nom===nom) : null;
            const isGB = tp && tp.poste === 'GB';
            const all  = isGB
                ? DATA.filter(r => r[COLS.club]!=='FENIX' && matchPlayerName((r[COLS.gardien]||'').toString().trim(), nom) && r[COLS.impact] && String(r[COLS.impact]).includes(';'))
                : DATA.filter(r => r[COLS.club]==='FENIX'  && matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom)   && r[COLS.impact] && String(r[COLS.impact]).includes(';'));
            _drawPmfImpact(all, isGB);
        }

        function _drawPmfImpact(allRows, isGB) {
            const rows = _pmfZoneFilter ? allRows.filter(r => (r[COLS.field_position]||'').toString().trim() === _pmfZoneFilter) : allRows;

            // ── Stats au tir pour la zone filtrée ──
            const statsEl = document.getElementById('pmf-impact-stats');
            if (statsEl) {
                if (isGB) {
                    const arrets = rows.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
                    const buts   = rows.filter(r => r[COLS.resultat]  === 'But').length;
                    const tot    = arrets + buts;
                    const eff    = tot > 0 ? Math.round(arrets / tot * 100) : 0;
                    const effColor = (typeof getEffColor === 'function') ? getEffColor(eff, 'GB') : '#0A2463';
                    statsEl.innerHTML = tot === 0 ? '' : `
                        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                            <span style="font-size:0.8rem;color:#64748B">${arrets} arrêt${arrets>1?'s':''} / ${tot} tir${tot>1?'s':''}</span>
                            <span style="font-size:1.1rem;font-weight:800;color:${effColor}">${eff}%</span>
                        </div>`;
                } else {
                    const buts  = rows.filter(r => r[COLS.resultat] === 'But').length;
                    const rates = rows.filter(r => r[COLS.resultat] === 'Tir raté').length;
                    const tot   = buts + rates;
                    const eff   = tot > 0 ? Math.round(buts / tot * 100) : 0;
                    const nom   = getSessionPlayerNom();
                    const tp    = (typeof JOUEURS_TERRAIN !== 'undefined') ? JOUEURS_TERRAIN.find(p => p.nom === nom) : null;
                    const poste = tp ? tp.poste : '';
                    const effColor = (typeof getEffColor === 'function') ? getEffColor(eff, poste) : '#0A2463';
                    statsEl.innerHTML = tot === 0 ? '' : `
                        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                            <span style="font-size:0.8rem;color:#64748B">${buts} but${buts>1?'s':''} / ${tot} tir${tot>1?'s':''}</span>
                            <span style="font-size:1.1rem;font-weight:800;color:${effColor}">${eff}%</span>
                        </div>`;
                }
            }

            const drawOn = (canvasId, b64, subset) => {
                const canvas = document.getElementById(canvasId);
                if (!canvas) return;
                const W = canvas.parentElement.clientWidth || 300;
                const H = Math.round(W * 0.62);
                canvas.width=W; canvas.height=H;
                const ctx = canvas.getContext('2d');
                const paint = img => {
                    if (img) { ctx.drawImage(img, 0, 0, W, H); }
                    else { ctx.fillStyle='#DBEAFE'; ctx.fillRect(0,0,W,H); }
                    subset.forEach(row => {
                        const p=String(row[COLS.impact]).split(';');
                        const x=parseFloat(p[0]),y=parseFloat(p[1]);
                        if(isNaN(x)||isNaN(y)) return;
                        const dotX=(x/100)*W, dotY=(y/100)*H, s=Math.max(5,W*0.022);
                        const isPos = isGB ? row[COLS.finalite]==='Tir arrêté' : row[COLS.resultat]==='But';
                        ctx.save(); ctx.lineCap='round';
                        if (isPos) {
                            ctx.beginPath(); ctx.arc(dotX,dotY,s,0,Math.PI*2);
                            ctx.fillStyle='#10B981'; ctx.fill();
                            ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
                        } else {
                            const sc=s/Math.SQRT2;
                            ctx.strokeStyle='#EF4444'; ctx.lineWidth=2.5;
                            ctx.beginPath();
                            ctx.moveTo(dotX-sc,dotY-sc); ctx.lineTo(dotX+sc,dotY+sc);
                            ctx.moveTo(dotX+sc,dotY-sc); ctx.lineTo(dotX-sc,dotY+sc);
                            ctx.stroke();
                        }
                        ctx.restore();
                    });
                };
                if (typeof IMPACT_B64!=='undefined' && b64) {
                    const img=new Image(); img.onload=()=>paint(img); img.onerror=()=>paint(null); img.src=b64;
                } else { paint(null); }
            };

            const b64=(typeof IMPACT_B64!=='undefined')?IMPACT_B64:{};
            drawOn('pmf-canvas-alg',  b64.alg,  rows.filter(r=>getImpactView(r)==='alg'));
            drawOn('pmf-canvas-face', b64.face, rows.filter(r=>getImpactView(r)==='face'));
            drawOn('pmf-canvas-ald',  b64.ald,  rows.filter(r=>getImpactView(r)==='ald'));
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

        // ── Extras Stats Match : impact + actions/zones ─────────────────────────
        function renderPlayerMatchExtras(nom, isGB, matchFilter) {
            const wrap = document.getElementById('pm-match-extras');
            if (!wrap) return;

            _pmmZoneFilter = '';
            _pmmIsGB = isGB;
            _pmmImpactRows = isGB
                ? DATA.filter(r => r[COLS.club] !== 'FENIX' && (!matchFilter || r[COLS.rencontre] === matchFilter) && matchPlayerName((r[COLS.gardien]||'').toString().trim(), nom) && r[COLS.impact] && String(r[COLS.impact]).includes(';'))
                : DATA.filter(r => r[COLS.club] === 'FENIX'  && (!matchFilter || r[COLS.rencontre] === matchFilter) && matchPlayerName((r[COLS.joueur]||'').toString().trim(), nom)   && r[COLS.impact] && String(r[COLS.impact]).includes(';'));

            const impactTitle  = isGB ? 'ARRÊTS ET BUTS CONCÉDÉS' : 'ZONES DE TIR';
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

            const actionsHTML  = isGB ? _buildGbZoneTableHTML(nom, matchFilter) : _buildDetailedActionsHTML(nom, matchFilter);
            const actionsTitle = isGB ? 'STATS PAR ZONE' : 'ACTIONS';

            wrap.innerHTML = `
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
            addFSButtons(wrap);
        }

        // ── Stats Match : équipes ────────────────────────────────────────────────
        function renderPlayerMatchStats() {
            const selEl      = document.getElementById('pm-match-sel');
            const matchFilter = selEl ? selEl.value : '';
            const filtered   = matchFilter ? DATA.filter(r=>r[COLS.rencontre]===matchFilter) : DATA;
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
                const neut=rows.filter(r=>r[COLS.resultat]==='Jet franc').length;
                const eff=total>0?Math.round(buts/total*100):0;
                return {buts,rates,total,penB,penT,poss,pb,po,neut,eff};
            };

            const rd=(n,d)=>Math.round(n/d);
            const fv=compute(fenix), av=compute(adv);
            const advName = matchFilter ? ([...new Set(adv.map(r=>r[COLS.club]).filter(Boolean))][0]||'ADVERSAIRE') : 'ADVERSAIRE';

            const card=(data,color,title)=>{
                const d=showAvg?{poss:rd(data.poss,matchCount),buts:`${rd(data.buts,matchCount)}/${rd(data.total,matchCount)}`,pen:`Pen: ${rd(data.penB,matchCount)}/${rd(data.penT,matchCount)}`,pb:rd(data.pb,matchCount),po:rd(data.po,matchCount),neut:rd(data.neut,matchCount)}:{poss:data.poss,buts:`${data.buts}/${data.total}`,pen:`Pen: ${data.penB}/${data.penT}`,pb:data.pb,po:data.po,neut:data.neut};
                return `<div class="pm-team-card" style="border-left:4px solid ${color}">
                    <div class="pm-team-title"><span class="pm-dot" style="background:${color}"></span><strong>${title}</strong>${showAvg?'<span class="pm-avg-lbl">(Moy./match)</span>':''}</div>
                    <div class="pm-stats-grid">
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.poss}</div><div class="pm-stat-lbl">POSSESSIONS</div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.buts}</div><div class="pm-stat-lbl">BUTS<br><small style="color:#94a3b8">${d.pen}</small></div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val" style="color:${color}">${data.eff}%</div><div class="pm-stat-lbl">% RÉUSSITE</div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.pb}</div><div class="pm-stat-lbl">PERTES DE BALLE</div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.po}</div><div class="pm-stat-lbl">PEN. OBTENUS</div></div>
                        <div class="pm-stat-box"><div class="pm-stat-val">${d.neut}</div><div class="pm-stat-lbl">NEUTRALISÉ</div></div>
                    </div>
                </div>`;
            };

            const cardsEl = document.getElementById('pm-match-cards');
            if (cardsEl) cardsEl.innerHTML = card(fv,'#0A2463','FENIX TOULOUSE') + card(av,'#EF4444',advName);

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
                addFSButtons(wrap);

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
                addFSButtons(wrap);
            }
        }

        // ── Sélecteur de match (mode joueur) ────────────────────────────────────
        function buildPmMatchSelector() {
            const sel = document.getElementById('pm-match-sel');
            if (!sel) return;
            sel.innerHTML = '<option value="">Tous les matchs</option>'
                + MATCHS.map(m=>`<option value="${m}">${m}</option>`).join('');
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

        // ── Modal plein écran carte ───────────────────────────────────────────────
        let _fsOrigParent = null;
        let _fsOrigNext   = null;

        function pmOpenFS(btn) {
            const card  = btn.closest('.pmf-card');
            const modal = document.getElementById('pmf-fs-modal');
            const inner = document.getElementById('pmf-fs-inner');
            if (!modal || !inner || !card) return;

            _fsOrigParent = card.parentElement;
            _fsOrigNext   = card.nextSibling;

            inner.appendChild(card);
            modal.style.display = 'flex';
            document.body.classList.add('pmf-fs-active');

            setTimeout(() => _fsRedrawCanvases(card), 150);
        }

        function pmCloseFS() {
            const modal = document.getElementById('pmf-fs-modal');
            const inner = document.getElementById('pmf-fs-inner');
            if (!modal) return;
            const card = inner ? inner.querySelector('.pmf-card') : null;
            if (card && _fsOrigParent) {
                if (_fsOrigNext && _fsOrigNext.parentElement === _fsOrigParent) {
                    _fsOrigParent.insertBefore(card, _fsOrigNext);
                } else {
                    _fsOrigParent.appendChild(card);
                }
                setTimeout(() => _fsRedrawCanvases(card), 80);
            }
            modal.style.display = 'none';
            document.body.classList.remove('pmf-fs-active');
            _fsOrigParent = null; _fsOrigNext = null;
        }

        function pmCloseFSBackdrop(e) {
            if (e.target === document.getElementById('pmf-fs-modal')) pmCloseFS();
        }

        function _fsRedrawCanvases(card) {
            const inModal = !!document.getElementById('pmf-fs-inner')?.contains(card);
            if (card.querySelector('#pmf-graph-canvas')) {
                // Adapter la hauteur du wrapper selon le contexte
                const wrap = card.querySelector('.pmf-graph-wrap');
                if (wrap) wrap.style.height = inModal ? '65vh' : '280px';
                const nom = getSessionPlayerNom();
                if (nom) renderPmfGraph(nom);
            }
            if (card.querySelector('#pmm-canvas-alg')) {
                const rows = _pmmZoneFilter ? _pmmImpactRows.filter(r => (r[COLS.field_position]||'').toString().trim() === _pmmZoneFilter) : _pmmImpactRows;
                _drawMatchExtrasImpact(rows);
            }
        }

        function addFSButtons(root) {
            const container = root || document;
            container.querySelectorAll('.pmf-card').forEach(card => {
                if (card.querySelector('.pmf-fs-btn')) return;
                const btn = document.createElement('button');
                btn.className = 'pmf-fs-btn';
                btn.textContent = '⛶';
                btn.title = 'Plein écran';
                btn.onclick = () => pmOpenFS(btn);
                card.insertBefore(btn, card.firstChild);
            });
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
                if (e.key === 'Escape') pmCloseFS();
            });
        });
