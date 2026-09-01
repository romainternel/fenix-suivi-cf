        // ===== PAGE ANALYSE — v163 =====
        // Chargé depuis Supabase au boot (loadFromSupabase(), STORY-24) — plus de source localStorage.
        let coachAnalyses = {};
        let chatHistory = [];

        // ===== MODULE ANALYSE — familles tactiques (8 familles, validées coach 2026-08-27) =====
        // La correspondance Intention attaque → Famille vit désormais dans Supabase (FAMILLE_MAPPING,
        // chargée au boot, STORY-24) — l'ancien littéral ENC_FAMILLE_MAP a été retiré.
        const ENC_FAMILLES_ORDRE = ['Isoler','Rentrée','Jeu Pivot','7vs6','Faire courir','Spéciaux','6vs5','Jeu Rapide'];
        const ENC_FAMILLE_COLORS = {
            'Isoler':'var(--enc-isoler)',
            'Rentrée':'var(--enc-rentree)','Jeu Pivot':'var(--enc-jeu-pvt)',
            '7vs6':'var(--enc-7vs6)',
            'Faire courir':'var(--enc-faire-courir)','Spéciaux':'var(--enc-speciaux)',
            '6vs5':'var(--enc-6vs5)','Jeu Rapide':'var(--enc-jeu-rapide)','Autre':'var(--enc-autre)',
        };
        const ENC_FAMILLE_IDS = {
            'Isoler':'isoler','Rentrée':'rentree',
            'Jeu Pivot':'jeu-pivot','7vs6':'7vs6',
            'Faire courir':'faire-courir','Spéciaux':'speciaux','6vs5':'6vs5','Jeu Rapide':'jeu-rapide','Autre':'autre',
        };

        let _momentsCles = [];
        let _bascules = [];
        let _encStatsCache = null;
        let _encStatsCacheMatch = null;

        // Normalisation temps vidéo → minutes de match (0-60)
        // Mise à jour par drawTimeline, utilisée par renderBasculContext et findMomentsCles
        let _timeNorm = { max1: 0, maxAll: 1, hasTwo: false };
        function posToMatchMin(pos) {
            const { max1, maxAll, hasTwo } = _timeNorm;
            if (!hasTwo || maxAll <= 0) return Math.floor(pos / 60);
            if (pos <= max1) return max1 > 0 ? Math.round((pos / max1) * 30) : 0;
            return Math.round(30 + ((pos - max1) / Math.max(maxAll - max1, 1)) * 30);
        }
        function fmtMatchMin(pos) {
            if (pos == null || isNaN(pos)) return '?';
            const m = posToMatchMin(pos);
            return m + "'";
        }
        let _gardienFamilleFilter = null;
        let _gardienSelected = null;
        let _lastBasculeResult = null;
        let _encStatsSaison = null;
        let _encMatrixHoverController = null;
        let _ENC_FAMILLE_CUSTOM = {};
        try { _ENC_FAMILLE_CUSTOM = JSON.parse(localStorage.getItem('enc_famille_custom') || '{}'); } catch(e) {}

        function checkPeriodeData(matchData) {
            const total = matchData.length;
            if (total === 0) return { ok: false, partial: false, withPeriode: 0, total: 0 };
            const withPeriode = matchData.filter(row => /^[12]/.test((row[COLS.periode] || '').toString().trim())).length;
            const pct = withPeriode / total;
            return { ok: withPeriode > 0, partial: pct > 0 && pct < 0.7, withPeriode, total };
        }

        function updateAnalysePage() {
            const matchFilter = document.getElementById('filter-match-global').value;

            if (!matchFilter) {
                document.getElementById('analyse-content').style.display = 'none';
                document.getElementById('analyse-empty').style.display = 'block';
                renderEncFamillesSection(DATA);
                generateSeasonCorrelations();
                return;
            }

            document.getElementById('analyse-content').style.display = 'block';
            document.getElementById('analyse-empty').style.display = 'none';

            const matchData = DATA.filter(row => row[COLS.rencontre] === matchFilter);

            // Vérifier la qualité des données période
            const periodeCheck = checkPeriodeData(matchData);
            const hasPeriode = periodeCheck.ok;
            const warningEl = document.getElementById('periode-warning');
            if (warningEl) {
                if (periodeCheck.partial) {
                    warningEl.textContent = `⚠ Données période partielles (${periodeCheck.withPeriode}/${periodeCheck.total} lignes) — résultats MT1/MT2 approximatifs.`;
                    warningEl.style.display = 'block';
                } else if (!hasPeriode && matchData.length > 0) {
                    warningEl.textContent = `⚠ Aucune donnée de période — colonnes MT1/MT2 masquées.`;
                    warningEl.style.display = 'block';
                } else {
                    warningEl.style.display = 'none';
                }
            }

            // Charger l'analyse coach sauvegardée
            document.getElementById('coach-analyse').value = coachAnalyses[matchFilter] || '';

            // Reset chat
            chatHistory = [];
            document.getElementById('chat-messages').innerHTML = `
                <div class="chat-message ia">
                    <div class="chat-avatar">🤖</div>
                    <div class="chat-content">Salut Coach ! Je suis prêt à analyser le match <strong>${matchFilter}</strong> avec toi. Pose-moi tes questions !</div>
                </div>
            `;

            // Générer l'analyse
            generateResume3Points(matchFilter, matchData, hasPeriode);
            generateIndicateurs(matchFilter, matchData, hasPeriode);
            _momentsCles = [];
            _bascules = [];
            findMomentsCles(matchFilter, matchData);
            _bascules = detectAllBascules(getSortedGoals(matchData), matchData);
            window._currentMatchName = matchFilter;
            window._currentMatchData = matchData;
            drawTimeline(matchFilter, matchData);
            const _tlCanvas = document.getElementById('timeline-canvas');
            if (_tlCanvas && !_tlCanvas._tooltipInit) { initTimelineTooltip(); _tlCanvas._tooltipInit = true; }
            renderBasculContext(matchData, _bascules);
            renderEncFamillesSection(matchData);
            renderGardienEncSection(matchData);
            _analyseTab(sessionStorage.getItem('an_active_tab') || 'resume');
        }

        // STORY-14 — Onglets page Analyse (structure calquée sur pmTab(), js/player-mode.js).
        // Toujours appelée quand #analyse-content est affiché (un match est sélectionné) :
        // les 5 onglets ont donc toujours un contenu valide, pas de cas "onglet vide" à gérer ici.
        const AN_TABS = ['resume', 'timeline', 'enclenchements', 'gardien', 'chat'];
        function _analyseTab(tab) {
            if (!AN_TABS.includes(tab)) tab = 'resume';
            sessionStorage.setItem('an_active_tab', tab);
            document.querySelectorAll('.an-tab-btn').forEach(b => {
                const active = b.dataset.tab === tab;
                b.classList.toggle('active', active);
                b.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            AN_TABS.forEach(t => {
                const el = document.getElementById('an-tab-' + t);
                if (el) el.style.display = (t === tab) ? 'block' : 'none';
            });
            // Canvas dimensionnés via clientWidth du conteneur : redessiner à l'ouverture de
            // l'onglet évite un canvas figé sur la taille du dernier onglet actif au moment du rendu.
            if (tab === 'timeline' && window._currentMatchName && window._currentMatchData) {
                drawTimeline(window._currentMatchName, window._currentMatchData);
            } else if (tab === 'enclenchements') {
                requestAnimationFrame(() => _drawEncChart());
            }
        }

        function generateResume3Points(matchName, matchData, hasPeriode) {
            const fenixData = matchData.filter(row => row[COLS.club] === 'FENIX');
            const advData   = matchData.filter(row => row[COLS.club] !== 'FENIX');

            const fenixButs = fenixData.filter(r => r[COLS.resultat] === 'But').length;
            const advButs   = advData.filter(r => r[COLS.resultat] === 'But').length;
            const fenixTirs = fenixButs + fenixData.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const advTirs   = advButs  + advData.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const fenixEff  = fenixTirs > 0 ? Math.round(fenixButs / fenixTirs * 100) : 0;
            const advEff    = advTirs  > 0 ? Math.round(advButs  / advTirs  * 100) : 0;
            const fenixPB   = fenixData.filter(r => r[COLS.resultat] === 'PB').length;
            const advPB     = advData.filter(r => r[COLS.resultat] === 'PB').length;

            const fenixTirsSubis = advData.filter(r => r[COLS.finalite] === 'But' || r[COLS.finalite] === 'Tir arrêté').length;
            const fenixArrets    = advData.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
            const fenixGardEff   = fenixTirsSubis > 0 ? Math.round(fenixArrets / fenixTirsSubis * 100) : 0;
            const advTirsSubis   = fenixData.filter(r => r[COLS.finalite] === 'But' || r[COLS.finalite] === 'Tir arrêté').length;
            const advArrets      = fenixData.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
            const advGardEff     = advTirsSubis > 0 ? Math.round(advArrets / advTirsSubis * 100) : 0;

            const getSup = (data, sign) => data.filter(r => (r[COLS.phase_att] || '').toString().includes(sign));
            const fSup = getSup(fenixData, '+'), aSup = getSup(advData, '+');
            const fSupB = fSup.filter(r => r[COLS.resultat] === 'But').length;
            const fSupT = fSupB + fSup.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const aSupB = aSup.filter(r => r[COLS.resultat] === 'But').length;
            const aSupT = aSupB + aSup.filter(r => r[COLS.resultat] === 'Tir raté').length;

            const candidates = [];

            // Efficacité
            const effDiff = fenixEff - advEff;
            if (Math.abs(effDiff) >= 5) candidates.push({
                score: Math.abs(effDiff),
                icon: '🎯',
                text: effDiff > 0
                    ? `Bonne efficacité FENIX : ${fenixEff}% vs ${advEff}%`
                    : `Efficacité insuffisante : ${fenixEff}% vs ${advEff}% adversaire`
            });

            // Pertes de balle
            const pbDiff = fenixPB - advPB;
            if (Math.abs(pbDiff) >= 2) candidates.push({
                score: Math.abs(pbDiff) * 2,
                icon: pbDiff < 0 ? '✅' : '🔴',
                text: pbDiff < 0
                    ? `Maîtrise du ballon : seulement ${fenixPB} PB (vs ${advPB})`
                    : `${fenixPB} pertes de balle (vs ${advPB} adversaire)`
            });

            // Gardien
            const gardDiff = fenixGardEff - advGardEff;
            if (Math.abs(gardDiff) >= 5) candidates.push({
                score: Math.abs(gardDiff),
                icon: '🧤',
                text: gardDiff > 0
                    ? `Bon gardien : ${fenixGardEff}% d'arrêts (vs ${advGardEff}%)`
                    : `Gardien en difficulté : ${fenixGardEff}% d'arrêts (vs ${advGardEff}%)`
            });

            // Supériorités
            const supDiff = fSupB - aSupB;
            if (Math.abs(supDiff) >= 1 && (fSupT > 0 || aSupT > 0)) candidates.push({
                score: Math.abs(supDiff) * 3,
                icon: supDiff > 0 ? '💪' : '⚠️',
                text: supDiff > 0
                    ? `Supériorités gagnées : FENIX ${fSupB}/${fSupT} vs ADV ${aSupB}/${aSupT}`
                    : `Supériorités perdues : FENIX ${fSupB}/${fSupT} vs ADV ${aSupB}/${aSupT}`
            });

            // Momentum MT2 (si données période fiables)
            if (hasPeriode) {
                const fMT1 = fenixData.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 1).length;
                const fMT2 = fenixData.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 2).length;
                const aMT1 = advData.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 1).length;
                const aMT2 = advData.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 2).length;
                const delta = (fMT2 - aMT2) - (fMT1 - aMT1);
                if (Math.abs(delta) >= 2) candidates.push({
                    score: Math.abs(delta) * 2,
                    icon: delta > 0 ? '📈' : '📉',
                    text: delta > 0
                        ? `FENIX meilleur en MT2 : ${fMT2}-${aMT2} (vs MT1 ${fMT1}-${aMT1})`
                        : `Déclin en MT2 : ${fMT2}-${aMT2} (vs MT1 ${fMT1}-${aMT1})`
                });
            }

            // Trier par magnitude décroissante → top 3
            candidates.sort((a, b) => b.score - a.score);
            const top3 = candidates.slice(0, 3);

            let resultClass, resultText;
            if (fenixButs > advButs) { resultClass = 'victoire'; resultText = `✅ VICTOIRE ${fenixButs}-${advButs}`; }
            else if (fenixButs < advButs) { resultClass = 'defaite'; resultText = `❌ DÉFAITE ${fenixButs}-${advButs}`; }
            else { resultClass = 'nul'; resultText = `➖ MATCH NUL ${fenixButs}-${advButs}`; }

            let html = `<div class="ia-diagnostic ${resultClass}"><h4>${resultText}</h4></div>`;
            if (top3.length === 0) {
                html += `<p style="color:#6B7280;font-size:0.85rem;">Pas assez de données pour générer un résumé.</p>`;
            } else {
                top3.forEach(p => {
                    html += `<div class="ia-point"><span class="ia-point-icon">${p.icon}</span><span>${p.text}</span></div>`;
                });
            }
            document.getElementById('ia-analyse').innerHTML = html;
        }

        function generateIndicateurs(matchName, matchData, hasPeriode) {
            const fenixData = matchData.filter(row => row[COLS.club] === 'FENIX');
            const advData   = matchData.filter(row => row[COLS.club] !== 'FENIX');

            const subData = (data, p) => hasPeriode ? data.filter(r => getPeriodeNum(r) === p) : [];

            function stats(data) {
                const buts = data.filter(r => r[COLS.resultat] === 'But').length;
                const tirs = buts + data.filter(r => r[COLS.resultat] === 'Tir raté').length;
                return {
                    buts, tirs,
                    eff:  tirs > 0 ? Math.round(buts / tirs * 100) : null,
                    pb:   data.filter(r => r[COLS.resultat] === 'PB').length,
                    poss: data.filter(r => r[COLS.possession] && String(r[COLS.possession]).trim()).length
                };
            }

            const tot = { f: stats(fenixData),             a: stats(advData) };
            const mt1 = { f: stats(subData(fenixData, 1)), a: stats(subData(advData, 1)) };
            const mt2 = { f: stats(subData(fenixData, 2)), a: stats(subData(advData, 2)) };

            const getSup = (data, s) => data.filter(r => (r[COLS.phase_att] || '').toString().includes(s));
            const fSup = getSup(fenixData, '+'), aSup = getSup(advData, '+');
            const fSupB = fSup.filter(r => r[COLS.resultat] === 'But').length;
            const fSupT = fSupB + fSup.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const aSupB = aSup.filter(r => r[COLS.resultat] === 'But').length;
            const aSupT = aSupB + aSup.filter(r => r[COLS.resultat] === 'Tir raté').length;

            function card(label, fVal, aVal, { inverse = false, isPct = false, fMT1 = null, aMT1 = null, fMT2 = null, aMT2 = null } = {}) {
                const cls = fVal == null || aVal == null ? '' :
                    inverse ? (fVal < aVal ? 'avantage' : fVal > aVal ? 'desavantage' : '') :
                              (fVal > aVal ? 'avantage' : fVal < aVal ? 'desavantage' : '');
                const fmt = v => v != null ? `${v}${isPct ? '%' : ''}` : '—';
                let sub = '';
                if (hasPeriode && fMT1 != null) {
                    sub = `<div class="ind-sub">MT1 ${fmt(fMT1)}<span class="ind-sub-vs">–</span>${fmt(aMT1)} · MT2 ${fmt(fMT2)}<span class="ind-sub-vs">–</span>${fmt(aMT2)}</div>`;
                }
                return `<div class="indicateur-card ${cls}">
                    <div class="indicateur-label">${label}</div>
                    <div class="indicateur-values">
                        <span class="indicateur-fenix">${fmt(fVal)}</span>
                        <span class="indicateur-vs">vs</span>
                        <span class="indicateur-adv">${fmt(aVal)}</span>
                    </div>${sub}
                </div>`;
            }

            const supCls = fSupB > aSupB ? 'avantage' : fSupB < aSupB ? 'desavantage' : '';

            let html = '';
            html += card('Buts',           tot.f.buts, tot.a.buts, { fMT1: mt1.f.buts, aMT1: mt1.a.buts, fMT2: mt2.f.buts, aMT2: mt2.a.buts });
            html += card('Tirs',           tot.f.tirs, tot.a.tirs, { fMT1: mt1.f.tirs, aMT1: mt1.a.tirs, fMT2: mt2.f.tirs, aMT2: mt2.a.tirs });
            html += card('Efficacité',     tot.f.eff,  tot.a.eff,  { isPct: true, fMT1: mt1.f.eff, aMT1: mt1.a.eff, fMT2: mt2.f.eff, aMT2: mt2.a.eff });
            html += card('Pertes de balle', tot.f.pb,  tot.a.pb,   { inverse: true, fMT1: mt1.f.pb, aMT1: mt1.a.pb, fMT2: mt2.f.pb, aMT2: mt2.a.pb });
            html += card('Possessions',    tot.f.poss, tot.a.poss, { fMT1: mt1.f.poss, aMT1: mt1.a.poss, fMT2: mt2.f.poss, aMT2: mt2.a.poss });
            html += `<div class="indicateur-card ${supCls}">
                <div class="indicateur-label">Supériorités (+)</div>
                <div class="indicateur-values">
                    <span class="indicateur-fenix">${fSupB}b/${fSupT}t</span>
                    <span class="indicateur-vs">vs</span>
                    <span class="indicateur-adv">${aSupB}b/${aSupT}t</span>
                </div>
            </div>`;

            document.getElementById('indicateurs-grid').innerHTML = html;
        }

        // ===== DÉTECTION BASCULES =====
        function detectAllBascules(sortedGoals, matchData) {
            const bascules = [];
            if (sortedGoals.length < 3) return bascules;

            const fmtD = d => (d >= 0 ? '+' : '') + d;
            const toMin = p => fmtMatchMin(p);

            // Reconstruit le score but par but
            let fS = 0, aS = 0;
            const pts = [{ rawPos: 0, fenix: 0, adv: 0, idx: -1 }];
            sortedGoals.forEach(({ row, pos }, i) => {
                if (row[COLS.club] === 'FENIX') fS++; else aS++;
                pts.push({ rawPos: pos, fenix: fS, adv: aS, idx: i, row });
            });
            const diffs = pts.map(p => p.fenix - p.adv);

            const getCtx = (gIdx, nBefore, nAfter) => {
                const s = Math.max(0, gIdx - nBefore), e = Math.min(sortedGoals.length - 1, gIdx + nAfter);
                return sortedGoals.slice(s, e + 1);
            };

            // Type 1 — Décrochage (FENIX passe de +1 ou plus à négatif)
            for (let i = 1; i < diffs.length; i++) {
                if (diffs[i-1] > 0 && diffs[i] < 0) {
                    // Skip si on vient directement de 0-0 (première action du match)
                    if (diffs[i-1] === 0 && pts[i-1].rawPos === 0) continue;
                    const ctx = getCtx(pts[i].idx, 2, 1);
                    const advButs = ctx.filter(g => g.row[COLS.club] !== 'FENIX').length;
                    const minB = toMin(pts[i].rawPos), minD = ctx.length > 1 ? toMin(ctx[0].pos) : minB;
                    const startRaw = ctx.length ? ctx[0].pos : pts[i].rawPos;
                    const endRaw = ctx.length ? ctx[ctx.length - 1].pos : pts[i].rawPos;
                    bascules.push({
                        type: 'decrochage', label: 'Décrochage', positif: false,
                        rawPos: pts[i].rawPos, avant: diffs[i-1], apres: diffs[i],
                        startRaw, endRaw,
                        description: `À la ${minB}, l'adversaire prend les devants (${advButs} but${advButs > 1 ? 's' : ''} encaissés depuis la ${minD}). FENIX bascule de ${fmtD(diffs[i-1])} à ${fmtD(diffs[i])}.`
                    });
                }
            }

            // Type 4 — On reprend la main (FENIX repasse de négatif à +1 ou plus)
            for (let i = 1; i < diffs.length; i++) {
                if (diffs[i-1] < 0 && diffs[i] > 0) {
                    // Skip si on vient directement de 0-0 (première action du match)
                    if (diffs[i-1] === 0 && pts[i-1].rawPos === 0) continue;
                    const ctx = getCtx(pts[i].idx, 3, 0);
                    const fenButs = ctx.filter(g => g.row[COLS.club] === 'FENIX').length;
                    const fams = [...new Set(ctx.filter(g => g.row[COLS.club] === 'FENIX')
                        .map(g => getEncFamille(g.row[COLS.intention_attaque])).filter(f => f && f !== 'Autre'))];
                    const famStr = fams.length ? ` (${fams.join(', ')})` : '';
                    const minB = toMin(pts[i].rawPos), minD = ctx.length > 1 ? toMin(ctx[0].pos) : minB;
                    const startRaw = ctx.length ? ctx[0].pos : pts[i].rawPos;
                    const endRaw = ctx.length ? ctx[ctx.length - 1].pos : pts[i].rawPos;
                    bascules.push({
                        type: 'reprend-main', label: 'On reprend la main', positif: true,
                        rawPos: pts[i].rawPos, avant: diffs[i-1], apres: diffs[i],
                        startRaw, endRaw,
                        description: `FENIX marque ${fenButs} but${fenButs > 1 ? 's' : ''}${famStr} entre la ${minD} et la ${minB} et repasse devant. Écart : ${fmtD(diffs[i-1])} → ${fmtD(diffs[i])}.`
                    });
                }
            }

            // Type 2 — Enlisement (pire écart, si FENIX n'a jamais mené)
            const fenixEverLed = diffs.some(d => d > 0);
            if (!fenixEverLed) {
                let minDiff = 0, minIdx = -1;
                for (let i = 1; i < diffs.length; i++) {
                    if (diffs[i] < minDiff) { minDiff = diffs[i]; minIdx = i; }
                }
                if (minIdx !== -1 && minDiff <= -3) {
                    const avant = diffs[minIdx - 1] !== undefined ? diffs[minIdx - 1] : 0;
                    const rp = pts[minIdx].rawPos;
                    bascules.push({
                        type: 'enlisement', label: 'Enlisement', positif: false,
                        rawPos: rp, avant, apres: minDiff,
                        startRaw: rp - 90, endRaw: rp + 90,
                        description: `FENIX atteint son pire écart à la ${toMin(rp)} (${fmtD(minDiff)}). FENIX n'a jamais mené sur ce match.`
                    });
                }
            }

            // Type 3 — Occasion manquée (4+ possessions FENIX ratées en étant derrière)
            // Calcul de l'offset une seule fois, cohérent avec getSortedGoals
            const _g1raw = matchData.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 1);
            const _g2raw = matchData.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 2);
            const _max1raw = _g1raw.length ? Math.max(..._g1raw.map(r => parseTimecode(r[COLS.position]))) : 0;
            const _min2raw = _g2raw.length ? Math.min(..._g2raw.map(r => parseTimecode(r[COLS.position]))) : Infinity;
            const _offsetP2 = (_g2raw.length > 0 && _min2raw < _max1raw) ? _max1raw : 0;
            const toRaw = r => getPeriodeNum(r) === 2
                ? parseTimecode(r[COLS.position]) + _offsetP2
                : parseTimecode(r[COLS.position]);

            const fenixActions = matchData
                .filter(r => r[COLS.club] === 'FENIX' && (r[COLS.resultat] || '').trim())
                .sort((a, b) => toRaw(a) - toRaw(b));

            const COOLDOWN_3MIN = 180;
            let missCount = 0, firstMissRaw = 0, lastMissRaw = 0, lastOccasionRaw = -COOLDOWN_3MIN * 2;
            fenixActions.forEach(r => {
                if (r[COLS.resultat] === 'But') { missCount = 0; return; }
                if (missCount === 0) firstMissRaw = toRaw(r);
                missCount++;
                lastMissRaw = toRaw(r);
                if (missCount === 4) {
                    const closestPt = [...pts].reverse().find(p => p.rawPos <= firstMissRaw) || pts[0];
                    const diffAtSeq = closestPt ? closestPt.fenix - closestPt.adv : 0;
                    const cooldownOk = firstMissRaw - lastOccasionRaw >= COOLDOWN_3MIN;
                    if (diffAtSeq <= -2 && cooldownOk) {
                        lastOccasionRaw = firstMissRaw;
                        bascules.push({
                            type: 'occasion-manquee', label: 'Occasion manquée', positif: false,
                            rawPos: firstMissRaw, avant: diffAtSeq, apres: diffAtSeq,
                            startRaw: firstMissRaw, endRaw: lastMissRaw,
                            description: `À la ${toMin(firstMissRaw)}, FENIX loupe 4 possessions d'affilée (tirs ratés / PB). Le retard stagne à ${fmtD(diffAtSeq)}.`
                        });
                    }
                    missCount = 0;
                }
            });

            // Type 5 — Tactique payante (famille soudain très efficace)
            ENC_FAMILLES_ORDRE.forEach(famille => {
                const famPoss = matchData.filter(r =>
                    r[COLS.club] === 'FENIX' &&
                    getEncFamille(r[COLS.intention_attaque]) === famille &&
                    (r[COLS.resultat] === 'But' || r[COLS.resultat] === 'Tir raté' || (r[COLS.resultat] || '').toUpperCase().includes('PB'))
                );
                if (famPoss.length < 6) return;
                const prior = famPoss.slice(0, -4), recent = famPoss.slice(-4);
                if (prior.length < 2) return;
                const priorEff = prior.filter(r => r[COLS.resultat] === 'But').length / prior.length;
                const recentButs = recent.filter(r => r[COLS.resultat] === 'But').length;
                const recentEff = recentButs / recent.length;
                if (priorEff < 0.35 && recentEff >= 0.5 && recentButs >= 2) {
                    const firstBut = recent.find(r => r[COLS.resultat] === 'But');
                    const inSorted = firstBut && sortedGoals.find(g => g.row === firstBut);
                    if (!inSorted) return;
                    bascules.push({
                        type: 'tactique-payante', label: 'Tactique payante', positif: true,
                        rawPos: inSorted.pos, avant: 0, apres: 0,
                        seqRows: recent, // les 4 possessions exactes, utilisées directement dans le tableau
                        description: `"${famille}" devient décisive : ${recentButs} buts sur les 4 dernières possessions (${Math.round(recentEff * 100)}% vs ${Math.round(priorEff * 100)}% avant). Système qui fait la différence.`
                    });
                }
            });

            bascules.sort((a, b) => a.rawPos - b.rawPos);
            return bascules;
        }

        // parseTimecode, getPeriodeNum, getSortedGoals → déplacées dans utils.js

        function drawTimeline(matchName, matchData) {
            const canvas = document.getElementById('timeline-canvas');
            const container = canvas.parentElement;
            const cw = container.clientWidth || container.offsetWidth || 600;
            const dpr = window.devicePixelRatio || 1;
            const logicalW = Math.max(cw, 300);
            const logicalH = Math.max(container.clientHeight || 0, 380);
            canvas.width  = logicalW * dpr;
            canvas.height = logicalH * dpr;
            canvas.style.width  = logicalW + 'px';
            canvas.style.height = logicalH + 'px';
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, logicalW, logicalH);

            const sortedGoals = getSortedGoals(matchData);
            if (sortedGoals.length === 0) return;

            // Normalisation 0-60 min : MT1 → 0-30, MT2 → 30-60
            const g1Pos  = sortedGoals.filter(g => getPeriodeNum(g.row) === 1).map(g => g.pos);
            const g2Pos  = sortedGoals.filter(g => getPeriodeNum(g.row) === 2).map(g => g.pos);
            const max1   = g1Pos.length ? Math.max(...g1Pos) : 0;
            const maxAll = Math.max(...sortedGoals.map(g => g.pos), 1);
            const hasTwo = g1Pos.length > 0 && g2Pos.length > 0;
            _timeNorm = { max1, maxAll, hasTwo };

            function normPos(pos) {
                if (!hasTwo) return (pos / maxAll) * 60;
                if (pos <= max1) return max1 > 0 ? (pos / max1) * 30 : 0;
                return 30 + ((pos - max1) / Math.max(maxAll - max1, 1)) * 30;
            }

            let fenixScore = 0, advScore = 0;
            const scoreHistory = [{ pos: 0, fenix: 0, adv: 0 }];
            sortedGoals.forEach(({ row, pos }) => {
                if (row[COLS.club] === 'FENIX') fenixScore++;
                else advScore++;
                scoreHistory.push({ pos: normPos(pos), fenix: fenixScore, adv: advScore });
            });

            // Score à la mi-temps → #timeline-scores
            const fenixMT1G = sortedGoals.filter(g => getPeriodeNum(g.row) === 1 && g.row[COLS.club] === 'FENIX').length;
            const advMT1G   = sortedGoals.filter(g => getPeriodeNum(g.row) === 1 && g.row[COLS.club] !== 'FENIX').length;
            const scoresEl  = document.getElementById('timeline-scores');
            if (scoresEl) {
                scoresEl.textContent = hasTwo
                    ? `MT1 : ${fenixMT1G}-${advMT1G} · Final : ${fenixScore}-${advScore}`
                    : `Score final : ${fenixScore}-${advScore}`;
            }

            const padding = { top: 40, right: 30, bottom: 70, left: 45 };
            const graphWidth  = logicalW - padding.left - padding.right;
            const graphHeight = logicalH - padding.top  - padding.bottom;
            const maxScore   = Math.max(fenixScore, advScore, 5);
            const roundedMax = Math.ceil(maxScore / 5) * 5;
            const maxPos     = 60;

            // Grille horizontale
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (graphHeight * (5 - i) / 5);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(logicalW - padding.right, y);
                ctx.stroke();
            }

            // Ligne de mi-temps (30')
            if (hasTwo) {
                const xHalf = padding.left + (30 / maxPos) * graphWidth;
                ctx.save();
                ctx.strokeStyle = '#94A3B8';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(xHalf, padding.top);
                ctx.lineTo(xHalf, padding.top + graphHeight);
                ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#94A3B8';
                ctx.font = '10px Inter';
                ctx.textAlign = 'center';
                ctx.fillText('MI-TEMPS', xHalf, padding.top - 6);
            }

            // Axe Y labels
            ctx.fillStyle = '#6B7280';
            ctx.font = '11px Inter';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (graphHeight * (5 - i) / 5);
                ctx.fillText(Math.round(roundedMax * i / 5), padding.left - 8, y + 4);
            }

            // Axe X labels (minutes)
            ctx.fillStyle = '#6B7280';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            [0, 15, 30, 45, 60].forEach(min => {
                const x = padding.left + (min / maxPos) * graphWidth;
                ctx.fillText(min + "'", x, padding.top + graphHeight + 14);
            });

            // Courbe FENIX
            ctx.strokeStyle = '#0A2463';
            ctx.lineWidth = 3;
            ctx.beginPath();
            scoreHistory.forEach((p, i) => {
                const x = padding.left + (p.pos / maxPos) * graphWidth;
                const y = padding.top + graphHeight - (p.fenix / roundedMax * graphHeight);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
            scoreHistory.forEach((p, i) => {
                if (i === 0) return;
                const x = padding.left + (p.pos / maxPos) * graphWidth;
                const y = padding.top + graphHeight - (p.fenix / roundedMax * graphHeight);
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#0A2463'; ctx.fill();
            });

            // Courbe Adversaire
            ctx.strokeStyle = '#DC2626';
            ctx.lineWidth = 3;
            ctx.beginPath();
            scoreHistory.forEach((p, i) => {
                const x = padding.left + (p.pos / maxPos) * graphWidth;
                const y = padding.top + graphHeight - (p.adv / roundedMax * graphHeight);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
            scoreHistory.forEach((p, i) => {
                if (i === 0) return;
                const x = padding.left + (p.pos / maxPos) * graphWidth;
                const y = padding.top + graphHeight - (p.adv / roundedMax * graphHeight);
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#DC2626'; ctx.fill();
            });

            // Score final
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#0A2463';
            ctx.fillText(fenixScore, logicalW - padding.right - 30, padding.top - 15);
            ctx.fillStyle = '#6B7280';
            ctx.fillText('-', logicalW - padding.right - 20, padding.top - 15);
            ctx.fillStyle = '#DC2626';
            ctx.fillText(advScore, logicalW - padding.right, padding.top - 15);

            // Légende
            ctx.font = '12px Inter';
            // Légende dans le padding top (ligne du bas du padding)
            const legY = padding.top - 14;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#0A2463';
            ctx.fillRect(padding.left, legY - 9, 14, 3);
            ctx.beginPath();
            ctx.arc(padding.left + 7, legY - 7, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText('FENIX', padding.left + 18, legY);
            ctx.fillStyle = '#DC2626';
            ctx.fillRect(padding.left + 70, legY - 9, 14, 3);
            ctx.beginPath();
            ctx.arc(padding.left + 77, legY - 7, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.fillText('Adversaire', padding.left + 88, legY);

            // Marqueurs MC — ligne verticale fine + petit cercle + numéro
            if (_momentsCles && _momentsCles.length > 0) {
                _momentsCles.forEach((mc, idx) => {
                    const normX = normPos(mc.rawPos);
                    const x = padding.left + (normX / maxPos) * graphWidth;
                    const isPositif = mc.type === 'positif';

                    // Ligne verticale fine
                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = isPositif ? 'rgba(22,163,74,0.6)' : 'rgba(220,38,38,0.6)';
                    ctx.lineWidth = 1.5;
                    if (!isPositif) {
                        ctx.setLineDash([3, 3]);
                    }
                    ctx.moveTo(x, padding.top + 4);
                    ctx.lineTo(x, padding.top + graphHeight);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Petit cercle en haut de la ligne
                    ctx.beginPath();
                    ctx.fillStyle = isPositif ? '#16a34a' : '#dc2626';
                    ctx.arc(x, padding.top + 4, 4, 0, Math.PI * 2);
                    ctx.fill();

                    // Numéro MC en petit au-dessus
                    ctx.font = 'bold 7px Inter, sans-serif';
                    ctx.fillStyle = isPositif ? '#16a34a' : '#dc2626';
                    ctx.textAlign = 'center';
                    ctx.fillText(idx + 1, x, padding.top - 2);
                    ctx.restore();
                });
            }

            // Marqueurs bascule ⚡ — triangles sous l'axe X (anti-collision verticale)
            const basculeXPositions = _bascules.map(b => {
                if (b.rawPos == null) return null;
                return padding.left + (normPos(b.rawPos) / maxPos) * graphWidth;
            });

            const basculeRows = new Array(_bascules.length).fill(0);
            for (let i = 1; i < basculeXPositions.length; i++) {
                if (basculeXPositions[i] == null) continue;
                for (let j = i - 1; j >= 0; j--) {
                    if (basculeXPositions[j] == null) continue;
                    if (Math.abs(basculeXPositions[i] - basculeXPositions[j]) < 32) {
                        basculeRows[i] = basculeRows[j] === 0 ? 1 : 0;
                        break;
                    }
                }
            }

            _bascules.forEach((b, idx) => {
                if (b.rawPos == null) return;
                const x = basculeXPositions[idx];
                if (x == null) return;
                const row = basculeRows[idx];
                const baseY = padding.top + graphHeight + 8;
                const y = baseY + row * 22; // row 0 = premier niveau, row 1 = deuxième niveau

                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = '#f59e0b';
                ctx.moveTo(x, y);
                ctx.lineTo(x - 6, y + 12);
                ctx.lineTo(x + 6, y + 12);
                ctx.closePath();
                ctx.fill();

                ctx.font = 'bold 7px Inter, sans-serif';
                ctx.fillStyle = '#92400e';
                ctx.textAlign = 'center';
                ctx.fillText('⚡' + (idx + 1), x, y + 22);
                ctx.restore();
            });

            // Stocker les zones pour le tooltip
            window._timelineHitAreas = [];

            _momentsCles.forEach((mc, idx) => {
                const x = padding.left + (normPos(mc.rawPos) / maxPos) * graphWidth;
                // Zone réduite au cercle MC (rayon 4px en haut de la ligne, centré sur padding.top + 4)
                window._timelineHitAreas.push({
                    type: 'mc',
                    x, y: padding.top + 4 - 8,   // top du cercle (centre - 8px)
                    w: 16, h: 16,                  // zone 16x16 autour du cercle
                    label: 'MC' + (idx + 1),
                    text: mc.text,
                    positif: mc.type === 'positif',
                    rawPos: mc.rawPos,
                    startRaw: mc.startRaw,
                    endRaw: mc.endRaw
                });
            });

            _bascules.forEach((b, idx) => {
                const x = basculeXPositions[idx];
                if (x == null) return;
                const row = basculeRows[idx];
                const baseY = padding.top + graphHeight + 8;
                const y = baseY + row * 22;
                window._timelineHitAreas.push({
                    type: 'bascule',
                    x, y,
                    w: 14, h: 34,
                    label: '⚡ ' + b.label,
                    text: b.description || '',
                    positif: b.positif,
                    rawPos: b.rawPos,
                    startRaw: b.startRaw,
                    endRaw: b.endRaw,
                    seqRows: b.seqRows || null
                });
            });

            // Points des courbes de score (skip i=0 : point à 0-0 initial)
            const advLabel = document.getElementById('adversaire-title-text')?.textContent?.trim() || 'Adversaire';
            scoreHistory.forEach((p, i) => {
                if (i === 0) return;
                const x = padding.left + (p.pos / maxPos) * graphWidth;
                const yFenix = padding.top + graphHeight - (p.fenix / roundedMax) * graphHeight;
                const yAdv   = padding.top + graphHeight - (p.adv   / roundedMax) * graphHeight;
                const scoreText = `FENIX <strong>${p.fenix}</strong> · ${advLabel} <strong>${p.adv}</strong>`;

                window._timelineHitAreas.push({
                    type: 'score',
                    x, y: yFenix,
                    w: 16, h: 16,
                    label: `${p.fenix} — ${p.adv}`,
                    text: scoreText
                });
                if (Math.abs(yAdv - yFenix) > 8) {
                    window._timelineHitAreas.push({
                        type: 'score',
                        x, y: yAdv,
                        w: 16, h: 16,
                        label: `${p.fenix} — ${p.adv}`,
                        text: scoreText
                    });
                }
            });

            // Overlay momentum + détection bascule (A-04)
            drawMomentumOverlay(ctx, scoreHistory, logicalW, logicalH, padding, roundedMax, maxPos);
        }

        function findMomentsCles(matchName, matchData) {
            const sortedGoals = getSortedGoals(matchData);

            if (sortedGoals.length < 3) {
                document.getElementById('moments-cles').innerHTML = '<p style="color:#6B7280;font-size:0.85rem;">Pas assez de données pour identifier des séquences.</p>';
                return;
            }

            const moments = [];

            // Calcul offset MT2 pour rawPos
            const _g1 = sortedGoals.filter(g => getPeriodeNum(g.row) === 1);
            const _g2 = sortedGoals.filter(g => getPeriodeNum(g.row) === 2);
            const _max1 = _g1.length ? Math.max(..._g1.map(g => g.pos)) : 0;
            const _min2raw = _g2.length ? Math.min(..._g2.map(g => parseTimecode(g.row[COLS.position]))) : Infinity;
            const _off2 = _g2.length && _min2raw < _max1 ? _max1 : 0;
            const toRaw = r => getPeriodeNum(r) === 2
                ? parseTimecode(r[COLS.position]) + _off2
                : parseTimecode(r[COLS.position]);

            // Toutes les actions triées par période puis timecode
            const allActions = matchData
                .filter(r => (r[COLS.resultat] || '').trim())
                .sort((a, b) => {
                    const pA = getPeriodeNum(a), pB = getPeriodeNum(b);
                    if (pA !== pB) return pA - pB;
                    return parseTimecode(a[COLS.position]) - parseTimecode(b[COLS.position]);
                });

            const SEUIL_POSS = 4;

            // Signal 1a — Temps fort ATT : FENIX marque sur 4+ possessions consécutives (ADV ignoré)
            let fenButStreak = 0, fenButRaw = 0, fenButEndRaw = 0;
            allActions.forEach(r => {
                if (r[COLS.club] !== 'FENIX') return;
                if (r[COLS.resultat] === 'But') {
                    if (fenButStreak === 0) fenButRaw = toRaw(r);
                    fenButStreak++;
                    fenButEndRaw = toRaw(r);
                } else {
                    if (fenButStreak >= SEUIL_POSS) moments.push({ text: `Temps fort ATT — ${fenButStreak} buts FENIX de suite`, type: 'positif', rawPos: fenButRaw, startRaw: fenButRaw, endRaw: fenButEndRaw });
                    fenButStreak = 0;
                }
            });
            if (fenButStreak >= SEUIL_POSS) moments.push({ text: `Temps fort ATT — ${fenButStreak} buts FENIX de suite`, type: 'positif', rawPos: fenButRaw, startRaw: fenButRaw, endRaw: fenButEndRaw });

            // Signal 1c — Temps fort DEF : ADV rate 4+ possessions de suite sans marquer (FENIX ignoré)
            let advMissStreak = 0, advMissRaw = 0, advMissEndRaw = 0;
            allActions.forEach(r => {
                if (r[COLS.club] === 'FENIX') return;
                if (r[COLS.resultat] !== 'But') {
                    if (advMissStreak === 0) advMissRaw = toRaw(r);
                    advMissStreak++;
                    advMissEndRaw = toRaw(r);
                } else {
                    if (advMissStreak >= SEUIL_POSS) moments.push({ text: `Temps fort DEF — ${advMissStreak} attaques adverses stoppées`, type: 'positif', rawPos: advMissRaw, startRaw: advMissRaw, endRaw: advMissEndRaw });
                    advMissStreak = 0;
                }
            });
            if (advMissStreak >= SEUIL_POSS) moments.push({ text: `Temps fort DEF — ${advMissStreak} attaques adverses stoppées`, type: 'positif', rawPos: advMissRaw, startRaw: advMissRaw, endRaw: advMissEndRaw });

            // Signal 2 — Silence offensif FENIX >= 5 min (intra-période uniquement)
            const SILENCE_SEUIL = 300;
            const fenixGoals = sortedGoals.filter(g => g.row[COLS.club] === 'FENIX');
            for (let i = 1; i < fenixGoals.length; i++) {
                if (getPeriodeNum(fenixGoals[i].row) !== getPeriodeNum(fenixGoals[i - 1].row)) continue;
                const gap = fenixGoals[i].pos - fenixGoals[i - 1].pos;
                if (gap >= SILENCE_SEUIL) {
                    moments.push({ text: `Silence offensif ${Math.round(gap / 60)} min`, type: 'negatif', rawPos: fenixGoals[i - 1].pos, startRaw: fenixGoals[i - 1].pos, endRaw: fenixGoals[i].pos });
                }
            }

            // Signal 3 — Retard critique (premier passage à -3 ou pire)
            let fScore = 0, aScore = 0, criticalAdded = false;
            sortedGoals.forEach(({ row, pos }) => {
                if (row[COLS.club] === 'FENIX') fScore++; else aScore++;
                if (!criticalAdded && fScore - aScore <= -3) {
                    moments.push({ text: `Retard critique ${fScore}-${aScore}`, type: 'negatif', rawPos: pos, startRaw: pos - 90, endRaw: pos + 90 });
                    criticalAdded = true;
                }
            });

            // Signal 4 — Retour au score (après -2 ou pire, retour à égalité ou devant)
            fScore = 0; aScore = 0;
            let wasDown = false, comebackAdded = false;
            sortedGoals.forEach(({ row, pos }) => {
                if (row[COLS.club] === 'FENIX') fScore++; else aScore++;
                if (fScore - aScore <= -2) wasDown = true;
                if (wasDown && !comebackAdded && fScore - aScore >= 0) {
                    moments.push({ text: `Retour au score ${fScore}-${aScore}`, type: 'positif', rawPos: pos, startRaw: pos - 90, endRaw: pos + 90 });
                    comebackAdded = true; wasDown = false;
                }
            });

            // Signal 5 — Occasion de prendre la tête manquée
            // 2+ ratés FENIX consécutifs quand diff ≥ -1, sans but adverse entre les ratés
            {
                const SEUIL_OCPM = 3;
                const COOLDOWN_OCPM = 240;
                const MISS_OCPM = new Set(['Tir raté', 'PB', 'PO']);
                let ocFen = 0, ocAdv = 0;
                let ocStreak = 0, ocFirstRaw = 0, ocEndRaw = 0;
                let ocFenAtFirst = 0, ocAdvAtFirst = 0, ocPeriod = null;
                let lastOcpmRaw = -COOLDOWN_OCPM * 2;

                allActions.forEach(r => {
                    const rp = toRaw(r);
                    const res = (r[COLS.resultat] || '').trim();
                    const club = r[COLS.club];
                    const period = getPeriodeNum(r);

                    if (res === 'But') {
                        if (club === 'FENIX') ocFen++; else ocAdv++;
                        ocStreak = 0; // but (marqué ou encaissé) rompt la séquence
                        return;
                    }

                    if (club !== 'FENIX' || !MISS_OCPM.has(res)) return;

                    const diff = ocFen - ocAdv;

                    if (ocStreak === 0) {
                        if (diff >= -1) {
                            ocStreak = 1;
                            ocFirstRaw = rp;
                            ocEndRaw = rp;
                            ocFenAtFirst = ocFen;
                            ocAdvAtFirst = ocAdv;
                            ocPeriod = period;
                        }
                    } else if (period === ocPeriod) {
                        ocStreak++;
                        ocEndRaw = rp;
                        if (ocStreak >= SEUIL_OCPM) {
                            const cooldownOk = ocFirstRaw - lastOcpmRaw >= COOLDOWN_OCPM;
                            if (cooldownOk) {
                                lastOcpmRaw = ocFirstRaw;
                                const context = ocFenAtFirst - ocAdvAtFirst === 0
                                    ? `à égalité (${ocFenAtFirst}-${ocAdvAtFirst}), FENIX aurait pu prendre l'avantage`
                                    : `à -1 (${ocFenAtFirst}-${ocAdvAtFirst}), FENIX aurait pu égaliser puis mener`;
                                moments.push({
                                    text: `Occasion manquée — ${ocStreak} ratés FENIX de suite, ${context}`,
                                    type: 'negatif',
                                    rawPos: ocFirstRaw,
                                    startRaw: ocFirstRaw,
                                    endRaw: ocEndRaw
                                });
                            }
                            ocStreak = 0;
                        }
                    } else {
                        // Nouvelle période : reset et redémarre si conditions ok
                        ocStreak = diff >= -1 ? 1 : 0;
                        if (ocStreak) {
                            ocFirstRaw = rp; ocEndRaw = rp;
                            ocFenAtFirst = ocFen; ocAdvAtFirst = ocAdv;
                            ocPeriod = period;
                        }
                    }
                });
            }

            moments.sort((a, b) => a.rawPos - b.rawPos);
            _momentsCles = moments;

            if (moments.length === 0) {
                document.getElementById('moments-cles').innerHTML = '<p style="color:#6B7280;font-size:0.85rem;">Pas de séquence marquante détectée.</p>';
                return;
            }

            let html = '<strong style="font-size:0.85rem;color:#333;">Moments clés :</strong> ';
            moments.forEach((m, idx) => {
                html += `<span class="moment-badge ${m.type}">MC${idx + 1} — ${m.text}</span> `;
            });
            document.getElementById('moments-cles').innerHTML = html;
        }

        async function saveCoachAnalyse() {
            const matchFilter = document.getElementById('filter-match-global').value;
            if (!matchFilter) return;

            const btn = document.querySelector('.save-coach-btn');
            const analyse = document.getElementById('coach-analyse').value;
            if (btn) btn.disabled = true;
            try {
                await upsertRows('coach_analyses', [{ match_key: matchFilter, contenu: analyse }]);
                coachAnalyses[matchFilter] = analyse;
                const msg = document.getElementById('coach-saved-msg');
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 2000);
            } catch (e) {
                alert('Erreur lors de l\'enregistrement de la note — réessaie (' + (e.message || 'échec réseau') + ')');
            } finally {
                if (btn) btn.disabled = false;
            }
        }

        function _escapeHtml(str) {
            return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        function sendChatMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            if (!message) return;

            const matchFilter = document.getElementById('filter-match-global').value;
            if (!matchFilter) return;

            // Ajouter message utilisateur
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML += `
                <div class="chat-message user">
                    <div class="chat-avatar">👨‍🏫</div>
                    <div class="chat-content">${_escapeHtml(message)}</div>
                </div>
            `;
            
            input.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Ajouter loading
            chatMessages.innerHTML += `
                <div class="chat-message ia" id="chat-loading">
                    <div class="chat-avatar">🤖</div>
                    <div class="chat-content">
                        <div class="chat-loading"><span></span><span></span><span></span></div>
                    </div>
                </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Générer réponse IA (locale pour l'instant)
            setTimeout(() => {
                document.getElementById('chat-loading').remove();
                const response = generateChatResponse(message, matchFilter);
                chatMessages.innerHTML += `
                    <div class="chat-message ia">
                        <div class="chat-avatar">🤖</div>
                        <div class="chat-content">${response}</div>
                    </div>
                `;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 800);
        }

        function generateChatResponse(question, matchName) {
            const matchData = DATA.filter(row => row[COLS.rencontre] === matchName);
            const fenixData = matchData.filter(row => row[COLS.club] === 'FENIX');
            const advData = matchData.filter(row => row[COLS.club] !== 'FENIX');
            
            const q = question.toLowerCase();
            
            // Stats de base
            const fenixButs = fenixData.filter(r => r[COLS.resultat] === 'But').length;
            const advButs = advData.filter(r => r[COLS.resultat] === 'But').length;
            const fenixTirs = fenixButs + fenixData.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const fenixEff = fenixTirs > 0 ? Math.round(fenixButs / fenixTirs * 100) : 0;
            const fenixPB = fenixData.filter(r => r[COLS.resultat] === 'PB').length;
            
            // ===== ENCLENCHEMENTS =====
            if (q.includes('enclenchement') || q.includes('marqué') || q.includes('comment on a marqué') || q.includes('type de but')) {
                const fenixButsData = fenixData.filter(r => r[COLS.resultat] === 'But');
                const enclenchements = {};
                fenixButsData.forEach(r => {
                    const enc = r[COLS.enclenchement] || 'Non renseigné';
                    enclenchements[enc] = (enclenchements[enc] || 0) + 1;
                });
                
                const sorted = Object.entries(enclenchements).sort((a, b) => b[1] - a[1]);
                let response = `<strong>Enclenchements des ${fenixButs} buts FENIX :</strong><br>`;
                sorted.forEach(([enc, count]) => {
                    response += `• ${enc} : ${count} but(s)<br>`;
                });
                return response;
            }
            
            if (q.includes('adversaire') && (q.includes('enclenchement') || q.includes('marqué'))) {
                const advButsData = advData.filter(r => r[COLS.resultat] === 'But');
                const enclenchements = {};
                advButsData.forEach(r => {
                    const enc = r[COLS.enclenchement] || 'Non renseigné';
                    enclenchements[enc] = (enclenchements[enc] || 0) + 1;
                });
                
                const sorted = Object.entries(enclenchements).sort((a, b) => b[1] - a[1]);
                let response = `<strong>Enclenchements des ${advButs} buts adverses :</strong><br>`;
                sorted.forEach(([enc, count]) => {
                    response += `• ${enc} : ${count} but(s)<br>`;
                });
                return response;
            }
            
            // ===== SUPÉRIORITÉS NUMÉRIQUES =====
            if (q.includes('supériorité') || q.includes('sup') || q.includes('infériorité') || q.includes('inf') || q.includes('+ -') || q.includes('+/-')) {
                // FENIX en supériorité (adversaire en -)
                const fenixSupData = fenixData.filter(r => {
                    const phase = (r[COLS.phase_att] || '').toString();
                    return phase.includes('+');
                });
                const fenixSupButs = fenixSupData.filter(r => r[COLS.resultat] === 'But').length;
                const fenixSupTirs = fenixSupButs + fenixSupData.filter(r => r[COLS.resultat] === 'Tir raté').length;
                
                // FENIX en infériorité (adversaire en +)
                const fenixInfData = fenixData.filter(r => {
                    const phase = (r[COLS.phase_att] || '').toString();
                    return phase.includes('-');
                });
                const fenixInfButs = fenixInfData.filter(r => r[COLS.resultat] === 'But').length;
                const fenixInfTirs = fenixInfButs + fenixInfData.filter(r => r[COLS.resultat] === 'Tir raté').length;
                
                // Adversaire en supériorité
                const advSupData = advData.filter(r => {
                    const phase = (r[COLS.phase_att] || '').toString();
                    return phase.includes('+');
                });
                const advSupButs = advSupData.filter(r => r[COLS.resultat] === 'But').length;
                const advSupTirs = advSupButs + advSupData.filter(r => r[COLS.resultat] === 'Tir raté').length;
                
                // Adversaire en infériorité
                const advInfData = advData.filter(r => {
                    const phase = (r[COLS.phase_att] || '').toString();
                    return phase.includes('-');
                });
                const advInfButs = advInfData.filter(r => r[COLS.resultat] === 'But').length;
                
                // Bilan
                const fenixGagne = fenixSupButs > advSupButs;
                const bilan = fenixGagne ? '✅ FENIX gagne les supériorités' : (fenixSupButs < advSupButs ? '❌ Adversaire gagne les supériorités' : '➖ Égalité');
                
                let response = `<strong>Supériorités numériques :</strong><br><br>`;
                response += `<strong>FENIX en supériorité (+) :</strong> ${fenixSupButs}/${fenixSupTirs} tirs<br>`;
                response += `<strong>FENIX en infériorité (-) :</strong> ${fenixInfButs}/${fenixInfTirs} tirs<br><br>`;
                response += `<strong>Adversaire en supériorité (+) :</strong> ${advSupButs}/${advSupTirs} tirs<br>`;
                response += `<strong>Adversaire en infériorité (-) :</strong> ${advInfButs} buts<br><br>`;
                response += `<strong>Bilan :</strong> ${bilan}`;
                
                return response;
            }
            
            // Réponses contextuelles existantes
            if (q.includes('perdu') || q.includes('défaite') || q.includes('pourquoi')) {
                if (fenixButs < advButs) {
                    const causes = [];
                    if (fenixEff < 55) causes.push(`efficacité insuffisante (${fenixEff}%)`);
                    if (fenixPB > 5) causes.push(`trop de pertes de balle (${fenixPB})`);
                    return `La défaite s'explique probablement par : ${causes.join(', ') || 'un écart de niveau global'}. Score final: ${fenixButs}-${advButs}.`;
                }
                return `En fait, vous avez gagné ce match ${fenixButs}-${advButs} ! 🎉`;
            }
            
            if (q.includes('efficace') || q.includes('meilleur') || q.includes('buteur')) {
                const playerButs = {};
                fenixData.filter(r => r[COLS.resultat] === 'But').forEach(r => {
                    const joueur = r[COLS.joueur];
                    if (joueur) playerButs[joueur] = (playerButs[joueur] || 0) + 1;
                });
                const sorted = Object.entries(playerButs).sort((a, b) => b[1] - a[1]);
                if (sorted.length > 0) {
                    return `Le meilleur buteur du match est <strong>${sorted[0][0]}</strong> avec ${sorted[0][1]} but(s). ${sorted.length > 1 ? `Suivi de ${sorted[1][0]} (${sorted[1][1]} but(s)).` : ''}`;
                }
                return "Je n'ai pas trouvé de buteurs pour ce match.";
            }
            
            if (q.includes('gardien') || q.includes('arrêt')) {
                const arrets = advData.filter(r => r[COLS.resultat] === 'Tir raté').length;
                const tirsSubis = advButs + arrets;
                const pct = tirsSubis > 0 ? Math.round(arrets / tirsSubis * 100) : 0;
                return `Le gardien a réalisé ${arrets} arrêt(s) sur ${tirsSubis} tirs cadrés, soit <strong>${pct}%</strong> d'efficacité.`;
            }
            
            if (q.includes('perte') || q.includes('pb')) {
                return `FENIX a commis <strong>${fenixPB} perte(s) de balle</strong> sur ce match. ${fenixPB > 6 ? "C'est beaucoup, ça a probablement coûté des occasions." : "C'est correct."}`;
            }
            
            if (q.includes('score') || q.includes('résultat')) {
                return `Score final : <strong>FENIX ${fenixButs} - ${advButs} Adversaire</strong>. ${fenixButs > advButs ? 'Victoire ! 🎉' : fenixButs < advButs ? 'Défaite.' : 'Match nul.'}`;
            }
            
            // Réponse par défaut avec suggestions
            return `Pour ce match (${matchName}), voici les stats clés : Score ${fenixButs}-${advButs}, Efficacité ${fenixEff}%, ${fenixPB} pertes de balle.<br><br><strong>Tu peux me demander :</strong><br>• "Enclenchements" - comment on a marqué<br>• "Supériorités" - bilan des + et -<br>• "Meilleur buteur"<br>• "Gardien"`;
        }

        function generateSeasonCorrelations() {
            const container = document.getElementById('saison-correlations');
            if (!container) return;

            if (typeof MATCHS === 'undefined' || !MATCHS || MATCHS.length < 3) {
                container.innerHTML = MATCHS && MATCHS.length > 0
                    ? `<p style="color:#64748B;font-size:0.85rem;text-align:center;padding:16px 0">Minimum 3 matchs nécessaires pour calculer les corrélations (${MATCHS.length} match${MATCHS.length > 1 ? 's' : ''} actuellement).</p>`
                    : '';
                return;
            }

            const groups = { V: [], D: [], N: [] };

            MATCHS.forEach(matchName => {
                const matchData = DATA.filter(row => row[COLS.rencontre] === matchName);
                if (matchData.length === 0) return;

                const fenixData = matchData.filter(row => row[COLS.club] === 'FENIX');
                const advData   = matchData.filter(row => row[COLS.club] !== 'FENIX');

                const fenixButs = fenixData.filter(r => r[COLS.resultat] === 'But').length;
                const advButs   = advData.filter(r => r[COLS.resultat] === 'But').length;

                let result;
                if (fenixButs > advButs) result = 'V';
                else if (fenixButs < advButs) result = 'D';
                else result = 'N';

                const fenixTirs = fenixButs + fenixData.filter(r => r[COLS.resultat] === 'Tir raté').length;
                const fenixEff  = fenixTirs > 0 ? Math.round(fenixButs / fenixTirs * 100) : 0;
                const fenixPB   = fenixData.filter(r => r[COLS.resultat] === 'PB').length;
                const fenixPoss = fenixData.filter(r => r[COLS.possession] && r[COLS.possession].toString().trim() !== '').length;

                const gbArrets  = advData.filter(r => r[COLS.finalite] === 'Tir arrêté').length;
                const advShots  = advButs + gbArrets;
                const pctArrets = advShots > 0 ? Math.round(gbArrets / advShots * 100) : 0;

                groups[result].push({ matchName, fenixButs, advButs, fenixEff, fenixPB, fenixPoss, pctArrets });
            });

            const avg = (arr, key) => arr.length > 0
                ? arr.reduce((s, x) => s + x[key], 0) / arr.length
                : null;

            const statsDef = [
                { key: 'fenixButs', label: 'Buts marqués',    unit: '',  higherBetter: true  },
                { key: 'advButs',   label: 'Buts encaissés',  unit: '',  higherBetter: false },
                { key: 'fenixEff',  label: 'Efficacité',      unit: '%', higherBetter: true  },
                { key: 'fenixPB',   label: 'Pertes de balle', unit: '',  higherBetter: false },
                { key: 'fenixPoss', label: 'Possessions',     unit: '',  higherBetter: true  },
                { key: 'pctArrets', label: '% Arrêts GB',     unit: '%', higherBetter: true  },
            ];

            const colHeaders = [];
            if (groups.V.length > 0) colHeaders.push({ key: 'V', label: `Victoires (${groups.V.length})`, color: '#10B981' });
            if (groups.D.length > 0) colHeaders.push({ key: 'D', label: `Défaites (${groups.D.length})`,  color: '#EF4444' });
            if (groups.N.length > 0) colHeaders.push({ key: 'N', label: `Nuls (${groups.N.length})`,      color: '#6B7280' });

            if (colHeaders.length < 2) { container.innerHTML = ''; return; }

            const fmtVal = (val, unit) => val !== null
                ? (Number.isInteger(Math.round(val * 10) / 10) ? val.toFixed(0) : val.toFixed(1)) + unit
                : null;

            let rows = '';
            statsDef.forEach(stat => {
                const avgs = {};
                colHeaders.forEach(col => { avgs[col.key] = avg(groups[col.key], stat.key); });

                let sigV = '', sigD = '', sigLevel = null, relDiff = null, vBetter = null;
                if (avgs.V !== null && avgs.D !== null) {
                    const base = (avgs.V + avgs.D) / 2;
                    relDiff = base > 0 ? Math.abs(avgs.V - avgs.D) / base : 0;
                    vBetter = stat.higherBetter ? avgs.V > avgs.D : avgs.V < avgs.D;
                    if (relDiff >= 0.15) {
                        sigV = vBetter ? ' 🔑' : ' ⚠️';
                        sigD = vBetter ? ' ⚠️' : ' 🔑';
                        sigLevel = 'fort';
                    } else if (relDiff >= 0.07) {
                        sigV = vBetter ? ' ↑' : ' ↓';
                        sigD = vBetter ? ' ↓' : ' ↑';
                        sigLevel = 'modéré';
                    } else {
                        sigLevel = 'faible';
                    }
                }

                let tooltip;
                if (avgs.V === null || avgs.D === null) {
                    tooltip = `Comparaison victoires/défaites non disponible cette saison (pas encore assez de matchs des deux types).`;
                } else {
                    const better  = vBetter ? 'victoire' : 'défaite';
                    const pct     = Math.round(relDiff * 100);
                    const compare = `En moyenne ${fmtVal(avgs.V, stat.unit)} en victoire contre ${fmtVal(avgs.D, stat.unit)} en défaite (écart de ${pct}%).`;
                    const meaning = sigLevel === 'fort'
                        ? `🔑 Signal fort : cet écart est important, ce KPI est nettement associé au résultat (plus favorable en ${better}).`
                        : sigLevel === 'modéré'
                            ? `↑↓ Signal modéré : cet écart est notable mais moins déterminant (plus favorable en ${better}).`
                            : `Écart trop faible pour être significatif.`;
                    tooltip = `${compare} ${meaning}`;
                }

                let cells = `<td class="corr-label">${stat.label}<span class="enc-info-btn" style="margin-left:5px;width:16px;height:16px;font-size:0.6rem;vertical-align:middle" title="${tooltip.replace(/"/g, '&quot;')}">i</span></td>`;
                colHeaders.forEach(col => {
                    const val = avgs[col.key];
                    const sig = col.key === 'V' ? sigV : (col.key === 'D' ? sigD : '');
                    const display = val !== null
                        ? (Number.isInteger(Math.round(val * 10) / 10) ? val.toFixed(0) : val.toFixed(1)) + stat.unit + sig
                        : '—';
                    cells += `<td style="text-align:center;font-weight:600;color:${col.color}">${display}</td>`;
                });
                rows += `<tr>${cells}</tr>`;
            });

            let headerCells = '<th style="text-align:left;padding:6px 10px">KPI</th>';
            colHeaders.forEach(col => {
                headerCells += `<th style="text-align:center;padding:6px 10px;color:${col.color}">${col.label}</th>`;
            });

            container.innerHTML = `
                <div class="corr-block">
                    <div class="corr-title">📊 Tendances saison — selon résultat</div>
                    <div class="corr-legend">🔑 Signal fort (&gt;15% d'écart) &nbsp;|&nbsp; ↑↓ Signal modéré (7-15%)</div>
                    <div style="overflow-x:auto">
                        <table class="corr-table">
                            <thead><tr>${headerCells}</tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // ====================================================================
        // MODULE ANALYSE — Fonctions A-00 à A-08
        // ====================================================================

        // A-00 — Parser famille enclenchement
        // Format: SITUATION;PLAY;VARIANT — check variant (p2) first, then play (p1), then situation (p0)
        function getEncFamille(intentionStr) {
            if (intentionStr === null || intentionStr === undefined) return 'Autre';
            const str = intentionStr.toString().trim();
            if (!str) return 'Autre';
            // _ENC_FAMILLE_CUSTOM (localStorage) reste vérifié en premier : c'est le filet de sécurité
            // pour classifier manuellement une intention non reconnue (panneau "non classifié"), dont
            // l'écriture n'est rebranchée sur Supabase qu'en STORY-25 (éditeur de familles). Le retirer
            // maintenant désactiverait cette classification manuelle sans remplacement fonctionnel.
            if (_ENC_FAMILLE_CUSTOM[str]) return _ENC_FAMILLE_CUSTOM[str];
            return FAMILLE_MAPPING[str] || 'Autre';
        }

        function computeEncCoverage(rows) {
            // possession col non-vide = vraie fin de possession (exclut Jet franc, Pen post-PO, etc.)
            const possessions = rows.filter(r => (r[COLS.possession] || '').toString().trim());
            const classifiees = possessions.filter(r => getEncFamille(r[COLS.intention_attaque]) !== 'Autre');
            const total = possessions.length;
            return { total, classifiees: classifiees.length, pct: total > 0 ? Math.round(classifiees.length / total * 100) : 100 };
        }

        // A-01 — Calcul stats famille par match
        function computeEncStats(matchData, isAdv) {
            const rows = matchData.filter(r => isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX');
            const FAMILLES = [...ENC_FAMILLES_ORDRE, 'Autre'];
            const stats = new Map();
            FAMILLES.forEach(f => stats.set(f, { tirs: 0, buts: 0, pb: 0, po: 0, eff: 0, possessions: 0 }));
            rows.forEach(r => {
                if (!(r[COLS.possession] || '').toString().trim()) return; // sub-event (Jet franc, Pen post-PO…) — pas une possession
                const encRaw = (r[COLS.intention_attaque] || '').toString().trim();
                const famille = getEncFamille(encRaw);
                const s = stats.get(famille);
                const res = isAdv ? (r[COLS.finalite]||'') : (r[COLS.resultat]||'');
                s.possessions++;
                if (res === 'But') s.buts++;
                else if (res === 'Tir raté' || res === 'Tir arrêté') s.tirs++; // tirs = ratés seulement
                else if (res === 'PB') s.pb++;
                else if (res === 'PO') s.po++;
            });
            stats.forEach(s => { s.eff = s.possessions > 0 ? Math.round((s.buts + s.po) / s.possessions * 100) : 0; });
            return stats;
        }

        // Stats saison (avec cache)
        function computeEncStatsSaison(isAdv) {
            const cacheKey = isAdv ? 'adv' : 'fenix';
            if (_encStatsSaison && _encStatsSaison.has(cacheKey)) return _encStatsSaison.get(cacheKey);
            if (!_encStatsSaison) _encStatsSaison = new Map();
            if (typeof MATCHS === 'undefined' || !MATCHS || !MATCHS.length) { _encStatsSaison.set(cacheKey, new Map()); return _encStatsSaison.get(cacheKey); }
            const FAMILLES = [...ENC_FAMILLES_ORDRE, 'Autre'];
            const byFamille = new Map();
            FAMILLES.forEach(f => byFamille.set(f, { effParMatch: [], utilisParMatch: [], matchCount: 0 }));
            MATCHS.forEach(matchName => {
                const matchData = DATA.filter(r => r[COLS.rencontre] === matchName);
                if (!matchData.length) return;
                const matchStats = computeEncStats(matchData, isAdv);
                const teamRowsM = matchData.filter(r => isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX');
                const totalPossM = teamRowsM.filter(r => (r[COLS.possession] || '').toString().trim()).length;
                matchStats.forEach((s, famille) => {
                    if (s.possessions >= 1) {
                        byFamille.get(famille).effParMatch.push(s.eff);
                        byFamille.get(famille).utilisParMatch.push(totalPossM > 0 ? s.possessions / totalPossM * 100 : 0);
                        byFamille.get(famille).matchCount++;
                    }
                });
            });
            const result = new Map();
            byFamille.forEach((entry, famille) => {
                const arr = entry.effParMatch, n = arr.length;
                if (!n) { result.set(famille, { effMoy: 0, utilisMoy: 0, cv: 0, matchCount: 0 }); return; }
                const mean = arr.reduce((s, v) => s + v, 0) / n;
                const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
                const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
                const utilisMoy = entry.utilisParMatch.reduce((s,v)=>s+v,0) / n;
                result.set(famille, { effMoy: Math.round(mean), utilisMoy: Math.round(utilisMoy), cv: Math.round(cv * 100) / 100, matchCount: n });
            });
            _encStatsSaison.set(cacheKey, result);
            return result;
        }

        // A-01/02/03 — Rendu section enclenchements (layout 2 colonnes + radar)
        function renderEncFamillesSection(matchData) {
            const analyseContentVisible = document.getElementById('analyse-content')?.style.display !== 'none';
            const containerId = analyseContentVisible ? 'enc-familles-section' : 'enc-familles-section-saison';
            const otherId     = analyseContentVisible ? 'enc-familles-section-saison' : 'enc-familles-section';
            // Vider l'autre conteneur pour éviter les doublons d'IDs (enc-radar-canvas, etc.)
            const otherEl = document.getElementById(otherId);
            if (otherEl) otherEl.innerHTML = '';
            const container = document.getElementById(containerId);
            if (!container) return;
            if (window._encTeamMode === undefined) window._encTeamMode = 'fenix';
            if (window._encGraphMode === undefined) window._encGraphMode = 'pie';
            const isAdv = window._encTeamMode === 'adv';
            const statsMatch = computeEncStats(matchData, isAdv);
            const statsSaison = computeEncStatsSaison(isAdv);
            const teamRows = matchData.filter(r => isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX');
            const coverage = computeEncCoverage(teamRows);
            const totalPoss = teamRows.filter(r => (r[COLS.possession] || '').toString().trim()).length;
            window._encCurrentMatchData = matchData;
            window._encCurrentStatsMatch = statsMatch;
            window._encCurrentStatsSaison = statsSaison;
            window._encCurrentTotalPoss = totalPoss;
            window._encIsMatchSpecifique = !!(document.getElementById('filter-match-global')?.value);
            window._encSelectedFamille = null;
            const sublabelCard = isAdv ? 'RÉUSSITE ADV.' : 'RÉUSSITE POSS.';
            const warningHtml = coverage.pct < 80 && coverage.total > 0
                ? `<div class="enc-coverage-warning enc-coverage-clickable" onclick="_toggleUnclassifiedPanel()">⚠ ${100 - coverage.pct}% des enclenchements non classifiés — <u>cliquer pour voir le détail</u></div>
                   <div id="enc-unclassified-panel" style="display:none;margin-bottom:10px"></div>` : '';
            const cardsInfoHtml = `<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;position:relative;margin-bottom:2px">
                <span style="font-size:0.62rem;font-weight:700;color:#94A3B8;letter-spacing:0.07em;text-transform:uppercase">Familles</span>
                <span class="enc-info-btn" onclick="_toggleEncCardsInfo()" title="Lire les cartes">i</span>
                <div id="enc-cards-info-box" style="display:none;position:absolute;top:0;left:calc(100% + 12px);width:390px;background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;font-size:0.74rem;line-height:1.4;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
                    <strong style="font-size:0.8rem;color:#0A2463">Lire les cartes</strong>
                    <div style="display:flex;gap:14px;align-items:flex-start;margin-top:8px">
                        <div style="position:relative;flex:0 0 auto">
                            <div class="enc-card-mini" style="border-top-color:#F59E0B;width:118px;pointer-events:none;cursor:default">
                                <div class="enc-card-mini-header"><span class="enc-famille-dot" style="background:#F59E0B"></span><span class="enc-famille-name">Isoler</span></div>
                                <div class="enc-famille-eff">29%</div>
                                <div class="enc-famille-sublabel">UTILISATION</div>
                                <div class="enc-progress-track"><div class="enc-progress-fill above" style="width:29%"></div></div>
                                <div class="enc-stat-pair">
                                    <div><div class="enc-stat-main-val">52%</div><div class="enc-stat-pair-label">encl.</div></div>
                                    <div class="enc-stat-sep">·</div>
                                    <div><div class="enc-stat-sec-val">71%</div><div class="enc-stat-pair-label">tir</div></div>
                                </div>
                                <div class="enc-footnote">349p · <span style="color:#10B981;font-weight:600">▲ +3pts</span></div>
                            </div>
                            <div style="position:absolute;top:2px;right:-9px;width:16px;height:16px;border-radius:50%;background:#0A2463;color:#fff;font-size:0.52rem;font-weight:700;display:flex;align-items:center;justify-content:center">1</div>
                            <div style="position:absolute;top:35px;right:-9px;width:16px;height:16px;border-radius:50%;background:#0A2463;color:#fff;font-size:0.52rem;font-weight:700;display:flex;align-items:center;justify-content:center">2</div>
                            <div style="position:absolute;top:66px;right:-9px;width:16px;height:16px;border-radius:50%;background:#0A2463;color:#fff;font-size:0.52rem;font-weight:700;display:flex;align-items:center;justify-content:center">3</div>
                            <div style="position:absolute;top:84px;right:-9px;width:16px;height:16px;border-radius:50%;background:#0A2463;color:#fff;font-size:0.52rem;font-weight:700;display:flex;align-items:center;justify-content:center">4</div>
                            <div style="position:absolute;bottom:4px;right:-9px;width:16px;height:16px;border-radius:50%;background:#0A2463;color:#fff;font-size:0.52rem;font-weight:700;display:flex;align-items:center;justify-content:center">5</div>
                        </div>
                        <div style="flex:1;font-size:0.67rem;color:#374151;display:flex;flex-direction:column">
                            <div style="display:flex;align-items:center;gap:5px;margin-top:2px"><span style="background:#0A2463;color:#fff;border-radius:50%;width:14px;height:14px;font-size:0.48rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px">1</span><span>Famille + couleur identifiant</span></div>
                            <div style="display:flex;align-items:center;gap:5px;margin-top:19px"><span style="background:#0A2463;color:#fff;border-radius:50%;width:14px;height:14px;font-size:0.48rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px">2</span><span>% d'utilisation dans le match</span></div>
                            <div style="display:flex;align-items:center;gap:5px;margin-top:17px"><span style="background:#0A2463;color:#fff;border-radius:50%;width:14px;height:14px;font-size:0.48rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px">3</span><span>Barre : vert ≥ moy. saison / rouge &lt;</span></div>
                            <div style="display:flex;align-items:center;gap:5px;margin-top:10px"><span style="background:#0A2463;color:#fff;border-radius:50%;width:14px;height:14px;font-size:0.48rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px">4</span><span>Efficacité enc. <span style="color:#94A3B8">·</span> Réussite tir</span></div>
                            <div style="display:flex;align-items:center;gap:5px;margin-top:14px"><span style="background:#0A2463;color:#fff;border-radius:50%;width:14px;height:14px;font-size:0.48rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px">5</span><span>Nb possessions · Écart vs moy. saison</span></div>
                        </div>
                    </div>
                </div>
            </div>`;
            let cardsHtml = cardsInfoHtml;
            const famillesToRender = [...ENC_FAMILLES_ORDRE].sort((a, b) =>
                ((statsMatch.get(b)||{possessions:0}).possessions) - ((statsMatch.get(a)||{possessions:0}).possessions)
            );
            famillesToRender.forEach(famille => {
                const s = statsMatch.get(famille) || { tirs:0, buts:0, pb:0, po:0, eff:0, possessions:0 };
                const sd = statsSaison.get(famille) || { effMoy:0, cv:0, matchCount:0 };
                const couleur = ENC_FAMILLE_COLORS[famille];
                const fid = ENC_FAMILLE_IDS[famille];
                if (!s.possessions) {
                    cardsHtml += `<div class="enc-card-mini disabled" style="border-top-color:${couleur}"><div class="enc-card-mini-header"><span class="enc-famille-dot" style="background:${couleur};opacity:0.35"></span><span class="enc-famille-name">${famille}</span></div><div class="enc-famille-vide">Non utilisé</div></div>`;
                    return;
                }
                const utilisPct = totalPoss > 0 ? Math.round(s.possessions / totalPoss * 100) : 0;
                const totalTirs = s.buts + s.tirs;
                const tirEff = totalTirs > 0 ? Math.round(s.buts / totalTirs * 100) : 0;
                let badgeHtml = '';
                if (sd.matchCount >= 3 && s.possessions >= 5) {
                    const em = sd.effMoy, ec = s.eff;
                    if (isAdv) {
                        if (em > 0 && ec / em >= 1.5) badgeHtml = `<div class="enc-badge-mini faiblesse">⚠ POINT FAIBLE</div>`;
                        else if (em > 0 && Math.abs(ec - em) / em <= 0.10 && sd.cv < 0.20) badgeHtml = `<div class="enc-badge-mini force">⭐ FORCE DÉFENSE</div>`;
                    } else {
                        if (em > 0 && ec / em >= 1.5) badgeHtml = `<div class="enc-badge-mini faiblesse">⚡ FAIBLESSE ADV</div>`;
                        else if (em > 0 && Math.abs(ec - em) / em <= 0.10 && sd.cv < 0.20) badgeHtml = `<div class="enc-badge-mini force">⭐ FORCE</div>`;
                    }
                }
                const hasRef = sd.matchCount >= 3;
                const fillClass = !hasRef ? 'noref' : (s.eff >= sd.effMoy ? 'above' : 'below');
                const delta = hasRef ? s.eff - sd.effMoy : null;
                const deltaHtml = delta === null ? ''
                    : delta > 0 ? ` · <span style="color:#10B981;font-weight:600">▲ +${delta}pts</span>`
                    : delta < 0 ? ` · <span style="color:#EF4444;font-weight:600">▼ ${delta}pts</span>`
                    : ` · <span style="color:#94A3B8">=moy.</span>`;
                cardsHtml += `
                <div class="enc-card-mini" id="enc-card-${fid}" style="border-top-color:${couleur}" onclick="_selectEncFamille('${famille}','${fid}')">
                    <div class="enc-card-mini-header"><span class="enc-famille-dot" style="background:${couleur}"></span><span class="enc-famille-name">${famille}</span></div>
                    <div class="enc-famille-eff">${utilisPct}%</div>
                    <div class="enc-famille-sublabel">UTILISATION</div>
                    <div class="enc-progress-track"><div class="enc-progress-fill ${fillClass}" style="width:${utilisPct}%"></div></div>
                    <div class="enc-stat-pair">
                        <div><div class="enc-stat-main-val">${s.eff}%</div><div class="enc-stat-pair-label">encl.</div></div>
                        <div class="enc-stat-sep">·</div>
                        <div><div class="enc-stat-sec-val">${tirEff}%</div><div class="enc-stat-pair-label">tir</div></div>
                    </div>
                    <div class="enc-footnote">${s.possessions}p${deltaHtml}</div>
                    ${badgeHtml}
                </div>`;
            });
            // Carte "Non classifié" : enc non vides sans famille connue
            const sAutre = statsMatch.get('Autre') || { tirs:0, buts:0, pb:0, po:0, eff:0, possessions:0 };
            if (sAutre.possessions > 0) {
                const cAutre = ENC_FAMILLE_COLORS['Autre'] || 'var(--enc-autre)';
                const utilisAutrePct = totalPoss > 0 ? Math.round(sAutre.possessions / totalPoss * 100) : 0;
                const totalTirsAutre = sAutre.buts + sAutre.tirs;
                const tirEffAutre = totalTirsAutre > 0 ? Math.round(sAutre.buts / totalTirsAutre * 100) : 0;
                const enclEffAutre = sAutre.possessions > 0 ? Math.round((sAutre.buts + sAutre.po) / sAutre.possessions * 100) : 0;
                cardsHtml += `
                <div class="enc-card-mini" id="enc-card-autre" style="border-top-color:${cAutre}" onclick="_selectEncFamille('Autre','autre')">
                    <div class="enc-card-mini-header"><span class="enc-famille-dot" style="background:${cAutre}"></span><span class="enc-famille-name">Non classifié</span></div>
                    <div class="enc-famille-eff">${utilisAutrePct}%</div>
                    <div class="enc-famille-sublabel">UTILISATION</div>
                    <div class="enc-progress-track"><div class="enc-progress-fill noref" style="width:${utilisAutrePct}%"></div></div>
                    <div class="enc-stat-pair">
                        <div><div class="enc-stat-main-val">${enclEffAutre}%</div><div class="enc-stat-pair-label">encl.</div></div>
                        <div class="enc-stat-sep">·</div>
                        <div><div class="enc-stat-sec-val">${tirEffAutre}%</div><div class="enc-stat-pair-label">tir</div></div>
                    </div>
                    <div class="enc-footnote">${sAutre.possessions}p</div>
                </div>`;
            }
            const mode = window._encGraphMode;
            const titleIcon = isAdv ? '🛡' : '⚡';
            const titleLabel = isAdv ? 'DÉFENSE FENIX — enclenchements adversaires' : 'ENCLENCHEMENTS OFFENSIFS FENIX';
            container.innerHTML = `
                <div class="enc-section-header">
                    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                        <span class="enc-section-title">${titleIcon} ${titleLabel}</span>
                        <div class="enc-team-toggle">
                            <button class="enc-team-btn${!isAdv?' active':''}" onclick="_setEncTeamMode('fenix')">⚡ Attaque</button>
                            <button class="enc-team-btn${isAdv?' active':''}" onclick="_setEncTeamMode('adv')">🛡 Défense</button>
                        </div>
                    </div>
                    <div class="enc-graph-toggle enc-graph-toggle--header">
                        <button class="enc-toggle-btn${mode!=='matrice'?' active':''}" data-mode="pie" onclick="_setEncGraphMode('pie')">Vue générale</button>
                        <button class="enc-toggle-btn${mode==='matrice'?' active':''}" data-mode="matrice" onclick="_setEncGraphMode('matrice')">Matrice 2×2</button>
                        <span class="enc-info-btn" id="enc-graph-info-btn" onclick="if(window._encGraphMode==='matrice')_toggleEncGraphInfo()" title="Comprendre la matrice" style="opacity:${mode!=='matrice'?'0.3':'1'}">i</span>
                    </div>
                </div>
                ${warningHtml}
                <div class="enc-body">
                    <div class="enc-cards-grid">${cardsHtml}</div>
                    <div class="enc-right-panel" id="enc-right-panel">
                        <div id="enc-pie-mode-bar" style="display:${mode!=='matrice'?'flex':'none'};gap:4px;margin-bottom:6px;justify-content:center;flex-wrap:wrap">
                            <button class="enc-pie-mode-btn${!window._encPieMode||window._encPieMode==='utilisation'?' active':''}" data-mode="utilisation" onclick="_setEncPieMode('utilisation')">Utilisation</button>
                            <button class="enc-pie-mode-btn${window._encPieMode==='production'?' active':''}" data-mode="production" onclick="_setEncPieMode('production')">Buts + PO</button>
                            <button class="enc-pie-mode-btn${window._encPieMode==='tirs'?' active':''}" data-mode="tirs" onclick="_setEncPieMode('tirs')">Tirs</button>
                        </div>
                        <div id="enc-graph-wrap" style="position:relative;display:flex;align-items:center;justify-content:center;width:100%">
                            <canvas id="enc-pie-canvas" width="340" height="280" style="display:block;max-width:100%"></canvas>
                            <canvas id="enc-radar-canvas" width="340" height="280" style="display:none;max-width:100%"></canvas>
                        </div>
                        <div id="enc-detail-wrap" style="display:none">
                            <div class="enc-detail-header-bar" id="enc-detail-header"></div>
                            <div id="enc-detail-content"></div>
                        </div>
                    </div>
                </div>
                <div class="enc-footer-row">
                    <div id="enc-matrix-legend" style="margin-left:auto"></div>
                    <span class="enc-section-meta">n=${totalPoss} poss. · Couv. ${coverage.pct}%</span>
                </div>`;
            requestAnimationFrame(() => _drawEncChart());
        }

        function _setEncTeamMode(mode) {
            window._encTeamMode = mode;
            window._encSelectedFamille = null;
            if (window._encCurrentMatchData) renderEncFamillesSection(window._encCurrentMatchData);
        }

        function _setEncPieMode(mode) {
            window._encPieMode = mode;
            document.querySelectorAll('.enc-pie-mode-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.mode === mode));
            requestAnimationFrame(() => _drawEncPie());
        }

        function _setEncGraphMode(mode) {
            window._encGraphMode = mode;
            document.querySelectorAll('.enc-toggle-btn[data-mode]').forEach(b =>
                b.classList.toggle('active', b.dataset.mode === mode));
            const infoBtn = document.getElementById('enc-graph-info-btn');
            if (infoBtn) infoBtn.style.opacity = mode !== 'matrice' ? '0.3' : '1';
            const mib = document.getElementById('enc-matrix-info-box');
            if (mib) mib.style.display = 'none';
            const modeBar = document.getElementById('enc-pie-mode-bar');
            if (modeBar) modeBar.style.display = mode !== 'matrice' ? 'flex' : 'none';
            requestAnimationFrame(() => _drawEncChart());
        }

        function _drawEncChart() {
            const pieC = document.getElementById('enc-pie-canvas');
            const radC = document.getElementById('enc-radar-canvas');
            if (window._encGraphMode === 'matrice') {
                if (pieC) pieC.style.display = 'none';
                if (radC) radC.style.display = 'block';
                _drawEncMatrix();
            } else {
                if (radC) radC.style.display = 'none';
                if (pieC) pieC.style.display = 'block';
                _drawEncPie();
            }
        }

        function _drawEncPie() {
            const canvas = document.getElementById('enc-pie-canvas');
            if (!canvas) return;
            const wrap = canvas.parentElement;
            if (wrap && wrap.clientWidth > 0) {
                const cw = Math.min(Math.max(300, wrap.clientWidth - 28), 1200);
                const pieRPrev = Math.min(cw * 0.29, 340);
                const ch = Math.round(2 * pieRPrev + 115); // hauteur = diamètre + marges labels haut/bas
                canvas.width = cw;
                canvas.height = ch;
                canvas.style.width  = cw + 'px';
                canvas.style.height = ch + 'px';
            }
            const statsMatch = window._encCurrentStatsMatch;
            const totalPoss = window._encCurrentTotalPoss;
            if (!statsMatch || !totalPoss) return;
            const PIE_HEX = {
                'Isoler':'#F59E0B','Rentrée':'#F97316',
                'Jeu Pivot':'#8B5CF6','7vs6':'#10B981',
                'Faire courir':'#EC4899','Spéciaux':'#64748B','6vs5':'#06B6D4',
                'Jeu Rapide':'#4F46E5','Autre':'#94A3B8'
            };
            const pm = window._encPieMode || 'utilisation';
            const slices = [];
            [...ENC_FAMILLES_ORDRE, 'Autre'].forEach(famille => {
                const s = statsMatch.get(famille);
                if (!s || s.possessions === 0) return;
                const val = pm === 'production' ? (s.buts || 0) + (s.po || 0)
                          : pm === 'tirs' ? (s.buts || 0) + (s.tirs || 0)
                          : s.possessions;
                if (val === 0) return;
                slices.push({ famille, poss: s.possessions, val, color: PIE_HEX[famille] || '#94A3B8' });
            });
            if (!slices.length) return;

            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // Géométrie : pieR = 29% de la largeur (cap 340), cy collé en haut avec marge labels
            const pieR = Math.min(W * 0.29, 340);
            const cx = W / 2, cy = pieR + 55;

            const sliceTotal = slices.reduce((sum, s) => sum + s.val, 0);
            const denom = pm === 'utilisation' ? (totalPoss || sliceTotal) : sliceTotal;
            if (!denom) return;
            let angle = -Math.PI / 2;
            const computed = slices.map(slice => {
                const frac = slice.val / denom;
                const sweep = frac * 2 * Math.PI;
                const start = angle;
                angle += sweep;
                return { ...slice, frac, start, sweep };
            });

            // Dessiner les tranches
            computed.forEach(s => {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, pieR, s.start, s.start + s.sweep);
                ctx.closePath();
                ctx.fillStyle = s.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Séparer labels intérieurs (≥ 12%) et périphériques (2–12%)
            const peripheral = [];
            computed.forEach(s => {
                if (s.frac < 0.02) return;
                const mid = s.start + s.sweep / 2;
                const pct = Math.round(s.frac * 100);
                const name = s.famille;
                const isRight = Math.cos(mid) >= 0;

                if (s.frac >= 0.12) {
                    // Label intérieur : nom bold blanc + % blanc
                    const lx = cx + Math.cos(mid) * pieR * 0.62;
                    const ly = cy + Math.sin(mid) * pieR * 0.62;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 17px Inter,sans-serif';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(name, lx, ly);
                    ctx.font = '14px Inter,sans-serif';
                    ctx.textBaseline = 'top';
                    ctx.fillText(pct + '%', lx, ly);
                } else {
                    // Label périphérique — radialLen fixe 20px, kinkLen fixe 12px
                    const radialLen = 20;
                    const rawX = cx + Math.cos(mid) * (pieR + radialLen);
                    const rawY = cy + Math.sin(mid) * (pieR + radialLen);
                    peripheral.push({ s, mid, pct, name, isRight, rawX, rawY, adjustedY: rawY });
                }
            });

            // Anti-chevauchement : tri par rawY, espacement min 26px par côté
            ['left', 'right'].forEach(side => {
                const group = peripheral
                    .filter(l => l.isRight === (side === 'right'))
                    .sort((a, b) => a.rawY - b.rawY);
                group.forEach((item, i) => {
                    if (i > 0 && item.rawY - group[i - 1].adjustedY < 26)
                        item.adjustedY = group[i - 1].adjustedY + 26;
                    else
                        item.adjustedY = item.rawY;
                });
            });

            // Dessiner les labels périphériques avec ligne coudée
            const kinkLen = 12;
            peripheral.forEach(({ s, mid, pct, name, isRight, rawX, adjustedY }) => {
                // Point de départ sur l'arc (ancré sur la bonne tranche)
                const p1x = cx + Math.cos(mid) * (pieR + 4);
                const p1y = cy + Math.sin(mid) * (pieR + 4);
                // Point intermédiaire (position radiale brute, y ajusté)
                const p2x = rawX;
                const p2y = adjustedY;
                // Point final (coude horizontal)
                const p3x = p2x + (isRight ? kinkLen : -kinkLen);

                ctx.strokeStyle = s.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p1x, p1y);
                ctx.lineTo(p2x, p2y);
                ctx.lineTo(p3x, p2y);
                ctx.stroke();

                const tx = p3x + (isRight ? 3 : -3);
                ctx.textAlign = isRight ? 'left' : 'right';
                ctx.fillStyle = '#1E293B';
                ctx.font = 'bold 14px Inter,sans-serif';
                ctx.textBaseline = 'bottom';
                ctx.fillText(name, tx, p2y);
                ctx.fillStyle = '#475569';
                ctx.font = '12.5px Inter,sans-serif';
                ctx.textBaseline = 'top';
                ctx.fillText(pct + '%', tx, p2y);
            });
        }

        function _drawEncMatrix() {
            const canvas = document.getElementById('enc-radar-canvas');
            if (!canvas) return;
            // Auto-resize to container
            const wrap = canvas.parentElement;
            if (wrap && wrap.clientWidth > 0) {
                const cw = Math.max(300, wrap.clientWidth - 28);
                canvas.width = cw;
                canvas.height = Math.max(220, Math.min(Math.round(cw * 0.50), 430));
                canvas.style.width = cw + 'px';
                canvas.style.height = canvas.height + 'px';
            }
            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;
            const PAD = { top: 26, right: 14, bottom: 32, left: 34 };
            const pw = W - PAD.left - PAD.right, ph = H - PAD.top - PAD.bottom;
            const stats = window._encCurrentStatsMatch;
            if (!stats) return;
            ctx.clearRect(0, 0, W, H);
            const rootStyle = getComputedStyle(document.documentElement);
            const getHex = f => {
                const v = (ENC_FAMILLE_COLORS[f]||'').replace('var(','').replace(')','').trim();
                return rootStyle.getPropertyValue(v).trim() || '#94A3B8';
            };
            const used = ENC_FAMILLES_ORDRE.filter(f => (stats.get(f)||{possessions:0}).possessions > 0);
            if (!used.length) return;
            const possArr = used.map(f => (stats.get(f)||{possessions:0}).possessions);
            const maxP = Math.max(...possArr, 1);
            const avgP = possArr.reduce((a,b)=>a+b,0) / possArr.length;
            const EFF_MID = 50;
            const xS = v => PAD.left + (v / maxP) * pw;
            const yS = v => PAD.top + ph - Math.min(1, v / 100) * ph;
            const mx = xS(avgP), my = yS(EFF_MID);
            // Quadrant backgrounds
            const zones = [
                { x:PAD.left, y:PAD.top,    w:mx-PAD.left,        h:my-PAD.top,           bg:'rgba(219,234,254,0.4)', label:'Sous-utilisé', ta:'left',  tx:PAD.left+4,      ty:PAD.top+4 },
                { x:mx,       y:PAD.top,    w:PAD.left+pw-mx,     h:my-PAD.top,           bg:'rgba(209,250,229,0.5)', label:'Exploiter ⭐', ta:'right', tx:PAD.left+pw-4,   ty:PAD.top+4 },
                { x:PAD.left, y:my,         w:mx-PAD.left,        h:PAD.top+ph-my,        bg:'rgba(241,245,249,0.3)', label:'Abandonner',   ta:'left',  tx:PAD.left+4,      ty:PAD.top+ph-12 },
                { x:mx,       y:my,         w:PAD.left+pw-mx,     h:PAD.top+ph-my,        bg:'rgba(254,243,199,0.55)', label:'Corriger ⚠',  ta:'right', tx:PAD.left+pw-4,   ty:PAD.top+ph-12 },
            ];
            // Quadrant backgrounds only (labels drawn after dots)
            zones.forEach(z => { ctx.fillStyle = z.bg; ctx.fillRect(z.x, z.y, z.w, z.h); });
            // Quadrant dividers
            ctx.setLineDash([4,3]); ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(mx, PAD.top); ctx.lineTo(mx, PAD.top+ph); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(PAD.left, my); ctx.lineTo(PAD.left+pw, my); ctx.stroke();
            ctx.setLineDash([]);
            // Border
            ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1;
            ctx.strokeRect(PAD.left, PAD.top, pw, ph);
            // Y axis ticks
            const fAxis = Math.max(8, Math.round(W * 0.014));
            ctx.font = `${fAxis}px system-ui`; ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            [0, 50, 100].forEach(v => { ctx.fillText(v+'%', PAD.left-4, yS(v)); });
            // Axis legends
            ctx.fillStyle = '#64748B'; ctx.font = `${fAxis}px system-ui`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('← Utilisation FENIX (possessions) →', PAD.left+pw/2, PAD.top+ph+5);
            ctx.save(); ctx.translate(9, PAD.top+ph/2); ctx.rotate(-Math.PI/2);
            ctx.textBaseline = 'top'; ctx.fillText('Efficacité (b+PO)/poss. →', 0, 0); ctx.restore();
            // Dots — colored circles with number inside
            const DOT_R = 13;
            window._encMatrixDots = [];
            used.forEach(f => {
                const s = stats.get(f)||{possessions:0,eff:0};
                const x = xS(s.possessions), y = yS(s.eff||0);
                const col = getHex(f);
                ctx.beginPath(); ctx.arc(x, y, DOT_R, 0, 2*Math.PI);
                ctx.fillStyle = col; ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                ctx.font = `bold ${s.possessions >= 10 ? 9 : 10}px system-ui`;
                ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(s.possessions, x, y);
                const totalPossMatrix = window._encCurrentTotalPoss || 1;
                const utilisPctMatrix = Math.round(s.possessions / totalPossMatrix * 100);
                window._encMatrixDots.push({ x, y, famille: f, eff: s.eff||0, possessions: s.possessions, utilisPct: utilisPctMatrix });
            });
            // Zone labels drawn LAST (on top of dots) with white bg for legibility
            ctx.font = `bold ${fAxis}px system-ui`;
            zones.forEach(z => {
                ctx.textAlign = z.ta; ctx.textBaseline = 'top';
                const tw = ctx.measureText(z.label).width;
                const bgX = z.ta === 'right' ? z.tx - tw - 2 : z.tx - 2;
                ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.fillRect(bgX, z.ty - 1, tw + 4, 10);
                ctx.fillStyle = 'rgba(100,116,139,0.9)'; ctx.fillText(z.label, z.tx, z.ty);
            });
            _initEncMatrixHover();
            // Legend HTML (below canvas)
            const leg = document.getElementById('enc-matrix-legend');
            if (leg) {
                const abbr = {'Faire courir':'F.courir','Spéciaux':'Spéc.'};
                const items = used.map(f => {
                    const s = stats.get(f)||{eff:0};
                    const col = getHex(f);
                    const name = abbr[f]||f;
                    return `<span class="enc-legend-item"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${col};vertical-align:middle;margin-right:3px"></span>${name} <span style="color:#64748B;font-size:0.6rem">${s.eff}%</span></span>`;
                });
                leg.innerHTML = `<div class="enc-legend-grid">${items.join('')}</div>`;
            }
        }

        function _selectEncFamille(famille, fid) {
            const prev = window._encSelectedFamille;
            if (prev) document.getElementById(`enc-card-${prev}`)?.classList.remove('selected');
            const gw = document.getElementById('enc-graph-wrap');
            const dw = document.getElementById('enc-detail-wrap');
            if (!gw || !dw) return;
            if (prev === fid) {
                window._encSelectedFamille = null;
                gw.style.display = '';
                dw.style.display = 'none';
                requestAnimationFrame(() => _drawEncChart());
                return;
            }
            window._encSelectedFamille = fid;
            document.getElementById(`enc-card-${fid}`)?.classList.add('selected');
            _renderEncFamilleDetail(famille, fid);
            gw.style.display = 'none';
            dw.style.display = '';
        }

        // Niveau 1 du détail : liste des intentions attaque de la famille
        function _renderEncFamilleDetail(famille, fid) {
            window._encSelectedIntention = null;
            const couleur = ENC_FAMILLE_COLORS[famille];
            const s = window._encCurrentStatsMatch?.get(famille) || { eff:0, possessions:0 };
            const dh = document.getElementById('enc-detail-header');
            const dc = document.getElementById('enc-detail-content');
            if (dh) dh.innerHTML = `
                <button class="enc-detail-back" onclick="_closeEncDetail()">✕</button>
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${couleur};vertical-align:middle;margin-right:6px"></span>
                <strong style="text-transform:uppercase;font-size:0.85rem">${famille}</strong>
                <span style="color:#64748B;font-size:0.75rem;margin-left:8px">${s.eff}% · n=${s.possessions}</span>`;
            if (dc) dc.innerHTML = _buildEncDetailTable(window._encCurrentMatchData, famille, window._encTeamMode === 'adv');
        }

        // Niveau 2 du détail : enclenchements enregistrés sous une intention attaque précise
        function _selectEncIntention(famille, intention) {
            window._encSelectedIntention = intention;
            const couleur = ENC_FAMILLE_COLORS[famille];
            const fid = ENC_FAMILLE_IDS[famille];
            const dh = document.getElementById('enc-detail-header');
            const dc = document.getElementById('enc-detail-content');
            if (dh) dh.innerHTML = `
                <button class="enc-detail-back" title="Retour aux intentions" data-famille="${_escapeHtml(famille)}" data-fid="${_escapeHtml(fid)}" onclick="_renderEncFamilleDetail(this.dataset.famille, this.dataset.fid)">←</button>
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${couleur};vertical-align:middle;margin-right:6px"></span>
                <strong style="font-size:0.85rem">${_escapeHtml(intention || 'Non défini')}</strong>
                <span style="color:#64748B;font-size:0.75rem;margin-left:8px">${famille}</span>`;
            if (dc) dc.innerHTML = _buildEncIntentionDetailTable(window._encCurrentMatchData, intention, window._encTeamMode === 'adv');
        }

        function _closeEncDetail() {
            if (window._encSelectedFamille) {
                document.getElementById(`enc-card-${window._encSelectedFamille}`)?.classList.remove('selected');
                window._encSelectedFamille = null;
            }
            window._encSelectedIntention = null;
            const gw = document.getElementById('enc-graph-wrap');
            const dw = document.getElementById('enc-detail-wrap');
            if (gw) gw.style.display = '';
            if (dw) dw.style.display = 'none';
            requestAnimationFrame(() => _drawEncChart());
        }

        function _initEncMatrixHover() {
            const canvas = document.getElementById('enc-radar-canvas');
            if (!canvas) return;
            if (_encMatrixHoverController) _encMatrixHoverController.abort();
            _encMatrixHoverController = new AbortController();
            const signal = _encMatrixHoverController.signal;
            let tip = document.getElementById('enc-matrix-tooltip');
            if (!tip) {
                tip = document.createElement('div');
                tip.id = 'enc-matrix-tooltip';
                tip.style.cssText = 'position:fixed;background:rgba(15,23,42,0.92);color:#fff;border-radius:6px;padding:5px 10px;font-size:0.75rem;pointer-events:none;display:none;z-index:9999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
                document.body.appendChild(tip);
            }
            canvas.addEventListener('mousemove', e => {
                const rect = canvas.getBoundingClientRect();
                const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
                const cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy;
                const dots = window._encMatrixDots || [];
                const found = dots.find(d => Math.sqrt((cx-d.x)**2+(cy-d.y)**2) <= 15);
                if (found) {
                    tip.innerHTML = `<strong>${found.famille}</strong> · ${found.possessions} poss. (${found.utilisPct}% util.) · eff. ${found.eff}%`;
                    tip.style.display = 'block';
                    tip.style.left = (e.clientX + 14) + 'px';
                    tip.style.top = (e.clientY - 12) + 'px';
                    canvas.style.cursor = 'pointer';
                } else {
                    tip.style.display = 'none';
                    canvas.style.cursor = 'default';
                }
            }, { signal });
            canvas.addEventListener('mouseleave', () => { const t = document.getElementById('enc-matrix-tooltip'); if (t) t.style.display = 'none'; }, { signal });
            canvas.addEventListener('click', e => {
                const rect = canvas.getBoundingClientRect();
                const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
                const cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy;
                const dots = window._encMatrixDots || [];
                const found = dots.find(d => Math.sqrt((cx-d.x)**2+(cy-d.y)**2) <= 15);
                if (found) _selectEncFamille(found.famille, ENC_FAMILLE_IDS[found.famille]);
            }, { signal });
        }

        function _toggleEncGraphInfo() {
            _toggleEncMatrixInfo();
        }

        function _toggleEncRadarInfo() {
            let box = document.getElementById('enc-radar-info-box');
            if (!box) {
                box = document.createElement('div');
                box.id = 'enc-radar-info-box';
                box.style.cssText = 'position:absolute;top:30px;left:0;right:0;background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;font-size:0.75rem;line-height:1.7;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,0.1)';
                box.innerHTML = `<strong style="font-size:0.8rem;color:#0A2463">Lire le radar</strong><br>
                    <b style="color:#0A2463">━ Match actuel</b> — valeur affichée en <span style="color:#1e293b;font-weight:700">noir</span> sur chaque axe<br>
                    <b style="color:#94A3B8">╍ Moy. saison</b> — valeur affichée en <span style="color:#94A3B8;font-weight:700">gris · X% S</span> sous chaque axe<br>
                    <span style="display:inline-block;margin:5px 0 6px 10px;background:#F8FAFC;border-radius:5px;padding:3px 8px;font-size:0.72rem">
                        ex. <b style="color:#F59E0B">Isoler</b> &nbsp;
                        <span style="color:#1e293b;font-weight:700">39%</span>
                        <span style="color:#94A3B8"> · 32% S</span>
                    </span><br>
                    <b>Mode Utilisation</b> — % de possessions jouées avec cette famille<br>
                    <b>Mode Efficacité</b> — (buts + PO) / possessions<br><br>
                    <span style="color:#475569">Un axe <em>saillant</em> vs la saison = famille sur-représentée sur ce match.<br>
                    Un axe <em>rentrant</em> = famille moins utilisée / efficace que d'habitude.</span>`;
                const wrap = document.getElementById('enc-graph-wrap');
                if (wrap) wrap.appendChild(box);
                return;
            }
            box.style.display = box.style.display === 'none' ? '' : 'none';
        }

        function _toggleEncMatrixInfo() {
            let box = document.getElementById('enc-matrix-info-box');
            if (!box) {
                box = document.createElement('div');
                box.id = 'enc-matrix-info-box';
                box.style.cssText = 'position:absolute;top:30px;right:0;width:fit-content;background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;font-size:0.75rem;line-height:1.6;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,0.1);white-space:nowrap';
                box.innerHTML = `<strong style="font-size:0.8rem;color:#0A2463">Lire la matrice</strong><br>
                    <b>Axe X</b> — Utilisation : nb de possessions avec cet enclenchement<br>
                    <b>Axe Y</b> — Efficacité : (buts + PO) / possessions<br>
                    <b>Ligne verticale</b> — moyenne des possessions entre familles<br>
                    <b>Ligne 50%</b> — seuil d'efficacité<br><br>
                    <span style="color:#059669;font-weight:600">⭐ Exploiter</span> — fort <em>et</em> efficace → continuer<br>
                    <span style="color:#3B82F6;font-weight:600">🔵 Sous-utilisé</span> — efficace mais peu utilisé → faire plus<br>
                    <span style="color:#F59E0B;font-weight:600">⚠ Corriger</span> — très utilisé mais inefficace → améliorer<br>
                    <span style="color:#94A3B8;font-weight:600">🔘 Abandonner</span> — peu utilisé <em>et</em> inefficace → éviter`;
                const wrap = document.getElementById('enc-graph-wrap');
                if (wrap) wrap.appendChild(box);
                return;
            }
            box.style.display = box.style.display === 'none' ? '' : 'none';
        }

        function _toggleEncCardsInfo() {
            const box = document.getElementById('enc-cards-info-box');
            if (!box) return;
            box.style.display = box.style.display === 'none' ? '' : 'none';
        }

        function _toggleUnclassifiedPanel() {
            const panel = document.getElementById('enc-unclassified-panel');
            if (!panel) return;
            if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
            _buildUnclassifiedPanel(panel);
            panel.style.display = '';
        }

        function _buildUnclassifiedPanel(panel) {
            const isAdv = window._encTeamMode === 'adv';
            const matchData = window._encCurrentMatchData;
            if (!matchData) return;
            const rows = matchData.filter(r =>
                (isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX') &&
                (r[COLS.possession] || '').toString().trim() &&
                getEncFamille(r[COLS.intention_attaque]) === 'Autre'
            );
            const byEnc = new Map();
            rows.forEach(r => {
                const enc = (r[COLS.intention_attaque] || '').toString().trim() || 'Non défini';
                byEnc.set(enc, (byEnc.get(enc) || 0) + 1);
            });
            if (!byEnc.size) {
                panel.innerHTML = '<p style="color:#64748B;font-size:0.8rem;padding:6px 0">✓ Toutes les intentions d\'attaque sont classifiées.</p>';
                return;
            }
            const famOpts = ENC_FAMILLES_ORDRE.map(f => `<option value="${f}">${f}</option>`).join('');
            const sorted = [...byEnc.entries()].sort((a, b) => b[1] - a[1]);
            const lignes = sorted.map(([enc, cnt]) => {
                return `<tr>
                    <td>${_escapeHtml(enc)}</td>
                    <td style="text-align:center;font-weight:600">${cnt}</td>
                    <td><select class="enc-assign-select" data-enc="${_escapeHtml(enc)}" onchange="_assignEncFamille(this.dataset.enc, this.value)">
                        <option value="">— assigner —</option>${famOpts}
                    </select></td>
                </tr>`;
            }).join('');
            panel.innerHTML = `<table class="enc-detail-table" style="margin-top:0">
                <thead><tr><th>Intention attaque non classifiée</th><th style="width:40px">Nb</th><th style="width:160px">Famille</th></tr></thead>
                <tbody>${lignes}</tbody>
            </table>`;
        }

        function _assignEncFamille(enc, famille) {
            if (!famille) return;
            _ENC_FAMILLE_CUSTOM[enc] = famille;
            try { localStorage.setItem('enc_famille_custom', JSON.stringify(_ENC_FAMILLE_CUSTOM)); } catch(e) {}
            _encStatsSaison = null; // invalider cache saison
            if (window._encCurrentMatchData) {
                renderEncFamillesSection(window._encCurrentMatchData);
                requestAnimationFrame(() => {
                    const panel = document.getElementById('enc-unclassified-panel');
                    if (panel) { _buildUnclassifiedPanel(panel); panel.style.display = ''; }
                });
            }
        }

        // ── STORY-25 : édition des correspondances Intention attaque → Famille (famille_mapping) ──
        // Modèle direct : openPlayerAccountsModal()/savePlayerAccount()/deletePlayerAccount() (js/player-mode.js).
        // Reprend les 17 correspondances actuellement amorcées en base (supabase/seed-famille-mapping.sql)
        // pour détecter si famille_mapping est encore la configuration initiale, jamais éditée par Romain.
        const _FAMILLE_DEFAULTS = {
            'ISO 2':'Isoler','ISO 3':'Isoler','ISO 4':'Isoler','ISO 5':'Isoler',
            '7vs6':'7vs6',
            '1&2':'Jeu Pivot','2&3':'Jeu Pivot','3&4':'Jeu Pivot','4&5':'Jeu Pivot','5&6':'Jeu Pivot',
            'GLISSE':'Jeu Pivot','BLOC':'Jeu Pivot',
            'FAIRE COURIR':'Faire courir',
            'RENTREE':'Rentrée',
            'SPECIAUX':'Spéciaux',
            '6vs5':'6vs5',
            'JEU RAPIDE':'Jeu Rapide',
        };
        function _isFamilleMappingUnedited(map) {
            const keys = Object.keys(map);
            const defKeys = Object.keys(_FAMILLE_DEFAULTS);
            if (keys.length !== defKeys.length) return false;
            return defKeys.every(k => map[k] === _FAMILLE_DEFAULTS[k]);
        }

        function _renderFamillesList(rows) {
            const countLabel = document.getElementById('fam-count-label');
            if (countLabel) countLabel.textContent = `CORRESPONDANCES EXISTANTES (${rows.length})`;
            const tbody = document.getElementById('fam-mapping-list');
            if (!tbody) return;
            const sorted = rows.slice().sort((a, b) => (a.intention_attaque || '').localeCompare(b.intention_attaque || ''));
            tbody.innerHTML = sorted.length === 0
                ? '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Aucune correspondance</td></tr>'
                : sorted.map(r => `<tr>
                    <td style="padding:6px 10px">${_escapeHtml(r.intention_attaque)}</td>
                    <td style="padding:6px 10px">${_escapeHtml(r.famille)}</td>
                    <td style="padding:6px 10px;text-align:right">
                        <button data-intention="${_escapeHtml(r.intention_attaque)}" onclick="deleteFamilleMapping(this.dataset.intention)"
                                style="color:#EF4444;background:none;border:none;cursor:pointer;font-size:1rem" title="Supprimer">🗑</button>
                    </td>
                </tr>`).join('');
        }

        async function openFamillesModal() {
            const selFam = document.getElementById('fam-famille-sel');
            if (selFam) selFam.innerHTML = ENC_FAMILLES_ORDRE.map(f => `<option value="${f}">${f}</option>`).join('');
            const tbody = document.getElementById('fam-mapping-list');
            if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Chargement…</td></tr>';
            _openSlidePanel('fam-modal', 'fam-overlay');

            let rows;
            try {
                rows = await fetchAll('famille_mapping');
            } catch (e) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#EF4444;padding:12px">Erreur de chargement — réessaie</td></tr>';
                return;
            }

            const map = {};
            rows.forEach(r => { map[r.intention_attaque] = r.famille; });
            const banner = document.getElementById('fam-default-banner');
            if (banner) banner.style.display = _isFamilleMappingUnedited(map) ? 'block' : 'none';

            _renderFamillesList(rows);
        }

        function closeFamillesModal(returnFocus) {
            _closeSlidePanel('fam-modal', 'fam-overlay', returnFocus);
        }

        async function addFamilleMapping() {
            const intentionEl = document.getElementById('fam-intention');
            const famEl = document.getElementById('fam-famille-sel');
            const intention = intentionEl ? intentionEl.value.trim() : '';
            const famille = famEl ? famEl.value : '';
            if (!intention || !famille) { alert('Renseigne une intention attaque et choisis une famille'); return; }
            const btn = document.getElementById('fam-add-btn');
            if (btn) { btn.disabled = true; btn.textContent = '…'; }
            try {
                await upsertRows('famille_mapping', [{ intention_attaque: intention, famille }]);
                FAMILLE_MAPPING[intention] = famille;
                _encStatsSaison = null; // invalider cache saison
                if (intentionEl) intentionEl.value = '';
                await openFamillesModal();
                if (window._encCurrentMatchData) renderEncFamillesSection(window._encCurrentMatchData);
            } catch (e) {
                alert('Erreur lors de l\'ajout : ' + (e.message || 'échec réseau'));
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = '✅ AJOUTER'; }
            }
        }

        async function deleteFamilleMapping(intention) {
            if (!confirm(`Supprimer la correspondance "${intention}" ?`)) return;
            try {
                const { error } = await supabaseClient.from('famille_mapping').delete().eq('intention_attaque', intention);
                if (error) throw error;
                delete FAMILLE_MAPPING[intention];
                _encStatsSaison = null; // invalider cache saison
                await openFamillesModal();
                if (window._encCurrentMatchData) renderEncFamillesSection(window._encCurrentMatchData);
            } catch (e) {
                alert('Erreur lors de la suppression : ' + (e.message || 'échec réseau'));
            }
        }

        function _drawEncRadar() {
            const canvas = document.getElementById('enc-radar-canvas');
            if (!canvas) return;
            // Auto-resize to container
            const wrap = canvas.parentElement;
            if (wrap && wrap.clientWidth > 0) {
                const cw = Math.max(300, wrap.clientWidth - 28);
                canvas.width = cw;
                canvas.height = Math.max(220, Math.min(Math.round(cw * 0.50), 430));
                canvas.style.width = cw + 'px';
                canvas.style.height = canvas.height + 'px';
            }
            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2;
            const R = Math.min(W, H) * 0.30;
            const LABEL_R = Math.min(W, H) * 0.41;
            const mode = window._encGraphMode || 'utilisation';
            const stats = window._encCurrentStatsMatch;
            const statsSaison = window._encCurrentStatsSaison;
            const totalPoss = window._encCurrentTotalPoss || 1;
            if (!stats) return;
            ctx.clearRect(0, 0, W, H);
            const familles = ENC_FAMILLES_ORDRE;
            const N = familles.length;
            const angles = familles.map((_, i) => (i / N) * 2 * Math.PI - Math.PI / 2);
            const rootStyle = getComputedStyle(document.documentElement);
            const getHex = f => {
                const v = (ENC_FAMILLE_COLORS[f] || '').replace('var(','').replace(')','').trim();
                return rootStyle.getPropertyValue(v).trim() || '#94A3B8';
            };
            // Valeurs match et saison (0-1)
            const matchVals = familles.map(f => {
                const s = stats.get(f) || {possessions:0,eff:0};
                return mode === 'utilisation'
                    ? Math.min(1, totalPoss > 0 ? s.possessions / totalPoss : 0)
                    : Math.min(1, (s.eff||0) / 100);
            });
            const isSpecifique = !!window._encIsMatchSpecifique;
            const saisonVals = (statsSaison && isSpecifique) ? familles.map(f => {
                const sd = statsSaison.get(f) || {utilisMoy:0,effMoy:0};
                return mode === 'utilisation'
                    ? Math.min(1, (sd.utilisMoy||0) / 100)
                    : Math.min(1, (sd.effMoy||0) / 100);
            }) : null;
            // Grilles
            [0.33, 0.67, 1.0].forEach((r, ri) => {
                ctx.beginPath();
                angles.forEach((a, i) => { const x=cx+r*R*Math.cos(a),y=cy+r*R*Math.sin(a); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
                ctx.closePath();
                ctx.strokeStyle = ri===2 ? '#CBD5E1' : '#EEF1F5'; ctx.lineWidth = ri===2 ? 1.5 : 1; ctx.stroke();
            });
            angles.forEach(a => { ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a)); ctx.strokeStyle='#E2E8F0'; ctx.lineWidth=1; ctx.stroke(); });
            // Polygone saison (derrière, pointillé gris)
            if (saisonVals && saisonVals.some(v => v > 0)) {
                ctx.beginPath();
                angles.forEach((a,i) => { const v=saisonVals[i],x=cx+v*R*Math.cos(a),y=cy+v*R*Math.sin(a); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
                ctx.closePath();
                ctx.fillStyle='rgba(148,163,184,0.08)'; ctx.fill();
                ctx.setLineDash([5,4]); ctx.strokeStyle='#94A3B8'; ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
            }
            // Polygone match (devant, plein)
            ctx.beginPath();
            angles.forEach((a,i) => { const v=matchVals[i],x=cx+v*R*Math.cos(a),y=cy+v*R*Math.sin(a); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
            ctx.closePath(); ctx.fillStyle='rgba(10,36,99,0.1)'; ctx.fill(); ctx.strokeStyle='#0A2463'; ctx.lineWidth=2; ctx.stroke();
            // Points match
            const dotR = Math.max(4, Math.round(R * 0.045));
            angles.forEach((a,i) => {
                if (!matchVals[i]) return;
                const x=cx+matchVals[i]*R*Math.cos(a), y=cy+matchVals[i]*R*Math.sin(a);
                ctx.beginPath(); ctx.arc(x,y,dotR,0,2*Math.PI); ctx.fillStyle=getHex(familles[i]); ctx.fill();
            });
            // Labels : nom + valeur match + valeur saison (plus petite, grise)
            const fMain = Math.max(9, Math.round(R * 0.088));
            const fSub  = Math.max(8, fMain - 1);
            const fTiny = Math.max(7, fSub - 1);
            const lyOff = Math.round(fMain * 0.65);
            const abbr = {'Faire courir':'F.courir','Spéciaux':'Spéc.','Bloc PVT':'Bloc PVT','Jeu PVT':'Jeu PVT'};
            ctx.textBaseline = 'middle';
            angles.forEach((a,i) => {
                const lx = cx + LABEL_R*Math.cos(a), ly = cy + LABEL_R*Math.sin(a);
                const cosA = Math.cos(a);
                const align = Math.abs(cosA)<0.25 ? 'center' : (cosA>0 ? 'left' : 'right');
                const xOff = align==='left' ? 3 : align==='right' ? -3 : 0;
                const name = abbr[familles[i]] || familles[i];
                const s = stats.get(familles[i]) || {possessions:0,eff:0};
                const matchLabel = mode==='utilisation'
                    ? `${Math.round(matchVals[i]*100)}%`
                    : `${s.eff||0}%`;
                ctx.textAlign = align;
                ctx.font = `bold ${fMain}px system-ui,sans-serif`; ctx.fillStyle = getHex(familles[i]);
                ctx.fillText(name, lx+xOff, ly - lyOff);
                ctx.font = `${fSub}px system-ui,sans-serif`; ctx.fillStyle = '#1e293b';
                ctx.fillText(matchLabel, lx+xOff, ly + lyOff);
                if (saisonVals) {
                    const sd = statsSaison.get(familles[i]) || {utilisMoy:0,effMoy:0};
                    const saisonLabel = mode==='utilisation' ? `${sd.utilisMoy||0}% S` : `${sd.effMoy||0}% S`;
                    ctx.font = `${fTiny}px system-ui,sans-serif`; ctx.fillStyle = '#94A3B8';
                    ctx.fillText(saisonLabel, lx+xOff, ly + lyOff + fSub + 2);
                }
            });
            // Légende dans le footer
            const leg = document.getElementById('enc-matrix-legend');
            if (leg) {
                const modeLabel = mode === 'utilisation' ? 'Utilisation %' : 'Efficacité %';
                leg.innerHTML = isSpecifique
                    ? `<div style="display:flex;align-items:center;gap:16px;font-size:0.72rem;color:#475569">
                        <span><span style="display:inline-block;width:18px;height:2px;background:#0A2463;vertical-align:middle;margin-right:4px;border-radius:1px"></span>Match actuel</span>
                        <span><span style="display:inline-block;width:18px;border-top:2px dashed #94A3B8;vertical-align:middle;margin-right:4px"></span>Moy. saison</span>
                        <span style="color:#94A3B8;font-size:0.68rem">${modeLabel}</span>
                      </div>`
                    : `<div style="display:flex;align-items:center;gap:10px;font-size:0.72rem;color:#475569">
                        <span><span style="display:inline-block;width:18px;height:2px;background:#0A2463;vertical-align:middle;margin-right:4px;border-radius:1px"></span>Saison complète</span>
                        <span style="color:#94A3B8;font-size:0.68rem">${modeLabel}</span>
                      </div>`;
            }
        }

        function _buildEncDetailTable(matchData, famille, isAdv) {
            // Intention vide → classée dans "Autre" (jeu libre non cadré, pas une erreur) : on la garde, pas de filtre sur intention non-vide.
            const rows = matchData.filter(r =>
                (isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX') &&
                (r[COLS.possession] || '').toString().trim() &&
                getEncFamille(r[COLS.intention_attaque]) === famille);
            const byEnc = new Map();
            rows.forEach(r => {
                const cle = (r[COLS.intention_attaque] || '').toString().trim();
                const label = cle || 'Non défini';
                if (!byEnc.has(cle)) byEnc.set(cle, { cle, label, tirs:0, buts:0, pb:0, po:0, possessions:0 });
                const s = byEnc.get(cle);
                const res = isAdv ? (r[COLS.finalite]||'') : (r[COLS.resultat]||'');
                s.possessions++;
                if (res === 'But') s.buts++;
                else if (res === 'Tir raté' || res === 'Tir arrêté') s.tirs++; // tirs = ratés seulement
                else if (res === 'PB') s.pb++;
                else if (res === 'PO') s.po++;
            });
            if (!byEnc.size) return '<p style="color:#94A3B8;font-size:0.82rem;padding:8px 0">Aucune donnée.</p>';
            const sorted = [...byEnc.entries()].sort((a, b) => b[1].possessions - a[1].possessions);
            let tt = 0, tb = 0, tp = 0, tpo = 0, tposs = 0;
            sorted.forEach(([, s]) => { tt += s.tirs; tb += s.buts; tp += s.pb; tpo += s.po; tposs += s.possessions; });
            const te = tposs > 0 ? Math.round((tb + tpo) / tposs * 100) : 0;
            let lignes = '';
            sorted.forEach(([, s]) => {
                const eff = s.possessions > 0 ? Math.round((s.buts + s.po) / s.possessions * 100) : 0;
                const c = eff >= 60 ? '#059669' : eff < 40 ? '#DC2626' : '#64748B';
                lignes += `<tr class="enc-detail-row-clickable" data-famille="${_escapeHtml(famille)}" data-intention="${_escapeHtml(s.cle)}" onclick="_selectEncIntention(this.dataset.famille, this.dataset.intention)" title="Voir les enclenchements utilisés pour cette intention"><td>${_escapeHtml(s.label)}</td><td>${s.buts}</td><td>${s.po}</td><td>${s.tirs}</td><td>${s.pb}</td><td>${s.possessions}</td><td style="color:${c};font-weight:600">${eff}%</td></tr>`;
            });
            return `<table class="enc-detail-table"><thead><tr><th>Intention attaque</th><th>Buts</th><th>PO</th><th>Ratés</th><th>PB</th><th>Poss.</th><th>Eff. <span title="(Buts + PO) / Possessions - le PO compte comme efficace" style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:50%;background:#94A3B8;color:#fff;font-size:9px;font-weight:700;cursor:help;vertical-align:middle;line-height:1">i</span></th></tr></thead><tbody>${lignes}</tbody><tfoot><tr class="enc-detail-total"><td>Total</td><td>${tb}</td><td>${tpo}</td><td>${tt}</td><td>${tp}</td><td>${tposs}</td><td>${te}%</td></tr></tfoot></table>`;
        }

        // Niveau 2 — enclenchements bruts enregistrés pour une intention attaque précise
        function _buildEncIntentionDetailTable(matchData, intention, isAdv) {
            const rows = matchData.filter(r =>
                (isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX') &&
                (r[COLS.possession] || '').toString().trim() &&
                (r[COLS.intention_attaque] || '').toString().trim() === intention);
            const byEnc = new Map();
            rows.forEach(r => {
                const cle = (r[COLS.enclenchement] || '').toString().trim() || '(vide)';
                if (!byEnc.has(cle)) byEnc.set(cle, { label: cle, tirs:0, buts:0, pb:0, po:0, possessions:0 });
                const s = byEnc.get(cle);
                const res = isAdv ? (r[COLS.finalite]||'') : (r[COLS.resultat]||'');
                s.possessions++;
                if (res === 'But') s.buts++;
                else if (res === 'Tir raté' || res === 'Tir arrêté') s.tirs++; // tirs = ratés seulement
                else if (res === 'PB') s.pb++;
                else if (res === 'PO') s.po++;
            });
            if (!byEnc.size) return '<p style="color:#94A3B8;font-size:0.82rem;padding:8px 0">Aucune donnée.</p>';
            const sorted = [...byEnc.entries()].sort((a, b) => b[1].possessions - a[1].possessions);
            let tt = 0, tb = 0, tp = 0, tpo = 0, tposs = 0;
            sorted.forEach(([, s]) => { tt += s.tirs; tb += s.buts; tp += s.pb; tpo += s.po; tposs += s.possessions; });
            const te = tposs > 0 ? Math.round((tb + tpo) / tposs * 100) : 0;
            let lignes = '';
            sorted.forEach(([, s]) => {
                const eff = s.possessions > 0 ? Math.round((s.buts + s.po) / s.possessions * 100) : 0;
                const c = eff >= 60 ? '#059669' : eff < 40 ? '#DC2626' : '#64748B';
                lignes += `<tr><td>${_escapeHtml(s.label)}</td><td>${s.buts}</td><td>${s.po}</td><td>${s.tirs}</td><td>${s.pb}</td><td>${s.possessions}</td><td style="color:${c};font-weight:600">${eff}%</td></tr>`;
            });
            return `<table class="enc-detail-table"><thead><tr><th>Enclenchement</th><th>Buts</th><th>PO</th><th>Ratés</th><th>PB</th><th>Poss.</th><th>Eff. <span title="(Buts + PO) / Possessions - le PO compte comme efficace" style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:50%;background:#94A3B8;color:#fff;font-size:9px;font-weight:700;cursor:help;vertical-align:middle;line-height:1">i</span></th></tr></thead><tbody>${lignes}</tbody><tfoot><tr class="enc-detail-total"><td>Total</td><td>${tb}</td><td>${tpo}</td><td>${tt}</td><td>${tp}</td><td>${tposs}</td><td>${te}%</td></tr></tfoot></table>`;
        }

        // A-04 — Overlay momentum + détection bascule
        function detectBasculeMoment(scoreHistory) {
            if (!scoreHistory || scoreHistory.length < 2) return null;
            const diffs = scoreHistory.map(p => p.fenix - p.adv);
            let crossingIdx = -1;
            for (let i = 1; i < diffs.length; i++) {
                if (diffs[i-1] >= 0 && diffs[i] < 0) { crossingIdx = i; break; }
            }
            let minDiff = 0, minIdx = -1;
            for (let i = 1; i < diffs.length; i++) {
                if (diffs[i] < minDiff) { minDiff = diffs[i]; minIdx = i; }
            }
            if (crossingIdx === -1 && minIdx === -1) return null;
            const idx = crossingIdx !== -1 ? crossingIdx : minIdx;
            return { index: idx, avant: diffs[idx-1] !== undefined ? diffs[idx-1] : 0, apres: diffs[idx] };
        }

        function drawMomentumOverlay(ctx, scoreHistory, logicalW, logicalH, padding, roundedMax, maxPos) {
            if (!scoreHistory || scoreHistory.length < 2) return;
            const gW = logicalW - padding.left - padding.right;
            const gH = logicalH - padding.top - padding.bottom;
            const diffs = scoreHistory.map(p => p.fenix - p.adv);
            const maxAbs = Math.max(...diffs.map(Math.abs), 1);
            const midY = padding.top + gH / 2;
            const diffToY = d => midY - (d / maxAbs) * (gH / 2) * 0.75;
            const posToX  = p => padding.left + (p / maxPos) * gW;
            ctx.save();
            // Zones colorées
            const drawZone = (positive) => {
                ctx.fillStyle = positive ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)';
                let open = false;
                ctx.beginPath();
                scoreHistory.forEach(p => {
                    const d = p.fenix - p.adv, x = posToX(p.pos);
                    const inZone = positive ? d > 0 : d < 0;
                    if (inZone && !open) { ctx.moveTo(x, midY); open = true; }
                    if (open) ctx.lineTo(x, diffToY(d));
                    if (!inZone && open) { ctx.lineTo(x, midY); ctx.closePath(); ctx.fill(); ctx.beginPath(); open = false; }
                });
                if (open) { ctx.lineTo(posToX(scoreHistory[scoreHistory.length-1].pos), midY); ctx.closePath(); ctx.fill(); }
            };
            drawZone(true); drawZone(false);
            // Ligne zéro tiretée
            ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
            ctx.beginPath(); ctx.moveTo(padding.left, midY); ctx.lineTo(logicalW - padding.right, midY); ctx.stroke(); ctx.setLineDash([]);
            // Courbe d'écart gold
            ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            scoreHistory.forEach((p, i) => { const x = posToX(p.pos), y = diffToY(p.fenix-p.adv); i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
            ctx.stroke();
            // Bascule désormais gérée par detectAllBascules + marqueurs ⚡ dans drawTimeline
            ctx.restore();
        }

        // A-05 — Section bascules (plusieurs par match)
        function renderBasculContext(matchData, bascules) {
            const container = document.getElementById('enc-bascule-section');
            if (!container) return;
            if (!bascules || bascules.length === 0) {
                container.innerHTML = `<div class="enc-bascule-none">✓ Aucune bascule détectée — FENIX a maîtrisé le match.</div>`;
                return;
            }
            const typeColor = t => (t === 'reprend-main' || t === 'tactique-payante') ? '#16A34A' : '#F59E0B';
            const fmtD = d => (d >= 0 ? '+' : '') + d;
            let html = '<div class="enc-bascule-list">';
            bascules.forEach((b, idx) => {
                const col = typeColor(b.type);
                const ecart = b.type === 'occasion-manquee'
                    ? `stagne à ${fmtD(b.avant)}`
                    : `${fmtD(b.avant)} → ${fmtD(b.apres)}`;
                html += `
                  <div class="enc-bascule-item">
                    <div class="enc-bascule-item-header" style="color:${col}">
                      ⚡${idx + 1} — ${b.label}
                      <span class="enc-bascule-ecart">${ecart}</span>
                    </div>
                    <div class="enc-bascule-item-desc">${b.description}</div>
                  </div>`;
            });
            html += '</div>';
            container.innerHTML = html;
        }

        // A-06/07 — Gardien × famille
        function computeGbEncStats(matchData) {
            const FAMILLES = [...ENC_FAMILLES_ORDRE, 'Autre'];
            const byGardien = new Map();
            matchData.filter(r => r[COLS.club] !== 'FENIX').forEach(r => {
                const gardien = (r[COLS.gardien] || '').toString().trim();
                if (!gardien) return;
                // matchPlayerName() plutôt qu'une égalité stricte : la colonne "Gardien" de la feuille
                // DATA contient le prénom seul ("Gabin"), pas le format court "Prénom.Initiale" utilisé
                // par GARDIENS_FENIX ("Gabin.S") — une comparaison directe ne correspond jamais.
                if (typeof GARDIENS_FENIX !== 'undefined' && GARDIENS_FENIX.length > 0 &&
                    !GARDIENS_FENIX.some(g => matchPlayerName(gardien, g))) return;
                if (!byGardien.has(gardien)) { const m = new Map(); FAMILLES.forEach(f => m.set(f, { arrets:0, tirs:0, pct:0 })); byGardien.set(gardien, m); }
                const s = byGardien.get(gardien).get(getEncFamille(r[COLS.intention_attaque]));
                const estArret = r[COLS.finalite] === 'Tir arrêté';
                const estBut = r[COLS.finalite] === 'But';
                if (estArret) { s.arrets++; s.tirs++; } else if (estBut) s.tirs++;
            });
            byGardien.forEach(famMap => famMap.forEach(s => { s.pct = s.tirs > 0 ? Math.round(s.arrets / s.tirs * 100) : 0; }));
            return byGardien;
        }

        function _computeGbMoyenneSaison(gardienName) {
            if (typeof MATCHS === 'undefined' || !MATCHS) return null;
            const pcts = [];
            MATCHS.forEach(matchName => {
                const gbStats = computeGbEncStats(DATA.filter(r => r[COLS.rencontre] === matchName));
                if (!gbStats.has(gardienName)) return;
                let t = 0, a = 0; gbStats.get(gardienName).forEach(s => { t += s.tirs; a += s.arrets; });
                if (t > 0) pcts.push(Math.round(a / t * 100));
            });
            return pcts.length >= 3 ? Math.round(pcts.reduce((s,v) => s+v, 0) / pcts.length) : null;
        }

        function renderGardienEncSection(matchData) {
            const container = document.getElementById('enc-gardien-section');
            if (!container) return;
            const gbStats = computeGbEncStats(matchData);
            if (!gbStats.size) { container.innerHTML = `<p style="color:#94A3B8;font-size:0.85rem;">Aucune donnée gardien.</p>`; return; }
            const gardiens = [...gbStats.keys()];
            if (!_gardienSelected || !gbStats.has(_gardienSelected)) {
                let maxTirs = -1;
                gardiens.forEach(g => { let t = 0; gbStats.get(g).forEach(s => t += s.tirs); if (t > maxTirs) { maxTirs = t; _gardienSelected = g; } });
            }
            const moySaison = _computeGbMoyenneSaison(_gardienSelected);
            const famMap = gbStats.get(_gardienSelected);
            let totalA = 0, totalT = 0;
            famMap.forEach(s => { totalA += s.arrets; totalT += s.tirs; });
            const pctGlobal = totalT > 0 ? Math.round(totalA / totalT * 100) : 0;
            const selectHtml = gardiens.length >= 2
                ? `<label class="enc-gardien-select-label">Gardien :</label><select id="enc-gardien-select" onchange="_onGardienChange(this.value)">${gardiens.map(g=>`<option value="${g}" ${g===_gardienSelected?'selected':''}>${g}</option>`).join('')}</select>`
                : `<strong>${_gardienSelected}</strong>`;
            let rows = '';
            ENC_FAMILLES_ORDRE.forEach(famille => {
                const s = famMap.get(famille) || { arrets:0, tirs:0, pct:0 };
                if (!s.tirs) return;
                let sig = `<td class="enc-signal-neutre">—</td>`;
                if (s.tirs < 3) sig = `<td class="enc-signal-neutre" style="font-style:italic;">(n&lt;3)</td>`;
                else if (moySaison !== null) {
                    const diff = s.pct - moySaison;
                    if (diff < -15) sig = `<td class="enc-signal-alerte">🔴 ALERTE</td>`;
                    else if (diff > 10) sig = `<td class="enc-signal-bon">✅ BON</td>`;
                }
                const rowCls = _gardienFamilleFilter === famille ? 'enc-gardien-row selected' : 'enc-gardien-row';
                const col = ENC_FAMILLE_COLORS[famille] || '#94A3B8';
                rows += `<tr class="${rowCls}" data-famille="${famille}" onclick="_onGardienFamilleClick('${famille}')"><td><span style="background:${col};width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:4px"></span>${famille}</td><td>${s.tirs}</td><td>${s.arrets}</td><td>${s.pct}%</td>${sig}</tr>`;
            });
            rows += `<tr class="enc-gardien-total"><td>Total</td><td>${totalT}</td><td>${totalA}</td><td>${pctGlobal}%</td><td>—</td></tr>`;
            const moyRef = moySaison !== null ? ` · Moy. saison : ${moySaison}%` : '';
            container.innerHTML = `
              <div class="enc-section-header">
                <span class="enc-section-title">GARDIEN × SYSTÈMES ADVERSES</span>
                <span class="enc-section-meta">% arrêts ce match : <strong>${pctGlobal}%</strong>${moyRef}</span>
              </div>
              <div class="enc-gardien-controls">${selectHtml}</div>
              <div class="enc-gardien-layout">
                <div class="enc-gardien-table-wrap">
                  <table><thead><tr><th>Système adverse</th><th>Tirs</th><th>Arr.</th><th>%</th><th>Signal</th></tr></thead><tbody>${rows}</tbody></table>
                  <p style="font-size:0.72rem;color:#94A3B8;font-style:italic;margin-top:4px;">Clic sur une ligne = filtre heatmap</p>
                </div>
                <div id="enc-gardien-heatmap"></div>
              </div>`;
            _renderGardienHeatmap(matchData, _gardienFamilleFilter);
        }

        function _onGardienChange(gardienName) {
            _gardienSelected = gardienName; _gardienFamilleFilter = null;
            const matchFilter = document.getElementById('filter-match-global').value;
            renderGardienEncSection(DATA.filter(r => r[COLS.rencontre] === matchFilter));
        }

        function _onGardienFamilleClick(famille) {
            _gardienFamilleFilter = _gardienFamilleFilter === famille ? null : famille;
            document.querySelectorAll('.enc-gardien-row').forEach(tr => {
                tr.classList.toggle('selected', tr.dataset.famille === _gardienFamilleFilter);
            });
            const matchFilter = document.getElementById('filter-match-global').value;
            _renderGardienHeatmap(DATA.filter(r => r[COLS.rencontre] === matchFilter), _gardienFamilleFilter);
        }

        function _renderGardienHeatmap(matchData, familleFilter) {
            const hc = document.getElementById('enc-gardien-heatmap');
            if (!hc) return;
            let advRows = matchData.filter(r => r[COLS.club] !== 'FENIX' && (r[COLS.finalite]==='But'||r[COLS.finalite]==='Tir arrêté') && matchPlayerName(_gardienSelected||'', (r[COLS.gardien]||'').toString().trim()));
            if (familleFilter) advRows = advRows.filter(r => getEncFamille(r[COLS.intention_attaque]) === familleFilter);
            const titre = familleFilter ? `${familleFilter} (${advRows.length} tirs)` : `Tous systèmes (${advRows.length} tirs)`;
            hc.innerHTML = `<div style="font-size:0.75rem;color:#64748B;margin-bottom:4px;">${titre}</div><canvas id="enc-gardien-canvas" width="160" height="180"></canvas>${familleFilter?`<button onclick="_onGardienFamilleClick(null)" class="enc-filter-reset">Tout afficher</button>`:''}`;
            _drawMiniZoneCanvas('enc-gardien-canvas', advRows);
        }

        function _drawMiniZoneCanvas(canvasId, rows) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ZONE_MAP = {
                '9m Int G':0,'9m ext G':0,'But à but':1,'9m Int D':2,'9m ext D':2,
                '6-9 ext G':3,'6-9 central G':3,'6-9 central D':5,'6-9 ext D':5,
                '6m ail G':6,'6m ext G':6,'6m central G':7,'6m central D':7,'7m':7,'6m ail D':8,'6m ext D':8
            };
            const counts = new Array(9).fill(0), buts = new Array(9).fill(0);
            rows.forEach(r => {
                const zone = (r[COLS.field_position]||'').toString().trim();
                const idx = ZONE_MAP[zone];
                if (idx !== undefined) { counts[idx]++; if (r[COLS.finalite]==='But') buts[idx]++; }
            });
            const cw = canvas.width, ch = canvas.height - 18;
            const cellW = cw/3, cellH = ch/3;
            const maxC = Math.max(...counts, 1);
            for (let i = 0; i < 9; i++) {
                const col = i%3, row = Math.floor(i/3), x = col*cellW, y = row*cellH, intensity = counts[i]/maxC;
                ctx.fillStyle = buts[i] > 0 ? `rgba(220,38,38,${0.1+intensity*0.5})` : `rgba(16,185,129,${0.08+intensity*0.3})`;
                ctx.fillRect(x+1,y+1,cellW-2,cellH-2);
                ctx.strokeStyle='#CBD5E1'; ctx.lineWidth=1; ctx.strokeRect(x,y,cellW,cellH);
                if (counts[i] > 0) { ctx.fillStyle='#0F172A'; ctx.font='700 11px Inter,sans-serif'; ctx.textAlign='center'; ctx.fillText(counts[i], x+cellW/2, y+cellH/2+4); }
            }
            ctx.fillStyle='#64748B'; ctx.font='8px Inter,sans-serif'; ctx.textAlign='left';
            ctx.fillText('Rouge=But · Vert=Arrêt', 2, ch+13);
        }

        let _mcAdvancedCols = false;
        let _mcSequencesMatchData = null;

        function showMCSequences(area, matchData) {
            _mcSequencesMatchData = matchData;
            const panel = document.getElementById('mc-sequences-panel');
            const table = document.getElementById('mc-sequences-table');
            const title = document.getElementById('mc-sequences-title');
            if (!panel || !table) return;

            // Titre
            const color = area.positif ? '#16a34a' : '#dc2626';
            const titleText = area.text || area.description || area.label;
            title.innerHTML = `<span style="color:${color}">${area.label}</span> — ${titleText}`;

            // Recalcul offset MT2 (même logique que getSortedGoals) pour normaliser les positions
            const _md = matchData || [];
            const _g1 = _md.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 1);
            const _g2 = _md.filter(r => r[COLS.resultat] === 'But' && getPeriodeNum(r) === 2);
            const _max1 = _g1.length ? Math.max(..._g1.map(r => parseTimecode(r[COLS.position]))) : 0;
            const _min2 = _g2.length ? Math.min(..._g2.map(r => parseTimecode(r[COLS.position]))) : Infinity;
            const _off2 = (_g2.length > 0 && _min2 < _max1) ? _max1 : 0;
            const toRawLocal = r => getPeriodeNum(r) === 2
                ? parseTimecode(r[COLS.position]) + _off2
                : parseTimecode(r[COLS.position]);

            // Filtrer les possessions : lignes directes si seqRows présent, sinon fenêtre startRaw→endRaw, fallback ±90s
            const WIN = 90;
            let rows;
            if (area.seqRows && area.seqRows.length > 0) {
                rows = [...area.seqRows].sort((a, b) => toRawLocal(a) - toRawLocal(b));
            } else {
                const s = area.startRaw, e = area.endRaw;
                const hasWindow = s != null && e != null && Math.min(s, e) !== Math.max(s, e);
                rows = _md.filter(r => {
                    const rawPos = toRawLocal(r);
                    if (isNaN(rawPos)) return false;
                    if (hasWindow) return rawPos >= Math.min(s, e) - 5 && rawPos <= Math.max(s, e) + 5;
                    return Math.abs(rawPos - area.rawPos) <= WIN;
                }).sort((a, b) => toRawLocal(a) - toRawLocal(b));
            }

            // Construire le tableau
            const cols = [
                { key: 'temps', label: 'Temps', primary: true, special: 'temps' },
                { key: 'score', label: 'Score', primary: true, special: 'score' },
                { key: 'joueur', label: 'Joueur', idx: COLS.joueur, primary: true },
                { key: 'resultat', label: 'Résultat', idx: COLS.resultat, primary: true },
                { key: 'club', label: 'Club', idx: COLS.club, primary: true },
                { key: 'phase_att', label: 'Phase', idx: COLS.phase_att, primary: true },
                { key: 'ge', label: 'GE', idx: COLS.ge, primary: false },
                { key: 'defense_attaquee', label: 'Défense', idx: COLS.defense_attaquee, primary: false },
                { key: 'enclenchement', label: 'Enclenchement', idx: COLS.enclenchement, primary: false },
                { key: 'gardien', label: 'Gardien', idx: COLS.gardien, primary: false },
                { key: 'action_joueur', label: 'Action joueur', idx: COLS.action_joueur, primary: false, advanced: true },
                { key: 'action_att', label: 'Action ATT', idx: COLS.action_att, primary: false, advanced: true },
                { key: 'action_def', label: 'Action DEF', idx: COLS.action_def, primary: false, advanced: true },
            ];

            const thead = cols.map(c =>
                `<th class="${c.advanced ? 'col-advanced' : ''}">${c.label}</th>`
            ).join('');

            const colgroup = '';

            // En mode seqRows (lignes éparpillées), on recalcule le score exact à chaque ligne depuis matchData
            const isSeqRowsMode = !!area.seqRows;

            // Score initial avant la 1ère ligne (mode continu)
            const windowStart = rows.length ? toRawLocal(rows[0]) : 0;
            let runFen = 0, runAdv = 0;
            if (!isSeqRowsMode) {
                _md.filter(r => r[COLS.resultat] === 'But' && toRawLocal(r) < windowStart - 1)
                   .forEach(r => { if (r[COLS.club] === 'FENIX') runFen++; else runAdv++; });
            }

            const closestPos = area.rawPos;
            let prevScore = '';
            const tbody = rows.map(r => {
                const rawPos = toRawLocal(r);
                if (isSeqRowsMode) {
                    // Recalcul depuis _md pour chaque ligne (buts jusqu'à et y compris cette ligne)
                    runFen = 0; runAdv = 0;
                    _md.filter(x => x[COLS.resultat] === 'But' && toRawLocal(x) <= rawPos)
                       .forEach(x => { if (x[COLS.club] === 'FENIX') runFen++; else runAdv++; });
                } else if (r[COLS.resultat] === 'But') {
                    if (r[COLS.club] === 'FENIX') runFen++; else runAdv++;
                }
                const currentScore = `${runFen}–${runAdv}`;
                const diff = runFen - runAdv;
                const scoreColor = diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#64748b';
                // Afficher le score uniquement quand il change
                const scoreStr = currentScore !== prevScore
                    ? `<span style="font-weight:700;color:${scoreColor}">${currentScore}</span>`
                    : `<span style="color:#cbd5e1;font-size:0.7rem">·</span>`;
                prevScore = currentScore;

                const isHighlight = Math.abs(rawPos - closestPos) < 5;
                const tds = cols.map(c => {
                    // Colonne temps match
                    if (c.special === 'temps') {
                        const min = fmtMatchMin(rawPos);
                        return `<td style="font-weight:600;color:#0A2463">${min}</td>`;
                    }
                    // Colonne score
                    if (c.special === 'score') {
                        return `<td style="text-align:center">${scoreStr}</td>`;
                    }
                    let val = (r[c.idx] || '').toString().trim();
                    // Résultat : colorer
                    if (c.key === 'resultat') {
                        const color = val === 'But' ? '#16a34a' : val === 'PB' ? '#f59e0b' : val === 'Tir raté' ? '#dc2626' : '#334155';
                        val = `<span style="color:${color};font-weight:600">${val || '—'}</span>`;
                    }
                    // Club : badge abrégé
                    if (c.key === 'club') {
                        const isFenix = val === 'FENIX';
                        const bg = isFenix ? '#0A2463' : '#dc2626';
                        const abbr = isFenix ? 'FNX' : (val.slice(0, 3).toUpperCase() || '?');
                        val = `<span style="background:${bg};color:white;padding:1px 5px;border-radius:3px;font-size:0.62rem;font-weight:700;letter-spacing:0.03em">${abbr}</span>`;
                    }
                    return `<td class="${c.advanced ? 'col-advanced' : ''}">${val || '—'}</td>`;
                }).join('');
                return `<tr class="${isHighlight ? 'mc-highlight' : ''}">${tds}</tr>`;
            }).join('');

            table.innerHTML = colgroup + `<thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody>`;
            if (_mcAdvancedCols) table.closest('div').classList.add('show-advanced');
            else table.closest('div').classList.remove('show-advanced');

            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function closeMCPanel() {
            const panel = document.getElementById('mc-sequences-panel');
            if (panel) panel.style.display = 'none';
            const canvas = document.getElementById('timeline-canvas');
            if (canvas) canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function toggleMCAdvancedCols() {
            _mcAdvancedCols = !_mcAdvancedCols;
            const table = document.getElementById('mc-sequences-table');
            const btn = document.getElementById('mc-sequences-toggle');
            if (table) {
                const wrapper = table.closest('div');
                if (_mcAdvancedCols) wrapper.classList.add('show-advanced');
                else wrapper.classList.remove('show-advanced');
            }
            if (btn) btn.style.background = _mcAdvancedCols ? '#e0e7ff' : 'white';
        }

        function initTimelineTooltip() {
            const canvas = document.getElementById('timeline-canvas');
            if (!canvas) return;
            const tooltip = document.getElementById('timeline-tooltip');
            if (!tooltip) return;

            canvas.addEventListener('mousemove', function(e) {
                const rect = canvas.getBoundingClientRect();
                const mx = (e.clientX - rect.left);
                const my = (e.clientY - rect.top);

                const areas = window._timelineHitAreas || [];

                // Priorité 1 : MC et bascules (hit area rectangulaire, y en haut)
                let found = null;
                for (const area of areas) {
                    if ((area.type === 'mc' || area.type === 'bascule') &&
                        mx >= area.x - area.w / 2 && mx <= area.x + area.w / 2 &&
                        my >= area.y && my <= area.y + area.h) {
                        found = area;
                        break;
                    }
                }
                // Priorité 2 : points de score (hit area centrée sur le point)
                if (!found) {
                    for (const area of areas) {
                        if (area.type === 'score' &&
                            Math.abs(mx - area.x) <= area.w / 2 &&
                            Math.abs(my - area.y) <= area.h / 2) {
                            found = area;
                            break;
                        }
                    }
                }

                if (found) {
                    if (found.type === 'score') {
                        tooltip.innerHTML = found.text;
                        tooltip.style.background = 'rgba(15,23,42,0.9)';
                    } else if (found.type === 'mc') {
                        const color = found.positif ? '#16a34a' : '#dc2626';
                        tooltip.innerHTML = `<span style="color:${color};font-weight:700">${found.label}</span><br>${found.text}`;
                        tooltip.style.background = 'rgba(15,23,42,0.95)';
                    } else {
                        tooltip.innerHTML = `<strong style="color:#f59e0b">${found.label}</strong><br>${found.text}`;
                        tooltip.style.background = 'rgba(15,23,42,0.95)';
                    }
                    tooltip.style.display = 'block';
                    tooltip.style.left = (e.clientX + 14) + 'px';
                    tooltip.style.top = (e.clientY - 10) + 'px';
                } else {
                    tooltip.style.display = 'none';
                }
            });

            canvas.addEventListener('mouseleave', function() {
                if (tooltip) tooltip.style.display = 'none';
            });

            canvas.addEventListener('click', function(e) {
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                const areas = window._timelineHitAreas || [];
                const mc = areas.find(a =>
                    a.type === 'mc' &&
                    mx >= a.x - a.w / 2 && mx <= a.x + a.w / 2 &&
                    my >= a.y && my <= a.y + a.h
                );
                if (mc) {
                    showMCSequences(mc, window._currentMatchData);
                    return;
                }
                const bascule = areas.find(a =>
                    a.type === 'bascule' &&
                    mx >= a.x - a.w / 2 && mx <= a.x + a.w / 2 &&
                    my >= a.y && my <= a.y + a.h
                );
                if (bascule) {
                    showMCSequences(bascule, window._currentMatchData);
                    return;
                }
                // Clic ailleurs ferme le panel
                closeMCPanel();
            });
        }
