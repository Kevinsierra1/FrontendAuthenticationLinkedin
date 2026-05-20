import { router } from "./core/router/router.js";
import { publicOnly, requireAuth, requireOnboarding } from "./core/guards/guards.js";

function lazy(loader, exportName) {
  let cached;
  const component = async (context) => {
    cached ||= loader();
    const module = await cached;
    return module[exportName](context);
  };
  component.preload = () => {
    cached ||= loader();
    return cached;
  };
  return component;
}

const LandingPage = lazy(() => import("./modules/landing/LandingPage.js"), "LandingPage");
const LoginPage = lazy(() => import("./modules/auth/LoginPage.js"), "LoginPage");
const RegisterPage = lazy(() => import("./modules/auth/RegisterPage.js"), "RegisterPage");
const ForgotPasswordPage = lazy(() => import("./modules/auth/ForgotPasswordPage.js"), "ForgotPasswordPage");
const ResetPasswordPage = lazy(() => import("./modules/auth/ResetPasswordPage.js"), "ResetPasswordPage");
const VerifyEmailPage = lazy(() => import("./modules/auth/VerifyEmailPage.js"), "VerifyEmailPage");
const OnboardingPage = lazy(() => import("./modules/onboarding/OnboardingPage.js"), "OnboardingPage");
const FeedPage = lazy(() => import("./modules/feed/FeedPage.js"), "FeedPage");
const ProfilePage = lazy(() => import("./modules/profile/ProfilePage.js"), "ProfilePage");
const NetworkPage = lazy(() => import("./modules/network/NetworkPage.js"), "NetworkPage");
const SearchPage = lazy(() => import("./modules/search/SearchPage.js"), "SearchPage");
const NotificationsPage = lazy(() => import("./modules/notifications/NotificationsPage.js"), "NotificationsPage");
const MessagesPage = lazy(() => import("./modules/messages/MessagesPage.js"), "MessagesPage");
const SettingsPage = lazy(() => import("./modules/settings/SettingsPage.js"), "SettingsPage");

export function registerRoutes() {
  router
    .add("/", LandingPage, { guard: publicOnly, layout: "public" })
    .add("/login", LoginPage, { guard: publicOnly, layout: "auth" })
    .add("/register", RegisterPage, { guard: publicOnly, layout: "auth" })
    .add("/forgot-password", ForgotPasswordPage, { guard: publicOnly, layout: "auth" })
    .add("/reset-password", ResetPasswordPage, { guard: publicOnly, layout: "auth" })
    .add("/verify-email", VerifyEmailPage, { layout: "auth" })
    .add("/onboarding", OnboardingPage, { guard: requireAuth, layout: "auth" })
    .add("/feed", FeedPage, { guard: requireOnboarding, layout: "app" })
    .add("/profile/me", ProfilePage, { guard: requireOnboarding, layout: "app" })
    .add("/profile/:id", ProfilePage, { guard: requireOnboarding, layout: "app" })
    .add("/network", NetworkPage, { guard: requireOnboarding, layout: "app" })
    .add("/search", SearchPage, { guard: requireOnboarding, layout: "app" })
    .add("/notifications", NotificationsPage, { guard: requireOnboarding, layout: "app" })
    .add("/messages", MessagesPage, { guard: requireOnboarding, layout: "app" })
    .add("/settings", SettingsPage, { guard: requireOnboarding, layout: "app" })
    .add("/settings/security", SettingsPage, { guard: requireOnboarding, layout: "app" });
}
