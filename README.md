# FrontendAuthenticationLinkedin

Simulador frontend del proceso de autenticacion y registro de LinkedIn construido con HTML5, CSS3 y JavaScript Vanilla ES6+.

## Ejecutar

```powershell
pnpm run dev
```

Luego abre:

http://localhost:4173

Si pnpm no esta instalado:

```powershell
corepack enable
corepack prepare pnpm@10.11.0 --activate
```

## Conexion con backend local

Este frontend usa por defecto:

- `API_BASE_URL: /api`
- `USE_MOCK: false`
- `FALLBACK_TO_MOCK: true`

La configuracion vive en `src/core/config/env.js`.

El servidor de desarrollo (`server.mjs`) hace proxy de `/api/*` hacia:

- `BACKEND_URL=http://localhost:5152` (valor por defecto)

Backend esperado:

- `C:\Users\Usuario\TomDev\Simulacion-Linkedin`

## Incluye

- Landing publica estilo LinkedIn
- Login normal, OAuth simulado y pantalla "welcome back"
- Recuperacion de contrasena en 4 pasos
- Registro guiado con barra de progreso y pasos simulados
- Modal OAuth Google simulado para importar contactos
- Feed final de LinkedIn en 3 columnas
- Perfil `/profile/me` estilo LinkedIn
- Rutas SPA sin recarga completa
- Estado en `localStorage` y `sessionStorage` con fallback a mock para endpoints no implementados

## Flujos incluidos

Conecta con API real cuando existe el endpoint y cae a flujo mock cuando el endpoint aun no esta disponible.
