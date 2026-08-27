        function _getJoueurBilanMatchs() {
            const val = document.getElementById('filter-joueur-bilan')?.value || '';
            if (!val || typeof BILANS === 'undefined') return null;
            return BILANS.find(b => b.nom === val)?.matchs || null;
        }

        function renderCourtPlayers(activeNames) {
            const g = document.getElementById('court-players');
            if (!g) return;

            // ── Calculs AVANT de toucher au DOM (évite fenêtre vide si le navigateur force un repaint) ──
            const matchFilter = document.getElementById('filter-joueur-match')?.value || '';
            const bilanMatchs = _getJoueurBilanMatchs();
            const playerEff = {};
            JOUEURS_TERRAIN.forEach(p => {
                if (p.poste === 'GB') {
                    const gbRows = DATA.filter(row => {
                        if (row[COLS.club] === 'FENIX') return false;
                        if (matchFilter && row[COLS.rencontre] !== matchFilter) return false;
                        if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return false;
                        const gn = (row[COLS.gardien] || '').toString().trim();
                        if (!matchPlayerName(gn, p.nom)) return false;
                        return row[COLS.resultat] === 'But' || row[COLS.finalite] === 'Tir arrêté';
                    });
                    const arrets     = gbRows.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
                    const butsConced = gbRows.filter(r => r[COLS.resultat] === 'But').length;
                    const totalFaced = arrets + butsConced;
                    playerEff[p.nom] = totalFaced > 0 ? Math.round(arrets / totalFaced * 100) : null;
                } else {
                    const rows = DATA.filter(row => {
                        if (row[COLS.club] !== 'FENIX') return false;
                        if (matchFilter && row[COLS.rencontre] !== matchFilter) return false;
                        if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return false;
                        return matchPlayerName((row[COLS.joueur] || '').toString().trim(), p.nom);
                    });
                    const buts  = rows.filter(r => r[COLS.resultat] === 'But').length;
                    const shots = rows.filter(r => ['But', 'Tir raté'].includes(r[COLS.resultat])).length;
                    playerEff[p.nom] = shots > 0 ? Math.round(buts / shots * 100) : null;
                }
            });

            const effectiveMatchList = matchFilter ? [matchFilter] : (bilanMatchs || MATCHS || []);

            // ── Construction dans un fragment off-DOM ──
            const frag = document.createDocumentFragment();
            JOUEURS_TERRAIN.forEach(p => {
                const isActive   = activeNames.size === 0 || [...activeNames].some(n => matchPlayerName(n, p.nom));
                const isSelected = p.nom === currentSelectedJoueur;
                const opacity    = isActive ? 1 : 0.28;
                const r          = isSelected ? 4.5 : 3.5;

                const eff        = playerEff[p.nom];
                const tjData     = getTJData(p.nom, effectiveMatchList);
                const tjAvg      = tjData.matchs > 0 ? tjData.total / tjData.matchs : 0;
                const qualified  = tjData.matchs >= 6 && tjAvg >= 20;
                const ringClr    = qualified && eff !== null ? getEffColor(eff, p.poste) : '#e2e8f0';
                const initials   = (p.nomComplet || p.nom).split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
                const safeName   = p.nom.replace(/'/g, "\\'");

                const elem = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                elem.setAttribute('class', 'court-player');
                elem.setAttribute('onclick', `selectJoueur('${safeName}')`);
                elem.setAttribute('opacity', opacity);

                // createElementNS évite le flash noir : innerHTML SVG applique fill="black" par défaut avant les attributs explicites
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', p.x); circle.setAttribute('cy', p.y);
                circle.setAttribute('r', r); circle.setAttribute('fill', '#e2e8f0');
                circle.setAttribute('stroke', ringClr); circle.setAttribute('stroke-width', '1.5');
                elem.appendChild(circle);

                if (isSelected) {
                    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
                    ring.setAttribute('r', r + 2); ring.setAttribute('fill', 'none');
                    ring.setAttribute('stroke', '#FCD34D'); ring.setAttribute('stroke-width', '1.2');
                    elem.appendChild(ring);
                }

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', p.x); text.setAttribute('y', p.y + 0.3);
                text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('font-family', 'Inter,sans-serif'); text.setAttribute('font-size', '2.0');
                text.setAttribute('font-weight', '700'); text.setAttribute('fill', '#0f172a');
                text.textContent = initials;
                elem.appendChild(text);

                frag.appendChild(elem);
            });

            // ── Swap atomique : clear puis insert en une seule opération ──
            g.innerHTML = '';
            g.appendChild(frag);
        }

        function selectJoueur(nom) {
            currentSelectedJoueur = nom;
            const terrainPlayer = JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom));
            const color = terrainPlayer ? POSTE_COLORS[terrainPlayer.poste] : '#0A2463';
            const posteName = {
                GB: 'Gardien de But', AG: 'Ailier Gauche', AD: 'Ailier Droit',
                ARG: 'Arrière Gauche', ARD: 'Arrière Droit', DC: 'Demi-Centre', PIV: 'Pivot'
            };
            const posteCode  = terrainPlayer ? terrainPlayer.poste : '';
            const posteLabel = posteName[posteCode] || posteCode;
            const displayNom = terrainPlayer ? (terrainPlayer.nomComplet || terrainPlayer.nom) : nom;
            const initials   = displayNom.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

            // Stats globales filtrées par le filtre match actif + bilan
            const matchFilter = document.getElementById('filter-joueur-match').value;
            const bilanMatchs = _getJoueurBilanMatchs();
            const rowsFiltered = DATA.filter(row => {
                if (row[COLS.club] !== 'FENIX') return false;
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return false;
                if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return false;
                return matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom);
            });
            const buts  = rowsFiltered.filter(r => r[COLS.resultat] === 'But').length;
            const tirs  = rowsFiltered.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const pb    = rowsFiltered.filter(r => r[COLS.resultat] === 'PB').length;
            const po    = rowsFiltered.filter(r => r[COLS.resultat] === 'PO').length;
            const total = buts + tirs;
            const eff   = total > 0 ? Math.round(buts / total * 100) : 0;

            // PD — depuis action_joueur / action_att (filtré match)
            let pd = 0;
            DATA.forEach(row => {
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                (row[COLS.action_joueur] || '').toString().split(';').forEach((j, i) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    const act = lastNonEmpty((row[COLS.action_att] || '').toString().split(';'), i);
                    if (act === 'PD' || act === 'PD DG') pd++;
                });
            });

            // Note — somme actions att + def (filtré match + bilan)
            let attPlus = 0, attMoins = 0, defPlus = 0, defMoins = 0;
            DATA.forEach(row => {
                if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                const joueurs = (row[COLS.action_joueur] || '').toString().split(';');
                const atts   = (row[COLS.action_att]    || '').toString().split(';');
                const defs   = (row[COLS.action_def]    || '').toString().split(';');
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
            const noteColor  = note > 0 ? 'var(--fenix-success)' : note < 0 ? 'var(--fenix-danger)' : '#64748B';
            const noteDisplay = (note > 0 ? '+' : '') + note;

            // ── Carte joueur (droite du terrain) ──────────────────────────────
            const effectiveTJMatchs = matchFilter ? [matchFilter] : (bilanMatchs || MATCHS);
            const tjNom = getTJData(nom, effectiveTJMatchs);
            const tjHeaderStr = tjNom.matchs
                ? `<div style="display:flex;gap:1rem;margin-top:0.35rem;font-size:0.75rem;opacity:0.9;">
                    <span>⏱ ${tjNom.matchs} matchs</span>
                    <span>⌀ ${Math.round(tjNom.total / tjNom.matchs)} min/match</span>
                  </div>`
                : '';
            const jpHeader = `
                <div class="jp-header" style="background:linear-gradient(135deg,${color} 0%,${color}cc 100%);">
                    <div class="jp-avatar">${initials}</div>
                    <div style="flex:1">
                        <div class="jp-name">${displayNom}</div>
                        <div class="jp-poste-label">${posteCode} — ${posteLabel}</div>
                        ${tjHeaderStr}
                        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                            <button class="jp-print-btn" onclick="printFicheJoueur()">🖨️ PDF</button>
                            <button class="jp-print-btn" onclick="exportJoueurPPT()" style="background:rgba(255,255,255,0.25)">📊 PowerPoint</button>
                        </div>
                    </div>
                </div>`;

            // ── Badges (rang note, top att/def, rang TJ, progression) ──────────
            const staffBadges = [];
            if (typeof computePlayerRank === 'function' && posteCode) {
                const rnk = computePlayerRank(nom, posteCode);
                if (rnk && rnk.total > 1) {
                    const m = rnk.rank === 1 ? '🥇' : rnk.rank === 2 ? '🥈' : rnk.rank === 3 ? '🥉' : null;
                    if (m) staffBadges.push(`${m} #${rnk.rank} au poste`);
                }
            }
            if (typeof _computeNoteScore === 'function' && posteCode && posteCode !== 'GB' && JOUEURS_TERRAIN) {
                const tms = JOUEURS_TERRAIN.filter(p => p.poste === posteCode && p.nom !== nom);
                if (tms.length > 0) {
                    const mn = _computeNoteScore(nom, posteCode);
                    if (mn.att > 0 && tms.every(p => _computeNoteScore(p.nom, posteCode).att <= mn.att)) staffBadges.push('⚡ Top ATT au poste');
                    if (mn.def > 0 && tms.every(p => _computeNoteScore(p.nom, posteCode).def <= mn.def)) staffBadges.push('🛡️ Top DEF au poste');
                }
            }
            if (posteCode && typeof JOUEURS_TERRAIN !== 'undefined') {
                const tms = JOUEURS_TERRAIN.filter(p => p.poste === posteCode && p.nom !== nom);
                if (tms.length > 0) {
                    const myTJData = getTJData(nom, effectiveTJMatchs);
                    const myTJAvg = myTJData.matchs > 0 ? myTJData.total / myTJData.matchs : 0;
                    let tjRank = 1;
                    tms.forEach(p => {
                        const d = getTJData(p.nom, effectiveTJMatchs);
                        const avg = d.matchs > 0 ? d.total / d.matchs : 0;
                        if (avg > myTJAvg) tjRank++;
                    });
                    const tjM = tjRank === 1 ? '🥇' : tjRank === 2 ? '🥈' : tjRank === 3 ? '🥉' : null;
                    if (tjM) staffBadges.push(`${tjM} #${tjRank} TJ au poste`);
                }
            }
            if (typeof computeStreak === 'function') {
                const str = computeStreak(nom);
                if (str.dir === 1 && str.streak >= 3) staffBadges.push(`↑ En progression (${str.streak} matchs)`);
                else if (str.dir === -1 && str.streak >= 3) staffBadges.push(`↓ En baisse (${str.streak} matchs)`);
            }
            const badgesHTML = staffBadges.length
                ? `<div style="display:flex;flex-wrap:wrap;gap:5px;padding:8px 12px;border-bottom:1px solid #F1F5F9">
                    ${staffBadges.map(b => `<span style="background:#EFF6FF;color:#1E3A8A;border:1px solid #BFDBFE;border-radius:20px;padding:3px 10px;font-size:0.72rem;font-weight:700">${b}</span>`).join('')}
                   </div>` : '';

            if (posteCode === 'GB') {
                // Stats gardien : tirs adverses sur lignes club≠FENIX, filtrées sur gardien
                const gbRows = DATA.filter(row => {
                    if (row[COLS.club] === 'FENIX') return false;
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return false;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return false;
                    const g = (row[COLS.gardien] || '').toString().trim();
                    if (!matchPlayerName(g, nom)) return false;
                    return row[COLS.resultat] === 'But' || row[COLS.finalite] === 'Tir arrêté';
                });
                const arrets     = gbRows.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
                const butsConced = gbRows.filter(r => r[COLS.resultat] === 'But').length;
                const totalFaced = arrets + butsConced;
                const gbEff      = totalFaced > 0 ? Math.round(arrets / totalFaced * 100) : 0;
                const gbEffColor = totalFaced === 0 ? '#94A3B8' : getEffColor(gbEff, 'GB');

                // PD depuis action_joueur / action_att
                let gbPd = 0;
                DATA.forEach(row => {
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    (row[COLS.action_joueur] || '').toString().split(';').forEach((j, i) => {
                        if (!matchPlayerName(j.trim(), nom)) return;
                        const act = lastNonEmpty((row[COLS.action_att] || '').toString().split(';'), i);
                        if (act === 'PD' || act === 'PD DG') gbPd++;
                    });
                });

                // Buts marqués par le GB → lignes FENIX, joueur=GB
                const gbButs = DATA.filter(row =>
                    row[COLS.club] === 'FENIX' &&
                    (!matchFilter || row[COLS.rencontre] === matchFilter) &&
                    (!bilanMatchs || bilanMatchs.includes(row[COLS.rencontre])) &&
                    matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom) &&
                    row[COLS.resultat] === 'But'
                ).length;

                // Note GB : utiliser le système de scoring gardien (zone-weighted)
                const gbAllNotes = calculateGardienNotes(buildEffectiveMatchFilter(matchFilter, bilanMatchs));
                const gbNoteEntry = Object.entries(gbAllNotes).find(([k]) => matchPlayerName(k, nom));
                const gbNoteTotal = gbNoteEntry
                    ? (gbNoteEntry[1].scoreArrets + gbNoteEntry[1].scoreButs + gbNoteEntry[1].bonus)
                    : 0;
                const gbNoteColor   = gbNoteTotal > 0 ? 'var(--fenix-success)' : gbNoteTotal < 0 ? 'var(--fenix-danger)' : '#64748B';
                const gbNoteDisplay = (gbNoteTotal > 0 ? '+' : '') + gbNoteTotal;

                document.getElementById('joueur-panel').innerHTML = jpHeader + badgesHTML + `
                    <div class="jp-stats-grid" style="grid-template-columns:repeat(5,1fr)">
                        <div class="jp-stat"><div class="jp-val">${arrets}/${totalFaced}</div><div class="jp-lbl">Arrêts / Tirs</div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:${gbEffColor}">${gbEff}%</div><div class="jp-lbl">Efficacité</div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:var(--fenix-accent)">${gbPd}</div><div class="jp-lbl">PD</div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:var(--fenix-success)">${gbButs}</div><div class="jp-lbl">Buts marqués</div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:${gbNoteColor}">${gbNoteDisplay}</div><div class="jp-lbl" style="display:flex;align-items:center;justify-content:center;gap:2px;">Note GB<span title="Score pondéré par zone : arrêt difficile = +3 pts, arrêt moyen = +2 pts, arrêt facile = +1 pt, but concédé = -1 pt" style="cursor:help;background:#CBD5E1;color:#1E293B;border-radius:50%;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;flex-shrink:0">i</span></div></div>
                    </div>`;
            } else {
                document.getElementById('joueur-panel').innerHTML = jpHeader + badgesHTML + `
                    <div class="jp-stats-grid">
                        <div class="jp-stat"><div class="jp-val">${buts}/${total}</div><div class="jp-lbl">But / Tir</div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:${effColor(posteCode, eff, total)}">${eff}%</div><div class="jp-lbl" style="display:flex;align-items:center;justify-content:center;gap:2px;">Efficacité<span class="eff-info-btn" onclick="openEffInfoModal(event,'${posteCode}')">i</span></div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:var(--fenix-accent)">${pd}</div><div class="jp-lbl">PD</div></div>
                        <div class="jp-stat"><div class="jp-val">${po}</div><div class="jp-lbl">Pén. obtenus</div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:var(--fenix-danger)">${pb}</div><div class="jp-lbl">Pertes balle</div></div>
                        <div class="jp-stat"><div class="jp-val" style="color:${noteColor}">${noteDisplay}</div><div class="jp-lbl">Note</div></div>
                    </div>`;
            }

            // ── Tableau détail par match (filtré bilan + match) ──────────────
            const matchesDiv = document.getElementById('joueur-matches');
            matchesDiv.style.display = 'block';

            if (posteCode === 'GB') {
                const gbSbm = {};
                const initGb = () => ({ ac:0, bc:0, ap:0, bp:0, pd:0, pb:0, but:0 });

                // Tirs adverses → arrêts et buts concédés (lignes adverses, gardien=GB)
                DATA.forEach(row => {
                    if (row[COLS.club] === 'FENIX') return;
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    const g = (row[COLS.gardien] || '').toString().trim();
                    if (!matchPlayerName(g, nom)) return;
                    const m = row[COLS.rencontre]; if (!m) return;
                    if (!gbSbm[m]) gbSbm[m] = initGb();
                    const isPen   = (row[COLS.ge] || '').toString().toLowerCase().includes('pen');
                    const isArret = row[COLS.finalite] === 'Tir arrêté';
                    const isBut   = row[COLS.resultat] === 'But';
                    if (!isArret && !isBut) return;
                    if (isPen) { isArret ? gbSbm[m].ap++ : gbSbm[m].bp++; }
                    else       { isArret ? gbSbm[m].ac++ : gbSbm[m].bc++; }
                });

                // Buts marqués + PB du GB → lignes FENIX, joueur=GB
                DATA.forEach(row => {
                    if (row[COLS.club] !== 'FENIX') return;
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    if (!matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom)) return;
                    const m = row[COLS.rencontre]; if (!m) return;
                    if (!gbSbm[m]) gbSbm[m] = initGb();
                    if (row[COLS.resultat] === 'But') gbSbm[m].but++;
                    if (row[COLS.resultat] === 'PB')  gbSbm[m].pb++;
                });

                // PD → action_joueur (GB) + action_att
                DATA.forEach(row => {
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    const m = row[COLS.rencontre]; if (!m) return;
                    (row[COLS.action_joueur] || '').toString().split(';').forEach((j, i) => {
                        if (!matchPlayerName(j.trim(), nom)) return;
                        const act = lastNonEmpty((row[COLS.action_att] || '').toString().split(';'), i);
                        if (act === 'PD' || act === 'PD DG') {
                            if (!gbSbm[m]) gbSbm[m] = initGb();
                            gbSbm[m].pd++;
                        }
                    });
                });

                let gtot = initGb();
                let gbHTML = '';
                Object.entries(gbSbm).forEach(([m, s]) => {
                    const tC=s.ac+s.bc, tP=s.ap+s.bp, tT=tC+tP, aT=s.ac+s.ap;
                    Object.keys(gtot).forEach(k => gtot[k] += s[k]);
                    const tjEntryG = findTJEntry(nom);
                    const tjMinG = tjEntryG && tjEntryG[m] !== undefined ? ` <span style="color:#94A3B8;font-size:0.8em">(${tjEntryG[m]} min)</span>` : '';
                    gbHTML += `<tr>
                        <td style="color:${matchResultColor(m)}">${m}${tjMinG}</td>
                        <td>${aT}/${tT}</td><td>${tT>0?Math.round(aT/tT*100)+'%':'-'}</td>
                        <td>${s.ac}/${tC}</td><td>${tC>0?Math.round(s.ac/tC*100)+'%':'-'}</td>
                        <td>${s.ap}/${tP}</td><td>${tP>0?Math.round(s.ap/tP*100)+'%':'-'}</td>
                        <td>${s.but}</td><td>${s.pd}</td><td>${s.pb}</td>
                    </tr>`;
                });
                const gtC=gtot.ac+gtot.bc, gtP=gtot.ap+gtot.bp, gtT=gtC+gtP, gaT=gtot.ac+gtot.ap;
                gbHTML += `<tr class="jm-total-row">
                    <td>TOTAL</td>
                    <td>${gaT}/${gtT}</td><td>${gtT>0?Math.round(gaT/gtT*100)+'%':'-'}</td>
                    <td>${gtot.ac}/${gtC}</td><td>${gtC>0?Math.round(gtot.ac/gtC*100)+'%':'-'}</td>
                    <td>${gtot.ap}/${gtP}</td><td>${gtP>0?Math.round(gtot.ap/gtP*100)+'%':'-'}</td>
                    <td>${gtot.but}</td><td>${gtot.pd}</td><td>${gtot.pb}</td>
                </tr>`;

                matchesDiv.innerHTML = `
                    <div class="jm-header">📊 DÉTAIL PAR MATCH — ${displayNom}</div>
                    <div style="overflow-x:auto">
                    <table class="jm-table">
                        <thead><tr>
                            <th>Match</th>
                            <th>Total</th><th>%</th>
                            <th>Champ</th><th>%</th>
                            <th>Pen</th><th>%</th>
                            <th>But</th><th>PD</th><th>PB</th>
                        </tr></thead>
                        <tbody>${gbHTML}</tbody>
                    </table></div>`;

            } else {
                // ── Joueur de champ ───────────────────────────────────────────
                const initField = () => ({ bc:0, tc:0, bp:0, tp:0, pb:0, po:0, pd:0, ap:0, am:0, dp:0, dm:0 });
                const sbm = {};
                DATA.forEach(row => {
                    if (row[COLS.club] !== 'FENIX') return;
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    if (!matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom)) return;
                    const m = row[COLS.rencontre]; if (!m) return;
                    if (!sbm[m]) sbm[m] = initField();
                    const isPen = (row[COLS.ge] || '').toString().toLowerCase().includes('pen');
                    if (row[COLS.resultat] === 'But')           { isPen ? sbm[m].bp++ : sbm[m].bc++; }
                    else if (row[COLS.resultat] === 'Tir raté') { isPen ? sbm[m].tp++ : sbm[m].tc++; }
                    else if (row[COLS.resultat] === 'PB')  sbm[m].pb++;
                    else if (row[COLS.resultat] === 'PO')  sbm[m].po++;
                });
                DATA.forEach(row => {
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    const m = row[COLS.rencontre]; if (!m) return;
                    const joueurs = (row[COLS.action_joueur] || '').toString().split(';');
                    const atts = (row[COLS.action_att] || '').toString().split(';');
                    const defs = (row[COLS.action_def] || '').toString().split(';');
                    joueurs.forEach((j, idx) => {
                        if (!matchPlayerName(j.trim(), nom)) return;
                        if (!sbm[m]) sbm[m] = initField();
                        const att = lastNonEmpty(atts, idx);
                        const def = lastNonEmpty(defs, idx);
                        if (att === 'PD' || att === 'PD DG') sbm[m].pd++;
                        if (isPositiveATT(att)) sbm[m].ap++;
                        else if (isNegativeATT(att)) sbm[m].am++;
                        if (isPositiveDEF(def)) sbm[m].dp++;
                        else if (isNegativeDEF(def)) sbm[m].dm++;
                    });
                });

                const nc = v => v > 0 ? `<span style="color:#059669;font-weight:700">+${v}</span>` : v < 0 ? `<span style="color:#DC2626;font-weight:700">${v}</span>` : `<span style="color:#64748B">0</span>`;
                let tot = initField();
                let tbodyHTML = '';
                Object.entries(sbm).forEach(([m, s]) => {
                    const tC=s.bc+s.tc, tP=s.bp+s.tp, tT=tC+tP, tB=s.bc+s.bp;
                    const nA=s.ap-s.am, nD=s.dp-s.dm, nT=nA+nD;
                    Object.keys(tot).forEach(k => tot[k] += s[k]);
                    const tjEntry = findTJEntry(nom);
                    const tjMin = tjEntry && tjEntry[m] !== undefined ? ` <span style="color:#94A3B8;font-size:0.8em">(${tjEntry[m]} min)</span>` : '';
                    tbodyHTML += `<tr>
                        <td style="color:${matchResultColor(m)}">${m}${tjMin}</td>
                        <td>${s.bc}/${tC}</td>
                        <td>${tC>0?Math.round(s.bc/tC*100)+'%':'-'}</td>
                        <td>${tP>0?s.bp+'/'+tP:'-'}</td>
                        <td>${tP>0?Math.round(s.bp/tP*100)+'%':'-'}</td>
                        <td>${tT>0?Math.round(tB/tT*100)+'%':'-'}</td>
                        <td>${s.pb}</td><td>${s.po}</td><td>${s.pd}</td>
                        <td>${nc(nA)}</td><td>${nc(nD)}</td><td>${nc(nT)}</td>
                    </tr>`;
                });
                const tC=tot.bc+tot.tc, tP=tot.bp+tot.tp, tT=tC+tP, tB=tot.bc+tot.bp;
                const tNA=tot.ap-tot.am, tND=tot.dp-tot.dm, tNT=tNA+tND;
                tbodyHTML += `<tr class="jm-total-row">
                    <td>TOTAL</td>
                    <td>${tot.bc}/${tC}</td>
                    <td>${tC>0?Math.round(tot.bc/tC*100)+'%':'-'}</td>
                    <td>${tP>0?tot.bp+'/'+tP:'-'}</td>
                    <td>${tP>0?Math.round(tot.bp/tP*100)+'%':'-'}</td>
                    <td>${tT>0?Math.round(tB/tT*100)+'%':'-'}</td>
                    <td>${tot.pb}</td><td>${tot.po}</td><td>${tot.pd}</td>
                    <td>${nc(tNA)}</td><td>${nc(tND)}</td><td>${nc(tNT)}</td>
                </tr>`;

                matchesDiv.innerHTML = `
                    <div class="jm-header">📊 DÉTAIL PAR MATCH — ${displayNom}</div>
                    <div style="overflow-x:auto"><table class="jm-table">
                        <thead><tr>
                            <th>Match</th>
                            <th>B/T</th><th>%Ch</th>
                            <th>Pen</th><th>%Pen</th><th>%Tot</th>
                            <th>PB</th><th>PO</th><th>PD</th>
                            <th class="jm-note-col">⭐⭐ATT</th><th class="jm-note-col">⭐DEF</th><th class="jm-note-col">★Tot</th>
                        </tr></thead>
                        <tbody>${tbodyHTML}</tbody>
                    </table></div>`;
            }

            renderCourtPlayers(getPlayersInData());
            if (typeof updatePlayerContextButtons === 'function') updatePlayerContextButtons();
        }

        // ── Joueurs page update ────────────────────────────────────────────────
        function updateJoueursPage() {
            if (typeof isPlayerMode === 'function' && isPlayerMode()) return;

            // Rebuild match dropdown selon bilan actif
            const bilanMatchs = _getJoueurBilanMatchs();
            const matchSel = document.getElementById('filter-joueur-match');
            if (matchSel) {
                const currentVal = matchSel.value;
                const activeSaison = document.getElementById('filter-saison')?.value || '';
                const allMatchs = bilanMatchs || (activeSaison
                    ? [...new Set(DATA.filter(r => r[COLS.saison] === activeSaison).map(r => r[COLS.rencontre]).filter(Boolean))]
                    : MATCHS);
                matchSel.innerHTML = '<option value="">Tous les matchs</option>';
                allMatchs.forEach(m => matchSel.innerHTML += `<option value="${m}">${m}</option>`);
                matchSel.value = (bilanMatchs && currentVal && !bilanMatchs.includes(currentVal)) ? '' : currentVal;
            }

            const warningDiv = document.getElementById('joueur-name-warnings');
            if (warningDiv) {
                const dupes = checkDuplicateNames();
                if (dupes.length > 0) {
                    warningDiv.style.display = 'block';
                    warningDiv.innerHTML = `<div class="joueur-warning-banner">⚠️ Noms en double sur le terrain — stats mélangées : <strong>${dupes.join(', ')}</strong></div>`;
                } else {
                    warningDiv.style.display = 'none';
                }
            }

            const activeNames = getPlayersInData();
            renderCourtPlayers(activeNames);
            if (currentSelectedJoueur) {
                selectJoueur(currentSelectedJoueur);
            } else {
                const md = document.getElementById('joueur-matches');
                if (md) md.style.display = 'none';
            }
        }

        // Modal Joueur
        function openPlayerModal(joueur) {
            document.getElementById('modal-player-name').textContent = '📊 ' + joueur + ' - Stats par match';

            const matchFilter  = document.getElementById('filter-joueur-match')?.value || '';
            const bilanMatchs  = _getJoueurBilanMatchs();

            // Calculer les stats par match pour ce joueur
            const statsByMatch = {};

            // Stats depuis colonne Joueur + Resultat
            DATA.forEach(row => {
                if (row[COLS.club] !== 'FENIX') return;
                if (!matchPlayerName((row[COLS.joueur] || '').toString().trim(), joueur)) return;

                const match = row[COLS.rencontre];
                if (!match) return;
                if (matchFilter && match !== matchFilter) return;
                if (bilanMatchs && !bilanMatchs.includes(match)) return;
                
                if (!statsByMatch[match]) {
                    statsByMatch[match] = { 
                        butsChamp: 0, tirsChamp: 0, 
                        butsPen: 0, tirsPen: 0,
                        pb: 0, po: 0, pd: 0 
                    };
                }
                
                const isPen = row[COLS.ge] && row[COLS.ge].toString().toLowerCase().includes('pen');
                
                if (row[COLS.resultat] === 'But') {
                    if (isPen) statsByMatch[match].butsPen++;
                    else statsByMatch[match].butsChamp++;
                } else if (row[COLS.resultat] === 'Tir raté') {
                    if (isPen) statsByMatch[match].tirsPen++;
                    else statsByMatch[match].tirsChamp++;
                } else if (row[COLS.resultat] === 'PB') {
                    statsByMatch[match].pb++;
                } else if (row[COLS.resultat] === 'PO') {
                    statsByMatch[match].po++;
                }
            });
            
            // PD depuis Action Joueur + Action ATT
            DATA.forEach(row => {
                if (row[COLS.club] !== 'FENIX') return;
                const match = row[COLS.rencontre];
                if (!match) return;
                if (matchFilter && match !== matchFilter) return;
                if (bilanMatchs && !bilanMatchs.includes(match)) return;

                const actionJoueurs = (row[COLS.action_joueur] || '').toString().split(';');
                const actionsAtt = (row[COLS.action_att] || '').toString().split(';');
                
                actionJoueurs.forEach((j, idx) => {
                    if (matchPlayerName(j.trim(), joueur)) {
                        const action = lastNonEmpty(actionsAtt, idx);
                        if (action === 'PD' || action === 'PD DG') {
                            if (!statsByMatch[match]) {
                                statsByMatch[match] = { butsChamp: 0, tirsChamp: 0, butsPen: 0, tirsPen: 0, pb: 0, po: 0, pd: 0 };
                            }
                            statsByMatch[match].pd++;
                        }
                    }
                });
            });
            
            // Générer le tableau
            const tbody = document.getElementById('modal-player-stats');
            tbody.innerHTML = '';
            
            let totals = { butsChamp: 0, tirsChamp: 0, butsPen: 0, tirsPen: 0, pb: 0, po: 0, pd: 0 };
            
            Object.entries(statsByMatch).forEach(([match, stats]) => {
                const totalChamp = stats.butsChamp + stats.tirsChamp;
                const totalPen = stats.butsPen + stats.tirsPen;
                const totalTirs = totalChamp + totalPen;
                const totalButs = stats.butsChamp + stats.butsPen;
                
                const pctChamp = totalChamp > 0 ? Math.round(stats.butsChamp / totalChamp * 100) : '-';
                const pctPen = totalPen > 0 ? Math.round(stats.butsPen / totalPen * 100) : '-';
                const pctTotal = totalTirs > 0 ? Math.round(totalButs / totalTirs * 100) : '-';
                
                totals.butsChamp += stats.butsChamp;
                totals.tirsChamp += stats.tirsChamp;
                totals.butsPen += stats.butsPen;
                totals.tirsPen += stats.tirsPen;
                totals.pb += stats.pb;
                totals.po += stats.po;
                totals.pd += stats.pd;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${match}</strong></td>
                    <td>${stats.butsChamp}</td>
                    <td>${stats.tirsChamp}</td>
                    <td>${pctChamp}${pctChamp !== '-' ? '%' : ''}</td>
                    <td>${stats.butsPen}/${totalPen}</td>
                    <td>${pctPen}${pctPen !== '-' ? '%' : ''}</td>
                    <td style="font-weight: bold; color: var(--fenix-blue);">${pctTotal}${pctTotal !== '-' ? '%' : ''}</td>
                    <td>${stats.pb}</td>
                    <td>${stats.po}</td>
                    <td>${stats.pd}</td>
                `;
                tbody.appendChild(tr);
            });
            
            // Ligne Total
            const totalChamp = totals.butsChamp + totals.tirsChamp;
            const totalPen = totals.butsPen + totals.tirsPen;
            const totalTirs = totalChamp + totalPen;
            const totalButs = totals.butsChamp + totals.butsPen;
            
            const pctChampTotal = totalChamp > 0 ? Math.round(totals.butsChamp / totalChamp * 100) : 0;
            const pctPenTotal = totalPen > 0 ? Math.round(totals.butsPen / totalPen * 100) : 0;
            const pctTotalTotal = totalTirs > 0 ? Math.round(totalButs / totalTirs * 100) : 0;
            
            const totalRow = document.createElement('tr');
            totalRow.className = 'total-row';
            totalRow.innerHTML = `
                <td><strong>TOTAL</strong></td>
                <td>${totals.butsChamp}</td>
                <td>${totals.tirsChamp}</td>
                <td>${pctChampTotal}%</td>
                <td>${totals.butsPen}/${totalPen}</td>
                <td>${pctPenTotal}%</td>
                <td style="font-weight: bold;">${pctTotalTotal}%</td>
                <td>${totals.pb}</td>
                <td>${totals.po}</td>
                <td>${totals.pd}</td>
            `;
            tbody.appendChild(totalRow);
            
            document.getElementById('player-modal').style.display = 'flex';
        }

        function closePlayerModal() {
            document.getElementById('player-modal').style.display = 'none';
        }

        async function printFicheJoueur(renderOnly = false) {
            const panel   = document.getElementById('joueur-panel');
            const matches = document.getElementById('joueur-matches');
            if (!panel || !matches) return;

            const nom = currentSelectedJoueur;
            if (!nom) return;

            const isGB = (typeof detectIsGB === 'function') ? detectIsGB(nom) : (JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom)) || {}).poste === 'GB';
            const matchFilter   = document.getElementById('filter-joueur-match').value;
            const bilanMatchs   = _getJoueurBilanMatchs();

            // === 1. Détail actions (joueur de champ) ou Zones % (GB) ===
            let actionCardHTML;
            if (isGB) {
                const DIFF_ORDER = ['Très difficile', 'Difficile', 'Moyen', 'Facile', 'Très facile', null];
                const DIFF_COLOR = { 'Très difficile':'#FEE2E2', 'Difficile':'#FFEDD5', 'Moyen':'#FEF3C7', 'Facile':'#D1FAE5', 'Très facile':'#F1F5F9' };
                const gbZones = {};
                DATA.forEach(row => {
                    if (row[COLS.club] === 'FENIX') return;
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    const g = (row[COLS.gardien]||'').toString().trim();
                    if (!matchPlayerName(g, nom)) return;
                    const isArret = row[COLS.finalite] === 'Tir arrêté';
                    const isBut   = row[COLS.resultat] === 'But';
                    if (!isArret && !isBut) return;
                    const zone = (row[COLS.field_position]||'').toString().trim() || '(sans zone)';
                    if (!gbZones[zone]) gbZones[zone] = { arrets: 0, buts: 0 };
                    if (isArret) gbZones[zone].arrets++;
                    if (isBut)   gbZones[zone].buts++;
                });
                const wz = (typeof GB_ZONE_WEIGHTS !== 'undefined') ? GB_ZONE_WEIGHTS : {};
                const allZones = Object.keys(gbZones).sort((a, b) => {
                    const da = wz[a] ? DIFF_ORDER.indexOf(wz[a].diff) : 99;
                    const db = wz[b] ? DIFF_ORDER.indexOf(wz[b].diff) : 99;
                    return da - db;
                });
                const zoneRows = allZones.map(zone => {
                    const zd = gbZones[zone];
                    const tirs = zd.arrets + zd.buts;
                    const pct  = tirs > 0 ? Math.round(zd.arrets / tirs * 100) : 0;
                    const w    = wz[zone] || {};
                    const diff = w.diff || '—';
                    const bg   = DIFF_COLOR[diff] || '#ffffff';
                    const pctColor = pct >= 40 ? '#10B981' : '#EF4444';
                    return `<tr style="border-bottom:1px solid #F1F5F9">
                        <td style="padding:3px 6px;font-weight:600;font-size:0.78rem">${zone}</td>
                        <td style="padding:3px 6px"><span style="background:${bg};border-radius:4px;padding:0.1rem 0.3rem;font-size:0.72rem">${diff}</span></td>
                        <td style="padding:3px 6px;text-align:center;color:#10B981;font-weight:600">${zd.arrets}</td>
                        <td style="padding:3px 6px;text-align:center;color:#EF4444;font-weight:600">${zd.buts}</td>
                        <td style="padding:3px 6px;text-align:center;color:#64748b">${tirs}</td>
                        <td style="padding:3px 6px;text-align:center;font-weight:700;color:${pctColor}">${pct}%</td>
                    </tr>`;
                }).join('');
                actionCardHTML = `
                    <div style="margin:12px 0">
                        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.05rem;color:#0A2463;margin-bottom:8px;letter-spacing:1.5px">STATS PAR ZONE — GARDIEN</div>
                        <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
                            <thead><tr style="background:#F8FAFC">
                                <th style="padding:3px 6px;text-align:left;font-size:0.7rem;color:#475569;font-weight:700">ZONE</th>
                                <th style="padding:3px 6px;text-align:left;font-size:0.7rem;color:#475569;font-weight:700">DIFFICULTÉ</th>
                                <th style="padding:3px 6px;text-align:center;font-size:0.7rem;color:#10B981;font-weight:700">ARRÊTS</th>
                                <th style="padding:3px 6px;text-align:center;font-size:0.7rem;color:#EF4444;font-weight:700">BUTS</th>
                                <th style="padding:3px 6px;text-align:center;font-size:0.7rem;color:#64748b;font-weight:700">TIRS</th>
                                <th style="padding:3px 6px;text-align:center;font-size:0.7rem;color:#475569;font-weight:700">%</th>
                            </tr></thead>
                            <tbody>${zoneRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:1rem">Aucune donnée</td></tr>'}</tbody>
                        </table>
                    </div>`;
            } else {
                const counts = {};
                const matchSet = new Set();
                DATA.forEach(row => {
                    if (matchFilter && row[COLS.rencontre] !== matchFilter) return;
                    if (bilanMatchs && !bilanMatchs.includes(row[COLS.rencontre])) return;
                    const joueurs = (row[COLS.action_joueur] || '').toString().split(';');
                    const atts    = (row[COLS.action_att]    || '').toString().split(';');
                    const defs    = (row[COLS.action_def]    || '').toString().split(';');
                    joueurs.forEach((j, idx) => {
                        if (!matchPlayerName(j.trim(), nom)) return;
                        if (row[COLS.rencontre]) matchSet.add(row[COLS.rencontre]);
                        const att = lastNonEmpty(atts, idx);
                        const def = lastNonEmpty(defs, idx);
                        if (att) counts[att] = (counts[att] || 0) + 1;
                        if (def) counts[def] = (counts[def] || 0) + 1;
                    });
                });
                const nb = matchSet.size || 1;
                const gc = g => {
                    const total = g.main.reduce((s, a) => s + (counts[a] || 0), 0);
                    return { total, sub: g.sub ? (counts[g.sub] || 0) : null };
                };
                const buildSection = (groups, color, label) => {
                    const rows = groups.map(g => {
                        const { total, sub } = gc(g);
                        const avg  = total > 0 ? (total / nb).toFixed(1) : '-';
                        const cTxt = sub !== null
                            ? `${total} <span style="color:#94A3B8;font-size:0.78em">(${sub})</span>`
                            : (total > 0 ? total : '-');
                        return `<tr style="border-bottom:1px solid #F1F5F9;opacity:${total === 0 ? '0.45' : '1'}">
                            <td style="padding:3px 6px;font-size:0.78rem">${g.label}</td>
                            <td style="padding:3px 6px;text-align:right;font-weight:700;color:${total > 0 ? color : '#CBD5E1'};font-size:0.82rem">${cTxt}</td>
                            <td style="padding:3px 6px;text-align:right;color:#64748B;font-size:0.75rem">${avg}</td>
                        </tr>`;
                    }).join('');
                    return `<div style="border:1px solid #E2E8F0;border-radius:6px;overflow:hidden">
                        <div style="background:${color};color:white;padding:4px 8px;font-weight:700;font-size:0.75rem;letter-spacing:1px">${label}</div>
                        <table style="width:100%;border-collapse:collapse">
                            <thead><tr style="background:#F8FAFC">
                                <th style="padding:2px 6px;text-align:left;font-size:0.68rem;color:#94A3B8;font-weight:600">ACTION</th>
                                <th style="padding:2px 6px;text-align:right;font-size:0.68rem;color:#94A3B8;font-weight:600">TOTAL</th>
                                <th style="padding:2px 6px;text-align:right;font-size:0.68rem;color:#94A3B8;font-weight:600">/MATCH</th>
                            </tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>`;
                };
                const totAP = NOTE_GROUPS.attPlus.reduce((s, g)  => s + gc(g).total, 0);
                const totAM = NOTE_GROUPS.attMoins.reduce((s, g) => s + gc(g).total, 0);
                const totDP = NOTE_GROUPS.defPlus.reduce((s, g)  => s + gc(g).total, 0);
                const totDM = NOTE_GROUPS.defMoins.reduce((s, g) => s + gc(g).total, 0);
                const noteAtt   = totAP - totAM;
                const noteDef   = totDP - totDM;
                const noteTotal = noteAtt + noteDef;
                const sign      = v => (v >= 0 ? '+' : '') + v;
                const ntColor   = noteTotal >= 0 ? '#10B981' : '#EF4444';
                const naColor   = noteAtt   >= 0 ? '#10B981' : '#EF4444';
                const ndColor   = noteDef   >= 0 ? '#10B981' : '#EF4444';
                actionCardHTML = `
                    <div style="margin:12px 0">
                        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.05rem;color:#0A2463;margin-bottom:8px;letter-spacing:1.5px">DÉTAIL DES ACTIONS — ${nb} MATCH${nb > 1 ? 'S' : ''}</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                            ${buildSection(NOTE_GROUPS.attPlus,  '#10B981', 'ATTAQUE +')}
                            ${buildSection(NOTE_GROUPS.defPlus,  '#10B981', 'DÉFENSE +')}
                            ${buildSection(NOTE_GROUPS.attMoins, '#EF4444', 'ATTAQUE -')}
                            ${buildSection(NOTE_GROUPS.defMoins, '#EF4444', 'DÉFENSE -')}
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center;border-top:2px solid #0A2463;margin-top:10px;padding-top:8px">
                            <div><div style="font-weight:700;font-size:1.1rem;color:${naColor}">${sign(noteAtt)}</div><div style="font-size:0.72rem;color:#64748B">Note ATT</div></div>
                            <div><div style="font-weight:700;font-size:1.1rem;color:${ndColor}">${sign(noteDef)}</div><div style="font-size:0.72rem;color:#64748B">Note DEF</div></div>
                            <div><div style="font-weight:700;font-size:1.3rem;color:${ntColor}">${sign(noteTotal)}</div><div style="font-size:0.72rem;color:#64748B">Note globale</div></div>
                        </div>
                    </div>`;
            }

            // === 2. Graph — GB : performances (arrêts/score/%) | Joueur : notes ===
            const effectiveMatchs = matchFilter ? [matchFilter] : (bilanMatchs || MATCHS);
            let graphCanvas = null;
            if (isGB) {
                const gbMd = {};
                effectiveMatchs.forEach(m => gbMd[m] = { arrets:0, buts:0, score:0 });
                DATA.forEach(row => {
                    if (row[COLS.club] === 'FENIX') return;
                    const g = (row[COLS.gardien]||'').toString().trim();
                    if (!matchPlayerName(g, nom)) return;
                    const m = row[COLS.rencontre]; if (!gbMd[m]) return;
                    const isArret = row[COLS.finalite]==='Tir arrêté';
                    const isBut   = row[COLS.resultat]==='But';
                    if (!isArret && !isBut) return;
                    const zone = (row[COLS.field_position]||'').toString().trim();
                    const wz = (typeof GB_ZONE_WEIGHTS!=='undefined' && GB_ZONE_WEIGHTS[zone]) ? GB_ZONE_WEIGHTS[zone] : {arret:1,but:-1};
                    if (isArret) { gbMd[m].arrets++; gbMd[m].score += wz.arret; }
                    if (isBut)   { gbMd[m].buts++;   gbMd[m].score += wz.but; }
                });
                const gbPlayed = effectiveMatchs.filter(m => gbMd[m] && gbMd[m].arrets + gbMd[m].buts > 0);
                if (gbPlayed.length > 0) {
                    const arrArr = gbPlayed.map(m => gbMd[m].arrets);
                    const scrArr = gbPlayed.map(m => gbMd[m].score);
                    const pctArr = gbPlayed.map(m => {
                        const t = gbMd[m].arrets + gbMd[m].buts;
                        return t > 0 ? Math.round(gbMd[m].arrets/t*100) : 0;
                    });
                    const tjArr = gbPlayed.map(m => {
                        const entry = findTJEntry(nom);
                        return (entry && entry[m]!==undefined) ? entry[m] : null;
                    });
                    const W=800, H=290;
                    const pl={t:40,r:55,b:58,l:46};
                    const cW=W-pl.l-pl.r, cH=H-pl.t-pl.b;
                    const lMin=Math.min(0,...scrArr)-1, lMax=Math.max(...arrArr,...scrArr,1)+1, lRng=lMax-lMin;
                    const toYL = v => pl.t + cH - ((v-lMin)/lRng)*cH;
                    const toYR = p => pl.t + cH - (p/100)*cH;
                    const slotW=cW/gbPlayed.length, bW=slotW*0.52;
                    const cx = i => pl.l+(i+0.5)*slotW;
                    const c=document.createElement('canvas'); c.width=W*2; c.height=H*2;
                    c.style.cssText='width:100%;display:block;border-radius:8px;border:1px solid #E2E8F0';
                    const ctx=c.getContext('2d');
                    ctx.scale(2, 2);
                    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
                    // Grid + left axis
                    const lStep = lRng>20?5:lRng>10?2:1;
                    for(let v=Math.ceil(lMin);v<=Math.floor(lMax);v++){
                        if(v%lStep!==0) continue;
                        const y=toYL(v);
                        ctx.strokeStyle='#F1F5F9'; ctx.lineWidth=1;
                        ctx.beginPath(); ctx.moveTo(pl.l,y); ctx.lineTo(pl.l+cW,y); ctx.stroke();
                        ctx.fillStyle='#94A3B8'; ctx.font='10px Inter,sans-serif';
                        ctx.textAlign='right'; ctx.fillText(v,pl.l-4,y+3);
                    }
                    // Right axis (%)
                    [0,20,40,60,80,100].forEach(p=>{
                        ctx.fillStyle='#0EA5E9'; ctx.font='9px Inter,sans-serif';
                        ctx.textAlign='left'; ctx.fillText(p+'%',pl.l+cW+4,toYR(p)+3);
                    });
                    // 0 line
                    const y0=toYL(0);
                    ctx.strokeStyle='#CBD5E1'; ctx.lineWidth=1.5;
                    ctx.beginPath(); ctx.moveTo(pl.l,y0); ctx.lineTo(pl.l+cW,y0); ctx.stroke();
                    // Bars arrêts
                    arrArr.forEach((v,i)=>{
                        const bh=Math.abs(toYL(v)-y0);
                        ctx.fillStyle='rgba(16,185,129,0.65)';
                        ctx.fillRect(cx(i)-bW/2, Math.min(toYL(v),y0), bW, bh||1);
                        if(v>0){
                            const tj=tjArr[i];
                            ctx.fillStyle='#065f46'; ctx.font='bold 10px Inter,sans-serif';
                            ctx.textAlign='center';
                            ctx.fillText(v+(tj!==null?' | '+tj+"'":''), cx(i), toYL(v)-4);
                        }
                    });
                    // Line Score Total
                    ctx.strokeStyle='#1E3A5F'; ctx.lineWidth=2.5;
                    ctx.beginPath();
                    scrArr.forEach((v,i)=>{ i===0?ctx.moveTo(cx(i),toYL(v)):ctx.lineTo(cx(i),toYL(v)); });
                    ctx.stroke();
                    scrArr.forEach((v,i)=>{
                        ctx.beginPath(); ctx.arc(cx(i),toYL(v),4,0,Math.PI*2);
                        ctx.fillStyle='#1E3A5F'; ctx.fill();
                        ctx.fillStyle='#1E3A5F'; ctx.font='bold 9px Inter,sans-serif';
                        ctx.textAlign='center'; ctx.fillText((v>=0?'+':'')+v, cx(i), toYL(v)-7);
                    });
                    // Line % Arrêts
                    ctx.strokeStyle='#0EA5E9'; ctx.lineWidth=2;
                    ctx.beginPath();
                    pctArr.forEach((v,i)=>{ i===0?ctx.moveTo(cx(i),toYR(v)):ctx.lineTo(cx(i),toYR(v)); });
                    ctx.stroke();
                    pctArr.forEach((v,i)=>{
                        ctx.beginPath(); ctx.arc(cx(i),toYR(v),3,0,Math.PI*2);
                        ctx.fillStyle='#0EA5E9'; ctx.fill();
                    });
                    // X labels
                    ctx.fillStyle='#334155'; ctx.font='bold 10px Inter,sans-serif'; ctx.textAlign='center';
                    gbPlayed.forEach((m,i)=>{ ctx.fillText(m.split(' ')[0], cx(i), H-pl.b+14); });
                    // Title
                    ctx.fillStyle='#1E3A5F'; ctx.font='bold 14px Inter,sans-serif';
                    ctx.textAlign='center'; ctx.fillText(`Performances par rencontre — ${nom}`, W/2, 22);
                    // Legend
                    const ly=H-10;
                    ctx.fillStyle='rgba(16,185,129,0.65)'; ctx.fillRect(pl.l,ly-9,12,10);
                    ctx.fillStyle='#334155'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='left';
                    ctx.fillText('Arrêts',pl.l+15,ly);
                    ctx.strokeStyle='#1E3A5F'; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.moveTo(pl.l+70,ly-4); ctx.lineTo(pl.l+82,ly-4); ctx.stroke();
                    ctx.fillStyle='#334155'; ctx.fillText('Score Total',pl.l+86,ly);
                    ctx.strokeStyle='#0EA5E9';
                    ctx.beginPath(); ctx.moveTo(pl.l+180,ly-4); ctx.lineTo(pl.l+192,ly-4); ctx.stroke();
                    ctx.fillStyle='#0EA5E9'; ctx.fillText('% Arrêts',pl.l+196,ly);
                    graphCanvas = c;
                }
            } else {
                const matchData = {};
                effectiveMatchs.forEach(m => matchData[m] = { ap:0, am:0, dp:0, dm:0 });
                DATA.forEach(row => {
                    const m = row[COLS.rencontre];
                    if (!matchData[m]) return;
                    (row[COLS.action_joueur]||'').toString().split(';').forEach((j,idx) => {
                        if (!matchPlayerName(j.trim(), nom)) return;
                        const att = lastNonEmpty((row[COLS.action_att]||'').toString().split(';'), idx);
                        const def = lastNonEmpty((row[COLS.action_def]||'').toString().split(';'), idx);
                        if (isPositiveATT(att)) matchData[m].ap++;
                        if (isNegativeATT(att)) matchData[m].am++;
                        if (isPositiveDEF(def)) matchData[m].dp++;
                        if (isNegativeDEF(def)) matchData[m].dm++;
                    });
                });
                const played = effectiveMatchs.filter(m => { const d=matchData[m]; return d && d.ap+d.am+d.dp+d.dm>0; });
                if (played.length > 0) {
                    const noteA = played.map(m => matchData[m].ap - matchData[m].am);
                    const noteD = played.map(m => matchData[m].dp - matchData[m].dm);
                    const tot   = played.map((_,i) => noteA[i]+noteD[i]);
                    const W=800, H=260;
                    const pl={t:36,r:20,b:52,l:40};
                    const cW=W-pl.l-pl.r, cH=H-pl.t-pl.b;
                    const allV=[...noteA,...noteD,...tot,0];
                    const maxV=Math.max(...allV)+2, minV=Math.min(...allV)-2;
                    const rng=maxV-minV;
                    const toY = v => pl.t + cH - ((v-minV)/rng)*cH;
                    const slotW = cW/played.length;
                    const bW = slotW*0.28;
                    const cx = i => pl.l + (i+0.5)*slotW;
                    const c=document.createElement('canvas'); c.width=W*2; c.height=H*2;
                    c.style.cssText='width:100%;display:block;border-radius:8px;border:1px solid #E2E8F0';
                    const ctx=c.getContext('2d');
                    ctx.scale(2, 2);
                    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
                    for(let v=Math.ceil(minV);v<=Math.floor(maxV);v++){
                        if(v%2!==0) continue;
                        const y=toY(v);
                        ctx.strokeStyle='#F1F5F9'; ctx.lineWidth=1;
                        ctx.beginPath(); ctx.moveTo(pl.l,y); ctx.lineTo(pl.l+cW,y); ctx.stroke();
                        ctx.fillStyle='#94A3B8'; ctx.font='10px Inter,sans-serif';
                        ctx.textAlign='right'; ctx.fillText(v,pl.l-4,y+3);
                    }
                    const y0=toY(0);
                    ctx.strokeStyle='#CBD5E1'; ctx.lineWidth=1.5;
                    ctx.beginPath(); ctx.moveTo(pl.l,y0); ctx.lineTo(pl.l+cW,y0); ctx.stroke();
                    noteA.forEach((v,i)=>{
                        const bh=Math.abs(toY(v)-y0);
                        ctx.fillStyle='rgba(20,184,166,0.8)';
                        ctx.fillRect(cx(i)-bW*1.05, Math.min(toY(v),y0), bW, bh||1);
                    });
                    noteD.forEach((v,i)=>{
                        const bh=Math.abs(toY(v)-y0);
                        ctx.fillStyle='rgba(245,158,11,0.8)';
                        ctx.fillRect(cx(i)+0.05*bW, Math.min(toY(v),y0), bW, bh||1);
                    });
                    ctx.strokeStyle='#1E3A5F'; ctx.lineWidth=2.5;
                    ctx.beginPath();
                    tot.forEach((v,i)=>{ i===0?ctx.moveTo(cx(i),toY(v)):ctx.lineTo(cx(i),toY(v)); });
                    ctx.stroke();
                    tot.forEach((v,i)=>{
                        ctx.beginPath(); ctx.arc(cx(i),toY(v),4,0,Math.PI*2);
                        ctx.fillStyle='#1E3A5F'; ctx.fill();
                        ctx.fillStyle='#1E3A5F'; ctx.font='bold 10px Inter,sans-serif';
                        ctx.textAlign='center'; ctx.fillText((v>=0?'+':'')+v, cx(i), toY(v)-7);
                    });
                    ctx.fillStyle='#334155'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='center';
                    played.forEach((m,i)=>{ ctx.fillText(m.split(' ')[0], cx(i), H-pl.b+14); });
                    ctx.fillStyle='#1E3A5F'; ctx.font='bold 14px Inter,sans-serif';
                    ctx.textAlign='center'; ctx.fillText(`Notes par rencontre — ${nom}`, W/2, 20);
                    const ly=H-8;
                    ctx.fillStyle='rgba(20,184,166,0.8)'; ctx.fillRect(pl.l,ly-9,12,10);
                    ctx.fillStyle='#334155'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='left';
                    ctx.fillText('NOTE ATT',pl.l+15,ly);
                    ctx.fillStyle='rgba(245,158,11,0.8)'; ctx.fillRect(pl.l+80,ly-9,12,10);
                    ctx.fillText('NOTE DEF',pl.l+95,ly);
                    ctx.strokeStyle='#1E3A5F'; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.moveTo(pl.l+175,ly-4); ctx.lineTo(pl.l+187,ly-4); ctx.stroke();
                    ctx.fillText('TOTAL',pl.l+191,ly);
                    graphCanvas = c;
                }
            }

            // Convertir le graphique en data URL AVANT de construire le HTML
            const graphDataUrl = graphCanvas ? graphCanvas.toDataURL('image/png') : null;

            // === 3. Impact — SVG inline (fiable à l'impression, sans canvas/toDataURL) ===
            const inPeriod = row => {
                if (matchFilter) return row[COLS.rencontre] === matchFilter;
                if (bilanMatchs) return bilanMatchs.includes(row[COLS.rencontre]);
                return true;
            };
            const impactRowsAll = isGB
                ? DATA.filter(row =>
                    row[COLS.club] !== 'FENIX' &&
                    (row[COLS.finalite]==='Tir arrêté' || row[COLS.resultat]==='But') &&
                    inPeriod(row) &&
                    matchPlayerName((row[COLS.gardien]||'').toString().trim(), nom)
                )
                : DATA.filter(row =>
                    row[COLS.club] === 'FENIX' &&
                    ['But','Tir raté'].includes(row[COLS.resultat]) &&
                    inPeriod(row) &&
                    matchPlayerName((row[COLS.joueur]||'').toString().trim(), nom)
                );
            const impactRowsWithCoords = impactRowsAll.filter(r =>
                r[COLS.impact] && String(r[COLS.impact]).includes(';')
            );

            // Efficacité par zone (terrain uniquement)
            const zoneStatsHtml = {};
            if (!isGB) {
                impactRowsAll.forEach(row => {
                    const z = (row[COLS.field_position] || '').toString().trim();
                    if (!z) return;
                    if (!zoneStatsHtml[z]) zoneStatsHtml[z] = { buts: 0, total: 0 };
                    zoneStatsHtml[z].total++;
                    if (row[COLS.resultat] === 'But') zoneStatsHtml[z].buts++;
                });
            }
            const buildZoneGrid = () => {
                if (isGB || !Object.keys(zoneStatsHtml).length) return '';
                const zr2 = [
                    ['6m ail G','6m ext G','6m central G','6m central D','6m ext D','6m ail D'],
                    ['6-9 ext G','6-9 central G','7m','6-9 central D','6-9 ext D'],
                    ['9m ext G','9m Int G','9m Int D','9m ext D'],
                ];
                const mkZCell = zone => {
                    const zd = zoneStatsHtml[zone];
                    if (!zd || zd.total === 0)
                        return `<div style="flex:1;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:3px;padding:3px 1px;text-align:center;min-width:0"><div style="font-size:0.52rem;color:#CBD5E1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${zone}</div><div style="font-size:0.7rem;color:#CBD5E1">—</div></div>`;
                    const pct = Math.round(zd.buts / zd.total * 100);
                    const [bg, tx] = pct>=65?['#D1FAE5','#065F46']:pct>=45?['#FEF3C7','#92400E']:['#FEE2E2','#991B1B'];
                    return `<div style="flex:1;background:${bg};border-radius:3px;padding:3px 1px;text-align:center;min-width:0"><div style="font-size:0.52rem;color:${tx};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${zone}</div><div style="font-weight:700;font-size:0.85rem;color:${tx}">${pct}%</div></div>`;
                };
                return `<div style="margin-top:12px;padding-top:8px;border-top:1px solid #E2E8F0"><div style="font-size:0.65rem;font-weight:700;color:#0A2463;letter-spacing:1px;margin-bottom:5px">EFFICACITÉ PAR ZONE</div>${zr2.map(cells=>`<div style="display:flex;gap:3px;margin-bottom:3px">${cells.map(mkZCell).join('')}</div>`).join('')}</div>`;
            };

            const buildImpactSVG = (rows, viewKey) => {
                const bgSrc = (typeof IMPACT_B64 !== 'undefined' && IMPACT_B64[viewKey]) ? IMPACT_B64[viewKey] : null;
                const bgEl = bgSrc
                    ? `<image href="${bgSrc}" x="3" y="5" width="94" height="50" preserveAspectRatio="xMidYMid slice"/>`
                    : `<rect x="3" y="5" width="94" height="50" fill="white" stroke="#1E293B" stroke-width="1.5" rx="1"/>`;
                const dots = rows.map(row => {
                    const p = String(row[COLS.impact]).split(';');
                    const rx = parseFloat(p[0]), ry = parseFloat(p[1]);
                    if (isNaN(rx) || isNaN(ry)) return '';
                    const cx = 3 + rx * 0.94;
                    const cy = 5 + ry * 0.50;
                    const isPos = isGB ? row[COLS.finalite]==='Tir arrêté' : row[COLS.resultat]==='But';
                    if (isPos) {
                        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.1" fill="#10B981" stroke="white" stroke-width="0.4"/>`;
                    } else {
                        const s = 1.0;
                        return `<line x1="${(cx-s).toFixed(1)}" y1="${(cy-s).toFixed(1)}" x2="${(cx+s).toFixed(1)}" y2="${(cy+s).toFixed(1)}" stroke="#EF4444" stroke-width="0.9"/>
                                <line x1="${(cx+s).toFixed(1)}" y1="${(cy-s).toFixed(1)}" x2="${(cx-s).toFixed(1)}" y2="${(cy+s).toFixed(1)}" stroke="#EF4444" stroke-width="0.9"/>`;
                    }
                }).join('');
                return `<svg viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;border-radius:5px;border:1px solid #E2E8F0">
                    ${bgEl}
                    ${dots}
                </svg>`;
            };

            let impactTitle = '';
            let impactStatSub = '';
            let impactBlock = '';
            if (impactRowsAll.length > 0) {
                const totalI  = impactRowsAll.length;
                const positifs = isGB
                    ? impactRowsAll.filter(r=>r[COLS.finalite]==='Tir arrêté').length
                    : impactRowsAll.filter(r=>r[COLS.resultat]==='But').length;
                const pct = Math.round(positifs / totalI * 100);
                impactTitle = isGB ? "ZONES D'ARRÊT" : 'ZONES DE TIR';
                impactStatSub = `${positifs} ${isGB?'arrêts':'buts'} / ${totalI} tirs (${pct}%)`;
                const svgAlg  = buildImpactSVG(impactRowsWithCoords.filter(r=>getImpactView(r)==='alg'), 'alg');
                const svgFace = buildImpactSVG(impactRowsWithCoords.filter(r=>getImpactView(r)==='face'), 'face');
                const svgAld  = buildImpactSVG(impactRowsWithCoords.filter(r=>getImpactView(r)==='ald'), 'ald');
                impactBlock = `
                    <div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
                            <div style="text-align:center">${svgAlg}<div style="font-size:0.68rem;color:#64748B;margin-top:4px;font-weight:700;letter-spacing:1px">EXT GAUCHE</div></div>
                            <div style="text-align:center">${svgFace}<div style="font-size:0.68rem;color:#64748B;margin-top:4px;font-weight:700;letter-spacing:1px">CENTRAL</div></div>
                            <div style="text-align:center">${svgAld}<div style="font-size:0.68rem;color:#64748B;margin-top:4px;font-weight:700;letter-spacing:1px">EXT DROIT</div></div>
                        </div>
                        <div style="margin-top:6px;font-size:0.68rem;color:#64748B">
                            ● <span style="color:#10B981">${isGB ? 'Arrêt' : 'But'}</span> &nbsp;
                            ✕ <span style="color:#EF4444">${isGB ? 'But encaissé' : 'Tir raté'}</span> &nbsp;
                            (${totalI - impactRowsWithCoords.length} tir(s) sans coordonnées non représenté(s))
                        </div>
                        ${buildZoneGrid()}
                    </div>`;
            }

            const graphLabel = isGB ? 'PERFORMANCES PAR RENCONTRE' : 'PROGRESSION DES NOTES';
            const imgStyle   = 'width:100%;display:block;border-radius:8px;border:1px solid #E2E8F0';
            const graphBlock = graphDataUrl ? `<img src="${graphDataUrl}" style="${imgStyle}">` : '';

            // Cover slide data
            const _jpInfo = (typeof JOUEURS_TERRAIN !== 'undefined') ? (JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom)) || {}) : {};
            const _posteCode = _jpInfo.poste || '';
            const _displayNom = _jpInfo.nomComplet || nom;
            const _posteLblMap = { GB:'Gardien de But', AG:'Ailier Gauche', AD:'Ailier Droit', ARG:'Arrière Gauche', ARD:'Arrière Droit', DC:'Demi-Centre', PIV:'Pivot' };
            const _posteLabel = _posteLblMap[_posteCode] || _posteCode;
            const _filterBilanEl = document.getElementById('filter-joueur-bilan');
            const _periodLabel = matchFilter ? ('Match : ' + matchFilter) : (_filterBilanEl?.value || 'Saison complète');
            const _tjD = (typeof getTJData === 'function') ? getTJData(nom, effectiveMatchs) : { matchs: 0, total: 0 };
            const _tjStr = (_tjD.matchs > 0) ? `${_tjD.matchs} match${_tjD.matchs > 1 ? 's' : ''}  ·  ⌀ ${Math.round(_tjD.total / _tjD.matchs)} min/match` : '';
            const _subHdr = _displayNom + (_periodLabel !== 'Saison complète' ? '  ·  ' + _periodLabel : '');

            // Logo FENIX en data URL (fiable pour html2canvas + impression)
            const _logoUrl = await new Promise(res => {
                const li = new Image();
                li.onload = () => { const lc=document.createElement('canvas'); lc.width=512; lc.height=512; lc.getContext('2d').drawImage(li,0,0,512,512); res(lc.toDataURL('image/png')); };
                li.onerror = () => res(null);
                li.src = 'favicon.png';
            });

            const _pptHdr = (title, statLine) => `<div style="background:#0A2463;padding:7px 16px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:Arial,sans-serif;font-size:12pt;font-weight:700;color:white;letter-spacing:0.5px">${title}</span><div style="display:flex;align-items:center;gap:8px"><span style="font-family:Arial,sans-serif;font-size:7pt;color:#BFDBFE">${statLine || _subHdr}</span>${_logoUrl?`<img src="${_logoUrl}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">`:''}</div></div>`;

            const printZone = document.getElementById('joueur-print-zone');
            printZone.innerHTML = `
                <div class="pdf-page pdf-slide-cover">
                    ${_logoUrl ? `<img src="${_logoUrl}" style="width:160px;height:160px;border-radius:50%;object-fit:cover;margin-bottom:20px">` : ''}
                    <div style="font-family:Arial,sans-serif;font-size:10pt;color:white;letter-spacing:4px;margin-bottom:10px;text-align:center">FENIX HANDBALL</div>
                    <div style="width:50%;border-top:1px solid rgba(191,219,254,0.5);margin:0 auto 10px"></div>
                    <div style="font-family:Arial,sans-serif;font-size:17pt;color:white;letter-spacing:2px;margin-bottom:8px;text-align:center">SUIVI HANDBALL</div>
                    <div style="font-family:Arial,sans-serif;font-size:36pt;font-weight:700;color:white;text-align:center">${_displayNom}</div>
                    <div style="font-family:Arial,sans-serif;font-size:11pt;color:#BFDBFE;letter-spacing:2px;margin-top:8px;text-align:center">${_posteLabel.toUpperCase()}</div>
                    <div style="width:50%;border-top:1px solid rgba(191,219,254,0.5);margin:10px auto 8px"></div>
                    <div style="font-family:Arial,sans-serif;font-size:9pt;color:#7EA0C4;text-align:center">${_periodLabel}</div>
                    ${_tjStr ? `<div style="font-family:Arial,sans-serif;font-size:8pt;color:#7EA0C4;margin-top:4px;text-align:center">${_tjStr}</div>` : ''}
                    <div style="position:absolute;bottom:12px;left:18px;font-family:Arial,sans-serif;font-size:8pt;color:#4A6FA5">Centre de Formation</div>
                </div>
                <div class="pdf-page" style="padding:0;overflow:hidden">
                    ${_pptHdr(isGB ? 'FICHE JOUEUR' : 'FICHE JOUEUR  ·  ACTIONS ATT / DEF')}
                    <div class="pdf-merged-cols" style="display:flex;gap:10px;padding:8px 16px;align-items:center">
                        <div style="flex:0 0 40%">${panel.outerHTML}</div>
                        <div style="flex:1">${actionCardHTML}</div>
                    </div>
                </div>
                <div class="pdf-page" style="padding:0;overflow:hidden">
                    ${_pptHdr('DÉTAIL PAR MATCH')}
                    <div style="padding:10px 18px">${matches.outerHTML}</div>
                </div>
                ${graphBlock ? `<div class="pdf-page" style="padding:0;overflow:hidden">${_pptHdr(graphLabel)}<div style="padding:10px 18px">${graphBlock}</div></div>` : ''}
                ${impactBlock ? `<div class="pdf-page" style="padding:0;overflow:hidden">${_pptHdr(impactTitle, impactStatSub)}<div style="padding:10px 18px">${impactBlock}</div></div>` : ''}`;

            // Attendre que toutes les <img> soient décodées avant d'imprimer
            const imgEls = Array.from(printZone.querySelectorAll('img'));
            await Promise.all(imgEls.map(img =>
                typeof img.decode === 'function'
                    ? img.decode().catch(() => {})
                    : new Promise(r => { img.onload = r; img.onerror = r; if (img.complete) r(); })
            ));

            if (!renderOnly) {
                window.addEventListener('afterprint', function cleanup() {
                    printZone.innerHTML = '';
                    window.removeEventListener('afterprint', cleanup);
                });
                window.print();
            }
        }

        async function exportJoueurPPT() {
            if (typeof PptxGenJS === 'undefined') { alert('PptxGenJS non chargé'); return; }
            if (typeof html2canvas === 'undefined') { alert('html2canvas non chargé'); return; }
            const nom = currentSelectedJoueur;
            if (!nom) return;

            const btnEl = document.querySelector('[onclick="exportJoueurPPT()"]');
            if (btnEl) { btnEl.disabled = true; btnEl.textContent = '⏳…'; }

            try {
                // 1. Render PDF layout sans imprimer
                await printFicheJoueur(true);

                // 2. Rendre le print-zone visible temporairement (largeur A4 paysage)
                const pz = document.getElementById('joueur-print-zone');
                pz.style.visibility = 'visible';
                pz.style.left = '-1400px';
                pz.style.width = '297mm';

                await new Promise(r => setTimeout(r, 400));

                // 3. Capturer chaque .pdf-page avec html2canvas
                const pptx = new PptxGenJS();
                pptx.defineLayout({ name: 'CF_A4L', width: 11.69, height: 8.27 });
                pptx.layout = 'CF_A4L';
                pptx.author = 'FENIX Handball CF';

                const pages = pz.querySelectorAll('.pdf-page');
                for (const page of pages) {
                    const canvas = await html2canvas(page, {
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const ar = canvas.width / canvas.height;
                    const slAR = 11.69 / 8.27; // A4 paysage = 1.414
                    const sl = pptx.addSlide();
                    sl.background = { color: 'FFFFFF' };
                    let iW, iH, iX, iY;
                    if (ar >= slAR) {
                        // Image plus large → caler sur la largeur
                        iW = 11.69; iH = parseFloat((iW / ar).toFixed(3));
                        iX = 0;    iY = parseFloat(((8.27 - iH) / 2).toFixed(3));
                    } else {
                        // Image plus haute → caler sur la hauteur
                        iH = 8.27; iW = parseFloat((iH * ar).toFixed(3));
                        iX = parseFloat(((11.69 - iW) / 2).toFixed(3)); iY = 0;
                    }
                    sl.addImage({ data: imgData, x: iX, y: iY, w: iW, h: iH });
                }

                // 4. Télécharger
                const nomSafe = nom.replace(/\s+/g, '_');
                await pptx.writeFile({ fileName: `${nomSafe}_suivi_CF.pptx` });

            } finally {
                // 5. Nettoyer
                const pz = document.getElementById('joueur-print-zone');
                pz.style.visibility = '';
                pz.style.left = '';
                pz.style.width = '';
                pz.innerHTML = '';
                if (btnEl) { btnEl.disabled = false; btnEl.textContent = '📊 PowerPoint'; }
            }

            // --- ANCIENNE FONCTION PPT (supprimée) ---
            // La suite est remplacée par le return ci-dessus
            if (false) { // bloc mort pour éviter de casser la structure
            const isGB = false;
            const matchFilter = '';
            const bilanMatchs = null;
            const effectiveMatchs = [];
            const inPeriod = row => {
                if (matchFilter) return row[COLS.rencontre] === matchFilter;
                if (bilanMatchs) return bilanMatchs.includes(row[COLS.rencontre]);
                return true;
            };

            const joueurInfo = JOUEURS_TERRAIN.find(p => matchPlayerName(p.nom, nom)) || {};
            const posteCode  = joueurInfo.poste || '';
            const posteName  = { GB:'Gardien de But', AG:'Ailier Gauche', AD:'Ailier Droit', ARG:'Arrière Gauche', ARD:'Arrière Droit', DC:'Demi-Centre', PIV:'Pivot' };
            const posteLabel = posteName[posteCode] || posteCode;
            const filterBilanEl = document.getElementById('filter-joueur-bilan');
            const periodLabel = matchFilter ? `Match : ${matchFilter}` : (filterBilanEl?.value ? filterBilanEl.value : 'Saison complète');
            const tjNom = getTJData(nom, effectiveMatchs);
            const tjStr = tjNom.matchs > 0 ? `${tjNom.matchs} matchs  ·  ⌀ ${Math.round(tjNom.total / tjNom.matchs)} min/match` : '';

            // ── Badges ─────────────────────────────────────────────────────────
            const pptBadges = [];
            if (typeof computePlayerRank === 'function' && posteCode) {
                const rnk = computePlayerRank(nom, posteCode);
                if (rnk && rnk.total > 1) {
                    const bm = rnk.rank===1?'🥇':rnk.rank===2?'🥈':rnk.rank===3?'🥉':null;
                    if (bm) pptBadges.push(`${bm} #${rnk.rank} au poste`);
                }
            }
            if (typeof _computeNoteScore === 'function' && posteCode && posteCode !== 'GB' && JOUEURS_TERRAIN) {
                const btms = JOUEURS_TERRAIN.filter(p => p.poste === posteCode && p.nom !== nom);
                if (btms.length > 0) {
                    const mn = _computeNoteScore(nom, posteCode);
                    if (mn.att > 0 && btms.every(p => _computeNoteScore(p.nom, posteCode).att <= mn.att)) pptBadges.push('⚡ Top ATT au poste');
                    if (mn.def > 0 && btms.every(p => _computeNoteScore(p.nom, posteCode).def <= mn.def)) pptBadges.push('🛡️ Top DEF au poste');
                }
            }
            if (posteCode && typeof JOUEURS_TERRAIN !== 'undefined') {
                const btms2 = JOUEURS_TERRAIN.filter(p => p.poste === posteCode && p.nom !== nom);
                if (btms2.length > 0) {
                    const myTJD = getTJData(nom, effectiveMatchs);
                    const myTJAvg = myTJD.matchs > 0 ? myTJD.total / myTJD.matchs : 0;
                    let tjRank = 1;
                    btms2.forEach(p => { const d=getTJData(p.nom, effectiveMatchs); if (d.matchs>0 && d.total/d.matchs>myTJAvg) tjRank++; });
                    const tjM2 = tjRank===1?'🥇':tjRank===2?'🥈':tjRank===3?'🥉':null;
                    if (tjM2) pptBadges.push(`${tjM2} #${tjRank} TJ au poste`);
                }
            }
            if (typeof computeStreak === 'function') {
                const str = computeStreak(nom);
                if (str.dir===1 && str.streak>=3) pptBadges.push(`↑ En progression (${str.streak} matchs)`);
                else if (str.dir===-1 && str.streak>=3) pptBadges.push(`↓ En baisse (${str.streak} matchs)`);
            }

            // ── Stats ──────────────────────────────────────────────────────────
            let statVals = {};
            let attPlus = 0, attMoins = 0, defPlus = 0, defMoins = 0;
            const attPlusDetail = {}, attMoinsDetail = {}, defPlusDetail = {}, defMoinsDetail = {};
            if (!isGB) {
                const rows = DATA.filter(row => {
                    if (row[COLS.club] !== 'FENIX') return false;
                    if (!inPeriod(row)) return false;
                    return matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom);
                });
                const buts  = rows.filter(r => r[COLS.resultat] === 'But').length;
                const tirs  = rows.filter(r => r[COLS.resultat] === 'Tir raté').length;
                const pb    = rows.filter(r => r[COLS.resultat] === 'PB').length;
                const po    = rows.filter(r => r[COLS.resultat] === 'PO').length;
                const total = buts + tirs;
                const eff   = total > 0 ? Math.round(buts / total * 100) : 0;
                let pd = 0;
                DATA.forEach(row => {
                    if (!inPeriod(row)) return;
                    (row[COLS.action_joueur] || '').toString().split(';').forEach((j, i) => {
                        if (!matchPlayerName(j.trim(), nom)) return;
                        const att = lastNonEmpty((row[COLS.action_att] || '').toString().split(';'), i);
                        const def = lastNonEmpty((row[COLS.action_def] || '').toString().split(';'), i);
                        if (att === 'PD' || att === 'PD DG') pd++;
                        if (isPositiveATT(att)) { attPlus++; for (const g of NOTE_GROUPS.attPlus)  { if (g.main.includes(att)) { attPlusDetail[g.label]  = (attPlusDetail[g.label]  || 0) + 1; break; } } }
                        else if (isNegativeATT(att)) { attMoins++; for (const g of NOTE_GROUPS.attMoins) { if (g.main.includes(att)) { attMoinsDetail[g.label] = (attMoinsDetail[g.label] || 0) + 1; break; } } }
                        if (isPositiveDEF(def)) { defPlus++; for (const g of NOTE_GROUPS.defPlus)  { if (g.main.includes(def)) { defPlusDetail[g.label]  = (defPlusDetail[g.label]  || 0) + 1; break; } } }
                        else if (isNegativeDEF(def)) { defMoins++; for (const g of NOTE_GROUPS.defMoins) { if (g.main.includes(def)) { defMoinsDetail[g.label] = (defMoinsDetail[g.label] || 0) + 1; break; } } }
                    });
                });
                const note = (attPlus - attMoins) + (defPlus - defMoins);
                statVals = { buts, total, eff, pd, po, pb, note };
            } else {
                const gbRows = DATA.filter(row => {
                    if (row[COLS.club] === 'FENIX') return false;
                    if (!inPeriod(row)) return false;
                    const g = (row[COLS.gardien] || '').toString().trim();
                    if (!matchPlayerName(g, nom)) return false;
                    return row[COLS.resultat] === 'But' || row[COLS.finalite] === 'Tir arrêté';
                });
                const arrets = gbRows.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
                const butsC  = gbRows.filter(r => r[COLS.resultat] === 'But').length;
                const totalF = arrets + butsC;
                const gbEff  = totalF > 0 ? Math.round(arrets / totalF * 100) : 0;
                const gbButs = DATA.filter(row =>
                    row[COLS.club] === 'FENIX' && inPeriod(row) &&
                    matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom) &&
                    row[COLS.resultat] === 'But'
                ).length;
                let gbPd = 0;
                DATA.forEach(row => {
                    if (!inPeriod(row)) return;
                    (row[COLS.action_joueur] || '').toString().split(';').forEach((j, i) => {
                        if (!matchPlayerName(j.trim(), nom)) return;
                        const att = lastNonEmpty((row[COLS.action_att] || '').toString().split(';'), i);
                        if (att === 'PD' || att === 'PD DG') gbPd++;
                    });
                });
                statVals = { arrets, butsC, totalF, gbEff, gbButs, gbPd };
            }

            // ── Match-by-match ─────────────────────────────────────────────────
            const initF = () => ({ bc:0, tc:0, bp:0, tp:0, pb:0, po:0, pd:0, ap:0, am:0, dp:0, dm:0 });
            const sbm = {};
            DATA.forEach(row => {
                if (row[COLS.club] !== 'FENIX') return;
                if (!inPeriod(row)) return;
                if (!matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom)) return;
                const m = row[COLS.rencontre]; if (!m) return;
                if (!sbm[m]) sbm[m] = initF();
                const isPen = (row[COLS.ge] || '').toString().toLowerCase().includes('pen');
                if (row[COLS.resultat] === 'But')           { isPen ? sbm[m].bp++ : sbm[m].bc++; }
                else if (row[COLS.resultat] === 'Tir raté') { isPen ? sbm[m].tp++ : sbm[m].tc++; }
                else if (row[COLS.resultat] === 'PB')  sbm[m].pb++;
                else if (row[COLS.resultat] === 'PO')  sbm[m].po++;
            });
            DATA.forEach(row => {
                if (!inPeriod(row)) return;
                const m = row[COLS.rencontre]; if (!m) return;
                (row[COLS.action_joueur] || '').toString().split(';').forEach((j, idx) => {
                    if (!matchPlayerName(j.trim(), nom)) return;
                    if (!sbm[m]) sbm[m] = initF();
                    const att = lastNonEmpty((row[COLS.action_att] || '').toString().split(';'), idx);
                    const def = lastNonEmpty((row[COLS.action_def] || '').toString().split(';'), idx);
                    if (att === 'PD' || att === 'PD DG') sbm[m].pd++;
                    if (isPositiveATT(att)) sbm[m].ap++; else if (isNegativeATT(att)) sbm[m].am++;
                    if (isPositiveDEF(def)) sbm[m].dp++; else if (isNegativeDEF(def)) sbm[m].dm++;
                });
            });

            // ── Impact zones (canvas) ──────────────────────────────────────────
            const impactAll = DATA.filter(row => {
                if (!inPeriod(row)) return false;
                if (isGB) {
                    if (row[COLS.club] === 'FENIX') return false;
                    if (!matchPlayerName((row[COLS.gardien] || '').toString().trim(), nom)) return false;
                    return row[COLS.resultat] === 'But' || row[COLS.finalite] === 'Tir arrêté';
                }
                if (row[COLS.club] !== 'FENIX') return false;
                if (!['But','Tir raté'].includes(row[COLS.resultat])) return false;
                return matchPlayerName((row[COLS.joueur] || '').toString().trim(), nom);
            });
            const impactCoords = impactAll.filter(r => r[COLS.impact] && String(r[COLS.impact]).includes(';'));

            // Stats par zone de terrain
            const zoneStats = {};
            impactAll.forEach(row => {
                const z = (row[COLS.field_position] || '').toString().trim();
                if (!z) return;
                if (!zoneStats[z]) zoneStats[z] = { buts: 0, total: 0 };
                zoneStats[z].total++;
                const isPos = isGB ? row[COLS.finalite]==='Tir arrêté' : row[COLS.resultat]==='But';
                if (isPos) zoneStats[z].buts++;
            });

            const renderZone = (viewKey, rows) => new Promise(resolve => {
                const W = 480, H = 288;
                const cv = document.createElement('canvas');
                cv.width = W; cv.height = H;
                const ctx = cv.getContext('2d');
                const drawDots = () => {
                    rows.forEach(row => {
                        const p = String(row[COLS.impact]).split(';');
                        const rx = parseFloat(p[0]), ry = parseFloat(p[1]);
                        if (isNaN(rx) || isNaN(ry)) return;
                        const cx = rx/100*W, cy = ry/100*H;
                        const isPos = isGB ? row[COLS.finalite]==='Tir arrêté' : row[COLS.resultat]==='But';
                        if (isPos) {
                            ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI*2);
                            ctx.fillStyle = '#10B981'; ctx.fill();
                            ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
                        } else {
                            ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 5;
                            const s = 9;
                            ctx.beginPath();
                            ctx.moveTo(cx-s,cy-s); ctx.lineTo(cx+s,cy+s);
                            ctx.moveTo(cx+s,cy-s); ctx.lineTo(cx-s,cy+s);
                            ctx.stroke();
                        }
                    });
                    resolve(cv.toDataURL('image/png'));
                };
                const bgSrc = (typeof IMPACT_B64 !== 'undefined' && IMPACT_B64[viewKey]) ? IMPACT_B64[viewKey] : null;
                if (bgSrc) {
                    const img = new Image();
                    img.onload  = () => { ctx.drawImage(img, 0, 0, W, H); drawDots(); };
                    img.onerror = () => { ctx.fillStyle='#EFF6FF'; ctx.fillRect(0,0,W,H); drawDots(); };
                    img.src = bgSrc;
                } else { ctx.fillStyle='#EFF6FF'; ctx.fillRect(0,0,W,H); drawDots(); }
            });

            const [imgAlg, imgFace, imgAld] = await Promise.all([
                renderZone('alg',  impactCoords.filter(r => getImpactView(r) === 'alg')),
                renderZone('face', impactCoords.filter(r => getImpactView(r) === 'face')),
                renderZone('ald',  impactCoords.filter(r => getImpactView(r) === 'ald')),
            ]);

            const graphCanvas  = document.getElementById('joueur-graph-canvas');
            const graphDataUrl = graphCanvas ? graphCanvas.toDataURL('image/png') : null;

            // ── PptxGenJS ──────────────────────────────────────────────────────
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';
            pptx.author = 'FENIX Handball CF';

            const NAVY='0A2463', WHITE='FFFFFF', GREEN='10B981', RED='DC2626', GOLD='D97706', LGRAY='F8FAFC', DGRAY='475569';

            // Logo FENIX (filigrane / branding)
            const logoB64 = await new Promise(res => {
                const li = new Image();
                li.onload = () => { const lc=document.createElement('canvas'); lc.width=256; lc.height=256; lc.getContext('2d').drawImage(li,0,0,256,256); res(lc.toDataURL('image/png')); };
                li.onerror = () => res(null);
                li.src = 'favicon.png';
            });

            const addHeader = (sl, title) => {
                sl.addShape(pptx.ShapeType.rect, { x:0, y:0, w:10, h:0.85, fill:{ color:NAVY } });
                sl.addText(title, { x:0.3, y:0.1, w:7, h:0.65, fontSize:20, color:WHITE, fontFace:'Arial', bold:true, valign:'middle' });
                sl.addText(nom + (periodLabel !== 'Saison complète' ? '  ·  ' + periodLabel : ''), { x:7.2, y:0.1, w:logoB64?1.85:2.65, h:0.65, fontSize:8, color:'BFDBFE', fontFace:'Arial', align:'right', valign:'middle' });
                if (logoB64) sl.addImage({ data:logoB64, x:9.27, y:0.09, w:0.67, h:0.67 });
            };

            // SLIDE 1 — COVER
            const s1 = pptx.addSlide();
            s1.background = { color: NAVY };
            if (logoB64) s1.addImage({ data:logoB64, x:4.4, y:0.08, w:1.2, h:1.2 });
            s1.addText('FENIX HANDBALL', { x:0.5, y:1.38, w:9, h:0.42, fontSize:13, color:WHITE, fontFace:'Arial', align:'center', charSpacing:6 });
            s1.addShape(pptx.ShapeType.rect, { x:2.5, y:1.86, w:5, h:0.03, fill:{ color:'BFDBFE' } });
            s1.addText('SUIVI HANDBALL', { x:0.5, y:1.96, w:9, h:0.55, fontSize:24, color:WHITE, fontFace:'Arial', align:'center', charSpacing:3 });
            s1.addText(nom, { x:0.5, y:2.55, w:9, h:1.1, fontSize:46, color:WHITE, fontFace:'Arial', bold:true, align:'center' });
            s1.addText(posteLabel.toUpperCase(), { x:0.5, y:3.75, w:9, h:0.38, fontSize:14, color:'BFDBFE', fontFace:'Arial', align:'center', charSpacing:3 });
            s1.addShape(pptx.ShapeType.rect, { x:2.5, y:4.2, w:5, h:0.03, fill:{ color:'BFDBFE' } });
            s1.addText(periodLabel, { x:0.5, y:4.28, w:9, h:0.32, fontSize:11, color:'7EA0C4', fontFace:'Arial', align:'center' });
            if (tjStr) s1.addText(tjStr, { x:0.5, y:4.65, w:9, h:0.28, fontSize:9.5, color:'7EA0C4', fontFace:'Arial', align:'center' });
            s1.addText('Centre de Formation', { x:0.35, y:5.22, w:4, h:0.3, fontSize:9, color:'4A6FA5', fontFace:'Arial' });

            // SLIDE 2 — STATS FICHE
            const s2 = pptx.addSlide();
            addHeader(s2, 'FICHE JOUEUR');
            s2.addText(nom + (posteLabel ? '  —  ' + posteLabel : ''), { x:0.3, y:0.9, w:9.4, h:0.38, fontSize:13, color:NAVY, fontFace:'Arial', bold:true, valign:'middle' });
            let s2InfoY = 1.28;
            if (tjStr) { s2.addText(tjStr, { x:0.3, y:s2InfoY, w:9, h:0.28, fontSize:10, color:DGRAY, fontFace:'Arial' }); s2InfoY += 0.28; }
            if (pptBadges.length > 0) {
                s2.addShape(pptx.ShapeType.roundRect, { x:0.3, y:s2InfoY, w:9.4, h:0.3, fill:{ color:'EFF6FF' }, line:{ color:'BFDBFE', width:0.5 } });
                s2.addText(pptBadges.join('   '), { x:0.3, y:s2InfoY, w:9.4, h:0.3, fontSize:9, color:'1E3A8A', fontFace:'Arial', bold:true, align:'center', valign:'middle' });
                s2InfoY += 0.35;
            }
            const sY = Math.max(1.65, s2InfoY + 0.07), sH = 1.55;
            if (!isGB) {
                const { buts, total, eff, pd, po, pb, note } = statVals;
                const ns = (note>0?'+':'')+note;
                const boxes = [
                    { val:`${buts}/${total}`, lbl:'BUTS / TIRS',  col:NAVY },
                    { val:`${eff}%`,          lbl:'EFFICACITÉ',    col:eff>=50?GREEN:eff>=35?GOLD:RED },
                    { val:`${pd}`,            lbl:'PASSES DÉC.',   col:NAVY },
                    { val:`${po}`,            lbl:'PÉN. OBTENUS',  col:NAVY },
                    { val:`${pb}`,            lbl:'PERTES BALLE',  col:pb>0?RED:NAVY },
                    { val:ns,                 lbl:'NOTE TOTALE',   col:note>0?GREEN:note<0?RED:DGRAY },
                ];
                boxes.forEach((b, i) => {
                    const x=0.2+(i%3)*3.2, y=sY+Math.floor(i/3)*1.7;
                    s2.addShape(pptx.ShapeType.rect, { x, y, w:3.1, h:sH, fill:{ color:LGRAY }, line:{ color:'E2E8F0', width:1 } });
                    s2.addText(b.val, { x:x+0.1, y:y+0.12, w:2.9, h:1.0, fontSize:34, color:b.col, fontFace:'Arial', bold:true, align:'center', valign:'middle' });
                    s2.addText(b.lbl, { x:x+0.1, y:y+1.18, w:2.9, h:0.28, fontSize:8, color:DGRAY, fontFace:'Arial', align:'center', charSpacing:1 });
                });
            } else {
                const { arrets, butsC, totalF, gbEff, gbButs, gbPd } = statVals;
                const boxes = [
                    { val:`${arrets}/${totalF}`, lbl:'ARRÊTS / TIRS', col:NAVY },
                    { val:`${gbEff}%`,           lbl:'EFFICACITÉ',     col:gbEff>=40?GREEN:gbEff>=30?GOLD:RED },
                    { val:`${gbPd}`,             lbl:'PASSES DÉC.',    col:NAVY },
                    { val:`${gbButs}`,           lbl:'BUTS MARQUÉS',   col:gbButs>0?GREEN:NAVY },
                ];
                boxes.forEach((b, i) => {
                    const x=0.4+i*2.35;
                    s2.addShape(pptx.ShapeType.rect, { x, y:sY, w:2.2, h:sH, fill:{ color:LGRAY }, line:{ color:'E2E8F0', width:1 } });
                    s2.addText(b.val, { x:x+0.05, y:sY+0.12, w:2.1, h:1.0, fontSize:30, color:b.col, fontFace:'Arial', bold:true, align:'center', valign:'middle' });
                    s2.addText(b.lbl, { x:x+0.05, y:sY+1.18, w:2.1, h:0.28, fontSize:8, color:DGRAY, fontFace:'Arial', align:'center', charSpacing:1 });
                });
            }

            // SLIDE 3 — ACTIONS ATT + DEF (4 colonnes sur 1 slide)
            if (!isGB) {
                const nm = effectiveMatchs.length;
                const fmtR = n => nm>0?(n/nm).toFixed(1)+'/m':'—';
                const s3 = pptx.addSlide();
                addHeader(s3, 'ACTIONS ATT / DEF');

                const colF = { fontSize:7.5, fontFace:'Arial', valign:'middle' };
                const mkLbl = txt => ({ text:txt, options:{ ...colF, align:'left', color:'1E293B', fill:{ color:LGRAY }, border:{ pt:0.3, color:'E2E8F0' } } });
                const mkVal = (n, col) => ({ text:n.toString(), options:{ ...colF, bold:true, align:'center', color:col, fill:{ color:LGRAY }, border:{ pt:0.3, color:'E2E8F0' } } });
                const mkSub = txt => ({ text:txt, options:{ ...colF, align:'center', color:DGRAY, fill:{ color:LGRAY }, border:{ pt:0.3, color:'E2E8F0' } } });
                const buildR = (detail, col) => Object.entries(detail).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([lbl,cnt]) => [mkLbl(lbl), mkVal(cnt, col), mkSub(fmtR(cnt))]);

                const cols4 = [
                    { title:'ATT +', count:attPlus,  detail:attPlusDetail,  color:GREEN, x:0.15 },
                    { title:'ATT −', count:attMoins, detail:attMoinsDetail, color:RED,   x:2.6  },
                    { title:'DEF +', count:defPlus,  detail:defPlusDetail,  color:GREEN, x:5.05 },
                    { title:'DEF −', count:defMoins, detail:defMoinsDetail, color:RED,   x:7.5  },
                ];
                const CW = 2.35;
                const allR = cols4.map(d => buildR(d.detail, d.color));
                const maxR = Math.max(1, ...allR.map(r => r.length));
                const rH   = Math.min(0.28, 3.5 / maxR);

                // Bandeau section ATT / DEF
                s3.addShape(pptx.ShapeType.rect, { x:0.15, y:0.9, w:4.7, h:0.22, fill:{ color:'DBEAFE' } });
                s3.addText('ATTAQUE', { x:0.15, y:0.9, w:4.7, h:0.22, fontSize:7, color:'1E40AF', fontFace:'Arial', bold:true, align:'center', valign:'middle', charSpacing:2 });
                s3.addShape(pptx.ShapeType.rect, { x:5.05, y:0.9, w:4.8, h:0.22, fill:{ color:'DCFCE7' } });
                s3.addText('DÉFENSE', { x:5.05, y:0.9, w:4.8, h:0.22, fontSize:7, color:'166534', fontFace:'Arial', bold:true, align:'center', valign:'middle', charSpacing:2 });

                cols4.forEach((d, i) => {
                    const rows = allR[i];
                    s3.addShape(pptx.ShapeType.rect, { x:d.x, y:1.15, w:CW, h:0.32, fill:{ color:d.color } });
                    s3.addText(`${d.title}  ·  ${d.count}  ·  ${fmtR(d.count)}`, { x:d.x, y:1.15, w:CW, h:0.32, fontSize:8.5, color:WHITE, fontFace:'Arial', bold:true, align:'center', valign:'middle' });
                    if (rows.length > 0) {
                        const padded = [...rows, ...Array(Math.max(0, maxR-rows.length)).fill(null).map(() => [
                            {text:'', options:{...colF, fill:{color:LGRAY}, border:{pt:0}}},
                            {text:'', options:{...colF, fill:{color:LGRAY}, border:{pt:0}}},
                            {text:'', options:{...colF, fill:{color:LGRAY}, border:{pt:0}}}
                        ])];
                        s3.addTable(padded, { x:d.x, y:1.5, w:CW, colW:[1.5, 0.45, 0.4], rowH:rH, border:{ pt:0.3, color:'E2E8F0' } });
                    }
                });

                // Notes résumé en bas
                const noteA=attPlus-attMoins, noteD=defPlus-defMoins, noteT=noteA+noteD;
                const sg = v => (v>=0?'+':'')+v;
                const nc = v => v>0?GREEN:v<0?RED:DGRAY;
                [[sg(noteA),nc(noteA),'NOTE ATT',0.5],[sg(noteD),nc(noteD),'NOTE DEF',3.9],[sg(noteT),nc(noteT),'NOTE TOTALE',7.2]].forEach(([v,col,lbl,x]) => {
                    s3.addText(v,   { x, y:4.95, w:2.5, h:0.35, fontSize:20, color:col, fontFace:'Arial', bold:true, align:'center' });
                    s3.addText(lbl, { x, y:5.3,  w:2.5, h:0.2,  fontSize:7, color:DGRAY, fontFace:'Arial', align:'center', charSpacing:1 });
                });
            }

            // SLIDE 4 — ZONES DE TIR / ARRÊT
            if (impactAll.length > 0) {
                const totalI   = impactAll.length;
                const positifs = isGB ? impactAll.filter(r=>r[COLS.finalite]==='Tir arrêté').length : impactAll.filter(r=>r[COLS.resultat]==='But').length;
                const pctI     = Math.round(positifs/totalI*100);
                const zTitle   = isGB ? `ZONES D'ARRÊT — ${positifs} arrêts / ${totalI} tirs (${pctI}%)` : `ZONES DE TIR — ${positifs} buts / ${totalI} tirs (${pctI}%)`;
                const s4 = pptx.addSlide();
                addHeader(s4, zTitle);

                // Images but (compactes pour laisser place à la grille zones)
                const iW=2.9, iH=1.5, iY=0.92;
                s4.addImage({ data:imgAlg,  x:0.2,  y:iY, w:iW, h:iH });
                s4.addImage({ data:imgFace, x:3.55, y:iY, w:iW, h:iH });
                s4.addImage({ data:imgAld,  x:6.9,  y:iY, w:iW, h:iH });
                [['EXT GAUCHE',0.2],['CENTRAL',3.55],['EXT DROIT',6.9]].forEach(([l,x]) =>
                    s4.addText(l, { x, y:iY+iH+0.06, w:iW, h:0.2, fontSize:7.5, color:DGRAY, fontFace:'Arial', align:'center', bold:true, charSpacing:1 })
                );
                const legY = iY+iH+0.32;
                s4.addShape(pptx.ShapeType.ellipse, { x:0.2,  y:legY+0.02, w:0.16, h:0.16, fill:{ color:GREEN } });
                s4.addText(isGB?'Arrêt':'But', { x:0.42, y:legY, w:1.4, h:0.2, fontSize:8, color:DGRAY, fontFace:'Arial' });
                s4.addShape(pptx.ShapeType.rect,   { x:2.0,  y:legY+0.02, w:0.16, h:0.16, fill:{ color:RED } });
                s4.addText(isGB?'But encaissé':'Tir raté', { x:2.22, y:legY, w:1.8, h:0.2, fontSize:8, color:DGRAY, fontFace:'Arial' });
                const sans = totalI - impactCoords.length;
                if (sans>0) s4.addText(`${sans} tir(s) sans coordonnées`, { x:5, y:legY, w:4.8, h:0.2, fontSize:7.5, color:'94A3B8', fontFace:'Arial', align:'right' });

                // Grille efficacité par zone — layout flex identique à Impact > Efficacité
                // Chaque ligne remplit toute la largeur (6/5/4 cellules → plus larges en bas)
                const gX0=0.25, gY0=3.25, gCH=0.52, gGap=0.06, totalGW=9.5;
                s4.addText('EFFICACITÉ PAR ZONE', { x:gX0, y:2.96, w:9.5, h:0.22, fontSize:8, color:NAVY, fontFace:'Arial', bold:true, charSpacing:1 });
                const zoneRows4 = [
                    ['6m ail G','6m ext G','6m central G','6m central D','6m ext D','6m ail D'],
                    ['6-9 ext G','6-9 central G','7m','6-9 central D','6-9 ext D'],
                    ['9m ext G','9m Int G','9m Int D','9m ext D'],
                ];
                zoneRows4.forEach((cells, ri) => {
                    const n  = cells.length;
                    const cw = (totalGW - gGap * (n - 1)) / n;
                    const gy = gY0 + ri * (gCH + gGap);
                    cells.forEach((zone, ci) => {
                        const gx = gX0 + ci * (cw + gGap);
                        const zd = zoneStats[zone];
                        if (!zd || zd.total === 0) {
                            s4.addShape(pptx.ShapeType.roundRect, { x:gx, y:gy, w:cw, h:gCH, fill:{ color:'F1F5F9' }, line:{ color:'E2E8F0', width:0.5 } });
                            s4.addText(zone, { x:gx+0.05, y:gy, w:cw-0.1, h:gCH, fontSize:6.5, color:'CBD5E1', fontFace:'Arial', align:'center', valign:'middle' });
                        } else {
                            const pct = Math.round(zd.buts / zd.total * 100);
                            const [bg, tx] = pct>=65?['D1FAE5','065F46']:pct>=45?['FEF3C7','92400E']:['FEE2E2','991B1B'];
                            s4.addShape(pptx.ShapeType.roundRect, { x:gx, y:gy, w:cw, h:gCH, fill:{ color:bg }, line:{ color:bg, width:0 } });
                            s4.addText([
                                { text:zone,      options:{ fontSize:6.5, color:tx, fontFace:'Arial', align:'center', breakLine:true } },
                                { text:`${pct}%`, options:{ fontSize:13,  color:tx, fontFace:'Arial', bold:true, align:'center' } },
                            ], { x:gx+0.05, y:gy, w:cw-0.1, h:gCH, align:'center', valign:'middle' });
                        }
                    });
                });
            }

            // SLIDE 5 — GRAPHIQUE
            if (graphDataUrl) {
                const s5 = pptx.addSlide();
                addHeader(s5, isGB ? 'PERFORMANCES PAR RENCONTRE' : 'PROGRESSION DES NOTES');
                s5.addImage({ data:graphDataUrl, x:0.3, y:0.95, w:9.4, h:4.5 });
            }

            // SLIDE 6 — TABLEAU DES MATCHS
            const matchEntries = Object.entries(sbm);
            if (matchEntries.length > 0) {
                const s6 = pptx.addSlide();
                addHeader(s6, 'DÉTAIL PAR MATCH');
                const hF = { color:WHITE, bold:true, fontSize:7, fontFace:'Arial' };
                const cF = { fontSize:7, fontFace:'Arial' };
                const hFill = { color:NAVY };
                const colW = [1.55,0.58,0.52,0.52,0.52,0.52,0.38,0.38,0.38,0.46,0.46,0.46];
                const mkCell = (text, opts) => ({ text, options: { ...opts, valign:'middle', border:{ pt:0.5, color:'E2E8F0' } } });
                const fmtN = n => n>0?'+'+n:n.toString();
                const colN = n => ({ color:n>0?GREEN:n<0?RED:DGRAY, bold:n!==0 });
                let tot = initF();
                const hdr = ['MATCH','B/T','%CH','PEN','%PEN','%TOT','PB','PO','PD','ATT','DEF','TOT'].map((h,i) =>
                    mkCell(h, { ...hF, fill:hFill, align:i===0?'left':'center' })
                );
                const trows = [hdr];
                matchEntries.forEach(([m, s]) => {
                    const tC=s.bc+s.tc, tP=s.bp+s.tp, tT=tC+tP, tB=s.bc+s.bp;
                    const nA=s.ap-s.am, nD=s.dp-s.dm, nT=nA+nD;
                    Object.keys(tot).forEach(k => tot[k]+=s[k]);
                    trows.push([
                        mkCell(m, { ...cF, align:'center', bold:true, color:NAVY }),
                        mkCell(`${s.bc}/${tC}`, { ...cF, align:'center' }),
                        mkCell(tC>0?Math.round(s.bc/tC*100)+'%':'-', { ...cF, align:'center' }),
                        mkCell(tP>0?`${s.bp}/${tP}`:'-', { ...cF, align:'center' }),
                        mkCell(tP>0?Math.round(s.bp/tP*100)+'%':'-', { ...cF, align:'center' }),
                        mkCell(tT>0?Math.round(tB/tT*100)+'%':'-', { ...cF, align:'center' }),
                        mkCell(s.pb.toString(), { ...cF, align:'center', color:s.pb>0?RED:DGRAY }),
                        mkCell(s.po.toString(), { ...cF, align:'center' }),
                        mkCell(s.pd.toString(), { ...cF, align:'center' }),
                        mkCell(fmtN(nA), { ...cF, align:'center', ...colN(nA) }),
                        mkCell(fmtN(nD), { ...cF, align:'center', ...colN(nD) }),
                        mkCell(fmtN(nT), { ...cF, align:'center', ...colN(nT) }),
                    ]);
                });
                const tC=tot.bc+tot.tc, tP=tot.bp+tot.tp, tT=tC+tP, tB=tot.bc+tot.bp;
                const tNA=tot.ap-tot.am, tND=tot.dp-tot.dm, tNT=tNA+tND;
                trows.push([
                    mkCell('TOTAL', { ...hF, fill:hFill, align:'center' }),
                    mkCell(`${tot.bc}/${tC}`, { ...hF, fill:hFill, align:'center' }),
                    mkCell(tC>0?Math.round(tot.bc/tC*100)+'%':'-', { ...hF, fill:hFill, align:'center' }),
                    mkCell(tP>0?`${tot.bp}/${tP}`:'-', { ...hF, fill:hFill, align:'center' }),
                    mkCell(tP>0?Math.round(tot.bp/tP*100)+'%':'-', { ...hF, fill:hFill, align:'center' }),
                    mkCell(tT>0?Math.round(tB/tT*100)+'%':'-', { ...hF, fill:hFill, align:'center' }),
                    mkCell(tot.pb.toString(), { ...hF, fill:hFill, align:'center' }),
                    mkCell(tot.po.toString(), { ...hF, fill:hFill, align:'center' }),
                    mkCell(tot.pd.toString(), { ...hF, fill:hFill, align:'center' }),
                    mkCell(fmtN(tNA), { ...hF, fill:hFill, align:'center' }),
                    mkCell(fmtN(tND), { ...hF, fill:hFill, align:'center' }),
                    mkCell(fmtN(tNT), { ...hF, fill:hFill, align:'center' }),
                ]);
                s6.addTable(trows, { x:0.25, y:1.0, w:9.5, colW, rowH:0.22, border:{ pt:0.5, color:'E2E8F0' } });
            }

            await pptx.writeFile({ fileName: `${nom.replace(/\s+/g,'_')}_suivi_CF.pptx` });
            } // end if(false) — ancien code PPT désactivé
        }

