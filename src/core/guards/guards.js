import { authStore, userStore } from "../state/stores.js";

export function requireAuth() {
  return authStore.getState().isAuthenticated ? true : "/login";
}

export function requireOnboarding() {
  if (!authStore.getState().isAuthenticated) return "/login";
  return userStore.getState().onboardingComplete ? true : "/onboarding";
}

export function publicOnly() {
  return authStore.getState().isAuthenticated && userStore.getState().onboardingComplete ? "/feed" : true;
}
