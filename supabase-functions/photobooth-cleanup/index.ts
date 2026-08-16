import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let deleted = 0;
  let failed = 0;

  // Procesar hasta 500 expiradas por ejecución, en lotes de 100.
  for (let batch = 0; batch < 5; batch++) {
    const { data: expired, error } = await supabase
      .from("photobooth_photos")
      .select("access_token,path")
      .lte("expires_at", new Date().toISOString())
      .limit(100);

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message, deleted, failed }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!expired || expired.length === 0) break;

    const paths = expired.map((row) => row.path);
    const tokens = expired.map((row) => row.access_token);

    const { error: removeError } = await supabase.storage
      .from("photobooth")
      .remove(paths);

    if (removeError) {
      console.error(removeError);
      failed += expired.length;
      break;
    }

    const { error: deleteRowsError } = await supabase
      .from("photobooth_photos")
      .delete()
      .in("access_token", tokens);

    if (deleteRowsError) {
      console.error(deleteRowsError);
      failed += expired.length;
      break;
    }

    deleted += expired.length;

    if (expired.length < 100) break;
  }

  return new Response(JSON.stringify({ ok: true, deleted, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
