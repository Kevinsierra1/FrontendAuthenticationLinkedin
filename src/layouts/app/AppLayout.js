import { notificationStore, userStore } from "../../core/state/stores.js";
import { AuthService } from "../../services/auth.service.js";

window.appActions = window.appActions || {};
window.appActions.logout = async () => {
  const { router } = await import("../../core/router/router.js");
  AuthService.logout(router);
};

if (!window.__talentLinkAppLayoutBound) {
  window.__talentLinkAppLayoutBound = true;
  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-global-search]");
    if (!form) return;
    event.preventDefault();
    const q = new FormData(form).get("q")?.trim();
    if (q) {
      const { router } = await import("../../core/router/router.js");
      router.navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  });
}

export function AppLayout(content) {
  const user = userStore.getState().me || { name: "User", avatar: "U" };
  const unread = notificationStore.getState().unread || 4;
  return `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" href="/feed" data-link><span class="brand-mark">in</span> TalentLink</a>
        <nav class="topnav" aria-label="Principal">
          <a href="/feed" data-link>Inicio</a>
          <a href="/network" data-link>Mi red</a>
          <a href="/messages" data-link>Mensajes</a>
          <a href="/notifications" data-link>Notificaciones <span class="badge">${unread}</span></a>
          <a href="/profile/me" data-link>Yo</a>
        </nav>
        <form class="global-search" action="/search" data-global-search>
          <input name="q" placeholder="Buscar personas, empresas o posts" autocomplete="off" />
        </form>
        <button class="avatar-button" onclick="appActions.logout()" title="Cerrar sesion">${user.avatar}</button>
      </header>
      <div class="app-main">${content}</div>
    </div>
  `;
}
