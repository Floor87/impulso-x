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
  it("sends display name only as profile metadata during signup", async () => {
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
    });

    expect(signUp).toHaveBeenCalledWith({
      email: "florencia@example.com",
      password: "clave-segura",
      options: {
        data: { display_name: "Florencia" },
        emailRedirectTo: "https://example.com/",
      },
    });
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
