import { renderLayout } from "../../layouts/renderLayout.js";

function pathToRegex(path) {
  return new RegExp(`^${path.replaceAll("/", "\\/").replace(/:([A-Za-z0-9_]+)/g, "([^/]+)")}$`);
}

function getParams(route, pathname) {
  const keys = [...route.path.matchAll(/:([A-Za-z0-9_]+)/g)].map((m) => m[1]);
  const values = pathname.match(route.regex)?.slice(1) || [];
  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
}

class Router {
  constructor() {
    this.routes = [];
    this.root = document.querySelector("#app");
  }

  add(path, component, options = {}) {
    this.routes.push({ path, regex: pathToRegex(path), component, options });
    return this;
  }

  start() {
    document.body.addEventListener("click", (event) => {
      const link = event.target.closest("[data-link]");
      if (!link) return;
      event.preventDefault();
      this.navigate(link.getAttribute("href"));
    });
    document.body.addEventListener("pointerover", (event) => {
      const link = event.target.closest("[data-link]");
      if (!link) return;
      const url = new URL(link.getAttribute("href"), window.location.origin);
      const route = this.match(url.pathname);
      route?.component.preload?.();
    });
    window.addEventListener("popstate", () => this.resolve());
    this.resolve();
  }

  navigate(path) {
    history.pushState({}, "", path);
    this.resolve();
  }

  replace(path) {
    history.replaceState({}, "", path);
    this.resolve();
  }

  async resolve() {
    const pathname = window.location.pathname;
    const route = this.match(pathname) || this.routes[0];
    const guardResult = route.options.guard?.();

    if (typeof guardResult === "string") {
      this.replace(guardResult);
      return;
    }

    const params = getParams(route, pathname);
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    const view = await route.component({ params, query, router: this });
    this.root.innerHTML = renderLayout(route.options.layout || "public", view);
    view.afterRender?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  match(pathname) {
    return this.routes.find((candidate) => candidate.regex.test(pathname));
  }
}

export const router = new Router();
