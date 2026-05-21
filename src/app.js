const demoUser = {
  name: "Ximena Afanador",
  email: "ximenaafanador749@gmail.com",
  avatar: null,
  headline: "Desarrolladora de Software .NET | C# • SQL | Python | JavaScript",
  location: "Área metropolitana de Bucaramanga",
  company: "Campuslands"
};

const registerSteps = [
  "/register",
  "/register/name",
  "/register/location",
  "/register/experience",
  "/register/verify-email",
  "/register/job-search",
  "/register/job-preferences",
  "/register/job-notifications",
  "/register/photo",
  "/register/contacts",
  "/register/app-download",
  "/register/games"
];

const store = {
  auth: JSON.parse(localStorage.getItem("tl_auth") || '{"isLoggedIn":false,"user":null}'),
  remembered: JSON.parse(localStorage.getItem("tl_remembered") || "null"),
  register: JSON.parse(sessionStorage.getItem("tl_register") || "{}"),
  forgot: JSON.parse(sessionStorage.getItem("tl_forgot") || "{}")
};

const app = document.querySelector("#app");

function saveAuth() {
  localStorage.setItem("tl_auth", JSON.stringify(store.auth));
}

function saveRemembered(user = demoUser) {
  store.remembered = user;
  localStorage.setItem("tl_remembered", JSON.stringify(user));
}

function saveRegister(patch) {
  store.register = { ...store.register, ...patch };
  sessionStorage.setItem("tl_register", JSON.stringify(store.register));
}

function saveForgot(patch) {
  store.forgot = { ...store.forgot, ...patch };
  sessionStorage.setItem("tl_forgot", JSON.stringify(store.forgot));
}

function login(user = demoUser) {
  store.auth = { isLoggedIn: true, user: { ...demoUser, ...user } };
  saveAuth();
  saveRemembered(store.auth.user);
  navigate("/feed");
}

function logout() {
  store.auth = { isLoggedIn: false, user: null };
  saveAuth();
  navigate("/");
}

function navigate(path) {
  history.pushState({}, "", path);
  render();
}

function maskedEmail(email = "") {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 1)}${"*".repeat(Math.max(4, name.length - 1))}@${domain}`;
}

function initials(name = "Ximena Afanador") {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function progress() {
  const index = registerSteps.indexOf(location.pathname);
  return index < 0 ? 0 : Math.round(((index + 1) / registerSteps.length) * 100);
}

function linkedinLogo() {
  return `<a href="/" class="li-logo" data-link><span>Linked</span><b>in</b></a>`;
}

function googleIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.77-.07-1.51-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.41 13.9A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.9V7.5H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.5l3.34-2.6z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.5l3.34 2.6C7.2 7.74 9.4 5.98 12 5.98z"/></svg>`;
}

function microsoftIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f25022" d="M3 3h8v8H3z"/><path fill="#7fba00" d="M13 3h8v8h-8z"/><path fill="#00a4ef" d="M3 13h8v8H3z"/><path fill="#ffb900" d="M13 13h8v8h-8z"/></svg>`;
}

function appleIcon() {
  return `<span class="apple-mark"></span>`;
}

function liIcon() {
  return `<span class="li-icon">in</span>`;
}

function oauthButton(provider, label) {
  const icon = provider === "google" ? googleIcon() : provider === "microsoft" ? microsoftIcon() : appleIcon();
  return `<button class="oauth-btn" data-oauth="${provider}" type="button">${icon}<span>${label}</span></button>`;
}

function legalText() {
  return `<p class="legal">Al hacer clic en «Continuar» para unirte o iniciar sesión, aceptas las <a href="#">Condiciones de uso</a>, la <a href="#">Política de privacidad</a> y la <a href="#">Política de cookies</a> de LinkedIn.</p>`;
}

function publicNav({ joinOutline = false, simple = false } = {}) {
  return `
    <header class="public-nav">
      ${linkedinLogo()}
      ${simple ? "" : `<nav><a class="${joinOutline ? "btn-outline" : ""}" href="/login" data-link>Iniciar sesión</a><a class="${joinOutline ? "btn-outline" : "btn-primary"}" href="/register" data-link>Únete ahora</a></nav>`}
    </header>
  `;
}

function authCard(content, footer = "") {
  return `${publicNav({ simple: true })}<main class="auth-main"><section class="auth-card">${content}</section>${footer}</main>`;
}

function inputField(label, name, type = "text", value = "", extra = "") {
  return `<label class="li-field"><span>${label}</span><input name="${name}" type="${type}" value="${value}" ${extra}/><small data-error="${name}"></small></label>`;
}

function passwordField(label, name = "password") {
  return `<label class="li-field password-wrap"><span>${label}</span><input name="${name}" type="password"/><button type="button" data-toggle-password="${name}">Mostrar</button><small data-error="${name}"></small></label>`;
}

function divider(text = "o") {
  return `<div class="divider"><span></span><b>${text}</b><span></span></div>`;
}

function avatar(user = demoUser, size = "") {
  return `<span class="avatar ${size}">${user.avatar ? `<img src="${user.avatar}" alt="">` : initials(user.name)}</span>`;
}

function renderLanding() {
  return `
    ${publicNav()}
    <div class="landing-wrapper">
    <main class="landing-page">
      <section class="landing-copy">
        <h1>¡Te damos la bienvenida a tu comunidad profesional!</h1>
        <div class="landing-actions">
          ${oauthButton("google", "Continuar con Google")}
          ${oauthButton("microsoft", "Continuar con Microsoft")}
          <a class="oauth-btn" href="/login" data-link>Iniciar sesión con el email</a>
        </div>
        ${legalText()}
        ${divider("")}
        <p class="join-note">¿Estás empezando a usar LinkedIn? <a href="/register" data-link>Únete ahora</a></p>
      </section>
      <section class="landing-art" aria-label="Ilustración profesional">
        <svg viewBox="0 0 560 420" role="img">
          <circle cx="410" cy="80" r="50" fill="#dceeff"/>
          <circle cx="190" cy="280" r="78" fill="#f5d6c6"/>
          <rect x="205" y="58" width="210" height="230" rx="22" fill="#ffffff" stroke="#c9cdd2"/>
          <rect x="236" y="98" width="150" height="18" rx="9" fill="#0a66c2"/>
          <rect x="236" y="134" width="112" height="14" rx="7" fill="#c9cdd2"/>
          <rect x="236" y="166" width="128" height="14" rx="7" fill="#c9cdd2"/>
          <circle cx="116" cy="120" r="42" fill="#e9f4e8"/>
          <path d="M95 176c28-30 58-30 90 0v64H95z" fill="#7fb3d5"/>
          <circle cx="132" cy="130" r="25" fill="#f3c3a3"/>
          <path d="M360 278c36-42 78-42 120 0v70H360z" fill="#9cc4b2"/>
          <circle cx="420" cy="230" r="29" fill="#f3c3a3"/>
          <path d="M65 342h430" stroke="#c9cdd2" stroke-width="5" stroke-linecap="round"/>
          <rect x="76" y="302" width="74" height="44" rx="8" fill="#f8c77e"/>
          <rect x="456" y="120" width="48" height="90" rx="12" fill="#fff" stroke="#c9cdd2"/>
        </svg>
      </section>
    </main>
    </div>
  `;
}

function renderLogin() {
  if (store.remembered) return renderWelcomeBack();

  return authCard(`
    <h1>Iniciar sesión</h1>
    ${oauthButton("google", "Continue with Google")}
    ${oauthButton("microsoft", "Iniciar sesión con Microsoft")}
    ${oauthButton("apple", "Iniciar sesión con Apple")}
    ${legalText()}
    ${divider()}
    <form data-form="login">
      ${inputField("Email o teléfono", "email", "text")}
      ${passwordField("Contraseña")}
      <a class="blue-link" href="/forgot-password" data-link>¿Has olvidado tu contraseña?</a>
      <label class="li-check"><input type="checkbox" name="remember" checked/> Mantener la sesión iniciada</label>
      <button class="btn-primary wide" type="submit">Iniciar sesión</button>
    </form>
  `, `<p class="auth-footer">¿Estás empezando a usar LinkedIn? <a href="/register" data-link>Únete ahora</a></p>`);
}

function renderWelcomeBack() {
  const user = store.remembered;
  return authCard(`
    <h1>¡Te damos la bienvenida de nuevo!</h1>
    <div class="remembered-row">
      ${avatar(user)}
      <div><b>${user.name}</b><span>${maskedEmail(user.email)}</span></div>
      <button type="button" class="more-btn">...</button>
    </div>
    <form data-form="welcome">
      ${passwordField("Contraseña")}
      <a class="blue-link" href="/forgot-password" data-link>¿Has olvidado tu contraseña?</a>
      <button class="btn-primary wide" type="submit">Iniciar sesión</button>
    </form>
    ${divider()}
    ${legalText()}
    ${oauthButton("google", "Continue with Google")}
    <hr/>
    <button class="text-btn" data-action="other-account">Iniciar sesión con otra cuenta</button>
  `);
}

function renderForgot() {
  return `
    ${publicNav({ joinOutline: true })}
    <main class="center-page">
      <section class="wide-card">
        <h1>¿Has olvidado tu contraseña?</h1>
        <p class="form-copy">Enviaremos un código de verificación a este email o número de teléfono si coincide con una cuenta de LinkedIn existente.</p>
        <form data-form="forgot">
          ${inputField("Email o teléfono", "email")}
          <button class="btn-primary wide" type="submit">Siguiente</button>
          <button class="text-btn" type="button" data-back="/login">Volver</button>
        </form>
      </section>
      ${footerLinks()}
    </main>
  `;
}

function renderForgotVerify() {
  const email = store.forgot.email || demoUser.email;
  return `
    ${publicNav({ simple: true })}
    <main class="center-page">
      <section class="wide-card">
        <h1>Introduce el código de 6 dígitos</h1>
        <p class="form-copy">Consulta el código de verificación en ${maskedEmail(email)}. <a href="/forgot-password" data-link>Cambiar</a></p>
        <form data-form="forgot-verify">
          <input class="code-input" name="code" inputmode="numeric" maxlength="6" placeholder="000000"/>
          <small data-error="code"></small>
          <button class="text-btn left" type="button" data-action="resend-code">Reenviar código</button>
          <button class="btn-primary wide" type="submit">Enviar</button>
        </form>
        <p class="small-copy">Si no ves el email en tu buzón, consulta la carpeta de correo no deseado o de promociones.</p>
        <a class="blue-link" href="#">¿No puedes acceder a este email?</a>
      </section>
    </main>
  `;
}

function renderResetPassword() {
  return `
    ${publicNav()}
    <main class="center-page">
      <section class="wide-card">
        <h1>Escoge otra contraseña</h1>
        <p class="form-copy">Para proteger tu cuenta, elige una contraseña segura que no hayas usado antes y que tenga al menos 8 caracteres.</p>
        <a class="blue-link" href="#">¿Cómo debe ser una contraseña segura?</a>
        <form data-form="reset">
          ${passwordField("Contraseña nueva", "password")}
          ${inputField("Vuelve a escribir tu contraseña", "confirm", "password")}
          <label class="li-check"><input type="checkbox" checked/> Solicita que todos los dispositivos inicien sesión con la nueva contraseña</label>
          <button class="btn-primary wide" type="submit">Enviar</button>
        </form>
      </section>
    </main>
  `;
}

function renderResetSuccess() {
  return `
    <header class="public-nav">${linkedinLogo()}<nav><a href="/feed" data-link>Ir a LinkedIn</a>${avatar(demoUser, "mini")}</nav></header>
    <main class="center-page">
      <section class="wide-card success-card">
        <h1>Se ha cambiado tu contraseña</h1>
        <svg class="rocket" viewBox="0 0 120 120"><path d="M63 13c21 9 32 25 34 48L76 82 38 44z" fill="#0a66c2"/><path d="M37 45 22 52l18 8zM75 83l-7 16-8-18z" fill="#f8c77e"/><circle cx="68" cy="44" r="9" fill="#fff"/><path d="M38 77c-10 4-16 11-18 23 12-2 20-8 24-18z" fill="#0a66c2"/></svg>
        <a class="btn-primary wide" href="/feed" data-link>Ir a LinkedIn</a>
        <aside class="security-callout"><a href="#">Activar el proceso de verificación en dos pasos ↗</a><p>La verificación en dos pasos es un nivel añadido de seguridad para tu cuenta.</p></aside>
      </section>
    </main>
  `;
}

function registerShell(content, options = {}) {
  return `
    <div class="register-progress"><span style="width:${progress()}%"></span></div>
    <main class="register-page">
      <div class="register-top">${linkedinLogo()}${options.skip ? `<a href="${options.skip}" data-link>Omitir</a>` : ""}</div>
      <section class="register-panel slide-in">${content}</section>
    </main>
  `;
}

function navButtons(back, disabled = false, label = "Continuar") {
  return `<div class="step-actions"><a class="back-circle" href="${back}" data-link>←</a><button class="btn-primary" ${disabled ? "disabled" : ""}>${label}</button></div>`;
}

function renderRegisterStart() {
  return registerShell(`
    <h1>Únete a LinkedIn. ¡Es gratis!</h1>
    <form data-form="register-start">
      ${inputField("Email", "email", "email", store.register.email || "")}
      ${passwordField("Contraseña")}
      <label class="li-check"><input type="checkbox" checked/> Recordarme</label>
      ${legalText()}
      <button class="btn-primary wide" type="submit">Aceptar y unirse</button>
      ${divider()}
      ${oauthButton("google", "Continuar con Google")}
      ${oauthButton("microsoft", "Continuar con Microsoft")}
    </form>
    <p class="auth-footer">¿Ya estás en LinkedIn? <a href="/login" data-link>Iniciar sesión</a></p>
    <p class="company-help">¿Quieres crear una página de empresa? <a href="#">Obtener ayuda</a></p>
  `);
}

function renderRegisterName() {
  return registerShell(`
    <h1>Únete a LinkedIn. ¡Es gratis!</h1>
    <form data-form="register-name">
      ${inputField("Nombre", "firstName", "text", store.register.firstName || "")}
      ${inputField("Apellidos", "lastName", "text", store.register.lastName || "")}
      <button class="btn-primary wide" type="submit">Continuar</button>
    </form>
  `);
}

function renderRegisterLocation() {
  return registerShell(`
    <h1>Añade tu ubicación</h1>
    <p class="form-copy">Esto nos ayuda a recomendarte personas, empleos y noticias en tu zona.</p>
    <form data-form="register-location">
      <div class="location-autocomplete">
        <label class="li-field">
          <span>Ubicación*</span>
          <input id="locationInput" name="location" type="text" autocomplete="off" placeholder="Escribe tu ciudad..."/>
          <small data-error="location"></small>
        </label>
        <ul id="locationSuggestions" class="location-dropdown" hidden></ul>
      </div>
      <button class="btn-primary wide" type="submit">Continuar</button>
    </form>
  `);
}

function renderRegisterExperience() {
  const isStudent = store.register.isStudent ?? false;
  return registerShell(`
    <h1>¿Cuál es tu experiencia más reciente?</h1>
    <p class="form-copy">Puedes cambiar esto más adelante.</p>
    <form data-form="register-experience">
      <label class="switch-row">Soy estudiante <input type="checkbox" name="isStudent" ${isStudent ? "checked" : ""} data-action="toggle-student"/><span></span></label>
      <div data-experience-fields>
        ${isStudent ? studentFields() : professionalFields()}
      </div>
      ${navButtons("/register/location")}
    </form>
  `);
}

function studentFields() {
  return `
    ${inputField("Universidad o institución educativa*", "university", "text", store.register.university || "", 'placeholder="Ejemplo: Universidad de Salamanca"')}
    ${inputField("Titulación", "degree", "text", store.register.degree || "", 'placeholder="Ejemplo: grado/licenciatura en Letras"')}
    ${inputField("Disciplina académica*", "discipline", "text", store.register.discipline || "", 'placeholder="Ejemplo: administración de empresas"')}
    ${inputField("Año inicio*", "startYear", "number", store.register.startYear || "2024")}
    <label class="li-check"><input name="age" type="checkbox" checked/> Tengo más de 16 años</label>
  `;
}

function professionalFields() {
  return `
    ${inputField("Cargo*", "jobTitle", "text", store.register.jobTitle || "Maestro", 'placeholder="Ejemplo: Maestro"')}
    ${inputField("Empresa*", "company", "text", store.register.company || "Campuslands", 'placeholder="Ejemplo: Microsoft"')}
  `;
}

function renderRegisterVerifyEmail() {
  return registerShell(`
    <h1>Verifica tu email</h1>
    <p class="form-copy">Introduce el código de 6 dígitos que te hemos enviado a: ${store.register.email || demoUser.email}</p>
    <form data-form="register-verify">
      <input class="code-input" name="code" maxlength="6" placeholder="Código de seis dígitos"/>
      <button class="oauth-btn wide" type="button" data-action="resend-code">Reenviar código</button>
      <details class="privacy-box"><summary>🛡 Tu privacidad es muy importante</summary><p>Controlas cómo se usa tu información durante el registro.</p></details>
      ${navButtons("/register/experience", true)}
    </form>
  `);
}

function renderJobSearch() {
  return registerShell(`
    <h1>¿Estás buscando empleo?</h1>
    <p class="form-copy">Tu respuesta nos ayudará a personalizar tu experiencia, pero solo tú podrás verla.</p>
    <form data-form="job-search">
      ${["Sí, estoy buscando empleo de forma activa", "Quizá, si encuentro la oportunidad adecuada", "No, ahora no me interesa"].map((text) => `<label class="radio-card"><input type="radio" name="jobSearch" value="${text}"/><span>${text}</span></label>`).join("")}
      ${navButtons("/register/verify-email", true)}
    </form>
  `, { skip: "/register/photo" });
}

function renderJobPreferences() {
  return registerShell(`
    <h1>¿Qué tipo de empleos podrían interesarte?</h1>
    <p class="form-copy">Puedes seleccionar hasta 5 cargos y ubicaciones.</p>
    <form data-form="job-preferences">
      ${inputField("Cargos", "preferredJobs", "text", store.register.preferredJobs || "", 'placeholder="Ejemplo: responsable de ventas minoristas"')}
      ${inputField("Ubicaciones de empleo", "jobLocations", "text", store.register.jobLocations || "", 'placeholder="Ejemplo: Toledo, España"')}
      <label class="li-check"><input name="remote" type="checkbox"/> Me interesa teletrabajar</label>
      ${navButtons("/register/job-search", true)}
    </form>
  `, { skip: "/register/photo" });
}

function renderJobNotifications() {
  return registerShell(`
    <h1>Configura tus notificaciones de empleo</h1>
    <p class="form-copy">Alertas de empleo recomendadas para ti. Podrás crear otras después.</p>
    <form data-form="job-notifications">
      <article class="option-card"><label class="switch-row">Notificaciones de empleos <input type="checkbox" checked/><span></span></label><p>${store.register.preferredJobs || "Teacher"}</p><p>${store.register.jobLocations || "Bucaramanga, Santander, Colombia"}</p></article>
      <article class="option-card"><label class="li-check"><input type="checkbox" checked/> <b>Informa a los técnicos de selección sobre tu interés por nuevos empleos</b></label><div class="privacy-blue">Solo se mostrará según tus preferencias de privacidad. <a href="#">Más información sobre tu privacidad</a></div></article>
      ${navButtons("/register/job-preferences")}
    </form>
  `, { skip: "/register/photo" });
}

function renderPhoto() {
  const user = registeredUser();
  return registerShell(`
    <h1>Añade una foto para que los técnicos de selección den mayor atención a tu perfil</h1>
    <form data-form="photo">
      <article class="photo-preview">
        <button type="button" class="photo-avatar">${avatar(user, "xl")}<b>+</b></button>
        <h2>${user.name}</h2>
        <p>${user.headline}</p>
      </article>
      ${navButtons("/register/job-notifications")}
    </form>
  `, { skip: "/register/contacts" });
}

function renderContacts() {
  return registerShell(`
    <h1>Crea tu red por la vía rápida</h1>
    <p class="form-copy">Averigua a quién conoces en LinkedIn.</p>
    <div class="gmail-art"><span>Gmail</span><i>XA</i><i>AR</i><i>CT</i><i>LM</i></div>
    <ul class="benefits"><li>👥 Vincula tus contactos de Gmail</li><li>🛡 Elige quién puede conectar contigo</li><li>📈 Mira oportunidades de crecimiento</li></ul>
    <a class="blue-link" href="#">Más información</a>
    <form data-form="contacts">${navButtons("/register/photo")}</form>
    <div class="google-modal" hidden data-google-modal>
      <section>
        <header>${googleIcon()} <b>Acceder con Google</b></header>
        ${liIcon()}
        <h2>Elige una cuenta</h2>
        <p>Ir a LinkedIn</p>
        <button class="google-account" data-action="google-account">${avatar(registeredUser())}<span><b>${registeredUser().name}</b><small>${registeredUser().email}</small></span></button>
        <button class="text-btn left">⊙ Usar otra cuenta</button>
        <footer>Español (Latinoamérica) ▼ <span>Ayuda Privacidad Condiciones</span></footer>
      </section>
    </div>
  `, { skip: "/register/app-download" });
}

function renderAppDownload() {
  return registerShell(`
    <h1>Descarga la aplicación para llevar la delantera</h1>
    <p class="form-copy">Lee las noticias de tu sector o habla con tus contactos sobre la marcha.</p>
    <form data-form="app-download">
      <div class="phone-qr"><span></span><div>${Array.from({ length: 49 }, (_, i) => `<i class="${i % 3 === 0 ? "on" : ""}"></i>`).join("")}</div></div>
      ${navButtons("/register/contacts")}
    </form>
  `);
}

function renderGames() {
  return registerShell(`
    <h1>Con solo jugar a diario, tendrás 1,5 veces más probabilidades de conectar con algún técnico de selección.</h1>
    <form data-form="games">
      <div class="game-icons">${["Zip", "Tango", "Queens", "Pinpoint", "Crossclimb", "Mini"].map((g, i) => `<span style="--i:${i}">${g[0]}</span>`).join("")}</div>
      <label class="switch-row">Recibir notificaciones para probar juegos de LinkedIn <input type="checkbox" checked/><span></span></label>
      <a class="blue-link" href="#">¿A qué esperas? ⚡ Pruébalo ya</a>
      <article class="game-card"><b>¡Descanso de 30 segundos!</b><h2>Zip</h2><p>Ábrete camino.</p><button class="btn-outline" type="button">Resolver</button></article>
      ${navButtons("/register/app-download", false, "Finalizar")}
    </form>
  `);
}

function registeredUser() {
  const name = `${store.register.firstName || "Ximena"} ${store.register.lastName || "Afanador"}`;
  return {
    ...demoUser,
    name,
    email: store.register.email || demoUser.email,
    headline: store.register.jobTitle || store.register.degree || "Profesional",
    location: store.register.location || demoUser.location,
    company: store.register.company || demoUser.company
  };
}

function renderFeed() {
  const user = store.auth.user || registeredUser();
  return `
    ${appNav("Inicio")}
    <main class="feed-layout">
      <aside class="feed-left">
        <section class="profile-mini card">
          <div class="cover-soft"></div>
          <button class="avatar-plus">${avatar(user, "large")}<b>+</b></button>
          <h2>${user.name}</h2>
          <p>${user.headline}</p>
          <small>${user.location}</small>
          <hr/>
          <a href="#">Contactos <b>0</b></a><a href="#">Amplía tu red</a>
          <hr/>
          <a href="#">≡ Preferencias</a><a href="#">🔖 Registro de empleos</a><a href="#">🟡 Mis perspectivas profesionales</a>
          <a class="blue-link" href="#">Anunciar un empleo gratis</a>
        </section>
        <footer class="mini-footer">Acerca de · Accesibilidad · Condiciones de uso · Privacidad</footer>
      </aside>
      <section class="feed-center">
        <article class="post-composer card">
          ${avatar(user)}
          <button>Crear publicación</button>
          <div><span>📹 Vídeo</span><span>📷 Foto</span><span>📝 Escribir artículo</span></div>
        </article>
        <div class="sort-row"><span></span>Ordenar por: <b>Principales ∨</b></div>
        <article class="card recommended">
          <h2>Te recomendamos</h2>
          <div class="recommend-grid">${suggestions().map(personSuggestion).join("")}</div>
          <a href="#">Mostrar más →</a>
        </article>
        <article class="card sponsored">
          <header><span class="company-logo">A</span><div><b>Atlassian</b><small>1.223.901 seguidores · Promocionado</small></div></header>
          <p>Equipos de software modernos construyen mejores productos cuando colaboran con claridad.</p>
          <div class="sponsored-media"></div>
          <footer><button>👍 Like</button><button>💬 Comment</button><button>↩ Repost</button><button>✈ Send</button></footer>
        </article>
      </section>
      <aside class="feed-right">
        <section class="card right-card"><h2>Juegos de hoy</h2>${["Zip #72", "Tango #64", "Queens #88", "Pinpoint #41"].map((g) => `<a href="#"><b>${g}</b><span>Desafío diario ></span></a>`).join("")}<a href="#">Mostrar más ∨</a></section>
        <section class="card right-card"><h2>Añadir a tu feed</h2>${["IBM", "Claude", "Platzi"].map((name) => `<article><span class="company-logo">${name[0]}</span><div><b>${name}</b><small>Empresa</small><button>+ Seguir</button></div></article>`).join("")}<a href="#">Ver todas las recomendaciones</a></section>
      </aside>
    </main>
  `;
}

function personSuggestion(person) {
  return `<section><span class="avatar">${person.initials}</span><b>${person.name}</b><p>${person.role}</p><small>Los profesionales del sector de Desarrollo de software también siguen a estas personas</small><button class="btn-outline">+ Seguir</button></section>`;
}

function suggestions() {
  return [
    { initials: "AR", name: "Andrea Rojas", role: "Recruiter IT | Selección de talento tech" },
    { initials: "CP", name: "Carlos Pérez", role: "Software Engineer at Globant" },
    { initials: "MD", name: "María Díaz", role: "Talent Acquisition Specialist" }
  ];
}

function appNav(active = "") {
  const items = [
    ["Inicio", "/feed", "⌂"],
    ["Mi red", "#", "👥"],
    ["Empleos", "#", "💼"],
    ["Mensajes", "#", "💬"],
    ["Notificaciones", "#", "🔔"],
    ["Yo▼", "/profile/me", "👤"],
    ["Para negocios▼", "#", "⋮⋮⋮"]
  ];
  return `
    <header class="app-nav">
      <div class="app-brand">${liIcon()}<label><span>⌕</span><input placeholder="Buscar"/></label></div>
      <nav>${items.map(([label, href, icon]) => {
        if (href === "/profile/me") {
          return `
            <div class="nav-dropdown-wrap">
              <a class="nav-yo ${label.startsWith(active) ? "active" : ""}" href="${href}" data-link>
                <i>${icon}</i><span>${label}</span>
              </a>
              <div class="nav-dropdown">
                <a href="/profile/me" data-link>Ver perfil</a>
                <hr/>
                <button data-action="logout">Cerrar sesión</button>
              </div>
            </div>`;
        }
        return `<a class="${label.startsWith(active) ? "active" : ""}" href="${href}" ${href !== "#" ? "data-link" : ""}><i>${icon}</i><span>${label}</span>${label === "Notificaciones" ? "<b>1</b>" : ""}</a>`;
      }).join("")}</nav>
      <a class="premium" href="#">Probar Premium por 0 COP</a>
    </header>
  `;
}

function renderProfile() {
  const user = store.auth.user || demoUser;
  return `
    ${appNav("Yo")}
    <main class="profile-layout">
      <section class="profile-main card">
        <div class="profile-cover"></div>
        <button class="avatar-plus profile-avatar">${avatar(user, "xl")}<b>+</b></button>
        <button class="edit-btn" data-action="edit-profile">✎</button>
        <div class="profile-info">
          <h1>${user.name}</h1>
          <a class="verify-link" href="#">✔ Añadir insignia de verificación</a>
          <p id="profileHeadline" data-editable="headline">${user.headline} | HTML y CSS | IA</p>
          <small>${user.location} · <a href="#">Información de contacto</a></small>
          <div class="profile-actions"><button class="btn-primary">Tengo interés en...</button><button class="btn-outline">Añadir sección</button><button class="btn-outline">Mejorar perfil</button><button class="btn-outline">...</button></div>
        </div>
        <aside class="profile-company"><span class="company-logo">C</span><b>${user.company}</b></aside>
      </section>
      <aside class="profile-side">
        <section class="card right-card"><h2>URL y perfil público <button>✎</button></h2><p>www.linkedin.com/in/ximena-afanador-749</p></section>
        <section class="card right-card"><h2>Otros perfiles vistos por tus visitantes</h2><small>Solo para ti</small>${suggestions().concat(suggestions().slice(0, 1)).map((p) => `<article>${avatar({ name: p.name })}<div><b>${p.name}</b><small>${p.role}</small><button>Ver</button></div></article>`).join("")}</section>
      </aside>
    </main>
  `;
}

function footerLinks() {
  return `<footer class="legal-footer">Condiciones de uso · Política de privacidad · Política de cookies · Copyright LinkedIn 2026</footer>`;
}

function renderToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function showError(form, name, message) {
  const target = form.querySelector(`[data-error="${name}"]`);
  if (target) target.textContent = message;
}

function requireFields(form, names) {
  let ok = true;
  names.forEach((name) => {
    const input = form.elements[name];
    if (!input?.value?.trim()) {
      showError(form, name, "Este campo es obligatorio");
      ok = false;
    }
  });
  return ok;
}

function bindPageEvents() {
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href"));
    });
  });

  document.querySelectorAll("[data-oauth]").forEach((button) => {
    button.addEventListener("click", () => {
      if (location.pathname.startsWith("/register")) {
        saveRegister({ firstName: "Ximena", lastName: "Afanador", email: demoUser.email });
        navigate("/register/name");
      } else {
        login(demoUser);
      }
    });
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector(`[name="${button.dataset.togglePassword}"]`);
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Mostrar" : "Ocultar";
    });
  });

  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.back)));
  document.querySelector('[data-action="other-account"]')?.addEventListener("click", () => {
    localStorage.removeItem("tl_remembered");
    store.remembered = null;
    render();
  });
  document.querySelectorAll('[data-action="resend-code"]').forEach((button) => button.addEventListener("click", () => renderToast("Código reenviado")));
  document.querySelector('[data-action="toggle-student"]')?.addEventListener("change", (event) => {
    saveRegister({ isStudent: event.target.checked });
    render();
  });
  document.querySelector('[data-action="google-account"]')?.addEventListener("click", () => navigate("/register/app-download"));
  document.querySelector('[data-action="logout"]')?.addEventListener("click", logout);

  if (location.pathname === "/register/location") {
    const locationInput = document.getElementById("locationInput");
    const suggestionsList = document.getElementById("locationSuggestions");

    if (locationInput && suggestionsList) {
      locationInput.value = store.register.location || "";

      let debounceTimer;
      locationInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        const query = locationInput.value.trim();
        if (query.length < 3) {
          suggestionsList.hidden = true;
          return;
        }
        debounceTimer = setTimeout(() => {
          fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`, {
            headers: { "Accept-Language": "es" }
          })
            .then((response) => response.json())
            .then((results) => {
              suggestionsList.innerHTML = "";
              if (!results.length) {
                suggestionsList.hidden = true;
                return;
              }
              results.forEach((place) => {
                const li = document.createElement("li");
                li.textContent = place.display_name;
                li.addEventListener("click", () => {
                  locationInput.value = place.display_name;
                  suggestionsList.hidden = true;
                  saveRegister({ location: place.display_name });
                });
                suggestionsList.appendChild(li);
              });
              suggestionsList.hidden = false;
            });
        }, 400);
      });

      document.addEventListener("click", (event) => {
        if (!event.target.closest(".location-autocomplete")) suggestionsList.hidden = true;
      });
    }
  }

  document.querySelector('[data-action="edit-profile"]')?.addEventListener("click", () => {
    const el = document.getElementById("profileHeadline");
    if (!el || el.querySelector("textarea")) return;

    const original = el.textContent.trim();
    el.innerHTML = `
      <textarea class="edit-textarea">${original}</textarea>
      <div class="edit-actions">
        <button class="btn-primary" data-action="save-headline">Guardar</button>
        <button class="btn-outline" data-action="cancel-headline">Cancelar</button>
      </div>`;

    document.querySelector('[data-action="save-headline"]').addEventListener("click", () => {
      const newVal = el.querySelector("textarea").value.trim() || original;
      if (store.auth.user) {
        store.auth.user.headline = newVal;
        saveAuth();
      }
      el.innerHTML = newVal;
    });

    document.querySelector('[data-action="cancel-headline"]').addEventListener("click", () => {
      el.innerHTML = original;
    });
  });

  document.querySelector(".profile-actions .btn-outline:nth-child(3)")?.addEventListener("click", () => {
    document.querySelector('[data-action="edit-profile"]')?.click();
  });

  bindForms();
}

function bindForms() {
  const form = document.querySelector("form[data-form]");
  if (!form) return;
  form.addEventListener("input", () => {
    form.querySelectorAll("small[data-error]").forEach((small) => (small.textContent = ""));
    if (form.dataset.form === "register-verify") form.querySelector(".step-actions button").disabled = form.code.value.length < 6;
    if (form.dataset.form === "job-search") form.querySelector(".step-actions button").disabled = !form.jobSearch.value;
    if (form.dataset.form === "job-preferences") form.querySelector(".step-actions button").disabled = !form.preferredJobs.value.trim() || !form.jobLocations.value.trim();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleForm(form);
  });
}

function handleForm(form) {
  const data = Object.fromEntries(new FormData(form));
  const route = {
    login: () => requireFields(form, ["email", "password"]) && login({ email: data.email }),
    welcome: () => requireFields(form, ["password"]) && login(store.remembered),
    forgot: () => {
      if (!requireFields(form, ["email"])) return;
      saveForgot({ email: data.email });
      navigate("/forgot-password/verify");
    },
    "forgot-verify": () => /^\d{6}$/.test(data.code || "") ? navigate("/reset-password") : showError(form, "code", "Introduce 6 dígitos"),
    reset: () => {
      if (!requireFields(form, ["password", "confirm"])) return;
      if (data.password.length < 8) return showError(form, "password", "Debe tener al menos 8 caracteres");
      if (data.password !== data.confirm) return showError(form, "confirm", "Las contraseñas no coinciden");
      saveRemembered(demoUser);
      store.auth = { isLoggedIn: true, user: demoUser };
      saveAuth();
      navigate("/reset-password/success");
    },
    "register-start": () => {
      if (!requireFields(form, ["email", "password"])) return;
      saveRegister(data);
      navigate("/register/name");
    },
    "register-name": () => {
      if (!requireFields(form, ["firstName", "lastName"])) return;
      saveRegister(data);
      navigate("/register/location");
    },
    "register-location": () => {
      if (!requireFields(form, ["location"])) return;
      saveRegister(data);
      navigate("/register/experience");
    },
    "register-experience": () => {
      saveRegister({ ...data, isStudent: Boolean(form.elements.isStudent?.checked) });
      navigate("/register/verify-email");
    },
    "register-verify": () => {
      if ((data.code || "").length < 6) return showError(form, "code", "Introduce el código de seis dígitos");
      navigate("/register/job-search");
    },
    "job-search": () => {
      if (!data.jobSearch) return;
      saveRegister(data);
      navigate(data.jobSearch === "No, ahora no me interesa" ? "/register/photo" : "/register/job-preferences");
    },
    "job-preferences": () => {
      if (!requireFields(form, ["preferredJobs", "jobLocations"])) return;
      saveRegister(data);
      navigate("/register/job-notifications");
    },
    "job-notifications": () => navigate("/register/photo"),
    photo: () => navigate("/register/contacts"),
    contacts: () => document.querySelector("[data-google-modal]").hidden = false,
    "app-download": () => navigate("/register/games"),
    games: () => login(registeredUser())
  }[form.dataset.form];
  route?.();
}

function routeView() {
  const path = location.pathname;
  const privateRoutes = ["/feed", "/profile/me"];
  if (privateRoutes.includes(path) && !store.auth.isLoggedIn) {
    history.replaceState({}, "", "/login");
    return renderLogin();
  }
  const routes = {
    "/": renderLanding,
    "/login": renderLogin,
    "/forgot-password": renderForgot,
    "/forgot-password/verify": renderForgotVerify,
    "/reset-password": renderResetPassword,
    "/reset-password/success": renderResetSuccess,
    "/register": renderRegisterStart,
    "/register/name": renderRegisterName,
    "/register/location": renderRegisterLocation,
    "/register/experience": renderRegisterExperience,
    "/register/verify-email": renderRegisterVerifyEmail,
    "/register/job-search": renderJobSearch,
    "/register/job-preferences": renderJobPreferences,
    "/register/job-notifications": renderJobNotifications,
    "/register/photo": renderPhoto,
    "/register/contacts": renderContacts,
    "/register/app-download": renderAppDownload,
    "/register/games": renderGames,
    "/feed": renderFeed,
    "/profile/me": renderProfile
  };
  return (routes[path] || renderLanding)();
}

function render() {
  app.classList.add("fade-out");
  setTimeout(() => {
    app.innerHTML = routeView();
    app.classList.remove("fade-out");
    bindPageEvents();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 80);
}

window.addEventListener("popstate", render);
window.appLogout = logout;
render();
