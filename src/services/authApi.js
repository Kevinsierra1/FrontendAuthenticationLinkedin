const runtimeConfig = window.APP_CONFIG || {};

function resolveApiBaseUrl() {
  const configured = (
    runtimeConfig.VITE_API_BASE_URL ||
    runtimeConfig.NEXT_PUBLIC_API_BASE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  if (configured) return configured;

  if (typeof window !== "undefined" && window.location?.origin) {
    return "/api";
  }

  return "http://localhost:5152";
}

const rawApiBaseUrl = resolveApiBaseUrl();

function resolveApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (rawApiBaseUrl.endsWith("/api")) return `${rawApiBaseUrl}${normalizedPath}`;
  return `${rawApiBaseUrl}/api${normalizedPath}`;
}

export function pickResponseValue(payload, camelName, pascalName) {
  return payload?.[camelName] ?? payload?.[pascalName];
}

export function normalizeAuthSession(payload) {
  const user = pickResponseValue(payload, "user", "User") || {};
  const onboarding = pickResponseValue(payload, "onboarding", "Onboarding") || {};

  return {
    accessToken: pickResponseValue(payload, "accessToken", "AccessToken") || "",
    refreshToken: pickResponseValue(payload, "refreshToken", "RefreshToken") || "",
    isNewUser: Boolean(pickResponseValue(payload, "isNewUser", "IsNewUser")),
    verificationCodeSent: Boolean(
      pickResponseValue(payload, "verificationCodeSent", "VerificationCodeSent")
    ),
    verificationMessage:
      pickResponseValue(payload, "verificationMessage", "VerificationMessage") || "",
    user: {
      id: pickResponseValue(user, "id", "Id"),
      email: pickResponseValue(user, "email", "Email") || "",
      firstName: pickResponseValue(user, "firstName", "FirstName") || "",
      lastName: pickResponseValue(user, "lastName", "LastName") || "",
      profilePictureUrl:
        pickResponseValue(user, "profilePictureUrl", "ProfilePictureUrl") || null
    },
    onboarding: {
      completed: Boolean(pickResponseValue(onboarding, "completed", "Completed")),
      currentStep: pickResponseValue(onboarding, "currentStep", "CurrentStep") || ""
    }
  };
}

function toApiError(status, payload, fallbackMessage) {
  const message =
    payload?.detail ||
    payload?.message ||
    payload?.title ||
    fallbackMessage;

  const error = new Error(message);
  error.status = status;
  return error;
}

async function requestJson(path, options, fallbackMessage) {
  let response;
  try {
    response = await fetch(resolveApiUrl(path), options);
  } catch {
    const error = new Error("Network error");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (response.ok) return payload;
  if (response.status === 502) {
    throw toApiError(
      response.status,
      { detail: "El backend no esta disponible. Inicia la API .NET en el puerto 5152." },
      fallbackMessage
    );
  }
  throw toApiError(response.status, payload, fallbackMessage);
}

async function requestFormData(path, formData, fallbackMessage) {
  const accessToken = localStorage.getItem("accessToken");
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  let response;
  try {
    response = await fetch(resolveApiUrl(path), {
      method: "POST",
      headers,
      body: formData
    });
  } catch {
    const error = new Error("Network error");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (response.ok) return payload;
  throw toApiError(response.status, payload, fallbackMessage);
}

export async function postExternalLogin(provider, idToken) {
  if (typeof idToken !== "string" || !idToken.trim()) {
    throw toApiError(400, {}, `Missing ${provider} idToken`);
  }

  const payload = await requestJson(
    `/auth/external-login/${provider}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: idToken.trim() })
    },
    `${provider} login failed`
  );

  return normalizeAuthSession(payload);
}

export async function postGoogleExternalLogin(idToken) {
  return postExternalLogin("google", idToken);
}

export async function registerLocalAccount(payload) {
  const response = await requestJson(
    "/auth/register/local",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    "Local register failed"
  );

  return normalizeAuthSession(response);
}

export async function loginLocalAccount(payload) {
  const response = await requestJson(
    "/auth/login/local",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    "Local login failed"
  );

  return normalizeAuthSession(response);
}

export async function updateLocalRegisterProfile(payload) {
  return requestJson(
    "/auth/register/local/profile",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    "Local profile update failed"
  );
}

export async function sendEmailVerificationCode(userId, email = "") {
  return requestJson(
    "/auth/email-verification/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        email: email?.trim() || undefined
      })
    },
    "Email verification send failed"
  );
}

export async function verifyEmailCode(userId, code) {
  return requestJson(
    "/auth/email-verification/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, code })
    },
    "Email verification failed"
  );
}

export async function cancelIncompleteRegistration() {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return {};

  return requestJson(
    "/auth/register/cancel",
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    },
    "Registration cancel failed"
  );
}

export async function uploadProfilePhoto(userId, file) {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("file", file);

  return requestFormData(
    "/auth/register/local/profile-photo",
    formData,
    "Profile photo upload failed"
  );
}
