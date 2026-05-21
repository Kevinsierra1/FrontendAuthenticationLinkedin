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

Configura variables de entorno en `.env` (ver `.env.example`):

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_API_BASE_URL=http://localhost:5152`

El servidor de desarrollo (`server.mjs`) expone esas variables en runtime (`/env.js`) y proxea `/api/*` al backend para evitar problemas de CORS.

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

Google OAuth usa token real de Google y lo intercambia con:

- `POST /api/auth/external-login/google`

El backend responde `accessToken`/`refreshToken` internos y esos son los tokens usados por la sesion de la app.
