# SafeOps

Sistema para la gestión de riesgos operacionales por área de trabajo.
Proyecto del curso Desarrollo Web Integrado (UTP).

| Carpeta | Contenido | Tecnología |
|---|---|---|
| `safeops-api/` | API REST con autenticación JWT y roles | Java 21, Spring Boot 4, Spring Security, JPA, H2 |
| `safeops-web/` | Interfaz de usuario | Angular 21, TypeScript, SASS |

## Requisitos

- JDK 21
- Node.js 20.19 o superior

## Configuración inicial

La clave JWT y las contraseñas de las cuentas iniciales no están en el repositorio.
Antes de ejecutar la API por primera vez:

1. En `safeops-api/`, copia `application-local.properties.example` como `application-local.properties`.
2. Completa los tres valores (una clave JWT de al menos 32 caracteres y las contraseñas
   de las cuentas `superadmin` e `invitado`).

También se pueden definir como variables de entorno: `JWT_SECRET`,
`SAFEOPS_ADMIN_PASSWORD` y `SAFEOPS_INVITADO_PASSWORD`.

## Cómo ejecutar

```powershell
# Terminal 1: API en http://localhost:8080
cd safeops-api
.\mvnw.cmd spring-boot:run

# Terminal 2: interfaz en http://localhost:4200
cd safeops-web
npm install
npm start
```

Al iniciar, la API crea las cuentas `superadmin` (ADMIN) e `invitado` (GUEST).
Las cuentas nuevas se crean desde la pantalla de registro con rol USER.

## Roles

| Rol | Consultar | Registrar y editar | Eliminar | Administrar usuarios |
|---|---|---|---|---|
| ADMIN | Sí | Sí | Sí | Sí |
| USER | Sí | Sí | No | No |
| GUEST | Sí | No | No | No |

## Pruebas

```powershell
# Pruebas automatizadas de la API (usan una base H2 en memoria)
cd safeops-api
.\mvnw.cmd clean test

# Verificación de los endpoints con la API en ejecución
powershell -ExecutionPolicy Bypass -File .\probar-endpoints.ps1
```

La estructura, las rutas y las validaciones del front-end están en `safeops-web/README.md`.
