export function AuthLayout(content) {
  return `
    <main class="auth-shell">
      <a class="brand auth-brand" href="/" data-link><span class="brand-mark">in</span> TalentLink</a>
      ${content}
    </main>
  `;
}
