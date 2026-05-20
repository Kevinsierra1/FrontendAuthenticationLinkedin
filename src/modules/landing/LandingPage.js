export function LandingPage() {
  return {
    html: `
      <section class="landing">
        <nav class="landing-nav">
          <a class="brand" href="/" data-link><span class="brand-mark">in</span> TalentLink</a>
          <div><a href="/login" data-link>Iniciar sesion</a><a class="btn btn-primary" href="/register" data-link>Registrarse</a></div>
        </nav>
        <div class="hero">
          <div>
            <p class="eyebrow">Red profesional para talento moderno</p>
            <h1>TalentLink</h1>
            <p class="hero-copy">Conecta con profesionales, publica ideas, gestiona tu red y avanza tu carrera desde una experiencia rapida, privada y lista para backend real.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="/register" data-link>Crear cuenta</a>
              <a class="btn btn-secondary" href="/login" data-link>Iniciar sesion</a>
            </div>
            <div class="oauth-row">
              <a href="/login?provider=google" data-link>Google</a>
              <a href="/login?provider=apple" data-link>Apple</a>
              <a href="/login?provider=microsoft" data-link>Microsoft</a>
            </div>
          </div>
          <div class="hero-panel" aria-label="Vista previa del feed">
            <div class="mini-profile"><span class="avatar">SH</span><div><b>Sofia Herrera</b><span>Frontend Engineer</span></div></div>
            <div class="mini-post"></div><div class="mini-post short"></div><div class="mini-grid"><span></span><span></span><span></span></div>
          </div>
        </div>
      </section>
    `
  };
}
