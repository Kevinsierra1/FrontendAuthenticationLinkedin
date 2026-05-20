import { createStore } from "./createStore.js";

export const authStore = createStore({
  initialized: false,
  token: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),
  isAuthenticated: Boolean(localStorage.getItem("access_token")),
  error: null
});

export const userStore = createStore({
  me: null,
  profile: null,
  onboardingComplete: localStorage.getItem("onboarding_complete") === "true"
});

export const feedStore = createStore({ posts: [], page: 1, loading: false, hasMore: true });
export const networkStore = createStore({ suggestions: [], connections: [], requestsIn: [], requestsOut: [] });
export const notificationStore = createStore({ items: [], unread: 0, open: false });
export const messageStore = createStore({ conversations: [], activeId: null, online: [] });
export const uiStore = createStore({ theme: localStorage.getItem("theme") || "light", toast: null, searching: false });

export function resetAllStores() {
  authStore.reset();
  userStore.reset();
  feedStore.reset();
  networkStore.reset();
  notificationStore.reset();
  messageStore.reset();
  uiStore.setState({ toast: null, searching: false });
}
