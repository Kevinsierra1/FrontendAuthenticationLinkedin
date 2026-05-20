import { AuthService } from "../../services/auth.service.js";
import { field, passwordStrength } from "../../components/forms.js";

export function ResetPasswordPage({ query, router }) {
  return {
    html: `
      <section class="auth-card">
        <h1>Nuevo password</h1>
        <p data-token-state>${query.token ? "Token listo para validacion." : "Token invalido o ausente."}</p>
        <form data-reset-form>
          ${field({ label: "Nuevo password", name: "password", type: "password" })}
          ${field({ label: "Confirmar password", name: "confirm", type: "password" })}
          <div class="strength" data-strength><span></span><b>Muy debil</b></div>
          <div class="form-error" data-error></div>
          <button class="btn btn-primary full" type="submit" ${query.token ? "" : "disabled"}>Actualizar y entrar</button>
        </form>
      </section>
    `,
    afterRender() {
      const form = document.querySelector("[data-reset-form]");
      form.password.addEventListener("input", () => {
        const { score, label } = passwordStrength(form.password.value);
        form.querySelector("[data-strength] span").style.width = `${score * 25}%`;
        form.querySelector("[data-strength] b").textContent = label;
      });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (form.password.value !== form.confirm.value) {
          form.querySelector("[data-error]").textContent = "Los passwords no coinciden";
          return;
        }
        await AuthService.resetPassword(query.token, form.password.value);
        router.replace("/feed");
      });
    }
  };
}
