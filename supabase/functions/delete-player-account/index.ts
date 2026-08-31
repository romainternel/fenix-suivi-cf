// FENIX Stats CF — Edge Function : suppression d'un compte joueur (STORY-24)
// Reçoit { nom } depuis l'app (appelée avec la clé publishable), supprime la ligne
// player_profiles PUIS le compte Supabase Auth (clé service_role, jamais côté client).
// Ordre important : player_profiles.user_id référence auth.users(id) sans cascade,
// supprimer auth.users en premier violerait la contrainte de clé étrangère.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nom } = await req.json();
    if (!nom) {
      return new Response(JSON.stringify({ error: "nom requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: findError } = await admin
      .from("player_profiles")
      .select("user_id")
      .eq("nom", nom)
      .maybeSingle();
    if (findError) {
      return new Response(JSON.stringify({ error: findError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!profile) {
      return new Response(JSON.stringify({ error: "Aucun compte trouvé pour ce joueur" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: deleteProfileError } = await admin
      .from("player_profiles")
      .delete()
      .eq("user_id", profile.user_id);
    if (deleteProfileError) {
      return new Response(JSON.stringify({ error: deleteProfileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(profile.user_id);
    if (deleteUserError) {
      return new Response(JSON.stringify({ error: deleteUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
