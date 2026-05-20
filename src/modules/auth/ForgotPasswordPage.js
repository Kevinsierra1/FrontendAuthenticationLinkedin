import { AuthService } from "../../services/auth.service.js";
import { bindRealtimeValidation, field } from "../../components/forms.js";

export function ForgotPasswordPage() {
  return {
    html: `
      <section class="auth-card">
        <h1>Recuperar password</h1>
        <p>Te enviaremos un link seguro para restaurar el acceso.</p>
        <form data-forgot-form>
          ${field({ label: "Email", name: "email", type: "email", placeholder: "tu@email.com" })}
          <div class="form-success" data-success hidden>Mensaje enviado correctamente. Revisa tu correo.</div>
          <button class="btn btn-primary full" type="submit">Enviar link</button>
        </form>
      </section>
    `,
    afterRender() {
      const form = document.querySelector("[data-forgot-form]");
      bindRealtimeValidation(form);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector("button");
        button.textContent = "Enviando...";
        button.disabled = true;
        await AuthService.forgotPassword(form.email.value);
        form.querySelector("[data-success]").hidden = false;
        button.textContent = "Link enviado";
      });
    }
  };
}
