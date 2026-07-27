import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2.110.7";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return response({ error: "method_not_allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return response({ error: "authentication_required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey =
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return response({ error: "server_configuration_error" }, 500);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return response({ error: "invalid_session" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userId = userData.user.id;

  const { data: avatarFiles, error: listError } = await adminClient.storage
    .from("profile-avatars")
    .list(userId, { limit: 100 });
  if (listError && listError.message !== "Bucket not found") {
    return response({ error: "avatar_cleanup_failed" }, 500);
  }
  if (avatarFiles?.length) {
    const paths = avatarFiles.map((file) => `${userId}/${file.name}`);
    const { error: removeError } = await adminClient.storage.from("profile-avatars").remove(paths);
    if (removeError) return response({ error: "avatar_cleanup_failed" }, 500);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) return response({ error: "account_deletion_failed" }, 500);

  return response({ deleted: true });
});

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}
