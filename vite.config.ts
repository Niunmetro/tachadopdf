import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { entradasVite } from './src/content/registro';

// Las entradas HTML se DERIVAN del registro de páginas (src/content/registro.ts): añadir un
// idioma no debe obligar a tocar este fichero. `registro.ts` es un módulo hoja sin dependencias
// para que importarlo aquí no arrastre la aplicación al config.
const input = Object.fromEntries(
  Object.entries(entradasVite()).map(([nombre, ruta]) => [
    nombre,
    fileURLToPath(new URL(`./${ruta}`, import.meta.url)),
  ]),
);

export default defineConfig({
  // GitHub Pages sirve bajo /<repo>/, así que el build de Pages necesita base='/tachadopdf/'.
  // Cloudflare Pages con dominio propio (producción recomendada) y el preview local usan '/'.
  // Lo controla la env var VITE_BASE (la pone el script de despliegue a Pages); default '/'.
  base: process.env.VITE_BASE ?? '/',
  build: {
    // mupdf (wasm) usa top-level await: el target debe soportarlo o el build falla.
    target: 'esnext',
    rollupOptions: { input },
  },
  optimizeDeps: {
    // El pre-bundle de esbuild del dev server tiene su propio target; sin esto, cargar
    // mupdf en `vite dev` peta con "Top-level await is not available".
    esbuildOptions: { target: 'esnext' },
  },
});
