// Toma las capturas de pantalla del informe APF3 con la aplicación real en ejecución.
//
// Requisitos: la API en http://localhost:8080 y el front-end en http://localhost:4200.
// Uso:  npm install   (solo la primera vez)
//       node capturar.mjs
//
// Usa el navegador Microsoft Edge instalado en Windows (no descarga otro navegador).
// Las contraseñas de superadmin e invitado se leen de safeops-api/application-local.properties.
// Durante el recorrido crea una cuenta y un riesgo de demostración y los elimina al terminar.

import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SAFEOPS_WEB ?? 'http://localhost:4200';
const SALIDA = join(AQUI, 'imagenes');
const USUARIO_DEMO = 'demo_apf3';
const CLAVE_DEMO = 'DemoApf3-2026';
const RIESGO_DEMO = 'Fuga de gas refrigerante';

function leerClaves() {
  if (process.env.CLAVE_ADMIN && process.env.CLAVE_INVITADO) {
    return { admin: process.env.CLAVE_ADMIN, invitado: process.env.CLAVE_INVITADO };
  }
  const ruta = join(AQUI, '..', 'safeops-api', 'application-local.properties');
  if (!existsSync(ruta)) {
    throw new Error(`No se encontró ${ruta}. Ahí deben estar las contraseñas de superadmin e invitado.`);
  }
  const valores = Object.fromEntries(
    readFileSync(ruta, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  );
  return { admin: valores['safeops.admin.password'], invitado: valores['safeops.invitado.password'] };
}

const claves = leerClaves();
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch(
  process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] }
    : { channel: process.env.NAVEGADOR ?? 'msedge' },
);
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
const pagina = await contexto.newPage();
const hechas = [];

async function captura(numero, nombre, { p = pagina, completa = false } = {}) {
  await p.waitForTimeout(350);
  const archivo = `${String(numero).padStart(2, '0')}-${nombre}.png`;
  await p.screenshot({ path: join(SALIDA, archivo), fullPage: completa });
  hechas.push(archivo);
  console.log(`  captura ${archivo}`);
}

async function ingresar(p, usuario, clave, destino) {
  await p.goto(`${BASE}/login`);
  await p.fill('#nombreUsuario', usuario);
  await p.fill('#password', clave);
  await p.click('button[type=submit]');
  await p.waitForURL(`**${destino}`);
}

// Peticiones directas a la API (a través del proxy del front-end) para preparar y limpiar datos.
async function api(metodo, ruta, token, cuerpo) {
  const respuesta = await contexto.request.fetch(`${BASE}/api${ruta}`, {
    method: metodo,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: cuerpo,
    failOnStatusCode: false,
  });
  const texto = await respuesta.text();
  return { estado: respuesta.status(), datos: texto ? JSON.parse(texto) : null };
}

async function limpiar(token) {
  const usuarios = (await api('GET', '/usuarios', token)).datos ?? [];
  for (const u of usuarios.filter((x) => x.nombreUsuario === USUARIO_DEMO)) {
    await api('DELETE', `/usuarios/${u.id}`, token);
  }
  const riesgos = (await api('GET', '/riesgos', token)).datos ?? [];
  for (const r of riesgos.filter((x) => x.peligro === RIESGO_DEMO)) {
    await api('DELETE', `/riesgos/${r.id}`, token);
  }
}

try {
  const sesionAdmin = await api('POST', '/auth/login', null, { nombreUsuario: 'superadmin', password: claves.admin });
  if (sesionAdmin.estado !== 200) {
    throw new Error(`No se pudo iniciar sesión como superadmin (estado ${sesionAdmin.estado}). ¿Están la API y el front-end en ejecución?`);
  }
  const token = sesionAdmin.datos.token;
  await limpiar(token);

  const areas = (await api('GET', '/areas', token)).datos;
  const riesgos = (await api('GET', '/riesgos', token)).datos;
  if (!areas.length || !riesgos.length) throw new Error('Se necesita al menos un área y un riesgo registrados.');
  const riesgoAlto = riesgos.find((r) => r.nivel === 'ALTO') ?? riesgos[0];

  console.log('Inicio de sesión y registro');
  await pagina.goto(`${BASE}/login`);
  await pagina.waitForSelector('#nombreUsuario');
  await captura(1, 'login');

  await pagina.fill('#nombreUsuario', 'superadmin');
  await pagina.fill('#password', 'clave-incorrecta');
  await pagina.click('button[type=submit]');
  await pagina.waitForSelector('.aviso--error');
  await captura(11, 'login-error');

  await pagina.goto(`${BASE}/registro`);
  await pagina.fill('#nombreUsuario', USUARIO_DEMO);
  await pagina.fill('#password', CLAVE_DEMO);
  await pagina.fill('#confirmacion', CLAVE_DEMO);
  await captura(2, 'registro');
  await pagina.click('button[type=submit]');
  await pagina.waitForSelector('.aviso--exito');
  await captura(17, 'registro-cuenta-creada');

  console.log('Vistas con sesión de administrador');
  await ingresar(pagina, 'superadmin', claves.admin, '/inicio');
  await pagina.waitForSelector('.niveles');
  await captura(3, 'panel-inicio', { completa: true });

  await pagina.goto(`${BASE}/areas`);
  await pagina.waitForSelector('.area');
  await captura(4, 'areas');

  await pagina.goto(`${BASE}/areas/nueva`);
  await pagina.fill('#nombre', 'Laboratorio de Calidad');
  await pagina.fill('#ubicacion', 'Sede Piura');
  await captura(5, 'formulario-area');

  await pagina.goto(`${BASE}/riesgos`);
  await pagina.waitForSelector('.tabla');
  await pagina.click('th button:has-text("Nivel")');
  await pagina.click('th button:has-text("Nivel")');
  await captura(6, 'riesgos-tabla');

  await pagina.goto(`${BASE}/riesgos/${riesgoAlto.id}`);
  await pagina.waitForSelector('.detalle');
  await captura(8, 'riesgo-detalle');

  await pagina.goto(`${BASE}/usuarios`);
  await pagina.waitForSelector('.tabla');
  await captura(9, 'usuarios');

  console.log('Registro, edición y eliminación de un riesgo');
  await pagina.goto(`${BASE}/areas/${areas[0].id}/riesgos/nuevo`);
  await pagina.waitForSelector('#peligro');
  await pagina.click('button[type=submit]');
  await pagina.waitForSelector('.campo__error');
  await captura(10, 'validaciones-riesgo');

  await pagina.fill('#peligro', RIESGO_DEMO);
  await pagina.fill('#descripcion', 'Una fuga en la cámara de frío puede afectar al personal que trabaja en el área.');
  await pagina.click('button.celda[aria-label^="Probabilidad 3, impacto 4"]');
  await captura(7, 'formulario-riesgo');
  await pagina.click('button[type=submit]');
  await pagina.waitForSelector('.detalle');
  await captura(18, 'riesgo-registrado');
  const idNuevo = pagina.url().split('/').pop();

  await pagina.goto(`${BASE}/riesgos/${idNuevo}/editar`);
  await pagina.waitForFunction(() => document.querySelector('#peligro')?.value);
  await captura(19, 'riesgo-edicion');
  await pagina.selectOption('#probabilidad', { index: 1 });
  await pagina.click('button[type=submit]');
  await pagina.waitForSelector('.detalle');

  await pagina.goto(`${BASE}/riesgos`);
  await pagina.waitForSelector('.tabla');
  await pagina.fill('#filtro-busqueda', RIESGO_DEMO);
  await pagina.click('tbody tr button:has-text("Eliminar")');
  await pagina.waitForSelector('.confirmacion');
  await captura(20, 'riesgo-eliminacion');
  await pagina.click('.confirmacion .boton--peligro');
  await pagina.waitForSelector('.flotante');

  console.log('Tema oscuro, vista móvil e invitado');
  await pagina.click('button:has-text("Tema oscuro")');
  await pagina.goto(`${BASE}/inicio`);
  await pagina.waitForSelector('.niveles');
  await captura(16, 'tema-oscuro', { completa: true });
  await pagina.click('button:has-text("Tema claro")');

  const movil = await navegador.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  const paginaMovil = await movil.newPage();
  await ingresar(paginaMovil, 'superadmin', claves.admin, '/inicio');
  await paginaMovil.goto(`${BASE}/riesgos`);
  await paginaMovil.waitForSelector('.tabla');
  await captura(15, 'movil', { p: paginaMovil });
  await movil.close();

  await pagina.click('button:has-text("Cerrar sesión")');
  await pagina.waitForURL('**/login');
  await ingresar(pagina, 'invitado', claves.invitado, '/riesgos');
  await pagina.waitForSelector('.tabla');
  await captura(13, 'invitado');

  await limpiar(token);
  console.log(`\nListo: ${hechas.length} capturas en ${SALIDA}`);
} catch (error) {
  console.error(`\nSe detuvo en un paso: ${error.message}`);
  process.exitCode = 1;
} finally {
  await navegador.close();
}
