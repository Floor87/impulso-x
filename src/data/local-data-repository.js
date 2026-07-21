import { DataRepository } from "./data-repository.js";
import { createDefaultState, normalizeState, STATE_VERSION } from "./state.js";

export const STATE_STORAGE_KEY = "impulsox-state";
export const LEGACY_STATE_STORAGE_KEY = "ritmo-diario-state";
export const RECOVERY_STORAGE_KEY = "impulsox-recovery";
export const CORRUPT_STATE_STORAGE_KEY = "impulsox-corrupt-state";
export const USER_STATE_OWNER_STORAGE_KEY = "impulsox-state-owner";

export class LocalDataRepository extends DataRepository {
  constructor(storage = globalThis.localStorage, { userId = null } = {}) {
    super();
    this.storage = storage;
    this.userId = userId ? String(userId) : null;
    this.stateStorageKey = scopedKey(STATE_STORAGE_KEY, this.userId);
    this.recoveryStorageKey = scopedKey(RECOVERY_STORAGE_KEY, this.userId);
    this.corruptStateStorageKey = scopedKey(CORRUPT_STATE_STORAGE_KEY, this.userId);
    this.notice = null;
  }

  load() {
    const sources = this.getStateSources();
    if (!sources.length) return normalizeState(createDefaultState());
    let corruptedSource = null;

    for (const source of sources) {
      try {
        const state = normalizeState(JSON.parse(source.value));
        if (source.claimable && this.userId) {
          this.writeItem(USER_STATE_OWNER_STORAGE_KEY, this.userId);
          this.save(state);
        } else if (source.key === LEGACY_STATE_STORAGE_KEY) {
          this.save(state);
        }
        if (corruptedSource) {
          this.notice = {
            code: "corrupt-state-restored",
            message: "Aislamos datos danados y recuperamos el ultimo estado disponible.",
          };
        }
        return state;
      } catch {
        if (!corruptedSource) {
          corruptedSource = source;
          this.preserveCorruptState(source);
        }
      }
    }

    this.notice = {
      code: "corrupt-state-reset",
      message:
        "Aislamos datos danados. IMPULSOX inicio un estado nuevo sin borrar la copia recuperable.",
    };
    if (this.userId && sources.some((source) => source.claimable)) {
      this.writeItem(USER_STATE_OWNER_STORAGE_KEY, this.userId);
    }
    return normalizeState(createDefaultState());
  }

  save(state) {
    const normalized = normalizeState(state);
    this.writeItem(this.stateStorageKey, JSON.stringify(normalized));
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
    return this.save(this.validateImport(serializedState));
  }

  validateImport(serializedState) {
    const parsed =
      typeof serializedState === "string" ? JSON.parse(serializedState) : serializedState;
    if (parsed?.app && parsed.app !== "IMPULSOX") {
      throw new Error("El archivo no pertenece a IMPULSOX");
    }

    const candidate = parsed?.state || parsed;
    if (Number(candidate?.version || 0) > STATE_VERSION) {
      throw new Error("El respaldo fue creado por una version mas nueva de IMPULSOX");
    }
    return normalizeState(candidate, true);
  }

  createRecoveryPoint(state, reason) {
    const payload = {
      app: "IMPULSOX",
      createdAt: new Date().toISOString(),
      reason: String(reason || "manual"),
      state: normalizeState(state),
    };
    this.writeItem(this.recoveryStorageKey, JSON.stringify(payload));
    return payload;
  }

  restoreRecoveryPoint() {
    const recovery = this.readItem(this.recoveryStorageKey);
    if (!recovery) throw new Error("No hay una copia de recuperacion disponible");
    return this.save(this.validateImport(recovery));
  }

  getRecoveryInfo() {
    const recovery = this.readItem(this.recoveryStorageKey);
    if (!recovery) return null;

    try {
      const parsed = JSON.parse(recovery);
      return {
        createdAt: parsed.createdAt || null,
        reason: parsed.reason || "manual",
      };
    } catch {
      return null;
    }
  }

  consumeNotice() {
    const notice = this.notice;
    this.notice = null;
    return notice;
  }

  getPreference(name, fallback = null) {
    return this.readItem(`impulsox-preference-${name}`) ?? fallback;
  }

  setPreference(name, value) {
    this.writeItem(`impulsox-preference-${name}`, String(value));
  }

  preserveCorruptState(source) {
    const payload = {
      capturedAt: new Date().toISOString(),
      sourceKey: source.key,
      raw: source.value,
    };
    this.writeItem(this.corruptStateStorageKey, JSON.stringify(payload));
  }

  getStateSources() {
    const scopedState = this.readItem(this.stateStorageKey);
    if (this.userId && scopedState) return [{ key: this.stateStorageKey, value: scopedState }];

    const current = this.userId ? this.readItem(STATE_STORAGE_KEY) : null;
    const legacy = this.readItem(LEGACY_STATE_STORAGE_KEY);
    if (!this.userId) {
      return [
        { key: STATE_STORAGE_KEY, value: scopedState },
        { key: LEGACY_STATE_STORAGE_KEY, value: legacy },
      ].filter((source) => source.value);
    }

    const owner = this.readItem(USER_STATE_OWNER_STORAGE_KEY);
    if (owner && owner !== this.userId) return [];
    return [
      { key: STATE_STORAGE_KEY, value: current, claimable: true },
      { key: LEGACY_STATE_STORAGE_KEY, value: legacy, claimable: true },
    ].filter((source) => source.value);
  }

  readItem(key) {
    try {
      return this.storage.getItem(key);
    } catch (cause) {
      throw repositoryError(
        "storage-read-failed",
        "El navegador no permitio leer los datos guardados.",
        cause,
      );
    }
  }

  writeItem(key, value) {
    try {
      this.storage.setItem(key, value);
    } catch (cause) {
      throw repositoryError(
        "storage-write-failed",
        "El navegador no pudo guardar los cambios. El almacenamiento puede estar lleno o bloqueado.",
        cause,
      );
    }
  }
}

function repositoryError(code, message, cause) {
  const error = new Error(message);
  error.name = "DataRepositoryError";
  error.code = code;
  error.cause = cause;
  return error;
}

function scopedKey(baseKey, userId) {
  return userId ? `${baseKey}:${encodeURIComponent(userId)}` : baseKey;
}
