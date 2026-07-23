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

function createClient({ readData = null, readError = null, writeError = null } = {}) {
  const upserts = [];
  return {
    upserts,
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
        async upsert(payload, options) {
          upserts.push({ payload, options });
          return { error: writeError };
        },
      };
    },
  };
}

describe("SupabaseDataRepository", () => {
  it("loads the remote state and keeps a local cache per user", async () => {
    const storage = new MemoryStorage();
    const client = createClient({ readData: { state: validState("Desde la nube") } });
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

    expect(client.upserts).toHaveLength(1);
    expect(client.upserts[0].payload.user_id).toBe("user-a");
    expect(client.upserts[0].payload.state.days["2026-07-21"].note).toBe("Solo local");
  });

  it("coalesces changes and syncs the latest saved state", async () => {
    const storage = new MemoryStorage();
    const client = createClient();
    const repository = new SupabaseDataRepository(client, {
      storage,
      userId: "user-a",
      syncDelay: 1000,
    });

    repository.save(validState("Primero"));
    repository.save(validState("Ultimo"));
    const synced = await repository.flush();

    expect(synced).toBe(true);
    expect(client.upserts).toHaveLength(1);
    expect(client.upserts[0].payload.state.days["2026-07-21"].note).toBe("Ultimo");
    expect(storage.getItem("impulsox-preference-remote-pending-user-a")).toBe("false");
  });

  it("uploads pending local changes before accepting an older remote copy", async () => {
    const storage = new MemoryStorage();
    const local = new LocalDataRepository(storage, { userId: "user-a" });
    local.save(validState("Cambio sin conexion"));
    local.setPreference("remote-pending-user-a", "true");
    const client = createClient({ readData: { state: validState("Copia vieja") } });
    const repository = new SupabaseDataRepository(client, {
      localRepository: local,
      userId: "user-a",
      syncDelay: 0,
    });

    const state = await repository.load();

    expect(state.days["2026-07-21"].note).toBe("Cambio sin conexion");
    expect(client.upserts[0].payload.state.days["2026-07-21"].note).toBe("Cambio sin conexion");
    expect(local.getPreference("remote-pending-user-a")).toBe("false");
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
});
