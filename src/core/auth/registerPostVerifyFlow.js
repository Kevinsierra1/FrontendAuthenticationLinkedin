export const postVerifyRegisterSteps = [
  "/register/job-search",
  "/register/job-preferences",
  "/register/job-notifications",
  "/register/photo",
  "/register/contacts",
  "/register/app-download",
  "/register/games"
];

export function isPostVerifyRegisterStep(path) {
  return postVerifyRegisterSteps.includes(path);
}

export function getPostVerifyStepIndex(path) {
  return postVerifyRegisterSteps.indexOf(path);
}

export function getPostVerifyStepsForUser(register = {}) {
  const skipJobPreferences = register.jobSearch === "No, ahora no me interesa";
  if (!skipJobPreferences) return [...postVerifyRegisterSteps];

  return postVerifyRegisterSteps.filter(
    (step) => step !== "/register/job-preferences" && step !== "/register/job-notifications"
  );
}

export function getNextPostVerifyStep(path, { skipJobPreferences = false } = {}) {
  const steps = skipJobPreferences
    ? postVerifyRegisterSteps.filter(
        (step) => step !== "/register/job-preferences" && step !== "/register/job-notifications"
      )
    : postVerifyRegisterSteps;

  const index = steps.indexOf(path);
  if (index < 0) return "/register/job-search";
  return steps[index + 1] || "/profile/me";
}

export function hasAnsweredJobSearch(register = {}) {
  return Boolean((register.jobSearch || "").trim());
}

export function markPostVerifyFlowStarted(register = {}) {
  return {
    ...register,
    postVerifyActive: true
  };
}

export function shouldProtectPostVerifyRoute(path, register = {}) {
  return Boolean(register.postVerifyActive) && isPostVerifyRegisterStep(path);
}
