import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // mupdf (wasm) usa top-level await: el target debe soportarlo o el build falla.
    target: 'esnext',
  },
  optimizeDeps: {
    // El pre-bundle de esbuild del dev server tiene su propio target; sin esto, cargar
    // mupdf en `vite dev` peta con "Top-level await is not available".
    esbuildOptions: { target: 'esnext' },
  },
});
