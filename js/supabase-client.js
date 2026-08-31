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
