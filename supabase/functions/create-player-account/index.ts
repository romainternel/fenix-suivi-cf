// FENIX Stats CF — Edge Function : création d'un compte joueur (STORY-20)
// Reçoit { nom, motDePasse } depuis l'app (appelée avec la clé publishable),
// crée le compte via Supabase Auth (clé service_role, jamais côté client — §1.2bis)
// puis la ligne player_profiles correspondante.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toInternalEmail(nom: string): string {
  const normalise = nom
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, ""); // ne garde que lettres/chiffres/points
  return `${normalise}@fenix.local`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nom, motDePasse } = await req.json();
    if (!nom || !motDePasse) {
      return new Response(JSON.stringify({ error: "nom et motDePasse requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const email = toInternalEmail(nom);

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: motDePasse,
      email_confirm: true,
    });
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: joueurRow } = await admin
      .from("joueurs")
      .select("poste")
      .eq("nom", nom)
      .maybeSingle();

    const { error: profileError } = await admin.from("player_profiles").insert({
      user_id: authData.user.id,
      nom,
      poste: joueurRow?.poste ?? null,
    });
    if (profileError) {
      // Compte Auth créé mais profil non lié : on annule pour ne pas laisser un compte orphelin
      await admin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, userId: authData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
