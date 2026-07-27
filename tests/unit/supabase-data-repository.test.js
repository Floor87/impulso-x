import { describe, expect, it, vi } from "vitest";

import { LocalDataRepository, STATE_STORAGE_KEY } from "../../src/data/local-data-repository.js";
import { SupabaseDataRepository } from "../../src/data/supabase-data-repository.js";

class MemoryStorage {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.entries.get(key) ?? null;
  }

  setItem(key, value) {
    this.entries.set(key, value);
  }
}

function validState(note = "Bien") {
  return {
    version: 2,
    habits: [{ id: "h1", name: "Leer", frequency: "Diario", time: "08:00" }],
    routines: [],
    waterGoal: 2000,
    days: {
      "2026-07-21": {
        habitsDone: { h1: true },
        routinesDone: {},
        meals: [],
        water: 1000,
        note,
        plan: {
          habits: [{ id: "h1", name: "Leer", frequency: "Diario", time: "08:00" }],
          routines: [],
          waterGoal: 2000,
        },
      },
    },
  };
}

function createClient({
  readData = null,
  readError = null,
  writeError = null,
  writeData = [{ saved: true, revision: 1, updated_at: "2026-07-27T18:00:00Z" }],
} = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      expect(table).toBe("user_states");
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: readData, error: readError };
                },
              };
            },
          };
        },
      };
    },
    async rpc(name, payload) {
      calls.push({ name, payload });
      return { data: writeData, error: writeError };
    },
  };
}

describe("SupabaseDataRepository", () => {
  it("loads the remote state and keeps a local cache per user", async () => {
    const storage = new MemoryStorage();
    const client = createClient({
      readData: { state: validState("Desde la nube"), revision: 7 },
    });
    const repository = new SupabaseDataRepository(client, {
      storage,
      userId: "user-a",
      syncDelay: 0,
    });

    const state = await repository.load();

    expect(state.days["2026-07-21"].note).toBe("Desde la nube");
    expect(JSON.parse(storage.getItem(`${STATE_STORAGE_KEY}:user-a`)).days["2026-07-21"].note).toBe(
      "Desde la nube",
    );
    expect(storage.getItem("impulsox-preference-remote-revision-user-a")).toBe("7");
  });

  it("uploads the local state when the user has no remote row", async () => {
    const storage = new MemoryStorage();
    const local = new LocalDataRepository(storage, { userId: "user-a" });
    local.save(validState("Solo local"));
    const client = createClient();
    const repository = new SupabaseDataRepository(client, {
      localRepository: local,
      userId: "user-a",
      syncDelay: 0,
    });

    await repository.load();

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].name).toBe("save_user_state");
    expect(client.calls[0].payload.p_expected_revision).toBe(0);
    expect(client.calls[0].payload.p_state.days["2026-07-21"].note).toBe("Solo local");
  });

  it("coalesces changes and syncs the latest saved state", async () => {
    const storage = new MemoryStorage();
    const client = createClient();
    const onSyncStatus = vi.fn();
    const repository = new SupabaseDataRepository(client, {
      storage,
      userId: "user-a",
      onSyncStatus,
      syncDelay: 1000,
    });

    repository.save(validState("Primero"));
    repository.save(validState("Ultimo"));
    const synced = await repository.flush();

    expect(synced).toBe(true);
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].payload.p_state.days["2026-07-21"].note).toBe("Ultimo");
    expect(storage.getItem("impulsox-preference-remote-pending-user-a")).toBe("false");
    expect(storage.getItem("impulsox-preference-remote-revision-user-a")).toBe("1");
    expect(onSyncStatus.mock.calls.map(([status]) => status)).toEqual([
      "pending",
      "pending",
      "syncing",
      "synced",
    ]);
  });

  it("uploads pending local changes before accepting an older remote copy", async () => {
    const storage = new MemoryStorage();
    const local = new LocalDataRepository(storage, { userId: "user-a" });
    local.save(validState("Cambio sin conexion"));
    local.setPreference("remote-pending-user-a", "true");
    const client = createClient({
      readData: { state: validState("Copia vieja"), revision: 0 },
    });
    const repository = new SupabaseDataRepository(client, {
      localRepository: local,
      userId: "user-a",
      syncDelay: 0,
    });

    const state = await repository.load();

    expect(state.days["2026-07-21"].note).toBe("Cambio sin conexion");
    expect(client.calls[0].payload.p_state.days["2026-07-21"].note).toBe("Cambio sin conexion");
    expect(local.getPreference("remote-pending-user-a")).toBe("false");
  });

  it("keeps pending local data when another device has advanced the revision", async () => {
    const storage = new MemoryStorage();
    const local = new LocalDataRepository(storage, { userId: "user-a" });
    local.save(validState("Cambio local"));
    local.setPreference("remote-pending-user-a", "true");
    local.setPreference("remote-revision-user-a", "3");
    const onSyncError = vi.fn();
    const client = createClient({
      readData: { state: validState("Cambio remoto"), revision: 4 },
    });
    const repository = new SupabaseDataRepository(client, {
      localRepository: local,
      userId: "user-a",
      onSyncError,
      syncDelay: 0,
    });

    const state = await repository.load();
    const notice = repository.consumeNotice();

    expect(state.days["2026-07-21"].note).toBe("Cambio local");
    expect(client.calls).toHaveLength(0);
    expect(local.getPreference("remote-pending-user-a")).toBe("true");
    expect(notice).toEqual(
      expect.objectContaining({
        code: "remote-sync-conflict",
      }),
    );
  });

  it("rejects a stale write returned by the atomic save function", async () => {
    const onSyncError = vi.fn();
    const client = createClient({
      writeData: [{ saved: false, revision: 5, updated_at: "2026-07-27T18:00:00Z" }],
    });
    const repository = new SupabaseDataRepository(client, {
      storage: new MemoryStorage(),
      userId: "user-a",
      onSyncError,
      syncDelay: 1000,
    });

    repository.save(validState("No perder"));
    const synced = await repository.flush();

    expect(synced).toBe(false);
    expect(onSyncError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "remote-sync-conflict", remoteRevision: 5 }),
    );
  });

  it("keeps local data and reports a remote synchronization failure", async () => {
    const onSyncError = vi.fn();
    const client = createClient({ writeError: new Error("offline") });
    const repository = new SupabaseDataRepository(client, {
      storage: new MemoryStorage(),
      userId: "user-a",
      onSyncError,
      syncDelay: 1000,
    });

    const saved = repository.save(validState("Sin conexion"));
    const synced = await repository.flush();

    expect(saved.days["2026-07-21"].note).toBe("Sin conexion");
    expect(synced).toBe(false);
    expect(onSyncError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "remote-sync-failed" }),
    );
  });

  it("stores profile photos in the private per-user bucket", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const client = createClient();
    client.storage = {
      from(bucket) {
        expect(bucket).toBe("profile-avatars");
        return { upload };
      },
    };
    const repository = new SupabaseDataRepository(client, {
      storage: new MemoryStorage(),
      userId: "user-a",
    });

    const result = await repository.storeProfileAvatar("data:image/webp;base64,AAAA");

    expect(upload).toHaveBeenCalledWith(
      "user-a/avatar.webp",
      expect.any(globalThis.Blob),
      expect.objectContaining({
        contentType: "image/webp",
        upsert: true,
      }),
    );
    expect(result).toEqual({
      avatarPath: "user-a/avatar.webp",
      avatarDataUrl: "",
      displayUrl: "data:image/webp;base64,AAAA",
    });
  });
});
