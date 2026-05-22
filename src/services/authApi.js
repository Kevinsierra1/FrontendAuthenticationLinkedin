const runtimeConfig = window.APP_CONFIG || {};

const rawApiBaseUrl = (
  runtimeConfig.VITE_API_BASE_URL ||
  runtimeConfig.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5152"
).replace(/\/$/, "");

function resolveApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (rawApiBaseUrl.endsWith("/api")) return `${rawApiBaseUrl}${normalizedPath}`;
  return `${rawApiBaseUrl}/api${normalizedPath}`;
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

  return requestJson(
    `/auth/external-login/${provider}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: idToken.trim() })
    },
    `${provider} login failed`
  );
}

export async function postGoogleExternalLogin(idToken) {
  return postExternalLogin("google", idToken);
}

export async function registerLocalAccount(payload) {
  return requestJson(
    "/auth/register/local",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    "Local register failed"
  );
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

export async function sendEmailVerificationCode(userId) {
  return requestJson(
    "/auth/email-verification/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
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
