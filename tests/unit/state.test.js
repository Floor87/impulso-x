import { describe, expect, it } from "vitest";

import {
  CORRUPT_STATE_STORAGE_KEY,
  LEGACY_STATE_STORAGE_KEY,
  LocalDataRepository,
  RECOVERY_STORAGE_KEY,
  STATE_STORAGE_KEY,
  USER_STATE_OWNER_STORAGE_KEY,
} from "../../src/data/local-data-repository.js";
import { normalizeState, STATE_VERSION } from "../../src/data/state.js";

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

class FailingStorage extends MemoryStorage {
  setItem() {
    throw new Error("quota exceeded");
  }
}

function validState() {
  return {
    version: 1,
    habits: [{ id: "h1", name: "Leer", frequency: "Diario", time: "8 am" }],
    routines: [],
    waterGoal: 2500,
    days: {
      "2026-07-17": {
        habitsDone: { h1: true },
        routinesDone: {},
        meals: [],
        water: 2000,
        note: "Bien",
        plan: {
          habits: [{ id: "h1", name: "Leer", frequency: "Diario", time: "08:00" }],
          routines: [],
          waterGoal: 2000,
        },
      },
    },
  };
}

describe("state migrations and repository", () => {
  it("migrates state while preserving historical goals", () => {
    const state = normalizeState(validState());
    expect(state.version).toBe(STATE_VERSION);
    expect(state.habits[0].time).toBe("08:00");
    expect(state.waterGoal).toBe(2500);
    expect(state.days["2026-07-17"].plan.waterGoal).toBe(2000);
  });

  it("rejects incomplete or invalid backups", () => {
    expect(() => normalizeState({ habits: [] }, true)).toThrow("Respaldo incompleto");
    expect(() => normalizeState({ ...validState(), days: { invalid: {} } }, true)).toThrow(
      "Fecha invalida",
    );
  });

  it("migrates the legacy storage key without deleting it", () => {
    const legacy = JSON.stringify(validState());
    const storage = new MemoryStorage({ [LEGACY_STATE_STORAGE_KEY]: legacy });
    const repository = new LocalDataRepository(storage);
    const state = repository.load();

    expect(state.version).toBe(STATE_VERSION);
    expect(storage.getItem(STATE_STORAGE_KEY)).not.toBeNull();
    expect(storage.getItem(LEGACY_STATE_STORAGE_KEY)).toBe(legacy);
  });

  it("validates imports before replacing the stored state", () => {
    const storage = new MemoryStorage();
    const repository = new LocalDataRepository(storage);
    const imported = repository.import(JSON.stringify({ app: "IMPULSOX", state: validState() }));

    expect(imported.days["2026-07-17"].note).toBe("Bien");
    expect(JSON.parse(storage.getItem(STATE_STORAGE_KEY)).version).toBe(STATE_VERSION);
  });

  it("isolates a corrupt current state and restores the valid legacy copy", () => {
    const storage = new MemoryStorage({
      [STATE_STORAGE_KEY]: "{broken",
      [LEGACY_STATE_STORAGE_KEY]: JSON.stringify(validState()),
    });
    const repository = new LocalDataRepository(storage);

    const state = repository.load();

    expect(state.days["2026-07-17"].note).toBe("Bien");
    expect(JSON.parse(storage.getItem(CORRUPT_STATE_STORAGE_KEY)).raw).toBe("{broken");
    expect(repository.consumeNotice()?.code).toBe("corrupt-state-restored");
  });

  it("keeps a recoverable copy when all stored state is corrupt", () => {
    const storage = new MemoryStorage({ [STATE_STORAGE_KEY]: "not-json" });
    const repository = new LocalDataRepository(storage);

    const state = repository.load();

    expect(state.version).toBe(STATE_VERSION);
    expect(JSON.parse(storage.getItem(CORRUPT_STATE_STORAGE_KEY)).raw).toBe("not-json");
    expect(repository.consumeNotice()?.code).toBe("corrupt-state-reset");
  });

  it("creates and restores a recovery point before destructive changes", () => {
    const storage = new MemoryStorage();
    const repository = new LocalDataRepository(storage);
    const original = normalizeState(validState());
    repository.save(original);
    repository.createRecoveryPoint(original, "reset-today");

    const changed = normalizeState({ ...validState(), days: {} });
    repository.save(changed);
    const restored = repository.restoreRecoveryPoint();

    expect(restored.days["2026-07-17"].note).toBe("Bien");
    expect(JSON.parse(storage.getItem(RECOVERY_STORAGE_KEY)).reason).toBe("reset-today");
  });

  it("rejects backups from another app or a newer state version", () => {
    const repository = new LocalDataRepository(new MemoryStorage());

    expect(() => repository.validateImport({ app: "OTRA", state: validState() })).toThrow(
      "no pertenece",
    );
    expect(() =>
      repository.validateImport({ ...validState(), version: STATE_VERSION + 1 }),
    ).toThrow("version mas nueva");
  });

  it("reports storage write failures instead of hiding them", () => {
    const repository = new LocalDataRepository(new FailingStorage());

    expect(() => repository.save(validState())).toThrowError(
      expect.objectContaining({ code: "storage-write-failed" }),
    );
  });

  it("lets only the first authenticated user claim existing local data", () => {
    const storage = new MemoryStorage({ [STATE_STORAGE_KEY]: JSON.stringify(validState()) });
    const firstUserRepository = new LocalDataRepository(storage, { userId: "user-a" });
    const secondUserRepository = new LocalDataRepository(storage, { userId: "user-b" });

    const firstState = firstUserRepository.load();
    const secondState = secondUserRepository.load();

    expect(firstState.days["2026-07-17"].note).toBe("Bien");
    expect(secondState.days).toEqual({});
    expect(storage.getItem(USER_STATE_OWNER_STORAGE_KEY)).toBe("user-a");
  });

  it("keeps state and recovery copies isolated between users", () => {
    const storage = new MemoryStorage();
    const firstUserRepository = new LocalDataRepository(storage, { userId: "user-a" });
    const secondUserRepository = new LocalDataRepository(storage, { userId: "user-b" });
    const firstState = normalizeState(validState());
    const secondState = normalizeState({
      ...validState(),
      days: {
        "2026-07-17": {
          ...validState().days["2026-07-17"],
          note: "Estado de B",
        },
      },
    });

    firstUserRepository.save(firstState);
    firstUserRepository.createRecoveryPoint(firstState, "test-a");
    secondUserRepository.save(secondState);

    expect(firstUserRepository.load().days["2026-07-17"].note).toBe("Bien");
    expect(secondUserRepository.load().days["2026-07-17"].note).toBe("Estado de B");
    expect(firstUserRepository.getRecoveryInfo()?.reason).toBe("test-a");
    expect(secondUserRepository.getRecoveryInfo()).toBeNull();
  });
});
