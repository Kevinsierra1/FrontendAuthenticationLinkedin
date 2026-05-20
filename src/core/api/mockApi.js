const wait = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

const people = [
  { id: "u-1", name: "Ana Rodriguez", title: "Senior Product Designer", company: "Nexa Labs", location: "Bogota", avatar: "AR" },
  { id: "u-2", name: "Camilo Torres", title: "Frontend Engineer", company: "Andes Cloud", location: "Medellin", avatar: "CT" },
  { id: "u-3", name: "Laura Mendez", title: "Talent Partner", company: "ScaleWorks", location: "Remote", avatar: "LM" }
];

const posts = [
  { id: "p-1", author: people[0], body: "Lanzamos un sistema de diseno para equipos distribuidos. Menos friccion, mas consistencia.", likes: 214, comments: 28, shared: false },
  { id: "p-2", author: people[1], body: "La arquitectura frontend senior no empieza en el framework: empieza en contratos claros, estado predecible y pantallas que fallan bien.", likes: 438, comments: 51, shared: true },
  { id: "p-3", author: people[2], body: "Buscamos perfiles full-stack con criterio de producto. Ingles B2+, remoto LATAM.", likes: 97, comments: 13, shared: false }
];

const conversations = [
  { id: "c-1", person: people[0], last: "Te envie feedback del perfil.", messages: [{ from: "them", text: "Tu headline esta muy claro." }, { from: "me", text: "Gracias, lo ajusto hoy." }] },
  { id: "c-2", person: people[1], last: "Hablemos del stack.", messages: [{ from: "them", text: "Vanilla JS para core, perfecto." }] }
];

export async function mockApi(path, options = {}) {
  await wait();
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === "/auth/login" && method === "POST") {
    if (!body.email || !body.password) throw new Error("Email y password son obligatorios");
    return {
      token: "mock-jwt-token",
      refreshToken: "mock-refresh-token",
      user: { id: "me", name: "Sofia Herrera", email: body.email, title: "Product-minded Frontend Engineer", location: "Bogota", avatar: "SH", onboardingComplete: true }
    };
  }

  if (path === "/auth/register" && method === "POST") {
    return { token: "mock-jwt-token", refreshToken: "mock-refresh-token", user: { id: "me", name: `${body.firstName} ${body.lastName}`, email: body.email, title: body.profession, location: body.location, avatar: `${body.firstName?.[0] || "U"}${body.lastName?.[0] || ""}`, onboardingComplete: false } };
  }

  if (path === "/auth/me") return { user: { id: "me", name: "Sofia Herrera", email: "sofia@company.com", title: "Product-minded Frontend Engineer", location: "Bogota", avatar: "SH", onboardingComplete: localStorage.getItem("onboarding_complete") === "true" } };
  if (path === "/auth/forgot-password") return { sent: true };
  if (path.startsWith("/auth/reset-password")) return { tokenValid: true, tokenExpired: false, autoLoginToken: "mock-jwt-token" };
  if (path.startsWith("/auth/verify-email")) return { status: "success" };
  if (path === "/onboarding" && method === "POST") return { complete: true };
  if (path.startsWith("/feed")) return { posts, hasMore: false };
  if (path === "/posts" && method === "POST") return { post: { id: crypto.randomUUID(), author: people[1], body: body.body, likes: 0, comments: 0, shared: false } };
  if (path === "/network/suggestions") return { suggestions: people, connections: people.slice(0, 1), requestsIn: people.slice(1, 2), requestsOut: people.slice(2) };
  if (path.startsWith("/search")) return { people, companies: ["Nexa Labs", "Andes Cloud", "ScaleWorks"], posts };
  if (path === "/notifications") return { unread: 4, items: ["Ana acepto tu invitacion", "Camilo comento tu publicacion", "Laura vio tu perfil", "Nexa Labs publico una vacante"] };
  if (path === "/messages") return { conversations, online: ["u-1", "u-2"] };
  if (path.startsWith("/profile")) return { profile: { id: "me", name: "Sofia Herrera", title: "Product-minded Frontend Engineer", company: "Independent", location: "Bogota", about: "Construyo experiencias web sobrias, rapidas y mantenibles.", avatar: "SH", skills: ["JavaScript", "Design Systems", "Product UX", "APIs REST"], experience: ["Frontend Lead - Independent", "UI Engineer - Cloud Studio"], education: ["Systems Engineering - Universidad Nacional"] } };

  return {};
}
