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
      onSyncStatus = () => {},
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
    this.onSyncStatus = onSyncStatus;
    this.syncDelay = Math.max(0, Number(syncDelay) || 0);
    this.dirtyPreferenceName = `remote-pending-${encodeURIComponent(this.userId)}`;
    this.revisionPreferenceName = `remote-revision-${encodeURIComponent(this.userId)}`;
    this.remoteRevision = parseRevision(this.local.getPreference(this.revisionPreferenceName, "0"));
    this.notice = null;
    this.pendingState = null;
    this.syncTimer = null;
    this.syncQueue = Promise.resolve(true);
    this.syncErrorNotified = false;
  }

  async load() {
    this.emitSyncStatus("syncing");
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
        .select("schema_version, state, revision, updated_at")
        .eq("user_id", this.userId)
        .maybeSingle();
      if (error) throw error;

      if (this.hasPendingLocalChanges()) {
        const currentRemoteRevision = parseRevision(data?.revision);
        if (data && currentRemoteRevision !== this.remoteRevision) {
          this.reportConflict(currentRemoteRevision);
          return localState;
        }
        const saved = await this.pushState(localState, { notify: false });
        if (saved) this.setPendingLocalChanges(false);
        return localState;
      }

      if (data?.state) {
        this.setRemoteRevision(data.revision);
        const remoteState = normalizeState(data.state);
        this.local.save(remoteState);
        this.setPendingLocalChanges(false);
        this.clearSyncError();
        this.emitSyncStatus("synced");
        return remoteState;
      }

      if (localLoadError) throw localLoadError;
      this.setRemoteRevision(0);
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
    this.emitSyncStatus("pending");
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

  clearUserData() {
    this.pendingState = null;
    if (this.syncTimer) globalThis.clearTimeout(this.syncTimer);
    this.syncTimer = null;
    this.local.clearUserData();
  }

  async storeProfileAvatar(dataUrl) {
    const { blob, contentType, extension } = avatarDataUrlToBlob(dataUrl);
    const avatarPath = `${this.userId}/avatar.${extension}`;
    const { error } = await this.client.storage.from("profile-avatars").upload(avatarPath, blob, {
      cacheControl: "3600",
      contentType,
      upsert: true,
    });
    if (error) throw createAvatarError(error, "No pudimos guardar la foto de perfil.");
    return { avatarPath, avatarDataUrl: "", displayUrl: dataUrl };
  }

  async loadProfileAvatar(path) {
    if (!path) return "";
    const { data, error } = await this.client.storage.from("profile-avatars").download(path);
    if (error) throw createAvatarError(error, "No pudimos recuperar la foto de perfil.");
    return URL.createObjectURL(data);
  }

  async removeProfileAvatar(path) {
    if (!path) return;
    const { error } = await this.client.storage.from("profile-avatars").remove([path]);
    if (error) throw createAvatarError(error, "No pudimos quitar la foto de perfil.");
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
    this.emitSyncStatus("syncing");

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
      const { data, error } = await this.client.rpc("save_user_state", {
        p_expected_revision: this.remoteRevision,
        p_schema_version: STATE_VERSION,
        p_state: normalized,
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.saved) {
        this.reportConflict(result?.revision, notify);
        return false;
      }
      this.setRemoteRevision(result.revision);
      this.clearSyncError();
      this.emitSyncStatus("synced");
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

  setRemoteRevision(revision) {
    this.remoteRevision = parseRevision(revision);
    this.local.setPreference(this.revisionPreferenceName, String(this.remoteRevision));
  }

  reportConflict(revision, notify = true) {
    const currentRevision = parseRevision(revision);
    const error = new Error(
      "Hay cambios nuevos en otro dispositivo. Conservamos esta copia local para que puedas resolver el conflicto sin perder datos.",
    );
    error.name = "DataRepositoryError";
    error.code = "remote-sync-conflict";
    error.remoteRevision = currentRevision;
    this.notice = { code: error.code, message: error.message };
    this.emitSyncStatus("conflict");
    if (notify && !this.syncErrorNotified) this.onSyncError(error);
    this.syncErrorNotified = true;
  }

  reportSyncError(cause, message, notify = true) {
    const error = createSyncError(cause, message);
    this.notice = { code: error.code, message: error.message };
    this.emitSyncStatus("offline");
    if (notify && !this.syncErrorNotified) this.onSyncError(error);
    this.syncErrorNotified = true;
  }

  clearSyncError() {
    this.syncErrorNotified = false;
  }

  emitSyncStatus(status) {
    this.onSyncStatus(status);
  }
}

function parseRevision(value) {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}

function createSyncError(cause, message) {
  const error = new Error(message);
  error.name = "DataRepositoryError";
  error.code = "remote-sync-failed";
  error.cause = cause;
  return error;
}

function avatarDataUrlToBlob(dataUrl) {
  const match = String(dataUrl || "").match(
    /^data:(image\/(?:webp|jpeg|png));base64,([a-zA-Z0-9+/=]+)$/,
  );
  if (!match) throw createAvatarError(null, "La foto preparada no tiene un formato válido.");
  const binary = globalThis.atob(match[2]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const contentType = match[1];
  return {
    blob: new Blob([bytes], { type: contentType }),
    contentType,
    extension: contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1],
  };
}

function createAvatarError(cause, message) {
  const error = new Error(message);
  error.name = "DataRepositoryError";
  error.code = "profile-avatar-failed";
  error.cause = cause;
  return error;
}
