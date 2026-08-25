/*
 * Toma el resultado de `vite build` y lo mete todo (JS + CSS) dentro de un unico
 * archivo HTML: dist/hitss-standalone.html
 *
 * Sirve para repartir la app por correo o USB a otros operadores: se abre con
 * doble clic, sin servidor y sin internet.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
const entrada = join(dist, 'index.html');

if (!existsSync(entrada)) {
  console.error('No existe dist/index.html. Corre primero: npm run build');
  process.exit(1);
}

let html = readFileSync(entrada, 'utf8');
const bundles = [];

// Saca los <script src="./app.js"> del head y guarda su codigo.
html = html.replace(/<script[^>]*src="\.?\/?([^"]+\.js)"[^>]*><\/script>/g, (_m, archivo) => {
  bundles.push(readFileSync(join(dist, archivo), 'utf8'));
  return '';
});

// <link rel="stylesheet" href="./app.css">  ->  <style>...css...</style>
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="\.?\/?([^"]+\.css)"[^>]*>/g, (_m, archivo) => {
  const css = readFileSync(join(dist, archivo), 'utf8');
  return `<style>\n${css}\n</style>`;
});

// Sin recursos externos que precargar.
html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');

/*
 * El codigo va al final del body, no en el head: al perder type="module" pasa a
 * ser un script clasico y se ejecutaria antes de que exista <div id="root">.
 * El reemplazo usa funcion para que las secuencias $& del bundle minificado no
 * se interpreten como referencias de String.replace.
 */
const etiquetas = bundles.map((codigo) => `<script>\n${codigo}\n</script>`).join('\n');
html = html.replace('</body>', () => `${etiquetas}\n  </body>`);

const salida = join(dist, 'hitss-standalone.html');
writeFileSync(salida, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`Listo: dist/hitss-standalone.html (${kb} kB, un solo archivo)`);
