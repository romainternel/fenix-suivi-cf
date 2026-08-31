// FENIX Stats CF — Client Supabase (STORY-20)
// Réf. docs/arch/migration-supabase.md §1.1
// Clé "publishable" : conçue pour être publique (protection réelle = policies RLS côté base), pas un secret.

const SUPABASE_URL = 'https://oamldfduxwsghrxdsaxy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_j0_GH_oE27RqVqq4PMZk3g_D-waLx7f';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fetchAll(table) {
    const { data, error } = await supabaseClient.from(table).select('*');
    if (error) throw error;
    return data;
}

// Tables issues de l'Excel, remplacées intégralement à chaque import (STORY-21).
// Clé auto-générée (id) : insertion avant suppression, aucun risque de collision.
// Clé naturelle (ex. "nom") : un nouvel import peut réutiliser les mêmes valeurs de clé,
// impossible d'insérer avant de supprimer sans provoquer un conflit — fenêtre de suppression
// brève acceptée (accès mono-utilisateur, cf. docs/arch/migration-supabase.md §1.4).
const TABLE_PK = { match_data: 'id', tableau_match: 'id', bilan: 'id', joueurs: 'nom' };

async function replaceTable(table, rows) {
    const pk = TABLE_PK[table];
    if (!pk) throw new Error(`replaceTable: table "${table}" non prise en charge`);

    if (pk === 'id') {
        const { data: oldRows, error: oldErr } = await supabaseClient.from(table).select('id');
        if (oldErr) throw oldErr;
        const oldIds = (oldRows || []).map(r => r.id);
        if (rows.length) {
            const { error: insertErr } = await supabaseClient.from(table).insert(rows);
            if (insertErr) throw insertErr;
        }
        if (oldIds.length) {
            const { error: deleteErr } = await supabaseClient.from(table).delete().in('id', oldIds);
            if (deleteErr) throw deleteErr;
        }
    } else {
        const { error: deleteErr } = await supabaseClient.from(table).delete().neq(pk, '__jamais_egal__');
        if (deleteErr) throw deleteErr;
        if (rows.length) {
            const { error: insertErr } = await supabaseClient.from(table).insert(rows);
            if (insertErr) throw insertErr;
        }
    }
}

async function upsertRows(table, rows) {
    if (!rows.length) return;
    const { error } = await supabaseClient.from(table).upsert(rows);
    if (error) throw error;
}

// Lecture de la feuille DATA par nom d'en-tête (STORY-21) — résilient à un réordonnancement
// des colonnes dans l'Excel, contrairement à COLS (mapping positionnel utilisé par le reste
// de l'app tant que STORY-22 n'est pas livrée). Réf. docs/arch/migration-supabase.md §1.3.
function _normaliseHeader(h) {
    return (h || '').toString()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

const DATA_HEADER_TO_COLUMN = {
    position: 'position',
    rencontre: 'rencontre',
    club: 'club',
    phaseatt: 'phase_att',
    ge: 'ge',
    defenseattaquee: 'defense_attaquee',
    resultat: 'resultat',
    joueurs: 'joueur', // en-tête Excel "Joueurs" (pluriel) -> colonne "joueur" (singulier)
    finalite: 'finalite',
    enclenchement: 'enclenchement',
    gardien: 'gardien',
    positiontir: 'position_tir',
    fieldposition: 'field_position',
    periode: 'periode',
    possession: 'possession',
    positionterrain: 'position_terrain',
    actionjoueur: 'action_joueur',
    actionatt: 'action_att',
    actiondef: 'action_def',
    impact: 'impact',
    saison: 'saison',
    intentionattaque: 'intention_attaque',
};

// STORY-22, mitigation risque P0 R1 — reconstruit le tableau positionnel DATA depuis les lignes
// nommées reçues de Supabase, dans l'ordre EXACT attendu par COLS (FENIX-HANDBALL-CF-SUIVI.html).
// Ne JAMAIS dériver cet ordre depuis les clés d'un objet JS (Object.values(DATA_HEADER_TO_COLUMN)
// par ex.) — l'ordre d'un objet littéral est trop fragile pour le point le plus critique de toute
// la migration (une réorganisation du fichier casserait cet ordre sans aucune erreur visible).
// Toujours une liste explicite, à faire correspondre manuellement à COLS si celui-ci change un jour.
const MATCH_DATA_COLUMN_ORDER = [
    'position', 'rencontre', 'club', 'phase_att', 'ge', 'defense_attaquee',
    'resultat', 'joueur', 'finalite', 'enclenchement', 'gardien',
    'position_tir', 'field_position', 'periode', 'possession',
    'position_terrain', 'action_joueur', 'action_att', 'action_def', 'impact',
    'saison', 'intention_attaque',
];

function rowToPositionalArray(row) {
    return MATCH_DATA_COLUMN_ORDER.map(col => row[col]);
}

function buildMatchDataRows(jsonData) {
    const headerRow = jsonData[0] || [];
    const idxToColumn = headerRow.map(h => DATA_HEADER_TO_COLUMN[_normaliseHeader(h)] || null);
    const rencontreIdx = idxToColumn.indexOf('rencontre');
    if (rencontreIdx < 0) throw new Error('Colonne "Rencontre" introuvable dans la feuille DATA');

    return jsonData.slice(1)
        .filter(row => row.length > 0 && row[rencontreIdx])
        .map(row => {
            const obj = {};
            idxToColumn.forEach((col, i) => {
                if (!col) return;
                const val = row[i];
                obj[col] = (val === undefined || val === null || val === '') ? null : val.toString();
            });
            return obj;
        });
}
