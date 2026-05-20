import { postCard, personCard } from "../../components/cards.js";
import { feedStore, networkStore, userStore } from "../../core/state/stores.js";
import { AppService } from "../../services/app.service.js";

export function FeedPage() {
  const user = userStore.getState().me || { name: "Sofia Herrera", avatar: "SH", title: "Frontend Engineer" };
  return {
    html: `
      <section class="three-column">
        <aside class="profile-summary card">
          <div class="cover"></div><span class="avatar large">${user.avatar}</span><h2>${user.name}</h2><p>${user.title}</p>
          <a href="/profile/me" data-link>Ver perfil</a>
        </aside>
        <main class="feed-column">
          <form class="card composer" data-post-form>
            <div>${postInput(user.avatar)}</div>
            <textarea name="body" placeholder="Comparte una actualizacion profesional"></textarea>
            <button class="btn btn-primary" type="submit">Publicar</button>
          </form>
          <div data-feed-list>${skeletons()}</div>
        </main>
        <aside class="suggestions card">
          <h2>Personas que quiza conozcas</h2>
          <div data-suggestions>${skeletons(2)}</div>
        </aside>
      </section>
    `,
    async afterRender() {
      await Promise.all([AppService.loadFeed(), AppService.loadNetwork()]);
      renderFeed();
      document.querySelector("[data-post-form]").addEventListener("submit", async (event) => {
        event.preventDefault();
        const body = new FormData(event.currentTarget).get("body");
        if (!body.trim()) return;
        await AppService.createPost(body);
        event.currentTarget.reset();
        renderFeed();
      });
      window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY > document.body.offsetHeight - 300 && feedStore.getState().hasMore) {
          AppService.loadFeed().then(renderFeed);
        }
      }, { passive: true });
    }
  };
}

function postInput(avatar) {
  return `<span class="avatar">${avatar}</span><strong>Crear publicacion</strong>`;
}

function skeletons(count = 3) {
  return Array.from({ length: count }, () => `<div class="skeleton"></div>`).join("");
}

function renderFeed() {
  const feed = document.querySelector("[data-feed-list]");
  const suggestions = document.querySelector("[data-suggestions]");
  if (feed) feed.innerHTML = feedStore.getState().posts.map(postCard).join("");
  if (suggestions) suggestions.innerHTML = networkStore.getState().suggestions.map((person) => personCard(person)).join("");
}
