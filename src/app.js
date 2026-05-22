import {
  cancelIncompleteRegistration,
  loginLocalAccount,
  postExternalLogin,
  registerLocalAccount,
  sendEmailVerificationCode,
  updateLocalRegisterProfile,
  uploadProfilePhoto,
  verifyEmailCode
} from "./services/authApi.js";
import {
  buildProviderRegisterDraft,
  getPostLoginRoute,
  shouldContinueRegistration,
  shouldShowEmailVerificationStep
} from "./core/auth/authFlow.js";
import {
  advanceRegisterProgress,
  enforceRegisterPath,
  getMinimumRegisterPath,
  getRequiredRegisterPath,
  getRouteAfterExperience
} from "./core/auth/registerFlow.js";
import {
  privateRoutes,
  registerSteps,
  shouldKeepLoggedInUserInApp
} from "./core/auth/onboardingFlow.js";
import {
  getNextPostVerifyStep,
  isPostVerifyRegisterStep,
  markPostVerifyFlowStarted
} from "./core/auth/registerPostVerifyFlow.js";
import {
  clearAuthStorage,
  persistAuth,
  persistBackendSession,
  persistForgot,
  persistRegister,
  persistRemembered,
  readInitialAuthState
} from "./core/auth/sessionPersistence.js";

const demoUser = {
  name: "Ximena Afanador",
  email: "ximenaafanador749@gmail.com",
  avatar: null,
  headline: "Desarrolladora de Software .NET | C# \u2022 SQL | Python | JavaScript",
  location: "Área metropolitana de Bucaramanga",
  company: "Campuslands"
};

const appConfig = window.APP_CONFIG || {};
const API_MEDIA_BASE_URL = (
  appConfig.VITE_BACKEND_URL ||
  appConfig.NEXT_PUBLIC_BACKEND_URL ||
  appConfig.VITE_API_BASE_URL ||
  appConfig.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5152"
)
  .replace(/\/$/, "")
  .replace(/\/api$/, "");
const GOOGLE_CLIENT_ID = appConfig.VITE_GOOGLE_CLIENT_ID || appConfig.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const MICROSOFT_CLIENT_ID =
  appConfig.VITE_MICROSOFT_CLIENT_ID || appConfig.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "";

let msalInstance = null;

let googleSignInInitialized = false;
let googleCredentialResolver = null;
let googleCredentialRejecter = null;
let hiddenGoogleButtonElement = null;

const store = readInitialAuthState();

const app = document.querySelector("#app");

function saveAuth() {
  persistAuth(store.auth);
}

function saveRemembered(user = demoUser) {
  store.remembered = user;
  persistRemembered(user);
}

function saveRegister(patch) {
  store.register = { ...store.register, ...patch };
  persistRegister(store.register);
}

function replaceRegister(nextState = {}) {
  store.register = { ...nextState };
  persistRegister(store.register);
}

function saveForgot(patch) {
  store.forgot = { ...store.forgot, ...patch };
  persistForgot(store.forgot);
}

function normalizeUserFromBackend(user = {}) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return {
    ...demoUser,
    id: user.id,
    name: fullName || user.email || demoUser.name,
    email: user.email || demoUser.email,
    avatar: resolveProfileImageUrl(user.profilePictureUrl)
  };
}

function resolveProfileImageUrl(url) {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_MEDIA_BASE_URL}${normalizedPath}`;
}

function hasActiveRegisterSession() {
  return Boolean(store.auth?.isLoggedIn && store.auth?.user?.id);
}

function hasProviderRegisterSession() {
  const authSource = store.register?.authSource;
  return Boolean(hasActiveRegisterSession() && authSource && authSource !== "local");
}

function hasLocalRegisterSession() {
  return Boolean(hasActiveRegisterSession() && store.register?.authSource === "local");
}

function getPendingOnboardingRoute() {
  if (!store.auth?.isLoggedIn || store.auth.onboarding?.completed) return null;
  return getMinimumRegisterPath(store.register, store.auth);
}

function beginPostVerifyFlow(targetPath = "/register/job-search") {
  startPostVerifyRegistrationFlow();
  navigate(targetPath);
}

function persistExternalSession(session) {
  const backendUser = session?.user || {};
  const onboarding = session?.onboarding || {};
  const userForUi = normalizeUserFromBackend(backendUser);

  store.auth = {
    isLoggedIn: true,
    accessToken: session?.accessToken || "",
    refreshToken: session?.refreshToken || "",
    user: userForUi,
    onboarding,
    isNewUser: Boolean(session?.isNewUser)
  };
  saveAuth();
  saveRemembered(userForUi);
  persistBackendSession(session, backendUser, onboarding);
}

function persistOnboardingState(onboarding) {
  if (!onboarding || !store.auth?.isLoggedIn) return;

  store.auth.onboarding = onboarding;
  saveAuth();
  localStorage.setItem("onboarding", JSON.stringify(onboarding));
}

function clearSessionAndRegisterState({ clearRemembered = false } = {}) {
  store.auth = { isLoggedIn: false, user: null };
  store.register = {};
  store.forgot = {};

  saveAuth();
  clearAuthStorage({ clearRemembered });
  if (clearRemembered) {
    store.remembered = null;
  }
}

function syncRegisterFromProviderSession(session, provider) {
  replaceRegister(buildProviderRegisterDraft(session, store.register, provider));
}

async function waitForGoogleIdentity(timeoutMs = 7000) {
  if (window.google?.accounts?.id) return window.google;
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        resolve(window.google);
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Google login unavailable"));
      }
    }, 50);
  });
}

function handleGoogleCredentialResponse(credentialResponse) {
  const idToken = credentialResponse?.credential;
  if (!googleCredentialResolver || !googleCredentialRejecter) return;
  if (!idToken) {
    googleCredentialRejecter(new Error("Google did not return an idToken"));
  } else {
    googleCredentialResolver(idToken);
  }
  googleCredentialResolver = null;
  googleCredentialRejecter = null;
}

async function ensureGoogleSignInClient() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Missing Google Client ID");
  }

  const google = await waitForGoogleIdentity();
  if (googleSignInInitialized) return google;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
    ux_mode: "popup",
    use_fedcm_for_button: false
  });
  googleSignInInitialized = true;
  return google;
}

function ensureHiddenGoogleButton(google) {
  if (hiddenGoogleButtonElement && document.body.contains(hiddenGoogleButtonElement)) {
    return hiddenGoogleButtonElement;
  }

  let mount = document.getElementById("google-hidden-button-mount");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "google-hidden-button-mount";
    mount.setAttribute("aria-hidden", "true");
    mount.style.position = "fixed";
    mount.style.left = "-10000px";
    mount.style.top = "-10000px";
    mount.style.width = "280px";
    mount.style.height = "56px";
    mount.style.opacity = "0";
    document.body.appendChild(mount);
  }

  mount.innerHTML = "";
  google.accounts.id.renderButton(mount, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: 280
  });

  hiddenGoogleButtonElement = mount.querySelector('[role="button"]') || mount.firstElementChild;
  if (!hiddenGoogleButtonElement) {
    throw new Error("Google button unavailable");
  }

  return hiddenGoogleButtonElement;
}

async function requestGoogleIdToken() {
  const google = await ensureGoogleSignInClient();
  const hiddenButton = ensureHiddenGoogleButton(google);
  return new Promise((resolve, reject) => {
    google.accounts.id.cancel();

    const timeout = setTimeout(() => {
      if (!googleCredentialRejecter) return;
      googleCredentialRejecter(new Error("Google login cancelled"));
      googleCredentialResolver = null;
      googleCredentialRejecter = null;
    }, 20000);

    googleCredentialResolver = (idToken) => {
      clearTimeout(timeout);
      resolve(idToken);
    };
    googleCredentialRejecter = (error) => {
      clearTimeout(timeout);
      reject(error);
    };

    hiddenButton.click();
  });
}

function googleLoginErrorMessage(error) {
  if (!error) return "No pudimos iniciar sesion con Google.";
  if (error.message === "Google login cancelled") return "Inicio de sesion con Google cancelado.";
  if (error.message === "Google did not return an idToken") return "Google no devolvio un idToken.";
  if (error.message === "Google button unavailable") return "No se pudo abrir el selector de cuentas de Google.";
  if (error.message === "Missing Google Client ID") return "Falta VITE_GOOGLE_CLIENT_ID.";
  if (error.message === "Google login unavailable") return "Google Identity Services no esta disponible.";
  if (error.code === "NETWORK_ERROR") return "Error de red al conectar con backend.";
  if (error.status === 400) return "Solicitud invalida al iniciar sesion con Google.";
  if (error.status === 401) return "Token de Google invalido o expirado.";
  if (error.status === 409) return "Conflicto de cuenta al iniciar sesion con Google.";
  if (error.status === 500) return "Error interno del servidor durante login con Google.";
  return "No pudimos iniciar sesion con Google.";
}

function renderInlineNotice(anchor, message) {
  const container = anchor?.parentElement || app || document.body;
  let notice = container.querySelector(".inline-alert");

  if (!notice) {
    notice = document.createElement("div");
    notice.className = "inline-alert";
    notice.setAttribute("role", "alert");
    notice.setAttribute("aria-live", "polite");
  }

  notice.textContent = message;
  if (anchor?.nextElementSibling) {
    anchor.parentElement.insertBefore(notice, anchor.nextElementSibling);
  } else {
    container.appendChild(notice);
  }
}

function implementationBanner(feature = "Esta opción") {
  return `<p class="implementation-banner" role="status"><strong>${feature} está en implementación.</strong> Por ahora usa <strong>Google</strong> o <strong>registro con email</strong>.</p>`;
}

function showUnderImplementation(feature = "Esta opción", anchor = null) {
  const message = `${feature} está en implementación. Usa Google o email.`;
  renderInlineNotice(anchor, message);
}

function showComingSoon(provider = "Esta opción", anchor = null) {
  showUnderImplementation(provider, anchor);
}

function buildLocalRegisterPayload(firstName, lastName) {
  return {
    email: (store.register.email || "").trim(),
    password: store.register.password || "",
    firstName: (firstName || "").trim(),
    lastName: (lastName || "").trim(),
    location: null,
    isStudent: false,
    jobTitle: null,
    company: null,
    university: null,
    degree: null,
    discipline: null,
    startYear: null,
    jobSearchStatus: null,
    preferredTitles: [],
    preferredLocations: [],
    remoteInterested: false,
    jobAlertsEnabled: true,
    recruiterVisibility: true
  };
}

async function completeLocalLogin(email, password, remember = true) {
  const session = await loginLocalAccount({
    email: email.trim(),
    password
  });
  persistExternalSession(session);
  replaceRegister({
    authSource: "local",
    email: session.user.email,
    firstName: session.user.firstName || "",
    lastName: session.user.lastName || ""
  });
  if (remember) saveRemembered(normalizeUserFromBackend(session.user));
  const nextRoute = getPostLoginRoute(session, "/profile/me", store.register);
  if (isPostVerifyRegisterStep(nextRoute)) {
    startPostVerifyRegistrationFlow();
  }
  navigate(nextRoute);
}

function isConfiguredClientId(value) {
  return Boolean(value && !String(value).startsWith("REPLACE_WITH_"));
}

function bindComingSoonOauthGuard() {
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest?.('[data-oauth="apple"]');
      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      showComingSoon("Apple", button);
    },
    true
  );
}

function registerErrorMessage(error) {
  if (!error) return "No pudimos completar el registro.";
  if (error.code === "NETWORK_ERROR") return "Error de red al conectar con backend.";
  if (error.status === 400) return error.message || "Datos invalidos para completar el registro.";
  if (error.status === 401) return "No autorizado para actualizar el registro.";
  if (error.status === 409) return "Ese correo ya esta registrado.";
  if (error.status === 500) return "Error interno del servidor durante el registro.";
  return error.message || "No pudimos completar el registro.";
}

function responseValue(payload, camelName, pascalName) {
  return payload?.[camelName] ?? payload?.[pascalName];
}

async function sendCurrentVerificationCode(force = false) {
  const userId = store.auth?.user?.id;
  if (!userId) {
    renderToast("No encontramos una sesion activa para enviar el codigo.");
    return false;
  }

  if (!force && store.register.verificationCodeSentFor === userId) {
    return true;
  }

  const response = await sendEmailVerificationCode(
    userId,
    store.register.email || store.auth?.user?.email || ""
  );
  const onboarding = responseValue(response, "onboarding", "Onboarding");
  const alreadyVerified = Boolean(responseValue(response, "alreadyVerified", "AlreadyVerified"));
  const codeSent = responseValue(response, "codeSent", "CodeSent") !== false;
  const apiMessage = responseValue(response, "message", "Message");

  saveRegister({ verificationCodeSentFor: userId });
  if (onboarding && (onboarding.completed !== undefined || onboarding.currentStep)) {
    persistOnboardingState(normalizeOnboardingStatus({ onboarding }));
  }

  if (alreadyVerified) {
    renderToast("Tu email ya estaba verificado.");
    persistOnboardingState({
      completed: false,
      currentStep: "JobPreferences"
    });
    saveRegister({
      ...markPostVerifyFlowStarted(store.register),
      ...advanceRegisterProgress("/register/verify-email", store.register)
    });
    navigate("/register/job-search");
    return true;
  }

  if (!codeSent) {
    renderToast(apiMessage || "No se pudo enviar el codigo al correo.");
    return false;
  }

  showVerificationDeliveryHint(apiMessage);
  renderToast(force ? "Codigo reenviado." : "Codigo enviado. Revisa tu correo.");
  return true;
}

function showVerificationDeliveryHint(apiMessage) {
  const form = document.querySelector('form[data-form="register-verify"]');
  if (!form) return;

  let hint = form.querySelector("[data-verification-hint]");
  if (!hint) {
    hint = document.createElement("p");
    hint.className = "verification-hint";
    hint.setAttribute("data-verification-hint", "");
    hint.setAttribute("role", "status");
    form.querySelector(".code-input")?.insertAdjacentElement("afterend", hint);
  }

  hint.hidden = false;
  hint.textContent =
    apiMessage || "Revisa tu bandeja de entrada y la carpeta de spam. El codigo solo llega por correo.";
}

function persistUploadedProfilePhoto(profilePictureUrl) {
  if (!profilePictureUrl) return;
  const resolvedProfilePictureUrl = resolveProfileImageUrl(profilePictureUrl);

  saveRegister({ profilePictureUrl: resolvedProfilePictureUrl });
  if (store.auth?.user) {
    store.auth.user.avatar = resolvedProfilePictureUrl;
    saveAuth();
  }

  if (store.remembered && store.auth?.user?.email === store.remembered.email) {
    store.remembered.avatar = resolvedProfilePictureUrl;
    localStorage.setItem("tl_remembered", JSON.stringify(store.remembered));
  }

  const rawBackendUser = JSON.parse(localStorage.getItem("user") || "{}");
  localStorage.setItem(
    "user",
    JSON.stringify({
      ...rawBackendUser,
      profilePictureUrl: resolvedProfilePictureUrl
    })
  );
}

function parseJobSearchStatus(rawValue) {
  if (!rawValue) return "NotInterested";
  const normalized = rawValue.trim().toLowerCase();
  if (normalized.startsWith("si")) return "Active";
  if (normalized.startsWith("quiz")) return "Open";
  return "NotInterested";
}

function splitCsvList(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOnboardingStatus(payload) {
  const nested = payload?.onboarding || payload?.Onboarding || payload || {};
  return {
    completed: Boolean(responseValue(nested, "completed", "Completed")),
    currentStep: responseValue(nested, "currentStep", "CurrentStep") || ""
  };
}

function buildLocalProfileUpdatePayload({ completeOnboarding = false } = {}) {
  const authUserId = store.auth?.user?.id;
  const jobSearchAnswered = Boolean((store.register.jobSearch || "").trim());
  const preferredJobs = splitCsvList(store.register.preferredJobs || "");
  const preferredLocations = splitCsvList(store.register.jobLocations || "");

  const payload = {
    userId: authUserId,
    completeOnboarding,
    firstName: (store.register.firstName || "").trim() || null,
    lastName: (store.register.lastName || "").trim() || null,
    location: (store.register.location || "").trim() || null,
    isStudent: Boolean(store.register.isStudent),
    jobTitle: (store.register.jobTitle || "").trim() || null,
    company: (store.register.company || "").trim() || null,
    university: (store.register.university || "").trim() || null,
    degree: (store.register.degree || "").trim() || null,
    discipline: (store.register.discipline || "").trim() || null,
    startYear: store.register.startYear ? Number(store.register.startYear) : null,
    preferredTitles: preferredJobs,
    preferredLocations,
    remoteInterested: Boolean(store.register.remote),
    jobAlertsEnabled: true,
    recruiterVisibility: true
  };

  if (jobSearchAnswered) {
    payload.jobSearchStatus = parseJobSearchStatus(store.register.jobSearch);
  } else if (preferredJobs.length && preferredLocations.length) {
    payload.jobSearchStatus = parseJobSearchStatus(store.register.jobSearch || "Sí");
  }

  return payload;
}

function startPostVerifyRegistrationFlow() {
  saveRegister(markPostVerifyFlowStarted(store.register));
}

function goToNextPostVerifyStep(currentPath, options = {}) {
  const nextPath = getNextPostVerifyStep(currentPath, options);
  saveRegister(advanceRegisterProgress(currentPath, store.register));
  navigate(nextPath);
}

async function waitForMsal(timeoutMs = 7000) {
  if (window.msal?.PublicClientApplication) return window.msal;
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (window.msal?.PublicClientApplication) {
        clearInterval(timer);
        resolve(window.msal);
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Microsoft login unavailable"));
      }
    }, 50);
  });
}

async function ensureMsalClient() {
  if (!isConfiguredClientId(MICROSOFT_CLIENT_ID)) {
    throw new Error("Missing Microsoft Client ID");
  }

  const msal = await waitForMsal();
  if (msalInstance) return msalInstance;

  msalInstance = new msal.PublicClientApplication({
    auth: {
      clientId: MICROSOFT_CLIENT_ID,
      authority: "https://login.microsoftonline.com/common",
      redirectUri: window.location.origin
    },
    cache: {
      cacheLocation: "sessionStorage"
    }
  });
  await msalInstance.initialize();
  return msalInstance;
}

async function requestMicrosoftIdToken() {
  const client = await ensureMsalClient();
  const response = await client.loginPopup({
    scopes: ["openid", "profile", "email", "User.Read"]
  });
  const idToken = response?.idToken;
  if (!idToken) {
    throw new Error("Microsoft did not return an idToken");
  }
  return idToken;
}

async function requestProviderIdToken(provider) {
  if (provider === "google") return requestGoogleIdToken();
  if (provider === "microsoft") return requestMicrosoftIdToken();
  throw new Error(`${provider} login unavailable`);
}

function microsoftLoginErrorMessage(error) {
  if (!error) return "No pudimos iniciar sesion con Microsoft.";
  if (error.message === "Missing Microsoft Client ID") {
    return "Microsoft está en implementación (falta configurar el Client ID).";
  }
  if (error.message === "Microsoft login unavailable") {
    return "Microsoft Identity no está disponible.";
  }
  if (error.message === "Microsoft did not return an idToken") {
    return "Microsoft no devolvió un idToken.";
  }
  if (error.code === "NETWORK_ERROR") return "Error de red al conectar con el backend.";
  if (error.status === 401) return "Token de Microsoft inválido o expirado.";
  return error.message || "No pudimos iniciar sesion con Microsoft.";
}

async function loginWithProvider(provider) {
  const idToken = await requestProviderIdToken(provider);
  const session = await postExternalLogin(provider, idToken);
  persistExternalSession(session);
  if (shouldContinueRegistration(session)) {
    syncRegisterFromProviderSession(session, provider);
    if (session.verificationCodeSent) {
      renderToast(
        "Registro iniciado. Tras ubicacion y experiencia, revisa tu correo para el codigo de verificacion."
      );
    } else if (session.verificationMessage) {
      renderToast(session.verificationMessage);
    }
  }
  const nextRoute = getPostLoginRoute(session, "/profile/me", store.register);
  if (isPostVerifyRegisterStep(nextRoute)) {
    startPostVerifyRegistrationFlow();
  }
  navigate(nextRoute);
}

function login(user = demoUser) {
  store.auth = { isLoggedIn: true, user: { ...demoUser, ...user } };
  saveAuth();
  saveRemembered(store.auth.user);
  navigate("/feed");
}

function logout() {
  clearSessionAndRegisterState();
  navigate("/");
}

async function cancelRegistration() {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    try {
      await cancelIncompleteRegistration();
    } catch {
      // Local cleanup still prevents access to incomplete profiles if the API is unavailable.
    }
  }

  clearSessionAndRegisterState({ clearRemembered: true });
  history.replaceState({}, "", "/");
  render();
}

function navigate(path) {
  history.pushState({}, "", path);
  render();
}

function maskedEmail(email = "") {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 1)}${"*".repeat(Math.max(4, name.length - 1))}@${domain}`;
}

function initials(name = "Ximena Afanador") {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function progress() {
  const index = registerSteps.indexOf(location.pathname);
  return index < 0 ? 0 : Math.round(((index + 1) / registerSteps.length) * 100);
}

function linkedinLogo({ cancelRegistrationFlow = false } = {}) {
  if (cancelRegistrationFlow) {
    return `<button type="button" class="li-logo logo-button" data-action="cancel-registration" aria-label="Cancelar registro y volver al inicio"><span>Linked</span><b>in</b></button>`;
  }

  return `<a href="/" class="li-logo" data-link><span>Linked</span><b>in</b></a>`;
}

function googleIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.77-.07-1.51-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.41 13.9A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.9V7.5H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.5l3.34-2.6z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.5l3.34 2.6C7.2 7.74 9.4 5.98 12 5.98z"/></svg>`;
}

function microsoftIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f25022" d="M3 3h8v8H3z"/><path fill="#7fba00" d="M13 3h8v8h-8z"/><path fill="#00a4ef" d="M3 13h8v8H3z"/><path fill="#ffb900" d="M13 13h8v8h-8z"/></svg>`;
}

function appleIcon() {
  return `<span class="apple-mark"></span>`;
}

function liIcon() {
  return `<span class="li-icon">in</span>`;
}

function oauthButton(provider, label) {
  const icon = provider === "google" ? googleIcon() : provider === "microsoft" ? microsoftIcon() : appleIcon();
  return `<button class="oauth-btn" data-oauth="${provider}" type="button">${icon}<span>${label}</span></button>`;
}

function legalText() {
  return `<p class="legal">Al hacer clic en «Continuar» para unirte o iniciar sesión, aceptas las <a href="#">Condiciones de uso</a>, la <a href="#">Política de privacidad</a> y la <a href="#">Política de cookies</a> de LinkedIn.</p>`;
}

function publicNav({ joinOutline = false, simple = false } = {}) {
  return `
    <header class="public-nav">
      ${linkedinLogo()}
      ${simple ? "" : `<nav><a class="${joinOutline ? "btn-outline" : ""}" href="/login" data-link>Iniciar sesión</a><a class="${joinOutline ? "btn-outline" : "btn-primary"}" href="/register" data-link>&Uacute;nete ahora</a></nav>`}
    </header>
  `;
}

function authCard(content, footer = "") {
  return `${publicNav({ simple: true })}<main class="auth-main"><section class="auth-card">${content}</section>${footer}</main>`;
}

function inputField(label, name, type = "text", value = "", extra = "") {
  return `<label class="li-field"><span>${label}</span><input name="${name}" type="${type}" value="${value}" ${extra}/><small data-error="${name}"></small></label>`;
}

function passwordField(label, name = "password") {
  return `<label class="li-field password-wrap"><span>${label}</span><input name="${name}" type="password"/><button type="button" data-toggle-password="${name}">Mostrar</button><small data-error="${name}"></small></label>`;
}

function divider(text = "o") {
  return `<div class="divider"><span></span><b>${text}</b><span></span></div>`;
}

function avatar(user = demoUser, size = "") {
  const avatarUrl = resolveProfileImageUrl(user.avatar);
  const fallbackInitials = initials(user.name);
  return `<span class="avatar ${size}">${avatarUrl ? `<img src="${avatarUrl}" alt="" onerror="this.remove(); this.parentElement.textContent='${fallbackInitials}';">` : fallbackInitials}</span>`;
}

function renderLanding() {
  return `
    ${publicNav()}
    <div class="landing-wrapper">
    <main class="landing-page">
      <section class="landing-copy">
        <h1>¡Te damos la bienvenida a tu comunidad profesional!</h1>
        <div class="landing-actions">
          ${oauthButton("google", "Continuar con Google")}
          ${oauthButton("microsoft", "Continuar con Microsoft")}
          <a class="oauth-btn" href="/login" data-link>Iniciar sesión con el email</a>
        </div>
        ${legalText()}
        ${divider("")}
        <p class="join-note">¿Estás empezando a usar LinkedIn? <a href="/register" data-link>&Uacute;nete ahora</a></p>
      </section>
      <section class="landing-art" aria-label="Ilustración profesional">
        <svg viewBox="0 0 560 420" role="img">
          <circle cx="410" cy="80" r="50" fill="#dceeff"/>
          <circle cx="190" cy="280" r="78" fill="#f5d6c6"/>
          <rect x="205" y="58" width="210" height="230" rx="22" fill="#ffffff" stroke="#c9cdd2"/>
          <rect x="236" y="98" width="150" height="18" rx="9" fill="#0a66c2"/>
          <rect x="236" y="134" width="112" height="14" rx="7" fill="#c9cdd2"/>
          <rect x="236" y="166" width="128" height="14" rx="7" fill="#c9cdd2"/>
          <circle cx="116" cy="120" r="42" fill="#e9f4e8"/>
          <path d="M95 176c28-30 58-30 90 0v64H95z" fill="#7fb3d5"/>
          <circle cx="132" cy="130" r="25" fill="#f3c3a3"/>
          <path d="M360 278c36-42 78-42 120 0v70H360z" fill="#9cc4b2"/>
          <circle cx="420" cy="230" r="29" fill="#f3c3a3"/>
          <path d="M65 342h430" stroke="#c9cdd2" stroke-width="5" stroke-linecap="round"/>
          <rect x="76" y="302" width="74" height="44" rx="8" fill="#f8c77e"/>
          <rect x="456" y="120" width="48" height="90" rx="12" fill="#fff" stroke="#c9cdd2"/>
        </svg>
      </section>
    </main>
    </div>
  `;
}

function renderLogin() {
  if (store.remembered) return renderWelcomeBack();

  return authCard(`
    <h1>Iniciar sesión</h1>
    ${oauthButton("google", "Continue with Google")}
    ${oauthButton("microsoft", "Iniciar sesión con Microsoft")}
    ${oauthButton("apple", "Iniciar sesión con Apple")}
    ${legalText()}
    ${divider()}
    <form data-form="login">
      ${inputField("Email o teléfono", "email", "text")}
      ${passwordField("Contraseña")}
      <a class="blue-link" href="/forgot-password" data-link>¿Has olvidado tu contraseña?</a>
      <label class="li-check"><input type="checkbox" name="remember" checked/> Mantener la sesión iniciada</label>
      <button class="btn-primary wide" type="submit">Iniciar sesión</button>
    </form>
  `, `<p class="auth-footer">¿Estás empezando a usar LinkedIn? <a href="/register" data-link>&Uacute;nete ahora</a></p>`);
}

function renderWelcomeBack() {
  const user = store.remembered;
  return authCard(`
    <h1>¡Te damos la bienvenida de nuevo!</h1>
    <div class="remembered-row">
      ${avatar(user)}
      <div><b>${user.name}</b><span>${maskedEmail(user.email)}</span></div>
      <button type="button" class="more-btn">...</button>
    </div>
    <form data-form="welcome">
      ${passwordField("Contraseña")}
      <a class="blue-link" href="/forgot-password" data-link>¿Has olvidado tu contraseña?</a>
      <button class="btn-primary wide" type="submit">Iniciar sesión</button>
    </form>
    ${divider()}
    ${legalText()}
    ${oauthButton("google", "Continue with Google")}
    <hr/>
    <button class="text-btn" data-action="other-account">Iniciar sesión con otra cuenta</button>
  `);
}

function renderForgot() {
  return `
    ${publicNav({ joinOutline: true })}
    <main class="center-page">
      <section class="wide-card">
        <h1>¿Has olvidado tu contraseña?</h1>
        <p class="form-copy">Enviaremos un código de verificación a este email o número de teléfono si coincide con una cuenta de LinkedIn existente.</p>
        ${implementationBanner("La recuperación de contraseña")}
        <form data-form="forgot" class="email-registration-section">
          ${inputField("Email o teléfono", "email")}
          <button class="btn-primary wide" type="submit">Siguiente</button>
          <button class="text-btn" type="button" data-back="/login">Volver</button>
        </form>
      </section>
      ${footerLinks()}
    </main>
  `;
}

function renderForgotVerify() {
  const email = store.forgot.email || demoUser.email;
  return `
    ${publicNav({ simple: true })}
    <main class="center-page">
      <section class="wide-card">
        <h1>Introduce el código de 6 dígitos</h1>
        <p class="form-copy">Consulta el código de verificación en ${maskedEmail(email)}. <a href="/forgot-password" data-link>Cambiar</a></p>
        <form data-form="forgot-verify">
          <input class="code-input" name="code" inputmode="numeric" maxlength="6" placeholder="000000"/>
          <small data-error="code"></small>
          <button class="oauth-btn wide" type="button" data-action="resend-code">Reenviar código</button>
          <button class="btn-primary wide" type="submit">Enviar</button>
        </form>
        <p class="small-copy">Si no ves el email en tu buzón, consulta la carpeta de correo no deseado o de promociones.</p>
        <a class="blue-link" href="#">¿No puedes acceder a este email?</a>
      </section>
    </main>
  `;
}

function renderResetPassword() {
  return `
    ${publicNav()}
    <main class="center-page">
      <section class="wide-card">
        <h1>Escoge otra contraseña</h1>
        <p class="form-copy">Para proteger tu cuenta, elige una contraseña segura que no hayas usado antes y que tenga al menos 8 caracteres.</p>
        <a class="blue-link" href="#">¿Cómo debe ser una contraseña segura?</a>
        <form data-form="reset">
          ${passwordField("Contraseña nueva", "password")}
          ${inputField("Vuelve a escribir tu contraseña", "confirm", "password")}
          <label class="li-check"><input type="checkbox" checked/> Solicita que todos los dispositivos inicien sesión con la nueva contraseña</label>
          <button class="btn-primary wide" type="submit">Enviar</button>
        </form>
      </section>
    </main>
  `;
}

function renderResetSuccess() {
  return `
    <header class="public-nav">${linkedinLogo()}<nav><a href="/feed" data-link>Ir a LinkedIn</a>${avatar(demoUser, "mini")}</nav></header>
    <main class="center-page">
      <section class="wide-card success-card">
        <h1>Se ha cambiado tu contraseña</h1>
        <svg class="rocket" viewBox="0 0 120 120"><path d="M63 13c21 9 32 25 34 48L76 82 38 44z" fill="#0a66c2"/><path d="M37 45 22 52l18 8zM75 83l-7 16-8-18z" fill="#f8c77e"/><circle cx="68" cy="44" r="9" fill="#fff"/><path d="M38 77c-10 4-16 11-18 23 12-2 20-8 24-18z" fill="#0a66c2"/></svg>
        <a class="btn-primary wide" href="/feed" data-link>Ir a LinkedIn</a>
        <aside class="security-callout"><a href="#">Activar el proceso de verificación en dos pasos -&gt;</a><p>La verificación en dos pasos es un nivel añadido de seguridad para tu cuenta.</p></aside>
      </section>
    </main>
  `;
}

function registerShell(content, options = {}) {
  return `
    <div class="register-progress"><span style="width:${progress()}%"></span></div>
    <main class="register-page">
      <div class="register-top">${linkedinLogo({ cancelRegistrationFlow: true })}${options.skip ? `<a href="${options.skip}" data-link>Omitir</a>` : ""}</div>
      <section class="register-panel slide-in">${content}</section>
    </main>
  `;
}

function navButtons(back, disabled = false, label = "Continuar") {
  return `<div class="step-actions"><a class="back-circle" href="${back}" data-link>&larr;</a><button class="btn-primary" type="submit" ${disabled ? "disabled" : ""}>${label}</button></div>`;
}

function renderRegisterStart() {
  return registerShell(`
    <h1>&Uacute;nete a LinkedIn. &iexcl;Es gratis!</h1>
    <form data-form="register-start">
      ${inputField("Email", "email", "email", store.register.email || "")}
      ${passwordField("Contraseña")}
      <label class="li-check"><input type="checkbox" checked/> Recordarme</label>
      ${legalText()}
      <button class="btn-primary wide" type="submit">Aceptar y unirse</button>
      ${divider()}
      ${oauthButton("google", "Continuar con Google")}
      ${oauthButton("microsoft", "Continuar con Microsoft")}
    </form>
    <p class="auth-footer">¿Ya estás en LinkedIn? <a href="/login" data-link>Iniciar sesión</a></p>
    <p class="company-help">¿Quieres crear una página de empresa? <a href="#">Obtener ayuda</a></p>
  `);
}

function renderRegisterName() {
  return registerShell(`
    <h1>&Uacute;nete a LinkedIn. &iexcl;Es gratis!</h1>
    <form data-form="register-name">
      ${inputField("Nombre", "firstName", "text", store.register.firstName || "")}
      ${inputField("Apellidos", "lastName", "text", store.register.lastName || "")}
      <button class="btn-primary wide" type="submit">Continuar</button>
    </form>
  `);
}

function renderRegisterLocation() {
  return registerShell(`
    <h1>Añade tu ubicación</h1>
    <p class="form-copy">Esto nos ayuda a recomendarte personas, empleos y noticias en tu zona.</p>
    <form data-form="register-location">
      <div class="location-autocomplete">
        <label class="li-field">
          <span>Ubicación*</span>
          <input id="locationInput" name="location" type="text" autocomplete="off" placeholder="Escribe tu ciudad..."/>
          <small data-error="location"></small>
        </label>
        <ul id="locationSuggestions" class="location-dropdown" hidden></ul>
      </div>
      <button class="btn-primary wide" type="submit">Continuar</button>
    </form>
  `);
}

function renderRegisterExperience() {
  const isStudent = store.register.isStudent ?? false;
  return registerShell(`
    <h1>¿Cuál es tu experiencia más reciente?</h1>
    <p class="form-copy">Puedes cambiar esto más adelante.</p>
    <form data-form="register-experience">
      <label class="switch-row">Soy estudiante <input type="checkbox" name="isStudent" ${isStudent ? "checked" : ""} data-action="toggle-student"/><span></span></label>
      <div data-experience-fields>
        ${isStudent ? studentFields() : professionalFields()}
      </div>
      ${navButtons("/register/location")}
    </form>
  `);
}

function studentFields() {
  return `
    ${inputField("Universidad o institución educativa*", "university", "text", store.register.university || "", 'placeholder="Ejemplo: Universidad de Salamanca"')}
    ${inputField("Titulación", "degree", "text", store.register.degree || "", 'placeholder="Ejemplo: grado/licenciatura en Letras"')}
    ${inputField("Disciplina académica*", "discipline", "text", store.register.discipline || "", 'placeholder="Ejemplo: administración de empresas"')}
    ${inputField("Año inicio*", "startYear", "number", store.register.startYear || "2024")}
    <label class="li-check"><input name="age" type="checkbox" checked/> Tengo más de 16 años</label>
  `;
}

function professionalFields() {
  return `
    ${inputField("Cargo*", "jobTitle", "text", store.register.jobTitle || "Maestro", 'placeholder="Ejemplo: Maestro"')}
    ${inputField("Empresa*", "company", "text", store.register.company || "Campuslands", 'placeholder="Ejemplo: Microsoft"')}
  `;
}

function renderRegisterVerifyEmail() {
  const targetEmail = store.register.email || store.auth?.user?.email || demoUser.email;
  return registerShell(`
    <h1>Verifica tu email</h1>
    <p class="form-copy">Introduce el código de 6 dígitos que te hemos enviado a: ${targetEmail}</p>
    <form data-form="register-verify">
      <input class="code-input" name="code" maxlength="6" placeholder="Código de seis dígitos" inputmode="numeric"/>
      <p class="verification-hint" data-verification-hint hidden></p>
      <small data-error="code"></small>
      <button class="oauth-btn wide" type="button" data-action="resend-code">Reenviar código</button>
      <details class="privacy-box"><summary>&#128737; Tu privacidad es muy importante</summary><p>Controlas cómo se usa tu información durante el registro.</p></details>
      ${navButtons("/register/experience", true)}
    </form>
  `);
}

function renderJobSearch() {
  const backRoute = "/register/verify-email";
  return registerShell(`
    <h1>¿Estás buscando empleo?</h1>
    <p class="form-copy">Tu respuesta nos ayudará a personalizar tu experiencia, pero solo tú podrás verla.</p>
    <form data-form="job-search">
      ${["Sí, estoy buscando empleo de forma activa", "Quizá, si encuentro la oportunidad adecuada", "No, ahora no me interesa"].map((text) => `<label class="radio-card"><input type="radio" name="jobSearch" value="${text}"/><span>${text}</span></label>`).join("")}
      ${navButtons(backRoute, true)}
    </form>
  `);
}

function renderJobPreferences() {
  return registerShell(`
    <h1>¿Qué tipo de empleos podrían interesarte?</h1>
    <p class="form-copy">Puedes seleccionar hasta 5 cargos y ubicaciones.</p>
    <form data-form="job-preferences">
      ${inputField("Cargos", "preferredJobs", "text", store.register.preferredJobs || "", 'placeholder="Ejemplo: responsable de ventas minoristas"')}
      ${inputField("Ubicaciones de empleo", "jobLocations", "text", store.register.jobLocations || "", 'placeholder="Ejemplo: Toledo, España"')}
      <label class="li-check"><input name="remote" type="checkbox"/> Me interesa teletrabajar</label>
      ${navButtons("/register/job-search", true)}
    </form>
  `);
}

function renderJobNotifications() {
  return registerShell(`
    <h1>Configura tus notificaciones de empleo</h1>
    <p class="form-copy">Alertas de empleo recomendadas para ti. Podrás crear otras después.</p>
    <form data-form="job-notifications">
      <article class="option-card"><label class="switch-row">Notificaciones de empleos <input type="checkbox" checked/><span></span></label><p>${store.register.preferredJobs || "Teacher"}</p><p>${store.register.jobLocations || "Bucaramanga, Santander, Colombia"}</p></article>
      <article class="option-card"><label class="li-check"><input type="checkbox" checked/> <b>Informa a los técnicos de selección sobre tu interés por nuevos empleos</b></label><div class="privacy-blue">Solo se mostrará según tus preferencias de privacidad. <a href="#">Más información sobre tu privacidad</a></div></article>
      ${navButtons("/register/job-preferences")}
    </form>
  `);
}

function renderPhoto() {
  const user = registeredUser();
  return registerShell(`
    <h1>Añade una foto para que los técnicos de selección den mayor atención a tu perfil</h1>
    <form data-form="photo">
      <article class="photo-preview">
        <button type="button" class="photo-avatar" data-action="choose-profile-photo">${avatar(user, "xl")}<b>+</b></button>
        <input id="profilePhotoInput" name="profilePhoto" type="file" accept="image/*" hidden/>
        <h2>${user.name}</h2>
        <p>${user.headline}</p>
      </article>
      ${navButtons("/register/job-notifications")}
    </form>
  `, { skip: "/register/contacts" });
}

function renderContacts() {
  return registerShell(`
    <h1>Crea tu red por la vía rápida</h1>
    <p class="form-copy">Averigua a quién conoces en LinkedIn.</p>
    <div class="gmail-art"><span>Gmail</span><i>XA</i><i>AR</i><i>CT</i><i>LM</i></div>
    <ul class="benefits"><li>&#128101; Vincula tus contactos de Gmail</li><li>&#128737; Elige quién puede conectar contigo</li><li>&#128200; Mira oportunidades de crecimiento</li></ul>
    <a class="blue-link" href="#">Más información</a>
    <form data-form="contacts">
      <button class="oauth-btn wide" type="button" data-action="open-contacts-modal">Vincular contactos de Gmail</button>
      ${navButtons("/register/photo")}
    </form>
    <div class="google-modal" hidden data-google-modal>
      <section>
        <header>${googleIcon()} <b>Acceder con Google</b></header>
        ${liIcon()}
        <h2>Elige una cuenta</h2>
        <p>Ir a LinkedIn</p>
        <button class="google-account" data-action="google-account">${avatar(registeredUser())}<span><b>${registeredUser().name}</b><small>${registeredUser().email}</small></span></button>
        <button class="text-btn left">&#8857; Usar otra cuenta</button>
        <footer>Español (Latinoamérica) &#9662; <span>Ayuda Privacidad Condiciones</span></footer>
      </section>
    </div>
  `, { skip: "/register/app-download" });
}

const APP_DOWNLOAD_QR_URL = "/QR-LinkedinSimulacion.png";

function renderAppDownload() {
  return registerShell(`
    <h1>Descarga la aplicación para llevar la delantera</h1>
    <p class="form-copy">Lee las noticias de tu sector o habla con tus contactos sobre la marcha. Escanea el código QR para instalar la app.</p>
    <form data-form="app-download">
      <div class="phone-qr" aria-label="Vista previa del teléfono con código QR">
        <span class="phone-notch" aria-hidden="true"></span>
        <img
          class="qr-image"
          src="${APP_DOWNLOAD_QR_URL}"
          alt="Código QR para descargar la aplicación de LinkedIn"
          width="156"
          height="156"
          loading="eager"
        />
        <p class="qr-caption">Escanea para descargar</p>
      </div>
      ${navButtons("/register/contacts")}
    </form>
  `);
}

function renderGames() {
  return registerShell(`
    <h1>Con solo jugar a diario, tendrás 1,5 veces más probabilidades de conectar con algún técnico de selección.</h1>
    <form data-form="games">
      <div class="game-icons">${["Zip", "Tango", "Queens", "Pinpoint", "Crossclimb", "Mini"].map((g, i) => `<span style="--i:${i}">${g[0]}</span>`).join("")}</div>
      <label class="switch-row">Recibir notificaciones para probar juegos de LinkedIn <input type="checkbox" checked/><span></span></label>
      <a class="blue-link" href="#">¿A qué esperas? &#9889; Pruébalo ya</a>
      <article class="game-card"><b>¡Descanso de 30 segundos!</b><h2>Zip</h2><p>Ábrete camino.</p><button class="btn-outline" type="button">Resolver</button></article>
      ${navButtons("/register/app-download", false, "Finalizar")}
    </form>
  `);
}

function registeredUser() {
  const name = `${store.register.firstName || "Ximena"} ${store.register.lastName || "Afanador"}`;
  return {
    ...demoUser,
    name,
    email: store.register.email || demoUser.email,
    avatar: store.register.profilePictureUrl || store.auth?.user?.avatar || demoUser.avatar,
    headline: store.register.jobTitle || store.register.degree || "Profesional",
    location: store.register.location || demoUser.location,
    company: store.register.company || demoUser.company
  };
}

function renderFeed() {
  const user = store.auth.user || registeredUser();
  return `
    ${appNav("Inicio")}
    <main class="feed-layout">
      <aside class="feed-left">
        <section class="profile-mini card">
          <div class="cover-soft"></div>
          <button type="button" class="avatar-plus" data-action="choose-profile-photo">${avatar(user, "large")}<b>+</b></button>
          <input id="profilePhotoInput" name="profilePhoto" type="file" accept="image/*" hidden/>
          <h2>${user.name}</h2>
          <p>${user.headline}</p>
          <small>${user.location}</small>
          <hr/>
          <a href="#">Contactos <b>0</b></a><a href="#">Amplía tu red</a>
          <hr/>
          <a href="#">Preferencias</a><a href="#">Registro de empleos</a><a href="#">Mis perspectivas profesionales</a>
          <a class="blue-link" href="#">Anunciar un empleo gratis</a>
        </section>
        <footer class="mini-footer">Acerca de · Accesibilidad · Condiciones de uso · Privacidad</footer>
      </aside>
      <section class="feed-center">
        <article class="post-composer card">
          ${avatar(user)}
          <button>Crear publicación</button>
          <div><span>Video</span><span>Foto</span><span>Escribir artículo</span></div>
        </article>
        <div class="sort-row"><span></span>Ordenar por: <b>Principales v</b></div>
        <article class="card recommended">
          <h2>Te recomendamos</h2>
          <div class="recommend-grid">${suggestions().map(personSuggestion).join("")}</div>
          <a href="#">Mostrar más &rarr;</a>
        </article>
        <article class="card sponsored">
          <header><span class="company-logo">A</span><div><b>Atlassian</b><small>1.223.901 seguidores · Promocionado</small></div></header>
          <p>Equipos de software modernos construyen mejores productos cuando colaboran con claridad.</p>
          <div class="sponsored-media"></div>
          <footer><button>Like</button><button>Comment</button><button>Repost</button><button>Send</button></footer>
        </article>
      </section>
      <aside class="feed-right">
        <section class="card right-card"><h2>Juegos de hoy</h2>${["Zip #72", "Tango #64", "Queens #88", "Pinpoint #41"].map((g) => `<a href="#"><b>${g}</b><span>Desafío diario ></span></a>`).join("")}<a href="#">Mostrar más v</a></section>
        <section class="card right-card"><h2>Añadir a tu feed</h2>${["IBM", "Claude", "Platzi"].map((name) => `<article><span class="company-logo">${name[0]}</span><div><b>${name}</b><small>Empresa</small><button>+ Seguir</button></div></article>`).join("")}<a href="#">Ver todas las recomendaciones</a></section>
      </aside>
    </main>
  `;
}

function personSuggestion(person) {
  return `<section><span class="avatar">${person.initials}</span><b>${person.name}</b><p>${person.role}</p><small>Los profesionales del sector de Desarrollo de software también siguen a estas personas</small><button class="btn-outline">+ Seguir</button></section>`;
}

function suggestions() {
  return [
    { initials: "AR", name: "Andrea Rojas", role: "Recruiter IT | Selección de talento tech" },
    { initials: "CP", name: "Carlos Pérez", role: "Software Engineer at Globant" },
    { initials: "MD", name: "María Díaz", role: "Talent Acquisition Specialist" }
  ];
}

function appNav(active = "") {
  const items = [
    ["Inicio", "/feed", "&#8962;"],
    ["Mi red", "#", "&#128101;"],
    ["Empleos", "#", "&#128188;"],
    ["Mensajes", "#", "&#128172;"],
    ["Notificaciones", "#", "&#128276;"],
    ["Yo&#9662;", "/profile/me", "&#128100;"],
    ["Para negocios&#9662;", "#", "&#8942;&#8942;&#8942;"]
  ];
  return `
    <header class="app-nav">
      <div class="app-brand">${liIcon()}<label><span>&#8981;</span><input placeholder="Buscar"/></label></div>
      <nav>${items.map(([label, href, icon]) => {
        if (href === "/profile/me") {
          return `
            <div class="nav-dropdown-wrap">
              <a class="nav-yo ${label.startsWith(active) ? "active" : ""}" href="${href}" data-link>
                <i>${icon}</i><span>${label}</span>
              </a>
              <div class="nav-dropdown">
                <a href="/profile/me" data-link>Ver perfil</a>
                <hr/>
                <button data-action="logout">Cerrar sesión</button>
              </div>
            </div>`;
        }
        return `<a class="${label.startsWith(active) ? "active" : ""}" href="${href}" ${href !== "#" ? "data-link" : ""}><i>${icon}</i><span>${label}</span>${label === "Notificaciones" ? "<b>1</b>" : ""}</a>`;
      }).join("")}</nav>
      <a class="premium" href="#">Probar Premium por 0 COP</a>
    </header>
  `;
}

function renderProfile() {
  const user = store.auth.user || demoUser;
  return `
    ${appNav("Yo")}
    <main class="profile-layout">
      <section class="profile-main card">
        <div class="profile-cover"></div>
        <button type="button" class="avatar-plus profile-avatar" data-action="choose-profile-photo">${avatar(user, "xl")}<b>+</b></button>
        <input id="profilePhotoInput" name="profilePhoto" type="file" accept="image/*" hidden/>
        <button class="edit-btn" data-action="edit-profile">&#9998;</button>
        <div class="profile-info">
          <h1>${user.name}</h1>
          <a class="verify-link" href="#">&#10004; Añadir insignia de verificación</a>
          <p id="profileHeadline" data-editable="headline">${user.headline} | HTML y CSS | IA</p>
          <small>${user.location} · <a href="#">Información de contacto</a></small>
          <div class="profile-actions"><button class="btn-primary">Tengo interés en...</button><button class="btn-outline">Añadir sección</button><button class="btn-outline">Mejorar perfil</button><button class="btn-outline">...</button></div>
        </div>
        <aside class="profile-company"><span class="company-logo">C</span><b>${user.company}</b></aside>
      </section>
      <aside class="profile-side">
        <section class="card right-card"><h2>URL y perfil público <button>&#9998;</button></h2><p>www.linkedin.com/in/ximena-afanador-749</p></section>
        <section class="card right-card"><h2>Otros perfiles vistos por tus visitantes</h2><small>Solo para ti</small>${suggestions().concat(suggestions().slice(0, 1)).map((p) => `<article>${avatar({ name: p.name })}<div><b>${p.name}</b><small>${p.role}</small><button>Ver</button></div></article>`).join("")}</section>
      </aside>
    </main>
  `;
}

function footerLinks() {
  return `<footer class="legal-footer">Condiciones de uso · Política de privacidad · Política de cookies · Copyright LinkedIn 2026</footer>`;
}

function renderToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function showError(form, name, message) {
  const target = form.querySelector(`[data-error="${name}"]`);
  if (target) target.textContent = message;
}

function requireFields(form, names) {
  let ok = true;
  names.forEach((name) => {
    const input = form.elements[name];
    if (!input?.value?.trim()) {
      showError(form, name, "Este campo es obligatorio");
      ok = false;
    }
  });
  return ok;
}

function bindPageEvents() {
  document.querySelector('[data-action="cancel-registration"]')?.addEventListener("click", async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    button.disabled = true;
    await cancelRegistration();
  });

  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href"));
    });
  });

  document.querySelectorAll("[data-oauth]").forEach((button) => {
    button.addEventListener("click", async () => {
      const provider = button.dataset.oauth;

      if (provider === "google") {
        button.disabled = true;
        try {
          await loginWithProvider(provider);
        } catch (error) {
          renderToast(googleLoginErrorMessage(error));
        } finally {
          button.disabled = false;
        }
        return;
      }

      if (provider === "microsoft" || provider === "apple") {
        showUnderImplementation(provider === "microsoft" ? "Microsoft" : "Apple", button);
        return;
      }

      showUnderImplementation("Esta opción", button);
    });
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector(`[name="${button.dataset.togglePassword}"]`);
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Mostrar" : "Ocultar";
    });
  });

  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.back)));
  document.querySelector('[data-action="other-account"]')?.addEventListener("click", () => {
    localStorage.removeItem("tl_remembered");
    store.remembered = null;
    render();
  });
  document.querySelectorAll('[data-action="resend-code"]').forEach((button) => {
    button.addEventListener("click", async () => {
      if (location.pathname !== "/register/verify-email") {
        renderToast("Codigo reenviado");
        return;
      }

      button.disabled = true;
      try {
        await sendCurrentVerificationCode(true);
      } catch (error) {
        renderToast(registerErrorMessage(error));
      } finally {
        button.disabled = false;
      }
    });
  });
  document.querySelector('[data-action="toggle-student"]')?.addEventListener("change", (event) => {
    saveRegister({ isStudent: event.target.checked });
    render();
  });
  document.querySelector('[data-action="open-contacts-modal"]')?.addEventListener("click", () => {
    const modal = document.querySelector("[data-google-modal]");
    if (modal) modal.hidden = false;
  });
  document.querySelector('[data-action="google-account"]')?.addEventListener("click", () => {
    goToNextPostVerifyStep("/register/contacts");
  });
  document.querySelector('[data-action="logout"]')?.addEventListener("click", logout);

  if (location.pathname === "/register/verify-email" && hasActiveRegisterSession()) {
    sendCurrentVerificationCode(false).catch((error) => renderToast(registerErrorMessage(error)));
  }

  const profilePhotoInput = document.getElementById("profilePhotoInput");
  document.querySelector('[data-action="choose-profile-photo"]')?.addEventListener("click", () => {
    profilePhotoInput?.click();
  });
  profilePhotoInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const userId = store.auth?.user?.id;
    if (!userId) {
      renderToast("No encontramos una sesion activa para subir la foto.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      renderToast("La foto no puede superar 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      const response = await uploadProfilePhoto(userId, file);
      const profilePictureUrl = responseValue(response, "profilePictureUrl", "ProfilePictureUrl");
      persistUploadedProfilePhoto(profilePictureUrl);
      renderToast("Foto de perfil actualizada.");
      render();
    } catch (error) {
      renderToast(registerErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  });

  if (location.pathname === "/register/location") {
    const locationInput = document.getElementById("locationInput");
    const suggestionsList = document.getElementById("locationSuggestions");

    if (locationInput && suggestionsList) {
      locationInput.value = store.register.location || "";

      let debounceTimer;
      locationInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        const query = locationInput.value.trim();
        if (query.length < 3) {
          suggestionsList.hidden = true;
          return;
        }
        debounceTimer = setTimeout(() => {
          fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`, {
            headers: { "Accept-Language": "es" }
          })
            .then((response) => response.json())
            .then((results) => {
              suggestionsList.innerHTML = "";
              if (!results.length) {
                suggestionsList.hidden = true;
                return;
              }
              results.forEach((place) => {
                const li = document.createElement("li");
                li.textContent = place.display_name;
                li.addEventListener("click", () => {
                  locationInput.value = place.display_name;
                  suggestionsList.hidden = true;
                  saveRegister({ location: place.display_name });
                });
                suggestionsList.appendChild(li);
              });
              suggestionsList.hidden = false;
            });
        }, 400);
      });

      document.addEventListener("click", (event) => {
        if (!event.target.closest(".location-autocomplete")) suggestionsList.hidden = true;
      });
    }
  }

  document.querySelector('[data-action="edit-profile"]')?.addEventListener("click", () => {
    const el = document.getElementById("profileHeadline");
    if (!el || el.querySelector("textarea")) return;

    const original = el.textContent.trim();
    el.innerHTML = `
      <textarea class="edit-textarea">${original}</textarea>
      <div class="edit-actions">
        <button class="btn-primary" data-action="save-headline">Guardar</button>
        <button class="btn-outline" data-action="cancel-headline">Cancelar</button>
      </div>`;

    document.querySelector('[data-action="save-headline"]').addEventListener("click", () => {
      const newVal = el.querySelector("textarea").value.trim() || original;
      if (store.auth.user) {
        store.auth.user.headline = newVal;
        saveAuth();
      }
      el.innerHTML = newVal;
    });

    document.querySelector('[data-action="cancel-headline"]').addEventListener("click", () => {
      el.innerHTML = original;
    });
  });

  document.querySelector(".profile-actions .btn-outline:nth-child(3)")?.addEventListener("click", () => {
    document.querySelector('[data-action="edit-profile"]')?.click();
  });

  bindForms();
}

function bindForms() {
  const form = document.querySelector("form[data-form]");
  if (!form) return;
  const syncJobSearchContinueButton = () => {
    if (form.dataset.form !== "job-search") return;
    const continueButton = form.querySelector(".step-actions button");
    if (continueButton) continueButton.disabled = !form.querySelector('input[name="jobSearch"]:checked');
  };

  form.addEventListener("input", () => {
    form.querySelectorAll("small[data-error]").forEach((small) => (small.textContent = ""));
    if (form.dataset.form === "register-verify") form.querySelector(".step-actions button").disabled = form.code.value.length < 6;
    syncJobSearchContinueButton();
    if (form.dataset.form === "job-preferences") form.querySelector(".step-actions button").disabled = !form.preferredJobs.value.trim() || !form.jobLocations.value.trim();
  });
  form.addEventListener("change", syncJobSearchContinueButton);
  syncJobSearchContinueButton();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      await handleForm(form);
    } catch (error) {
      renderToast(registerErrorMessage(error));
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function handleForm(form) {
  const data = Object.fromEntries(new FormData(form));
  const submitButton = form.querySelector('button[type="submit"]');
  const providerRegistrationRequiredForms = new Set([
    "register-location",
    "register-experience",
    "register-verify",
    "job-search",
    "job-preferences",
    "job-notifications",
    "photo",
    "contacts",
    "app-download",
    "games"
  ]);

  if (providerRegistrationRequiredForms.has(form.dataset.form) && !hasActiveRegisterSession()) {
    renderToast("Inicia el registro con email o Google antes de continuar.");
    return;
  }

  const route = {
    login: async () => {
      if (!requireFields(form, ["email", "password"])) return;
      if (data.password.length < 8) return showError(form, "password", "Debe tener al menos 8 caracteres");
      await completeLocalLogin(data.email, data.password, Boolean(data.remember));
    },
    welcome: async () => {
      if (!requireFields(form, ["password"])) return;
      const email = store.remembered?.email;
      if (!email) return renderToast("No encontramos el email recordado.");
      await completeLocalLogin(email, data.password, true);
    },
    forgot: () => showUnderImplementation("La recuperación de contraseña", form.querySelector('button[type="submit"]')),
    "forgot-verify": () => /^\d{6}$/.test(data.code || "") ? navigate("/reset-password") : showError(form, "code", "Introduce 6 dígitos"),
    reset: () => {
      if (!requireFields(form, ["password", "confirm"])) return;
      if (data.password.length < 8) return showError(form, "password", "Debe tener al menos 8 caracteres");
      if (data.password !== data.confirm) return showError(form, "confirm", "Las contraseñas no coinciden");
      saveRemembered(demoUser);
      store.auth = { isLoggedIn: true, user: demoUser };
      saveAuth();
      navigate("/reset-password/success");
    },
    "register-start": () => {
      if (!requireFields(form, ["email", "password"])) return;
      if (data.password.length < 8) return showError(form, "password", "Debe tener al menos 8 caracteres");
      replaceRegister({
        authSource: "local",
        email: data.email.trim(),
        password: data.password
      });
      navigate("/register/name");
    },
    "register-name": async () => {
      if (!requireFields(form, ["firstName", "lastName"])) return;
      saveRegister({ ...data, authSource: store.register.authSource || "local" });

      if (hasActiveRegisterSession()) {
        const onboarding = await updateLocalRegisterProfile(buildLocalProfileUpdatePayload());
        persistOnboardingState(normalizeOnboardingStatus(onboarding));
        saveRegister(advanceRegisterProgress("/register/name", store.register));
        navigate("/register/location");
        return;
      }

      if (!store.register.email || !store.register.password) {
        renderToast("Completa el email y la contraseña en el paso anterior.");
        navigate("/register");
        return;
      }

      const session = await registerLocalAccount(
        buildLocalRegisterPayload(data.firstName, data.lastName)
      );
      persistExternalSession(session);
      syncRegisterFromProviderSession(session, "local");
      if (session.verificationMessage) renderToast(session.verificationMessage);
      navigate(getRequiredRegisterPath(store.register, {
        isLoggedIn: true,
        onboarding: session.onboarding || {}
      }));
    },
    "register-location": async () => {
      if (!requireFields(form, ["location"])) return;
      saveRegister(data);
      saveRegister(advanceRegisterProgress("/register/location", store.register));
      if (hasActiveRegisterSession()) {
        const onboarding = await updateLocalRegisterProfile(buildLocalProfileUpdatePayload());
        persistOnboardingState(normalizeOnboardingStatus(onboarding));
      }
      navigate("/register/experience");
    },
    "register-experience": async () => {
      saveRegister({ ...data, isStudent: Boolean(form.elements.isStudent?.checked) });
      if (hasActiveRegisterSession()) {
        const onboarding = await updateLocalRegisterProfile(buildLocalProfileUpdatePayload());
        persistOnboardingState(normalizeOnboardingStatus(onboarding));
      }
      const nextPath = getRouteAfterExperience(store.auth?.onboarding);
      saveRegister(advanceRegisterProgress("/register/experience", store.register));
      if (nextPath === "/register/job-search") {
        saveRegister(markPostVerifyFlowStarted(store.register));
      }
      navigate(nextPath);
    },
    "register-verify": async () => {
      const code = (data.code || "").trim();
      if (!/^\d{6}$/.test(code)) return showError(form, "code", "Introduce el codigo de seis digitos");

      const userId = store.auth?.user?.id;
      if (!userId) return showError(form, "code", "No encontramos una sesion activa");

      try {
        const response = await verifyEmailCode(userId, code);
        persistOnboardingState(normalizeOnboardingStatus(response));
        saveRegister({
          ...markPostVerifyFlowStarted(store.register),
          ...advanceRegisterProgress("/register/verify-email", store.register)
        });
        navigate("/register/job-search");
      } catch (error) {
        if (error.status === 400 || error.status === 401) {
          showError(form, "code", "Codigo invalido o vencido");
          return;
        }
        throw error;
      }
    },
    "job-search": async () => {
      const selected = form.querySelector('input[name="jobSearch"]:checked');
      if (!selected?.value) return;
      saveRegister({ jobSearch: selected.value });
      const skipJobPreferences = selected.value === "No, ahora no me interesa";
      if (hasActiveRegisterSession()) {
        try {
          const onboarding = await updateLocalRegisterProfile(buildLocalProfileUpdatePayload());
          persistOnboardingState(normalizeOnboardingStatus(onboarding));
        } catch (error) {
          renderToast(registerErrorMessage(error));
          return;
        }
      }
      saveRegister(advanceRegisterProgress("/register/job-search", store.register));
      const nextPath = getNextPostVerifyStep("/register/job-search", { skipJobPreferences });
      navigate(nextPath);
    },
    "job-preferences": async () => {
      if (!requireFields(form, ["preferredJobs", "jobLocations"])) return;
      saveRegister({ ...data, remote: Boolean(form.elements.remote?.checked) });
      if (hasActiveRegisterSession()) {
        const onboarding = await updateLocalRegisterProfile(buildLocalProfileUpdatePayload());
        persistOnboardingState(normalizeOnboardingStatus(onboarding));
      }
      goToNextPostVerifyStep("/register/job-preferences");
    },
    "job-notifications": () => goToNextPostVerifyStep("/register/job-notifications"),
    photo: async () => {
      const file = document.getElementById("profilePhotoInput")?.files?.[0];
      const userId = store.auth?.user?.id;
      if (file && userId) {
        const response = await uploadProfilePhoto(userId, file);
        const profilePictureUrl = responseValue(response, "profilePictureUrl", "ProfilePictureUrl");
        persistUploadedProfilePhoto(profilePictureUrl);
      }
      goToNextPostVerifyStep("/register/photo");
    },
    contacts: () => goToNextPostVerifyStep("/register/contacts"),
    "app-download": () => goToNextPostVerifyStep("/register/app-download"),
    games: async () => {
      if (hasActiveRegisterSession()) {
        const onboarding = await updateLocalRegisterProfile(
          buildLocalProfileUpdatePayload({ completeOnboarding: true })
        );
        persistOnboardingState(normalizeOnboardingStatus(onboarding));
      }

      saveRegister({ postVerifyActive: false, postVerifyMaxStep: null, postVerifyMaxIndex: -1 });

      const profileUser = registeredUser();
      if (store.auth.user) {
        store.auth.user = {
          ...store.auth.user,
          ...profileUser
        };
      }
      saveAuth();
      saveRemembered(store.auth.user || profileUser);
      navigate(hasActiveRegisterSession() ? "/profile/me" : "/feed");
    }
  }[form.dataset.form];
  await route?.();
}

function routeView() {
  let path = location.pathname;
  const enforcedPath = enforceRegisterPath(path, store.register, store.auth);
  if (enforcedPath !== path) {
    history.replaceState({}, "", enforcedPath);
    path = enforcedPath;
  }

  const routes = {
    "/": renderLanding,
    "/login": renderLogin,
    "/forgot-password": renderForgot,
    "/forgot-password/verify": renderForgotVerify,
    "/reset-password": renderResetPassword,
    "/reset-password/success": renderResetSuccess,
    "/register": renderRegisterStart,
    "/register/name": renderRegisterName,
    "/register/location": renderRegisterLocation,
    "/register/experience": renderRegisterExperience,
    "/register/verify-email": renderRegisterVerifyEmail,
    "/register/job-search": renderJobSearch,
    "/register/job-preferences": renderJobPreferences,
    "/register/job-notifications": renderJobNotifications,
    "/register/photo": renderPhoto,
    "/register/contacts": renderContacts,
    "/register/app-download": renderAppDownload,
    "/register/games": renderGames,
    "/feed": renderFeed,
    "/profile/me": renderProfile
  };

  if (path === "/register/verify-email" && !shouldShowEmailVerificationStep(store.auth?.onboarding)) {
    history.replaceState({}, "", "/register/job-search");
    return renderJobSearch();
  }

  if (privateRoutes.has(path) && !store.auth.isLoggedIn) {
    history.replaceState({}, "", "/login");
    return renderLogin();
  }

  const pendingOnboardingRoute = getPendingOnboardingRoute();
  if (pendingOnboardingRoute && !registerSteps.includes(path)) {
    history.replaceState({}, "", pendingOnboardingRoute);
    return (routes[pendingOnboardingRoute] || renderRegisterName)();
  }

  if (shouldKeepLoggedInUserInApp(path, store.auth, store.register)) {
    const redirectPath = pendingOnboardingRoute || "/feed";
    history.replaceState({}, "", redirectPath);
    return (routes[redirectPath] || renderFeed)();
  }

  const view = routes[path];
  if (!view && store.auth.isLoggedIn) {
    const redirectPath = pendingOnboardingRoute || "/feed";
    history.replaceState({}, "", redirectPath);
    return (routes[redirectPath] || renderFeed)();
  }

  return (view || renderLanding)();
}

function render() {
  app.classList.add("fade-out");
  setTimeout(() => {
    app.innerHTML = routeView();
    app.classList.remove("fade-out");
    bindPageEvents();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 80);
}

window.addEventListener("popstate", render);
window.appLogout = logout;
bindComingSoonOauthGuard();
render();

