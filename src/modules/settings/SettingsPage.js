export function SettingsPage() {
  const isSecurity = window.location.pathname.includes("security");
  return {
    html: `
      <section class="workspace">
        <aside class="side-menu card">
          <a href="/settings" data-link>Cuenta</a>
          <a href="/settings/security" data-link>Seguridad</a>
          <a>Privacidad</a><a>Notificaciones</a><a>Preferencias</a>
        </aside>
        <main class="card settings-panel">
          ${isSecurity ? security() : account()}
        </main>
      </section>
    `
  };
}

function account() {
  return `
    <h1>Configuracion</h1>
    <label class="field"><span>Email principal</span><input value="sofia@company.com" /></label>
    <label class="field"><span>Idioma</span><select><option>Español</option><option>English</option></select></label>
    <label class="check"><input type="checkbox" checked /> Recibir recomendaciones de red</label>
  `;
}

function security() {
  return `
    <h1>Seguridad de cuenta</h1>
    <form class="grid-form">
      <label class="field"><span>Password actual</span><input type="password" /></label>
      <label class="field"><span>Nuevo password</span><input type="password" /></label>
      <button class="btn btn-primary">Cambiar password</button>
    </form>
    <h2>Sesiones activas</h2>
    <article class="device"><b>Chrome · Windows</b><span>Bogota · ahora</span><button>Cerrar sesion</button></article>
    <article class="device"><b>Safari · iPhone</b><span>Medellin · hace 2 dias</span><button>Cerrar sesion</button></article>
  `;
}
