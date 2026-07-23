import { createClient } from "@supabase/supabase-js";

import { SupabaseAuthService } from "./supabase-auth-service.js";

export async function createAuthService() {
  if (import.meta.env.VITE_AUTH_E2E_MOCK === "true") {
    const { MockAuthService } = await import("./mock-auth-service.js");
    return new MockAuthService();
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) return null;

  const client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true,
      storageKey: "impulsox-auth-session",
    },
  });
  return new SupabaseAuthService(client);
}
