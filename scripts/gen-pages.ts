// Escribe en disco las páginas HTML y el sitemap que produce src/content/generar.ts.
//
// Se ejecuta A MANO (`npm run gen:pages`), NO dentro de `vite build`: lo generado son textos
// legales, precios y metadatos, y esos artefactos tienen que poder revisarse en un pull request.
// Que el disco esté al día lo vigila src/content/pages-generadas.test.ts, que regenera en
// memoria y compara: editar a mano cualquiera de estos ficheros pone la suite en rojo.
//
// Uso: npm run gen:pages
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generarSitio } from '../src/content/generar';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const fichero of generarSitio()) {
  const destino = resolve(RAIZ, fichero.ruta);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, fichero.contenido, 'utf-8');
  console.log(`escrito ${fichero.ruta}`);
}
