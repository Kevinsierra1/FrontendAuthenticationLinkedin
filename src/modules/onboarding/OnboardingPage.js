import { AppService } from "../../services/app.service.js";

export function OnboardingPage({ router }) {
  const steps = ["Foto", "Cargo", "Empresa", "Skills", "Intereses", "Contactos"];
  return {
    html: `
      <section class="onboarding">
        <h1>Completa tu presencia profesional</h1>
        <ol class="stepper">${steps.map((step, index) => `<li class="${index === 0 ? "active" : ""}">${step}</li>`).join("")}</ol>
        <form data-onboarding-form class="onboarding-card">
          <label class="field"><span>Foto profesional</span><input name="photo" type="file" /></label>
          <label class="field"><span>Cargo profesional</span><input name="title" value="Frontend Engineer" /></label>
          <label class="field"><span>Empresa</span><input name="company" value="Independent" /></label>
          <label class="field"><span>Skills</span><input name="skills" value="JavaScript, UX, REST APIs" /></label>
          <label class="field"><span>Intereses</span><input name="interests" value="SaaS, AI, Product" /></label>
          <label class="check"><input type="checkbox" name="contacts" /> Importar contactos simulados</label>
          <button class="btn btn-primary full" type="submit">Finalizar onboarding</button>
        </form>
      </section>
    `,
    afterRender() {
      document.querySelector("[data-onboarding-form]").addEventListener("submit", async (event) => {
        event.preventDefault();
        await AppService.completeOnboarding(Object.fromEntries(new FormData(event.currentTarget)));
        router.replace("/feed");
      });
    }
  };
}
