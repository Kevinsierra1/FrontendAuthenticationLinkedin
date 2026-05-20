import { AuthService } from "../../services/auth.service.js";

export function VerifyEmailPage({ query, router }) {
  return {
    html: `
      <section class="auth-card center">
        <div class="loader"></div>
        <h1 data-title>Verificando email...</h1>
        <p data-copy>Estamos validando tu token.</p>
        <button class="btn btn-primary" data-continue hidden>Continuar onboarding</button>
      </section>
    `,
    async afterRender() {
      const title = document.querySelector("[data-title]");
      const copy = document.querySelector("[data-copy]");
      const button = document.querySelector("[data-continue]");
      try {
        const response = await AuthService.verifyEmail(query.token);
        title.textContent = response.status === "success" ? "Email verificado" : "Token invalido";
        copy.textContent = response.status === "success" ? "Tu cuenta ya esta lista para completar el perfil." : "Solicita un nuevo enlace.";
        button.hidden = response.status !== "success";
        button.addEventListener("click", () => router.replace("/onboarding"));
      } catch {
        title.textContent = "Token expirado";
        copy.textContent = "El enlace ya no esta activo.";
      }
    }
  };
}
