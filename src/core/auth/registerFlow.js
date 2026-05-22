import { getOnboardingRoute, registerSteps } from "./onboardingFlow.js";
import {
  getPostVerifyStepsForUser,
  getPostVerifyStepIndex,
  hasAnsweredJobSearch,
  isPostVerifyRegisterStep
} from "./registerPostVerifyFlow.js";

/** Pasos compartidos correo y Google (sin la pantalla inicial /register). */
export const sharedRegisterPathOrder = registerSteps.filter((path) => path !== "/register");

export function getRegisterProgressIndex(path) {
  return sharedRegisterPathOrder.indexOf(path);
}

export function hasExperienceFilled(register = {}) {
  if (register.isStudent) {
    return Boolean((register.university || "").trim() || (register.discipline || "").trim());
  }
  return Boolean((register.jobTitle || "").trim() || (register.company || "").trim());
}

export function isBeforeEmailVerification(onboarding = {}) {
  if (onboarding.completed) return false;
  const step = onboarding.currentStep || "";
  return !["JobPreferences", "ProfilePhoto", "Completed"].includes(step);
}

export function getRouteAfterExperience(onboarding = {}) {
  return isBeforeEmailVerification(onboarding) ? "/register/verify-email" : "/register/job-search";
}

export function advanceRegisterProgress(path, register = {}) {
  const index = getRegisterProgressIndex(path);
  if (index < 0) return register;

  return {
    ...register,
    registerProgressStep: path,
    registerProgressIndex: Math.max(register.registerProgressIndex ?? -1, index),
    postVerifyActive: isPostVerifyRegisterStep(path) ? true : register.postVerifyActive,
    postVerifyMaxStep: isPostVerifyRegisterStep(path) ? path : register.postVerifyMaxStep,
    postVerifyMaxIndex: isPostVerifyRegisterStep(path)
      ? Math.max(register.postVerifyMaxIndex ?? -1, getPostVerifyStepIndex(path))
      : register.postVerifyMaxIndex
  };
}

/**
 * Primera pantalla que el usuario aun debe completar (no puede saltar mas alla).
 */
export function getMinimumRegisterPath(register = {}, auth = {}) {
  if (!auth?.isLoggedIn) return "/register";

  const firstName = (register.firstName || "").trim();
  const lastName = (register.lastName || "").trim();
  if (!firstName || !lastName) return "/register/name";
  if (!(register.location || "").trim()) return "/register/location";
  if (!hasExperienceFilled(register)) return "/register/experience";
  if (isBeforeEmailVerification(auth.onboarding)) return "/register/verify-email";
  if (!hasAnsweredJobSearch(register)) return "/register/job-search";

  const progressIndex = register.registerProgressIndex ?? -1;
  const postSteps = getPostVerifyStepsForUser(register);

  for (const step of postSteps) {
    const stepIndex = getRegisterProgressIndex(step);
    if (stepIndex < 0 || progressIndex < stepIndex) {
      return step;
    }
  }

  return getOnboardingRoute(auth.onboarding || {}, "/profile/me");
}

/**
 * Evita saltar pasos hacia adelante; si vas atrasado, te lleva al minimo pendiente.
 */
export function enforceRegisterPath(path, register = {}, auth = {}) {
  if (!auth?.isLoggedIn || !registerSteps.includes(path) || path === "/register") return path;

  const minimumPath = getMinimumRegisterPath(register, auth);
  const minimumIndex = getRegisterProgressIndex(minimumPath);
  const pathIndex = getRegisterProgressIndex(path);

  if (pathIndex < 0 || minimumIndex < 0) return path;

  if (pathIndex < minimumIndex) return minimumPath;

  const progressIndex = register.registerProgressIndex ?? -1;
  const maxAllowedIndex = Math.max(minimumIndex, progressIndex + 1);

  if (pathIndex > maxAllowedIndex) return sharedRegisterPathOrder[maxAllowedIndex] || minimumPath;

  return path;
}

export function getRequiredRegisterPath(register = {}, auth = {}) {
  return getMinimumRegisterPath(register, auth);
}
