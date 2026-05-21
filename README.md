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

## Incluye

- Landing publica estilo LinkedIn
- Login normal, OAuth simulado y pantalla "welcome back"
- Recuperacion de contrasena en 4 pasos
- Registro guiado con barra de progreso y pasos simulados
- Modal OAuth Google simulado para importar contactos
- Feed final de LinkedIn en 3 columnas
- Perfil `/profile/me` estilo LinkedIn
- Rutas SPA sin recarga completa
- Estado mock en `localStorage` y `sessionStorage`

## Flujos incluidos

No conecta con APIs reales. Todo el flujo es simulado del lado frontend.
