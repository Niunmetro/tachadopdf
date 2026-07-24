import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages sirve bajo /<repo>/, así que el build de Pages necesita base='/tachadopdf/'.
  // Cloudflare Pages con dominio propio (producción recomendada) y el preview local usan '/'.
  // Lo controla la env var VITE_BASE (la pone el script de despliegue a Pages); default '/'.
  base: process.env.VITE_BASE ?? '/',
  build: {
    // mupdf (wasm) usa top-level await: el target debe soportarlo o el build falla.
    target: 'esnext',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        comprobador: fileURLToPath(new URL('./comprobador/index.html', import.meta.url)),
      },
    },
  },
  optimizeDeps: {
    // El pre-bundle de esbuild del dev server tiene su propio target; sin esto, cargar
    // mupdf en `vite dev` peta con "Top-level await is not available".
    esbuildOptions: { target: 'esnext' },
  },
});
