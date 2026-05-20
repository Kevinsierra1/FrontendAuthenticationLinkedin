import { authStore, userStore } from "../state/stores.js";

export function persistSession({ token, refreshToken, user, remember = true }) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("access_token", token);
  storage.setItem("refresh_token", refreshToken || "");
  if (typeof user?.onboardingComplete === "boolean") {
    localStorage.setItem("onboarding_complete", String(user.onboardingComplete));
  }
  authStore.setState({ token, refreshToken, isAuthenticated: true, error: null });
  userStore.setState({ me: user, onboardingComplete: Boolean(user?.onboardingComplete) });
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("onboarding_complete");
  sessionStorage.clear();
}
