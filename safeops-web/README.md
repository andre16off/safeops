# SafeOps Web

Front-end en Angular 21 de **SafeOps**, el sistema de gestión de riesgos operacionales.
Consume la API REST de Spring Boot (`safeops-api`) con autenticación JWT.

## Requisitos

- Node.js 20.19 o superior (probado con Node 24)
- La API `safeops-api` en ejecución en `http://localhost:8080`

## Cómo ejecutar

```powershell
# 1. Levantar la API (en la carpeta safeops-api)
.\mvnw.cmd spring-boot:run

# 2. Levantar el front-end (en la carpeta safeops-web)
npm install
npm start
```

Abrir `http://localhost:4200`.

El front-end llama a `/api` y el servidor de desarrollo reenvía esas peticiones a
`http://localhost:8080` (ver `proxy.conf.json`). La ruta base se configura en
`src/environments/environment.ts`.

## Estructura

```text
src/
├── environments/environment.ts   Dirección de la API
├── styles/                       SASS global: variables, base y componentes
└── app/
    ├── app.routes.ts             Rutas y guards
    ├── app.config.ts             Router, HttpClient e interceptor
    ├── core/                     Servicios, interceptor JWT, guards, modelos y validaciones
    ├── layout/shell              Cabecera y navegación de las vistas con sesión
    ├── shared/                   Matriz de riesgo, insignia de nivel, avisos y botón de tema
    └── features/
        ├── auth/                 Login y registro
        ├── inicio/               Panel de inicio con el resumen de riesgos
        ├── areas/                Lista y formulario de áreas
        ├── riesgos/              Lista, formulario y detalle de riesgos
        └── usuarios/             Lista de cuentas (solo ADMIN)
```

## Vistas y rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Sin sesión |
| `/registro` | Crear cuenta | Sin sesión |
| `/inicio` | Panel de inicio: riesgos por nivel, por celda de la matriz y por área | Todos los roles |
| `/areas` | Lista de áreas (tarjetas) | Todos los roles |
| `/areas/nueva`, `/areas/:id/editar` | Formulario de área | ADMIN, USER |
| `/areas/:areaId/riesgos` | Riesgos de un área (tabla) | Todos los roles |
| `/areas/:areaId/riesgos/nuevo` | Formulario de riesgo | ADMIN, USER |
| `/riesgos` | Todos los riesgos, con búsqueda, filtros y orden por columna | Todos los roles |
| `/riesgos/:id` | Detalle del riesgo | Todos los roles |
| `/riesgos/:id/editar` | Formulario de riesgo | ADMIN, USER |
| `/usuarios` | Lista de cuentas | ADMIN |

## Autenticación y roles

- El login guarda el token JWT, el usuario y el rol en `localStorage`.
- `auth.interceptor.ts` agrega `Authorization: Bearer <token>` a cada petición a la API.
  Si la API responde 401, cierra la sesión y redirige a `/login`.
- `auth.guard.ts` protege las rutas: sin sesión se redirige a `/login`; un invitado
  que intenta abrir un formulario vuelve a su vista inicial.
- Después del login, ADMIN y USER entran a `/inicio` y GUEST a `/riesgos`.
- Los botones de registrar, editar y eliminar se muestran según el rol
  (GUEST solo consulta, USER registra y edita, ADMIN además elimina).
  La API valida los mismos permisos.

## Consumo de la API

| Método | Endpoint | Dónde se usa |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/register` | Login y registro |
| GET | `/api/areas`, `/api/areas/{id}` | Lista y edición de áreas |
| POST / PUT / DELETE | `/api/areas`, `/api/areas/{id}` | Formulario y lista de áreas |
| GET | `/api/riesgos`, `/api/riesgos/{id}` | Tabla y detalle |
| GET | `/api/areas/{areaId}/riesgos` | Riesgos de un área |
| GET | `/api/riesgos/nivel/{nivel}` | Filtro por nivel (JPQL) |
| GET | `/api/riesgos/impacto-minimo/{impacto}` | Filtro por impacto mínimo (JPQL) |
| POST | `/api/areas/{areaId}/riesgos` | Registrar riesgo |
| PUT / DELETE | `/api/riesgos/{id}` | Editar y eliminar riesgo |
| GET / DELETE | `/api/usuarios`, `/api/usuarios/{id}` | Lista y eliminación de cuentas (ADMIN) |

## Validaciones de los formularios

Formularios reactivos. Los mensajes aparecen debajo de cada campo y los errores
que devuelve la API (400, 404, 409) se muestran en la misma vista.

| Formulario | Reglas |
|---|---|
| Login | Usuario y contraseña obligatorios |
| Registro | Usuario de 4 a 30 caracteres (letras, números, `.`, `-`, `_`); contraseña de 8 a 72; confirmación igual a la contraseña |
| Área | Nombre obligatorio, de 3 a 100 caracteres; ubicación obligatoria, hasta 150 |
| Riesgo | Peligro de 3 a 120 caracteres; descripción de 10 a 255; probabilidad e impacto obligatorios, de 1 a 5 |

## Otras funciones

- **Tema claro y oscuro.** El botón de la cabecera cambia el tema; la elección se guarda
  en `localStorage` y, si no hay ninguna, se usa la preferencia del sistema.
- **Búsqueda y orden.** La tabla de riesgos busca por peligro, descripción o área
  (sin distinguir tildes ni mayúsculas) y se ordena al hacer clic en los encabezados.
- **Avisos.** Registrar, guardar y eliminar muestran una notificación que se cierra sola.
