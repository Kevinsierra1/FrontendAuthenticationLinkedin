export function field({ label, name, type = "text", placeholder = "", required = true }) {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="${type}" placeholder="${placeholder}" ${required ? "required" : ""} />
      <small data-error-for="${name}"></small>
    </label>
  `;
}

export function passwordStrength(value = "") {
  const score = [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  return { score, label: ["Muy debil", "Debil", "Aceptable", "Fuerte", "Excelente"][score] };
}

export function bindRealtimeValidation(form) {
  form.addEventListener("input", (event) => {
    const input = event.target.closest("input");
    if (!input) return;
    const error = form.querySelector(`[data-error-for="${input.name}"]`);
    if (!error) return;
    error.textContent = input.validity.valid ? "" : "Revisa este campo";
  });
}
