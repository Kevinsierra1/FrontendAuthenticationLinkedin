import { avatar } from "../../components/cards.js";
import { messageStore } from "../../core/state/stores.js";
import { AppService } from "../../services/app.service.js";

export function MessagesPage() {
  return {
    html: `
      <section class="messages card">
        <aside data-conversations></aside>
        <main data-chat><div class="skeleton tall"></div></main>
      </section>
    `,
    async afterRender() {
      await AppService.loadMessages();
      renderMessages();
    }
  };
}

function renderMessages() {
  const state = messageStore.getState();
  const active = state.conversations.find((c) => c.id === state.activeId) || state.conversations[0];
  document.querySelector("[data-conversations]").innerHTML = state.conversations.map((c) => `
    <button class="conversation ${c.id === active.id ? "active" : ""}" data-conversation="${c.id}">${avatar(c.person.avatar)}<span><b>${c.person.name}</b><small>${c.last}</small></span></button>
  `).join("");
  document.querySelector("[data-chat]").innerHTML = `
    <header class="chat-header">${avatar(active.person.avatar)}<div><b>${active.person.name}</b><small class="online">Online</small></div></header>
    <div class="chat-body">${active.messages.map((m) => `<p class="bubble ${m.from}">${m.text}</p>`).join("")}</div>
    <form class="chat-input" data-chat-form><input name="message" placeholder="Escribe un mensaje" /><button class="btn btn-primary">Enviar</button></form>
  `;
  document.querySelectorAll("[data-conversation]").forEach((button) => {
    button.addEventListener("click", () => {
      messageStore.setState({ activeId: button.dataset.conversation });
      renderMessages();
    });
  });
  document.querySelector("[data-chat-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.message;
    active.messages.push({ from: "me", text: input.value });
    input.value = "";
    renderMessages();
  });
  document.querySelector(".chat-body").scrollTop = document.querySelector(".chat-body").scrollHeight;
}
