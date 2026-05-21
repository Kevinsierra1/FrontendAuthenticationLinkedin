import { authStore } from "../state/stores.js";
import { mockApi } from "./mockApi.js";

const DEFAULT_API_BASE_URL = "/api";
const API_BASE_URL = (window.APP_CONFIG?.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
const USE_MOCK = window.APP_CONFIG?.USE_MOCK ?? false;
const FALLBACK_TO_MOCK = window.APP_CONFIG?.FALLBACK_TO_MOCK ?? true;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  if (USE_MOCK) return mockApi(path, options);

  const token = authStore.getState().token;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (FALLBACK_TO_MOCK) return mockApi(path, options);
    throw error;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (FALLBACK_TO_MOCK && [404, 502, 503].includes(response.status)) return mockApi(path, options);
    throw new ApiError(payload.message || "Request failed", response.status, payload);
  }

  return payload;
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" })
};
