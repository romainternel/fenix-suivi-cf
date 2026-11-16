// Page "Face à Face" (v321, étendue v323) — comparatif par match, inspiré de la mise en page d'un
// artefact externe (U21 FRANCE). Le comptage réutilise les règles déjà établies ailleurs dans l'app
// (finalite pour le détail Arrêts/Échecs, tag Possession pour dédoublonner un sous-événement de
// séquence) — rien de nouveau n'est inventé, seule la mise en forme est nouvelle. Confirmé avec
// Romain (2026-11-16) :
// - le dispositif défensif attaqué vient de `defense_attaquee` (rempli des deux côtés, contrairement à
//   `articulation_def` qui ne l'est que côté défense FENIX) ;
// - "Jeu rapide" = phase_att CA/ER/Transition-Mdb ; "Penalty" = phase_att Pen ; tout le reste
//   (Att al/Att ét/+/-) = Attaque placée. Les 3 onglets (Général/Face à Face/Comparatif) et leurs
//   formules exactes ont été relus directement dans le code source de l'artefact de référence
//   (fonctions agg()/recap()/duel()) le 2026-11-16, pas devinés depuis des captures d'écran.

const FA_DISPO_LIST = ['0-6', '1-5', '6vs5', '5vs6'];
const FA_DISPO_LABEL = { '0-6': '0-6', '1-5': '1-5', '6vs5': '6 v 5', '5vs6': '5 v 6' };
const FA_JEURAPIDE_PHASES = ['CA', 'ER', 'Transition/Mdb'];
const FA_PENALTY_PHASE = 'Pen';
const FA_SHOT_CATS = new Set(['but', 'arret', 'echec']);
const FA_MODES = [['gen', 'Général'], ['face', 'Face à Face'], ['comp', 'Comparatif']];
const FA_MODE_DESC = {
    gen: "Général : chaque statistique, équipe contre équipe, sur la totalité de la période affichée (barres proportionnelles à la plus grande des deux valeurs).",
    face: "Face à Face : la répartition détaillée de l'attaque de chaque équipe, par dispositif défensif adverse.",
    comp: "Comparatif : la même phase de jeu des deux côtés (attaque / attaque, défense / défense...). Chaque % se lit sur ses propres possessions.",
};

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

function _faMerge(...rows) {
    const out = _faCountsRow();
    rows.forEach(r => { Object.keys(out).forEach(k => { out[k] += r[k]; }); });
    return out;
}

// Règle de possession déjà établie (_articAttBaseCounts, computeSuperiorites, v285/v311) : un tir
// (but/arret/echec) compte toujours ; un sous-événement (po/pb/jf/deuxmin) n'est compté que s'il porte
// le tag Possession, pour ne pas dédoubler une séquence qui s'étale sur plusieurs lignes.
//
// 3 compartiments mutuellement exclusifs : attaquePlacee (ni Jeu rapide, ni Penalty) / penalty
// (phase_att = Pen) / jeurapide. `attaque` = attaquePlacee + penalty fusionnés, et `parDispositif` est
// calculé sur ces mêmes lignes — c'est la répartition déjà affichée par l'onglet Face à Face (v321),
// inchangée par cet ajout.
function _faCounts(matchData, isFenix) {
    const rows = matchData.filter(r => (r[COLS.club] === 'FENIX') === isFenix);
    const attaquePlacee = _faCountsRow();
    const penalty = _faCountsRow();
    const jeurapide = _faCountsRow();
    const parDispositif = {};
    FA_DISPO_LIST.forEach(d => { parDispositif[d] = _faCountsRow(); });

    rows.forEach(r => {
        const cat = _faCat(r);
        if (!cat) return;
        const countsAsPoss = FA_SHOT_CATS.has(cat) || !!(r[COLS.possession] || '').toString().trim();
        // Un jet franc n'est jamais le point terminal d'une possession dans la convention de saisie de
        // Romain (la possession continue toujours après) : il ne porte donc jamais le tag Possession,
        // et la règle de dédoublonnage ci-dessus l'excluait entièrement du total — sous-comptage à 0
        // constaté sur la carte "Jets francs subis" (retour Romain, v325/v326). On le compte quand même
        // dans sa propre case (sans l'ajouter à `poss`, qui reste le nombre de possessions réellement
        // terminées), pour qu'il apparaisse comme un évènement à part entière partout où `jf` est lu.
        if (!countsAsPoss && cat !== 'jf') return;

        const phase = (r[COLS.phase_att] || '').toString().trim();
        const bucket = FA_JEURAPIDE_PHASES.includes(phase) ? jeurapide : (phase === FA_PENALTY_PHASE ? penalty : attaquePlacee);
        if (countsAsPoss) bucket.poss++;
        bucket[cat]++;
        if (bucket !== jeurapide) {
            const d = _faNormDispositif(r[COLS.defense_attaquee]);
            if (d) {
                if (countsAsPoss) parDispositif[d].poss++;
                parDispositif[d][cat]++;
            }
        }
    });

    const attaque = _faMerge(attaquePlacee, penalty);
    const total = _faMerge(attaque, jeurapide);
    return { attaquePlacee, penalty, attaque, parDispositif, jeurapide, total };
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
function _faComplement(row) {
    const e = _faEff(row);
    return e === null ? null : 100 - e;
}

// Réussite au tir = buts / (buts + arrêts + échecs), penalties compris dans le total — formule propre
// à cette statistique (différente de (buts+PO)/possessions utilisée partout ailleurs), lue dans
// l'artefact de référence.
function _faTirEff(row) {
    const tirs = row.but + row.arret + row.echec;
    return tirs > 0 ? Math.round(row.but / tirs * 100) : null;
}
function _faTirCaption(row) {
    const tirs = row.but + row.arret + row.echec;
    const echecs = tirs - row.but;
    return `${row.but} / ${tirs} · ${echecs} échec${echecs > 1 ? 's' : ''} dont ${row.echec} hors cadre`;
}

// Réussite gardien = arrêts / (arrêts + buts encaissés), sur les tirs cadrés uniquement (les tirs hors
// cadre ne sont pas comptés comme une opportunité pour le gardien) — lue dans l'artefact de référence.
function _faGkPct(row) {
    const n = row.arret + row.but;
    return n > 0 ? Math.round(row.arret / n * 100) : null;
}

function _fa65Caption(row) {
    if (!row.poss) return 'Aucune possession en 6 v 5';
    const tirs = row.arret + row.echec;
    return `${row.but} but${row.but > 1 ? 's' : ''} · ${row.po} PO · ${row.pb} PB · ${tirs} tir${tirs > 1 ? 's' : ''} raté${tirs > 1 ? 's' : ''} sur ${row.poss} possession${row.poss > 1 ? 's' : ''}`;
}
function _faAttCaption(row) {
    return `${row.but} but${row.but > 1 ? 's' : ''} + ${row.po} PO obtenu${row.po > 1 ? 's' : ''} sur ${row.poss} possession${row.poss > 1 ? 's' : ''}`;
}
function _faDefCaption(row) {
    return `${row.pb} perte${row.pb > 1 ? 's' : ''} de balle + ${row.arret} arrêt${row.arret > 1 ? 's' : ''} GB + ${row.echec} échec${row.echec > 1 ? 's' : ''} tir sur ${row.poss} possession${row.poss > 1 ? 's' : ''}`;
}

// Répartition en 3 parts (ex. Buts : Attaque placée/Jeu rapide/Penalty) avec arrondi "au plus grand
// reste" pour que les % affichés somment toujours exactement à 100.
function _faLargestRemainderPct(parts) {
    const tot = parts.reduce((a, b) => a + b, 0);
    if (!tot) return parts.map(() => 0);
    const base = parts.map(v => Math.floor(v / tot * 100));
    let rest = 100 - base.reduce((a, b) => a + b, 0);
    const order = parts.map((v, i) => [i, (v / tot * 100) - base[i]]).sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < rest; i++) base[order[i][0]]++;
    return base;
}

// Couleurs des 3 segments définies en CSS (`.fa-bd-fenix`/`.fa-bd-adv` × `.fa-bd-seg-1/2/3`), pas en
// inline-style, pour que le thème sombre les recolore sans que le premier segment (navy FENIX) devienne
// illisible sur un fond déjà sombre.
function _faBreakdownBar(labels, values, pcts, side, alignRight) {
    const tot = values.reduce((a, b) => a + b, 0);
    const segs = values.map((v, i) => v ? `<span class="fa-bd-seg-${i + 1}" style="width:${tot ? v / tot * 100 : 0}%"></span>` : '').join('');
    const lines = labels.map((lab, i) => `<div class="fa-breakdown-line"${alignRight ? ' style="text-align:right"' : ''}><i class="fa-bd-seg-${i + 1}"></i>${_escapeHtml(lab)} : ${values[i]} · ${pcts[i]} %</div>`).join('');
    return `<div class="fa-breakdown fa-bd-${side}"><div class="fa-breakdown-bar">${segs}</div>${lines}</div>`;
}

// Carte générique "duel" (deux côtés + barre miroir centrée), réutilisée par les 3 onglets. isPct=true
// borne la barre à 100 (chaque % se lit directement) ; sinon la barre est proportionnelle à la plus
// grande des deux valeurs.
function _faDuelCard(o) {
    const lv = o.leftVal, rv = o.rightVal;
    const mx = o.isPct ? 100 : Math.max(lv || 0, rv || 0, 1);
    const lp = lv == null ? 0 : (lv / mx * 100);
    const rp = rv == null ? 0 : (rv / mx * 100);
    let gap = '';
    if (lv != null && rv != null) {
        const diff = lv - rv;
        if (diff === 0) gap = 'Égalité';
        else gap = (diff > 0 ? 'FENIX' : _escapeHtml(o.advLabel)) + ' +' + Math.abs(diff) + (o.isPct ? ' pts' : '');
    }
    const fmt = v => (v == null ? '—' : (o.isPct ? v + ' %' : v));
    return `
        <div class="fa-duelcard">
            <div class="fa-duel-side fa-duel-l">
                <div class="fa-duel-label">FENIX</div>
                <div class="fa-duel-val">${fmt(lv)}</div>
                ${o.leftCaption ? `<div class="fa-duel-caption">${o.leftCaption}</div>` : ''}
                ${o.leftExtra || ''}
            </div>
            <div class="fa-duel-mid">
                <div class="fa-duel-title">${_escapeHtml(o.title)}</div>
                ${o.sub ? `<div class="fa-duel-sub">${_escapeHtml(o.sub)}</div>` : ''}
                <div class="fa-duel-bar">
                    <div class="fa-duel-bar-half fa-duel-bar-l"><span style="width:${lp}%"></span></div>
                    <div class="fa-duel-bar-half fa-duel-bar-r"><span style="width:${rp}%"></span></div>
                </div>
                ${gap ? `<div class="fa-duel-gap">${gap}</div>` : ''}
            </div>
            <div class="fa-duel-side fa-duel-r">
                <div class="fa-duel-label">${_escapeHtml(o.advLabel)}</div>
                <div class="fa-duel-val">${fmt(rv)}</div>
                ${o.rightCaption ? `<div class="fa-duel-caption">${o.rightCaption}</div>` : ''}
                ${o.rightExtra || ''}
            </div>
        </div>`;
}

function _faGeneralHtml(fenixStats, advStats, advLabel) {
    const cards = [];
    cards.push(_faDuelCard({
        title: "Possessions d'attaque", sub: 'possessions terminées', isPct: false, advLabel,
        leftVal: fenixStats.total.poss, rightVal: advStats.total.poss,
    }));

    const fPen = fenixStats.penalty, aPen = advStats.penalty;
    const fBreakVals = [fenixStats.attaquePlacee.but, fenixStats.jeurapide.but, fPen.but];
    const aBreakVals = [advStats.attaquePlacee.but, advStats.jeurapide.but, aPen.but];
    const labels = ['Attaque placée', 'Jeu rapide', 'Penalty'];
    cards.push(_faDuelCard({
        title: 'Buts', isPct: false, advLabel,
        leftVal: fenixStats.total.but, rightVal: advStats.total.but,
        leftCaption: `dont ${fPen.but}/${fPen.poss} penalty`, rightCaption: `dont ${aPen.but}/${aPen.poss} penalty`,
        leftExtra: _faBreakdownBar(labels, fBreakVals, _faLargestRemainderPct(fBreakVals), 'fenix', false),
        rightExtra: _faBreakdownBar(labels, aBreakVals, _faLargestRemainderPct(aBreakVals), 'adv', true),
    }));

    cards.push(_faDuelCard({
        title: 'Réussite au tir', sub: 'buts / tirs, penalties compris', isPct: true, advLabel,
        leftVal: _faTirEff(fenixStats.total), rightVal: _faTirEff(advStats.total),
        leftCaption: _faTirCaption(fenixStats.total), rightCaption: _faTirCaption(advStats.total),
    }));

    const f65 = fenixStats.parDispositif['6vs5'], a65 = advStats.parDispositif['6vs5'];
    cards.push(_faDuelCard({
        title: '6 contre 5', sub: 'réussite = (buts + PO) / possessions', isPct: true, advLabel,
        leftVal: _faEff(f65), rightVal: _faEff(a65),
        leftCaption: _fa65Caption(f65), rightCaption: _fa65Caption(a65),
    }));

    cards.push(_faDuelCard({
        title: 'Pertes de balle', sub: 'en attaque', isPct: false, advLabel,
        leftVal: fenixStats.total.pb, rightVal: advStats.total.pb,
    }));

    cards.push(_faDuelCard({
        title: 'Jets francs subis', isPct: false, advLabel,
        leftVal: fenixStats.total.jf, rightVal: advStats.total.jf,
    }));

    cards.push(_faDuelCard({
        title: 'Réussite gardien', sub: 'arrêts / tirs cadrés, penalties compris', isPct: true, advLabel,
        leftVal: _faGkPct(advStats.total), rightVal: _faGkPct(fenixStats.total),
        leftCaption: `${advStats.total.arret} / ${advStats.total.arret + advStats.total.but}`,
        rightCaption: `${fenixStats.total.arret} / ${fenixStats.total.arret + fenixStats.total.but}`,
    }));

    return `<div class="fa-duels">${cards.join('')}</div>`;
}

function _faComparatifHtml(fenixStats, advStats, advLabel) {
    const fAttJR = _faMerge(fenixStats.attaquePlacee, fenixStats.jeurapide);
    const aAttJR = _faMerge(advStats.attaquePlacee, advStats.jeurapide);
    const cards = [];

    cards.push(_faDuelCard({
        title: 'Attaque (total)', sub: 'attaque + jeu rapide, hors penalty', isPct: true, advLabel,
        leftVal: _faEff(fAttJR), rightVal: _faEff(aAttJR),
        leftCaption: _faAttCaption(fAttJR), rightCaption: _faAttCaption(aAttJR),
    }));
    cards.push(_faDuelCard({
        title: 'Défense (total)', sub: 'défense + repli, hors penalty', isPct: true, advLabel,
        leftVal: _faComplement(aAttJR), rightVal: _faComplement(fAttJR),
        leftCaption: _faDefCaption(aAttJR), rightCaption: _faDefCaption(fAttJR),
    }));
    cards.push(_faDuelCard({
        title: 'Attaque / Attaque', sub: 'attaque placée uniquement', isPct: true, advLabel,
        leftVal: _faEff(fenixStats.attaquePlacee), rightVal: _faEff(advStats.attaquePlacee),
        leftCaption: _faAttCaption(fenixStats.attaquePlacee), rightCaption: _faAttCaption(advStats.attaquePlacee),
    }));
    cards.push(_faDuelCard({
        title: 'Défense / Défense', sub: 'défense placée uniquement', isPct: true, advLabel,
        leftVal: _faComplement(advStats.attaquePlacee), rightVal: _faComplement(fenixStats.attaquePlacee),
        leftCaption: _faDefCaption(advStats.attaquePlacee), rightCaption: _faDefCaption(fenixStats.attaquePlacee),
    }));
    cards.push(_faDuelCard({
        title: 'Jeu rapide / Jeu rapide', isPct: true, advLabel,
        leftVal: _faEff(fenixStats.jeurapide), rightVal: _faEff(advStats.jeurapide),
        leftCaption: _faAttCaption(fenixStats.jeurapide), rightCaption: _faAttCaption(advStats.jeurapide),
    }));
    cards.push(_faDuelCard({
        title: 'Repli / Repli', isPct: true, advLabel,
        leftVal: _faComplement(advStats.jeurapide), rightVal: _faComplement(fenixStats.jeurapide),
        leftCaption: _faDefCaption(advStats.jeurapide), rightCaption: _faDefCaption(fenixStats.jeurapide),
    }));
    const f65 = fenixStats.parDispositif['6vs5'], a65 = advStats.parDispositif['6vs5'];
    cards.push(_faDuelCard({
        title: '6 contre 5', isPct: true, advLabel,
        leftVal: _faEff(f65), rightVal: _faEff(a65),
        leftCaption: _fa65Caption(f65), rightCaption: _fa65Caption(a65),
    }));

    return `<div class="fa-duels">${cards.join('')}</div>`;
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

function _faFaceHtml(fenixStats, advStats, advLabel) {
    return `
        <div class="fa-scoreboard">
            <div class="fa-score-card fa-fenix"><span class="fa-score-name">FENIX</span><span class="fa-score-val">${fenixStats.total.but}</span></div>
            <div class="fa-score-card fa-adv"><span class="fa-score-name">${_escapeHtml(advLabel)}</span><span class="fa-score-val">${advStats.total.but}</span></div>
        </div>
        <div class="fa-tables">
            <div class="fa-table-card fa-fenix">${_faTableHtml('FENIX', advLabel, fenixStats)}</div>
            <div class="fa-table-card fa-adv">${_faTableHtml(advLabel, 'FENIX', advStats)}</div>
        </div>`;
}

function _faSubnavHtml() {
    const mode = window._faMode || 'gen';
    const btns = FA_MODES.map(([key, label]) => `<button class="enc-pie-mode-btn${mode === key ? ' active' : ''}" onclick="_setFaMode('${key}')">${_escapeHtml(label)}</button>`).join('');
    return `<div class="fa-subnav">${btns}</div><p class="fa-mode-desc">${_escapeHtml(FA_MODE_DESC[mode])}</p>`;
}

function _setFaMode(mode) {
    window._faMode = mode;
    updateFaceAFacePage();
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

    const mode = window._faMode || 'gen';
    const body = mode === 'gen' ? _faGeneralHtml(fenixStats, advStats, advLabel)
        : mode === 'comp' ? _faComparatifHtml(fenixStats, advStats, advLabel)
        : _faFaceHtml(fenixStats, advStats, advLabel);

    content.innerHTML = _faSubnavHtml() + body;
}
