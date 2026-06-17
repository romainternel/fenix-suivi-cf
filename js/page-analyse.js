        // ===== PAGE ANALYSE =====
        let coachAnalyses = JSON.parse(localStorage.getItem('fenix_coach_analyses') || '{}');
        let chatHistory = [];

        function checkPeriodeData(matchData) {
            const total = matchData.length;
            if (total === 0) return { ok: false, withPeriode: 0, total: 0 };
            const withPeriode = matchData.filter(row => /^[12]/.test((row[COLS.periode] || '').toString().trim())).length;
            return { ok: withPeriode / total >= 0.7, withPeriode, total };
        }

        function updateAnalysePage() {
            const matchFilter = document.getElementById('filter-analyse-match').value;

            if (!matchFilter) {
                document.getElementById('analyse-content').style.display = 'none';
                document.getElementById('analyse-empty').style.display = 'block';
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
                if (!hasPeriode && matchData.length > 0) {
                    warningEl.textContent = `⚠️ Données période incomplètes (${periodeCheck.withPeriode}/${periodeCheck.total} lignes reconnues) — colonnes MT1/MT2 masquées.`;
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
            drawTimeline(matchFilter, matchData);
            findMomentsCles(matchFilter, matchData);
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

            const fenixTirsSubis = advData.filter(r => r[COLS.resultat] === 'But' || r[COLS.resultat] === 'Tir raté').length;
            const fenixArrets    = advData.filter(r => r[COLS.resultat] === 'Tir raté').length;
            const fenixGardEff   = fenixTirsSubis > 0 ? Math.round(fenixArrets / fenixTirsSubis * 100) : 0;
            const advTirsSubis   = fenixData.filter(r => r[COLS.resultat] === 'But' || r[COLS.resultat] === 'Tir raté').length;
            const advArrets      = fenixData.filter(r => r[COLS.resultat] === 'Tir raté').length;
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

        // parseTimecode, getPeriodeNum, getSortedGoals → déplacées dans utils.js

        function drawTimeline(matchName, matchData) {
            const canvas = document.getElementById('timeline-canvas');
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const sortedGoals = getSortedGoals(matchData);
            if (sortedGoals.length === 0) return;

            // Normalisation 0-60 min : MT1 → 0-30, MT2 → 30-60
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

            const padding = { top: 40, right: 30, bottom: 40, left: 45 };
            const graphWidth  = canvas.width  - padding.left - padding.right;
            const graphHeight = canvas.height - padding.top  - padding.bottom;
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
                ctx.lineTo(canvas.width - padding.right, y);
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
            ctx.fillText(fenixScore, canvas.width - padding.right - 30, padding.top - 15);
            ctx.fillStyle = '#6B7280';
            ctx.fillText('-', canvas.width - padding.right - 20, padding.top - 15);
            ctx.fillStyle = '#DC2626';
            ctx.fillText(advScore, canvas.width - padding.right, padding.top - 15);

            // Légende
            ctx.font = '12px Inter';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#0A2463';
            ctx.fillRect(padding.left, canvas.height - 18, 12, 12);
            ctx.fillStyle = '#333';
            ctx.fillText('FENIX', padding.left + 18, canvas.height - 8);
            ctx.fillStyle = '#DC2626';
            ctx.fillRect(padding.left + 80, canvas.height - 18, 12, 12);
            ctx.fillStyle = '#333';
            ctx.fillText('Adversaire', padding.left + 98, canvas.height - 8);
        }

        function findMomentsCles(matchName, matchData) {
            const actions = getSortedGoals(matchData).map(g => g.row);
            
            if (actions.length < 3) {
                document.getElementById('moments-cles').innerHTML = '<p style="color:#6B7280;font-size:0.85rem;">Pas assez de données pour identifier des séquences.</p>';
                return;
            }
            
            // Trouver les séquences
            const moments = [];
            let currentSeq = { team: null, count: 0, start: 0 };
            
            actions.forEach((action, i) => {
                const team = action[COLS.club] === 'FENIX' ? 'FENIX' : 'ADV';
                
                if (team === currentSeq.team) {
                    currentSeq.count++;
                } else {
                    if (currentSeq.count >= 3) {
                        moments.push({
                            text: currentSeq.team === 'FENIX' 
                                ? `Série de ${currentSeq.count} buts FENIX` 
                                : `${currentSeq.count} buts encaissés d'affilée`,
                            type: currentSeq.team === 'FENIX' ? 'positif' : 'negatif'
                        });
                    }
                    currentSeq = { team: team, count: 1, start: i };
                }
            });
            
            // Vérifier la dernière séquence
            if (currentSeq.count >= 3) {
                moments.push({
                    text: currentSeq.team === 'FENIX' 
                        ? `Série de ${currentSeq.count} buts FENIX` 
                        : `${currentSeq.count} buts encaissés d'affilée`,
                    type: currentSeq.team === 'FENIX' ? 'positif' : 'negatif'
                });
            }
            
            if (moments.length === 0) {
                document.getElementById('moments-cles').innerHTML = '<p style="color:#6B7280;font-size:0.85rem;">Pas de séquence marquante détectée.</p>';
                return;
            }
            
            let html = '<strong style="font-size:0.85rem;color:#333;">Moments clés :</strong> ';
            moments.forEach(m => {
                html += `<span class="moment-badge ${m.type}">${m.text}</span> `;
            });
            
            document.getElementById('moments-cles').innerHTML = html;
        }

        function saveCoachAnalyse() {
            const matchFilter = document.getElementById('filter-analyse-match').value;
            if (!matchFilter) return;
            
            const analyse = document.getElementById('coach-analyse').value;
            coachAnalyses[matchFilter] = analyse;
            localStorage.setItem('fenix_coach_analyses', JSON.stringify(coachAnalyses));
            
            const msg = document.getElementById('coach-saved-msg');
            msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 2000);
        }

        function _escapeHtml(str) {
            return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        function sendChatMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            if (!message) return;

            const matchFilter = document.getElementById('filter-analyse-match').value;
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

            let rows = '';
            statsDef.forEach(stat => {
                const avgs = {};
                colHeaders.forEach(col => { avgs[col.key] = avg(groups[col.key], stat.key); });

                let sigV = '', sigD = '';
                if (avgs.V !== null && avgs.D !== null) {
                    const base    = (avgs.V + avgs.D) / 2;
                    const relDiff = base > 0 ? Math.abs(avgs.V - avgs.D) / base : 0;
                    const vBetter = stat.higherBetter ? avgs.V > avgs.D : avgs.V < avgs.D;
                    if (relDiff >= 0.15) {
                        sigV = vBetter ? ' 🔑' : ' ⚠️';
                        sigD = vBetter ? ' ⚠️' : ' 🔑';
                    } else if (relDiff >= 0.07) {
                        sigV = vBetter ? ' ↑' : ' ↓';
                        sigD = vBetter ? ' ↓' : ' ↑';
                    }
                }

                let cells = `<td class="corr-label">${stat.label}</td>`;
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
