import { describe, expect, it } from "vitest";

import {
  LEGACY_STATE_STORAGE_KEY,
  LocalDataRepository,
  STATE_STORAGE_KEY,
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
});
