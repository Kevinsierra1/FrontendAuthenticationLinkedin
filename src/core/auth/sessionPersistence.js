export function readJson(storage, key, fallback) {
  try {
    return JSON.parse(storage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function readInitialAuthState() {
  return {
    auth: readJson(localStorage, "tl_auth", { isLoggedIn: false, user: null }),
    remembered: readJson(localStorage, "tl_remembered", null),
    register: readJson(sessionStorage, "tl_register", {}),
    forgot: readJson(sessionStorage, "tl_forgot", {})
  };
}

export function persistAuth(auth) {
  localStorage.setItem("tl_auth", JSON.stringify(auth));
}

export function persistRemembered(user) {
  localStorage.setItem("tl_remembered", JSON.stringify(user));
}

export function persistRegister(register) {
  sessionStorage.setItem("tl_register", JSON.stringify(register));
}

export function persistForgot(forgot) {
  sessionStorage.setItem("tl_forgot", JSON.stringify(forgot));
}

export function persistBackendSession(session, backendUser, onboarding) {
  localStorage.setItem("accessToken", session.accessToken || "");
  localStorage.setItem("refreshToken", session.refreshToken || "");
  localStorage.setItem("user", JSON.stringify(backendUser || {}));
  localStorage.setItem("onboarding", JSON.stringify(onboarding || {}));
  localStorage.setItem("isNewUser", String(Boolean(session.isNewUser)));
}

export function clearAuthStorage({ clearRemembered = false } = {}) {
  sessionStorage.removeItem("tl_register");
  sessionStorage.removeItem("tl_forgot");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("onboarding");
  localStorage.removeItem("isNewUser");

  if (clearRemembered) {
    localStorage.removeItem("tl_remembered");
  }
}
