import { DataRepository } from "./data-repository.js";
import { createDefaultState, normalizeState } from "./state.js";

export const STATE_STORAGE_KEY = "impulsox-state";
export const LEGACY_STATE_STORAGE_KEY = "ritmo-diario-state";

export class LocalDataRepository extends DataRepository {
  constructor(storage = globalThis.localStorage) {
    super();
    this.storage = storage;
  }

  load() {
    const current = this.storage.getItem(STATE_STORAGE_KEY);
    const legacy = this.storage.getItem(LEGACY_STATE_STORAGE_KEY);
    if (!current && !legacy) return normalizeState(createDefaultState());

    try {
      const state = normalizeState(JSON.parse(current || legacy));
      if (!current && legacy) this.save(state);
      return state;
    } catch {
      return normalizeState(createDefaultState());
    }
  }

  save(state) {
    const normalized = normalizeState(state);
    this.storage.setItem(STATE_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  export(state) {
    return {
      app: "IMPULSOX",
      exportedAt: new Date().toISOString(),
      state: normalizeState(state),
    };
  }

  import(serializedState) {
    const parsed =
      typeof serializedState === "string" ? JSON.parse(serializedState) : serializedState;
    const state = normalizeState(parsed.state || parsed, true);
    return this.save(state);
  }

  getPreference(name, fallback = null) {
    return this.storage.getItem(`impulsox-preference-${name}`) ?? fallback;
  }

  setPreference(name, value) {
    this.storage.setItem(`impulsox-preference-${name}`, String(value));
  }
}
