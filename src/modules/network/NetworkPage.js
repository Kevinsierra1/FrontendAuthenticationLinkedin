import { personCard } from "../../components/cards.js";
import { networkStore } from "../../core/state/stores.js";
import { AppService } from "../../services/app.service.js";

export function NetworkPage() {
  return {
    html: `
      <section class="workspace">
        <aside class="side-menu card"><a>Mis conexiones</a><a>Solicitudes recibidas</a><a>Solicitudes enviadas</a><a>Personas que quiza conozcas</a></aside>
        <main class="stack" data-network><div class="skeleton tall"></div></main>
      </section>
    `,
    async afterRender() {
      await AppService.loadNetwork();
      const s = networkStore.getState();
      document.querySelector("[data-network]").innerHTML = `
        ${block("Mis conexiones", s.connections, "Mensaje")}
        ${block("Solicitudes recibidas", s.requestsIn, "Aceptar")}
        ${block("Solicitudes enviadas", s.requestsOut, "Pendiente")}
        ${block("Personas que quiza conozcas", s.suggestions, "Conectar")}
      `;
    }
  };
}

function block(title, items, action) {
  return `<section class="card"><h2>${title}</h2><div class="people-grid">${items.map((p) => personCard(p, action)).join("")}</div></section>`;
}
