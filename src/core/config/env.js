window.APP_CONFIG = {
  API_BASE_URL: "/api",
  USE_MOCK: false,
  FALLBACK_TO_MOCK: true,
  ...(window.APP_CONFIG || {})
};
