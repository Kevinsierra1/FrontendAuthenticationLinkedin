import { http } from "../core/api/http.js";
import { clearSession, persistSession } from "../core/auth/session.js";
import { authStore, resetAllStores, userStore } from "../core/state/stores.js";

export const AuthService = {
  async bootstrapSession() {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (!token) return;
    try {
      const { user } = await http.get("/auth/me");
      authStore.setState({ token, isAuthenticated: true });
      userStore.setState({ me: user, onboardingComplete: Boolean(user.onboardingComplete) });
    } catch {
      clearSession();
      authStore.setState({ token: null, isAuthenticated: false });
    }
  },

  async login(payload) {
    const session = await http.post("/auth/login", payload);
    persistSession({ ...session, remember: payload.remember });
    return session;
  },

  async register(payload) {
    const session = await http.post("/auth/register", payload);
    persistSession({ ...session, remember: true });
    return session;
  },

  async oauth(provider) {
    return this.login({ email: `${provider}@oauth.local`, password: "oauth-flow", remember: true });
  },

  async forgotPassword(email) {
    return http.post("/auth/forgot-password", { email });
  },

  async resetPassword(token, password) {
    const response = await http.post("/auth/reset-password", { token, password });
    if (response.autoLoginToken) {
      localStorage.setItem("access_token", response.autoLoginToken);
      localStorage.setItem("onboarding_complete", "true");
      authStore.setState({ token: response.autoLoginToken, isAuthenticated: true });
      userStore.setState({ onboardingComplete: true });
    }
    return response;
  },

  async verifyEmail(token) {
    return http.post("/auth/verify-email", { token });
  },

  logout(router) {
    clearSession();
    resetAllStores();
    router.replace("/");
  }
};
