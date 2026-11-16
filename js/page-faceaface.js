// Page "Face à Face" (v321) — comparatif par match, inspiré de la mise en page de l'artefact
// U21 FRANCE (cartes FENIX/adversaire + tableau de répartition de l'attaque). Le comptage réutilise
// les règles déjà établies ailleurs dans l'app (finalite pour le détail Arrêts/Échecs, tag Possession
// pour dédoublonner un sous-événement de séquence) — rien de nouveau n'est inventé, seule la mise en
// forme est nouvelle. Confirmé avec Romain (2026-11-16) :
// - le dispositif défensif attaqué vient de `defense_attaquee` (rempli des deux côtés, contrairement à
//   `articulation_def` qui ne l'est que côté défense FENIX) ;
// - "Jeu rapide" = phase_att CA/ER/Transition-Mdb ; tout le reste (Att al/Att ét/Pen/+/-) = Attaque placée.

const FA_DISPO_LIST = ['0-6', '1-5', '6vs5', '5vs6'];
const FA_DISPO_LABEL = { '0-6': '0-6', '1-5': '1-5', '6vs5': '6 v 5', '5vs6': '5 v 6' };
const FA_JEURAPIDE_PHASES = ['CA', 'ER', 'Transition/Mdb'];
const FA_SHOT_CATS = new Set(['but', 'arret', 'echec']);

// "PF" vu en base est une variante orthographique de "PB" (CLAUDE.md §5) ; "2' obt" et "Jet franc"
// gardés comme catégories à part entière (pas montrés dans l'artefact de référence, mais on ne veut
// rien fusionner ni perdre par rapport au comptage réel de l'appli).
function _faCat(r) {
    const f = (r[COLS.finalite] || '').toString().trim();
    if (f === 'But') return 'but';
    if (f === 'PO') return 'po';
    if (f === 'PB' || f === 'PF') return 'pb';
    if (f === 'Jet franc') return 'jf';
    if (f === "2' obt") return 'deuxmin';
    if (f === 'Tir arrêté') return 'arret';
    if (f === 'Tir non cadré' || f === 'Tir contré' || f === 'Poteau') return 'echec';
    return null;
}

function _faNormDispositif(raw) {
    const v = (raw || '').toString().trim().toLowerCase();
    return FA_DISPO_LIST.includes(v) ? v : null;
}

function _faCountsRow() {
    return { poss: 0, but: 0, po: 0, pb: 0, jf: 0, deuxmin: 0, arret: 0, echec: 0 };
}

// Règle de possession déjà établie (_articAttBaseCounts, computeSuperiorites, v285/v311) : un tir
// (but/arret/echec) compte toujours ; un sous-événement (po/pb/jf/deuxmin) n'est compté que s'il porte
// le tag Possession, pour ne pas dédoubler une séquence qui s'étale sur plusieurs lignes.
function _faCounts(matchData, isFenix) {
    const rows = matchData.filter(r => (r[COLS.club] === 'FENIX') === isFenix);
    const attaque = _faCountsRow();
    const jeurapide = _faCountsRow();
    const parDispositif = {};
    FA_DISPO_LIST.forEach(d => { parDispositif[d] = _faCountsRow(); });

    rows.forEach(r => {
        const cat = _faCat(r);
        if (!cat) return;
        if (!FA_SHOT_CATS.has(cat) && !(r[COLS.possession] || '').toString().trim()) return;

        const phase = (r[COLS.phase_att] || '').toString().trim();
        const bucket = FA_JEURAPIDE_PHASES.includes(phase) ? jeurapide : attaque;
        bucket.poss++;
        bucket[cat]++;
        if (bucket === attaque) {
            const d = _faNormDispositif(r[COLS.defense_attaquee]);
            if (d) { parDispositif[d].poss++; parDispositif[d][cat]++; }
        }
    });

    const total = _faCountsRow();
    Object.keys(total).forEach(k => { total[k] = attaque[k] + jeurapide[k]; });
    return { attaque, parDispositif, jeurapide, total };
}

// Réussite = (buts + PO) / possessions — formule déjà utilisée par computeArticulationStats (mode
// Articulation défensive) pour ce même ratio, reprise ici telle quelle.
function _faEff(row) {
    return row.poss > 0 ? Math.round((row.but + row.po) / row.poss * 100) : null;
}
function _faEffLabel(row) {
    const e = _faEff(row);
    return e === null ? '—' : e + '%';
}
// La réussite défensive du camp en face, sur ce même lot de séquences, est le complément exact de la
// réussite offensive (vérifié sur l'artefact de référence : les deux colonnes somment toujours à 100).
function _faEffDefLabel(row) {
    const e = _faEff(row);
    return e === null ? '—' : (100 - e) + '%';
}

function _faTableRows(stats) {
    const rows = [{ label: 'Attaque', cls: 'fa-sub', data: stats.attaque }];
    FA_DISPO_LIST.forEach(d => {
        const data = stats.parDispositif[d];
        if (data.poss > 0) rows.push({ label: FA_DISPO_LABEL[d], cls: 'fa-dispo', data });
    });
    rows.push({ label: 'Jeu rapide', cls: 'fa-sub', data: stats.jeurapide });
    rows.push({ label: 'Total', cls: 'fa-total', data: stats.total });
    return rows;
}

function _faTableHtml(clubLabel, advLabel, stats) {
    const rowsHtml = _faTableRows(stats).map(r => `
        <tr class="${r.cls}">
            <td class="fa-rowlabel">${_escapeHtml(r.label)}</td>
            <td>${r.data.poss}</td>
            <td>${r.data.but}</td>
            <td>${r.data.po}</td>
            <td>${r.data.pb}</td>
            <td title="Jet franc">${r.data.jf}</td>
            <td title="2' obtenu">${r.data.deuxmin}</td>
            <td>${r.data.arret}</td>
            <td>${r.data.echec}</td>
            <td class="fa-eff">${_faEffLabel(r.data)}</td>
            <td class="fa-eff fa-eff-adv">${_faEffDefLabel(r.data)}</td>
        </tr>`).join('');
    return `
        <div class="fa-table-title">QUAND ${_escapeHtml(clubLabel.toUpperCase())} ATTAQUE</div>
        <div class="fa-table-scroll">
            <table class="fa-table">
                <thead><tr>
                    <th></th><th>Poss.</th><th>Buts</th><th>PO</th><th>PB</th>
                    <th title="Jet franc">JF</th><th title="2' obtenu">2'</th>
                    <th>Arrêts</th><th>Échecs</th>
                    <th>Réuss.<br>${_escapeHtml(clubLabel)} att.</th>
                    <th>Réuss.<br>${_escapeHtml(advLabel)} déf.</th>
                </tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>`;
}

function updateFaceAFacePage() {
    const matchFilterEl = document.getElementById('filter-match-global');
    const empty = document.getElementById('faceaface-empty');
    const content = document.getElementById('faceaface-content');
    if (!matchFilterEl || !empty || !content) return;
    const matchFilter = matchFilterEl.value;

    if (!matchFilter || typeof DATA === 'undefined' || !DATA.length) {
        empty.style.display = 'block';
        content.style.display = 'none';
        content.innerHTML = '';
        return;
    }

    const matchData = DATA.filter(r => r[COLS.rencontre] === matchFilter);
    if (!matchData.length) {
        empty.style.display = 'block';
        empty.textContent = 'Aucune donnée pour ce match.';
        content.style.display = 'none';
        content.innerHTML = '';
        return;
    }
    empty.style.display = 'none';
    content.style.display = 'block';

    const advRow = matchData.find(r => r[COLS.club] !== 'FENIX');
    const advLabel = advRow ? advRow[COLS.club] : 'Adversaire';
    const fenixStats = _faCounts(matchData, true);
    const advStats = _faCounts(matchData, false);

    content.innerHTML = `
        <div class="fa-scoreboard">
            <div class="fa-score-card fa-fenix"><span class="fa-score-name">FENIX</span><span class="fa-score-val">${fenixStats.total.but}</span></div>
            <div class="fa-score-card fa-adv"><span class="fa-score-name">${_escapeHtml(advLabel)}</span><span class="fa-score-val">${advStats.total.but}</span></div>
        </div>
        <div class="fa-tables">
            <div class="fa-table-card fa-fenix">${_faTableHtml('FENIX', advLabel, fenixStats)}</div>
            <div class="fa-table-card fa-adv">${_faTableHtml(advLabel, 'FENIX', advStats)}</div>
        </div>`;
}
