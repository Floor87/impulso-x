const MOCK_SESSION_KEY = "impulsox-e2e-auth-session";

export class MockAuthService {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.listeners = new Set();
  }

  async getSession() {
    const serialized = this.storage.getItem(MOCK_SESSION_KEY);
    return serialized ? JSON.parse(serialized) : null;
  }

  onAuthStateChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async signIn({ email, password }) {
    validatePassword(password);
    return this.createSession(email, email.split("@")[0]);
  }

  async signUp({ name, email, password }) {
    validatePassword(password);
    const session = this.createSession(email, name);
    return { session, user: session.user };
  }

  async requestPasswordReset() {}

  async updatePassword(password) {
    validatePassword(password);
    this.emit("USER_UPDATED", await this.getSession());
  }

  async signOut() {
    this.storage.removeItem(MOCK_SESSION_KEY);
    this.emit("SIGNED_OUT", null);
  }

  createSession(email, displayName) {
    const session = {
      user: {
        id: `e2e-${hashEmail(email)}`,
        email,
        user_metadata: { display_name: displayName },
      },
    };
    this.storage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    this.emit("SIGNED_IN", session);
    return session;
  }

  emit(event, session) {
    this.listeners.forEach((listener) => listener(event, session));
  }
}

function validatePassword(password) {
  if (String(password).length < 8) {
    const error = new Error("La clave debe tener al menos 8 caracteres.");
    error.code = "weak_password";
    throw error;
  }
}

function hashEmail(email) {
  let hash = 0;
  for (const character of email.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
}
