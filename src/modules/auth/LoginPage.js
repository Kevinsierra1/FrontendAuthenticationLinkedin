import { AuthService } from "../../services/auth.service.js";
import { bindRealtimeValidation, field } from "../../components/forms.js";

export function LoginPage({ router, query }) {
  return {
    html: `
      <section class="auth-card">
        <h1>Iniciar sesion</h1>
        <p>Accede al feed, mensajes y red profesional.</p>
        <div class="oauth-grid">
          <button data-oauth="google">Google</button><button data-oauth="apple">Apple</button><button data-oauth="microsoft">Microsoft</button>
        </div>
        <form data-login-form>
          ${field({ label: "Email", name: "email", type: "email", placeholder: "tu@email.com" })}
          ${field({ label: "Password", name: "password", type: "password", placeholder: "••••••••" })}
          <label class="check"><input type="checkbox" name="remember" checked /> Recordar sesion</label>
          <div class="form-error" data-form-error></div>
          <button class="btn btn-primary full" type="submit">Entrar</button>
        </form>
        <a href="/forgot-password" data-link>Olvide mi password</a>
        <span>¿Nuevo? <a href="/register" data-link>Crea tu cuenta</a></span>
      </section>
    `,
    afterRender() {
      const form = document.querySelector("[data-login-form]");
      bindRealtimeValidation(form);
      if (query.provider) AuthService.oauth(query.provider).then(() => router.replace("/feed"));
      document.querySelectorAll("[data-oauth]").forEach((button) => {
        button.addEventListener("click", async () => {
          await AuthService.oauth(button.dataset.oauth);
          router.replace("/feed");
        });
      });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector("button[type=submit]");
        submit.disabled = true;
        submit.textContent = "Validando...";
        try {
          const data = Object.fromEntries(new FormData(form));
          await AuthService.login({ ...data, remember: Boolean(data.remember) });
          router.replace("/feed");
        } catch (error) {
          form.querySelector("[data-form-error]").textContent = error.message || "No pudimos iniciar sesion";
        } finally {
          submit.disabled = false;
          submit.textContent = "Entrar";
        }
      });
    }
  };
}
