import { DataRepository } from "./data-repository.js";
import { LocalDataRepository } from "./local-data-repository.js";
import { createDefaultState, normalizeState, STATE_VERSION } from "./state.js";

const DEFAULT_SYNC_DELAY = 450;

export class SupabaseDataRepository extends DataRepository {
  constructor(
    client,
    {
      userId,
      storage = globalThis.localStorage,
      localRepository = null,
      onSyncError = () => {},
      syncDelay = DEFAULT_SYNC_DELAY,
    } = {},
  ) {
    super();
    if (!client?.from) throw new Error("SupabaseDataRepository requiere un cliente valido");
    if (!userId) throw new Error("SupabaseDataRepository requiere un usuario autenticado");

    this.client = client;
    this.userId = String(userId);
    this.local = localRepository || new LocalDataRepository(storage, { userId: this.userId });
    this.onSyncError = onSyncError;
    this.syncDelay = Math.max(0, Number(syncDelay) || 0);
    this.dirtyPreferenceName = `remote-pending-${encodeURIComponent(this.userId)}`;
    this.notice = null;
    this.pendingState = null;
    this.syncTimer = null;
    this.syncQueue = Promise.resolve(true);
    this.syncErrorNotified = false;
  }

  async load() {
    let localState;
    let localLoadError = null;
    try {
      localState = this.local.load();
    } catch (error) {
      localLoadError = error;
      localState = normalizeState(createDefaultState());
    }

    try {
      const { data, error } = await this.client
        .from("user_states")
        .select("schema_version, state, updated_at")
        .eq("user_id", this.userId)
        .maybeSingle();
      if (error) throw error;

      if (this.hasPendingLocalChanges()) {
        const saved = await this.pushState(localState, { notify: false });
        if (saved) this.setPendingLocalChanges(false);
        return localState;
      }

      if (data?.state) {
        const remoteState = normalizeState(data.state);
        this.local.save(remoteState);
        this.setPendingLocalChanges(false);
        this.clearSyncError();
        return remoteState;
      }

      if (localLoadError) throw localLoadError;
      const saved = await this.pushState(localState, { notify: false });
      if (saved) this.setPendingLocalChanges(false);
      return localState;
    } catch (error) {
      if (localLoadError) throw localLoadError;
      this.reportSyncError(
        error,
        "Abrimos los datos guardados en este dispositivo. La sincronizacion con la nube se reintentara al guardar.",
        false,
      );
      return localState;
    }
  }

  save(state) {
    const normalized = this.local.save(state);
    this.setPendingLocalChanges(true);
    this.pendingState = normalizeState(normalized);
    this.scheduleSync();
    return normalized;
  }

  export(state) {
    return this.local.export(state);
  }

  import(serializedState) {
    const imported = this.local.validateImport(serializedState);
    return this.save(imported);
  }

  validateImport(serializedState) {
    return this.local.validateImport(serializedState);
  }

  createRecoveryPoint(state, reason) {
    return this.local.createRecoveryPoint(state, reason);
  }

  restoreRecoveryPoint() {
    return this.save(this.local.restoreRecoveryPoint());
  }

  getRecoveryInfo() {
    return this.local.getRecoveryInfo();
  }

  getPreference(name, fallback = null) {
    return this.local.getPreference(name, fallback);
  }

  setPreference(name, value) {
    return this.local.setPreference(name, value);
  }

  consumeNotice() {
    const localNotice = this.local.consumeNotice();
    const remoteNotice = this.notice;
    this.notice = null;
    if (localNotice && remoteNotice) {
      return {
        code: `${localNotice.code}+${remoteNotice.code}`,
        message: `${localNotice.message} ${remoteNotice.message}`,
      };
    }
    return localNotice || remoteNotice;
  }

  flush() {
    if (this.syncTimer) {
      globalThis.clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.syncQueue = this.syncQueue.then(() => this.flushPendingState());
    return this.syncQueue;
  }

  scheduleSync() {
    if (this.syncTimer) globalThis.clearTimeout(this.syncTimer);
    this.syncTimer = globalThis.setTimeout(() => {
      this.syncTimer = null;
      void this.flush();
    }, this.syncDelay);
  }

  async flushPendingState() {
    const pendingState = this.pendingState;
    if (!pendingState) return true;
    this.pendingState = null;

    const saved = await this.pushState(pendingState);
    if (!saved) {
      this.pendingState ||= pendingState;
      return false;
    }
    if (this.pendingState) return this.flushPendingState();
    this.setPendingLocalChanges(false);
    return true;
  }

  hasPendingLocalChanges() {
    return this.local.getPreference(this.dirtyPreferenceName, "false") === "true";
  }

  setPendingLocalChanges(pending) {
    this.local.setPreference(this.dirtyPreferenceName, pending ? "true" : "false");
  }

  async pushState(state, { notify = true } = {}) {
    const normalized = normalizeState(state);
    try {
      const { error } = await this.client.from("user_states").upsert(
        {
          user_id: this.userId,
          schema_version: STATE_VERSION,
          state: normalized,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      this.clearSyncError();
      return true;
    } catch (error) {
      this.reportSyncError(
        error,
        "El cambio quedo guardado en este dispositivo, pero todavia no pudo sincronizarse con la nube.",
        notify,
      );
      return false;
    }
  }

  reportSyncError(cause, message, notify = true) {
    const error = createSyncError(cause, message);
    this.notice = { code: error.code, message: error.message };
    if (notify && !this.syncErrorNotified) this.onSyncError(error);
    this.syncErrorNotified = true;
  }

  clearSyncError() {
    this.syncErrorNotified = false;
  }
}

function createSyncError(cause, message) {
  const error = new Error(message);
  error.name = "DataRepositoryError";
  error.code = "remote-sync-failed";
  error.cause = cause;
  return error;
}
