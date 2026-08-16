import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: photo, error } = await supabase
    .from("photobooth_photos")
    .select("path, expires_at")
    .eq("access_token", token)
    .maybeSingle();

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!photo) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expiresAt = new Date(photo.expires_at);
  if (expiresAt.getTime() <= Date.now()) {
    return new Response(JSON.stringify({ error: "Expired" }), {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // URL corta: cada vez que el invitado abre booth.html se genera otra.
  const secondsRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  const signedFor = Math.max(60, Math.min(600, secondsRemaining));

  const { data, error: signError } = await supabase.storage
    .from("photobooth")
    .createSignedUrl(photo.path, signedFor);

  if (signError || !data?.signedUrl) {
    console.error(signError);
    return new Response(JSON.stringify({ error: "Could not sign URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    signedUrl: data.signedUrl,
    expiresAt: photo.expires_at,
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
});
