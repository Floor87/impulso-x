import { describe, expect, it, vi } from "vitest";

import { getFriendlyAuthError } from "../../src/auth/auth-ui.js";
import { MockAuthService } from "../../src/auth/mock-auth-service.js";
import { SupabaseAuthService } from "../../src/auth/supabase-auth-service.js";

class MemoryStorage {
  constructor() {
    this.entries = new Map();
  }

  getItem(key) {
    return this.entries.get(key) ?? null;
  }

  setItem(key, value) {
    this.entries.set(key, value);
  }

  removeItem(key) {
    this.entries.delete(key);
  }
}

describe("authentication", () => {
  it("sends the display name and accepted legal versions during signup", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { session: null, user: { id: "user-a" } },
      error: null,
    });
    const service = new SupabaseAuthService({ auth: { signUp } });

    await service.signUp({
      name: "Florencia",
      email: "florencia@example.com",
      password: "clave-segura",
      redirectTo: "https://example.com/",
      legalAcceptance: {
        termsVersion: "2026-07-27-beta",
        privacyVersion: "2026-07-27-beta",
      },
    });

    expect(signUp).toHaveBeenCalledWith({
      email: "florencia@example.com",
      password: "clave-segura",
      options: {
        data: {
          display_name: "Florencia",
          terms_version: "2026-07-27-beta",
          privacy_version: "2026-07-27-beta",
        },
        emailRedirectTo: "https://example.com/",
      },
    });
  });

  it("deletes the account through the protected function and clears the local session", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { deleted: true }, error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const service = new SupabaseAuthService({
      functions: { invoke },
      auth: { signOut },
    });

    await service.deleteAccount();

    expect(invoke).toHaveBeenCalledWith("delete-account", { method: "POST" });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("does not store passwords in the E2E authentication provider", async () => {
    const storage = new MemoryStorage();
    const service = new MockAuthService(storage);

    const session = await service.signUp({
      name: "Florencia",
      email: "florencia@example.com",
      password: "clave-segura",
    });

    expect(session.session.user.email).toBe("florencia@example.com");
    expect([...storage.entries.values()].join(" ")).not.toContain("clave-segura");
    expect((await service.getSession()).user.user_metadata.display_name).toBe("Florencia");
  });

  it("returns a generic message for invalid credentials", () => {
    expect(getFriendlyAuthError({ code: "invalid_credentials" })).toBe(
      "El usuario o la clave no son correctos.",
    );
    expect(getFriendlyAuthError({ code: "unexpected" })).not.toContain("unexpected");
  });
});
