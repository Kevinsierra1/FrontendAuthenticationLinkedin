# Frontend Authentication LinkedIn

Simulador del flujo de autenticación y experiencia de usuario de LinkedIn. Desarrollado con **HTML5, CSS3 y JavaScript Vanilla ES6+**.

---

## Requisitos Previos Obligatorios

Antes de empezar, verifica que tienes:

- **Node.js v18+** - [Descargar](https://nodejs.org/)
- **Git** - Para clonar el repositorio
- **pnpm o npm** - Gestor de paquetes
- **Backend .NET corriendo en `http://localhost:5152`**

---

## Instalación Paso a Paso

### 1. Clonar y preparar

```bash
git clone https://github.com/tu-usuario/FrontendAuthenticationLinkedin.git
cd FrontendAuthenticationLinkedin
```

### 2. Instalar dependencias

```bash
pnpm install
```

**Si no tienes pnpm:**
```bash
corepack enable
corepack prepare pnpm@10.11.0 --activate
```

### 3. Configurar variables de entorno

Crea archivo `.env` en la raíz del proyecto:

```env
# REEMPLAZA ESTO CON TU CLIENT ID DE GOOGLE
# Obtener en: https://console.cloud.google.com/
VITE_GOOGLE_CLIENT_ID=xxxxxxx.apps.googleusercontent.com

# URL donde corre tu backend .NET
# Por defecto: http://localhost:5152
VITE_API_BASE_URL=http://localhost:5152

# Entorno
VITE_ENV=development
```

**Variables que debes cambiar:**
- `VITE_GOOGLE_CLIENT_ID` → Tu Client ID de Google OAuth
- `VITE_API_BASE_URL` → URL del backend (si no es localhost:5152)

### 4. Ejecutar

```bash
pnpm run dev
```

La app abrirá en `http://localhost:4173`

---

## Descripción

Características incluidas:
- Login tradicional, Registro y OAuth Google
- Recuperación de contraseña en 4 pasos
- Feed, perfil y notificaciones estilo LinkedIn
- Arquitectura SPA sin recargas de página
- Persistencia de sesión en localStorage/sessionStorage

---

## Estructura del Proyecto

- **src/core/** - Autenticación, router, estado global
- **src/modules/** - Páginas (Auth, Feed, Profile, etc)
- **src/services/** - Servicios de API
- **server.mjs** - Servidor con proxy CORS

---

## Comandos Disponibles

```bash
pnpm run dev      # Desarrollo (http://localhost:4173)
pnpm run build    # Compilar para producción
pnpm run preview  # Preview del build
```

---

## Repositorio Backend

**Backend necesario:** [https://github.com/santiagoGal7/AuthenticationLinkedin.NET](https://github.com/santiagoGal7/AuthenticationLinkedin.NET)

El backend debe estar ejecutándose en `http://localhost:5152` con estos endpoints:

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/verify-email` - Verificar email
- `POST /api/auth/forgot-password` - Recuperación
- `POST /api/auth/reset-password` - Restablecer contraseña
- `POST /api/auth/google/callback` - OAuth callback
- `GET /api/user/me` - Usuario actual
- `GET /api/user/profile/:id` - Perfil usuario
- `PUT /api/user/profile` - Actualizar perfil
- `GET /api/feed` - Feed

---

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| "Cannot GET /env.js" | Ejecuta `pnpm run dev` (no abras HTML directamente) |
| "CORS error" | Verifica `VITE_API_BASE_URL` en `.env` |
| "OAuth no funciona" | Valida `VITE_GOOGLE_CLIENT_ID` en `.env` |
| "Backend no responde" | Asegúrate que backend corre en `http://localhost:5152` |
| "Sesión desaparece" | Comprueba que `localStorage` esté habilitado |

---

## Licencia

Proyecto educativo/demostrativo.
