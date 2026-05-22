export const registerSteps = [
  "/register",
  "/register/name",
  "/register/location",
  "/register/experience",
  "/register/verify-email",
  "/register/job-search",
  "/register/job-preferences",
  "/register/job-notifications",
  "/register/photo",
  "/register/contacts",
  "/register/app-download",
  "/register/games"
];

export const privateRoutes = new Set(["/feed", "/profile/me"]);

export const publicAuthRoutes = new Set([
  "/",
  "/login",
  "/forgot-password",
  "/forgot-password/verify",
  "/reset-password",
  "/reset-password/success"
]);

export const onboardingStepRouteMap = {
  BasicProfile: "/register/name",
  Location: "/register/location",
  Experience: "/register/experience",
  JobPreferences: "/register/job-search",
  ProfilePhoto: "/register/photo",
  PhoneVerification: "/register/verify-email",
  Completed: "/profile/me"
};

export function getOnboardingRoute(onboarding = {}, completedRoute = "/profile/me") {
  if (onboarding.completed || onboarding.currentStep === "Completed") return completedRoute;
  return onboardingStepRouteMap[onboarding.currentStep] || "/register/name";
}

export function isOnboardingIncomplete(onboarding) {
  return Boolean(onboarding) && !onboarding.completed && onboarding.currentStep !== "Completed";
}

export function canAccessRegisterRouteWhileLoggedIn(path, auth) {
  return isOnboardingIncomplete(auth?.onboarding) && path !== "/register" && registerSteps.includes(path);
}

export function getPendingOnboardingRoute(auth, completedRoute = "/profile/me") {
  if (!auth?.isLoggedIn || !isOnboardingIncomplete(auth.onboarding)) return null;
  return getOnboardingRoute(auth.onboarding, completedRoute);
}

export function shouldKeepLoggedInUserInApp(path, auth, register = {}) {
  if (!auth?.isLoggedIn || privateRoutes.has(path)) return false;
  if (canAccessRegisterRouteWhileLoggedIn(path, auth)) return false;
  if (register?.postVerifyActive && registerSteps.includes(path)) return false;
  return publicAuthRoutes.has(path) || registerSteps.includes(path);
}
