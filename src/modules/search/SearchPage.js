import { postCard, personCard } from "../../components/cards.js";
import { AppService } from "../../services/app.service.js";

export function SearchPage({ query }) {
  return {
    html: `
      <section class="search-page">
        <form class="card search-box" data-search-form>
          <input name="q" value="${query.q || ""}" placeholder="Busca personas, empresas o publicaciones" autocomplete="off" />
          <div class="autocomplete" data-autocomplete></div>
        </form>
        <div data-results></div>
      </section>
    `,
    afterRender() {
      const form = document.querySelector("[data-search-form]");
      let timer;
      const run = async () => {
        const q = form.q.value.trim();
        if (!q) return;
        const data = await AppService.search(q);
        document.querySelector("[data-autocomplete]").innerHTML = data.people.map((p) => `<button type="button">${p.name}</button>`).join("");
        document.querySelector("[data-results]").innerHTML = `
          <section class="card"><h2>Personas</h2>${data.people.map(personCard).join("")}</section>
          <section class="card"><h2>Empresas</h2>${data.companies.map((c) => `<p class="company-result">${c}</p>`).join("")}</section>
          <section><h2>Publicaciones</h2>${data.posts.map(postCard).join("")}</section>
        `;
      };
      form.q.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(run, 300);
      });
      run();
    }
  };
}
