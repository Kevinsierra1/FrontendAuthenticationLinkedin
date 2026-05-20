import { AuthService } from "../../services/auth.service.js";
import { bindRealtimeValidation, field, passwordStrength } from "../../components/forms.js";

export function RegisterPage({ router }) {
  return {
    html: `
      <section class="auth-card wide">
        <h1>Crear perfil profesional</h1>
        <p>Tu cuenta entra a verificacion y luego al onboarding.</p>
        <form data-register-form class="grid-form">
          ${field({ label: "Nombre", name: "firstName" })}
          ${field({ label: "Apellido", name: "lastName" })}
          ${field({ label: "Email", name: "email", type: "email" })}
          ${field({ label: "Password segura", name: "password", type: "password" })}
          ${field({ label: "Ubicacion", name: "location" })}
          ${field({ label: "Profesion", name: "profession" })}
          ${field({ label: "Foto opcional", name: "avatar", type: "file", required: false })}
          <div class="strength" data-strength><span></span><b>Muy debil</b></div>
          <div class="form-error" data-form-error></div>
          <button class="btn btn-primary full" type="submit">Registrarme</button>
        </form>
      </section>
    `,
    afterRender() {
      const form = document.querySelector("[data-register-form]");
      bindRealtimeValidation(form);
      form.password.addEventListener("input", () => {
        const { score, label } = passwordStrength(form.password.value);
        form.querySelector("[data-strength] span").style.width = `${score * 25}%`;
        form.querySelector("[data-strength] b").textContent = label;
      });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          await AuthService.register(Object.fromEntries(new FormData(form)));
          router.replace("/verify-email?token=mock");
        } catch (error) {
          form.querySelector("[data-form-error]").textContent = error.message;
        }
      });
    }
  };
}
