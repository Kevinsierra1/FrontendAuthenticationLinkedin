import { PublicLayout } from "./public/PublicLayout.js";
import { AuthLayout } from "./auth/AuthLayout.js";
import { AppLayout } from "./app/AppLayout.js";

export function renderLayout(type, view) {
  const content = typeof view === "string" ? view : view.html;
  const layouts = { public: PublicLayout, auth: AuthLayout, app: AppLayout };
  return layouts[type](content);
}
