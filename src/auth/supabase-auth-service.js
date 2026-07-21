export class SupabaseAuthService {
  constructor(client) {
    this.client = client;
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  onAuthStateChange(callback) {
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => data.subscription.unsubscribe();
  }

  async signIn({ email, password }) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }

  async signUp({ name, email, password, redirectTo }) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    return data;
  }

  async requestPasswordReset(email, redirectTo) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async updatePassword(password) {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw error;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }
}

export function getUserLabel(user) {
  const displayName = String(user?.user_metadata?.display_name || "").trim();
  if (displayName) return displayName.slice(0, 80);
  return String(user?.email || "Usuario")
    .split("@")[0]
    .slice(0, 80);
}
