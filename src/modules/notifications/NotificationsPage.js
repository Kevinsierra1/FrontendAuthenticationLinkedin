import { notificationStore } from "../../core/state/stores.js";
import { AppService } from "../../services/app.service.js";

export function NotificationsPage() {
  return {
    html: `<section class="notifications-page card"><h1>Notificaciones</h1><div data-notifications><div class="skeleton tall"></div></div></section>`,
    async afterRender() {
      await AppService.loadNotifications();
      document.querySelector("[data-notifications]").innerHTML = notificationStore.getState().items.map((item) => `
        <article class="notification-item"><span class="dot"></span><p>${item}</p><button>Ver</button></article>
      `).join("");
    }
  };
}
