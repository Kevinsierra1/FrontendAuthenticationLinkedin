import { getOnboardingRoute, isOnboardingIncomplete } from "./onboardingFlow.js";

export function shouldContinueRegistration(session) {
  return Boolean(session?.isNewUser) || isOnboardingIncomplete(session?.onboarding);
}

export function getPostLoginRoute(session, completedRoute = "/profile/me") {
  if (!shouldContinueRegistration(session)) return completedRoute;
  return getOnboardingRoute(session?.onboarding || {}, completedRoute);
}

export function buildProviderRegisterDraft(session, currentDraft = {}, provider) {
  const backendUser = session?.user || {};

  return {
    authSource: provider,
    email: backendUser.email || currentDraft.email || "",
    firstName: backendUser.firstName || currentDraft.firstName || "",
    lastName: backendUser.lastName || currentDraft.lastName || "",
    location: currentDraft.location || "",
    isStudent: Boolean(currentDraft.isStudent),
    jobTitle: currentDraft.jobTitle || "",
    company: currentDraft.company || "",
    university: currentDraft.university || "",
    degree: currentDraft.degree || "",
    discipline: currentDraft.discipline || "",
    startYear: currentDraft.startYear || "",
    jobSearch: currentDraft.jobSearch || "",
    preferredJobs: currentDraft.preferredJobs || "",
    jobLocations: currentDraft.jobLocations || "",
    remote: Boolean(currentDraft.remote)
  };
}

export function isProviderRegisterFlow(registerState, provider) {
  return registerState?.authSource === provider;
}
