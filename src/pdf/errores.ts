/**
 * Errores del motor PDF que la interfaz necesita RECONOCER sin cargar el motor.
 *
 * Este módulo no importa nada (y sobre todo no importa `mupdf`) a propósito: `src/main.ts` y
 * `src/comprobador/main.ts` hacen `instanceof PdfPasswordError` en sus manejadores de error, y si
 * lo importaran de `engine.ts` arrastrarían mupdf —10 MB de wasm— a la carga de la página aunque el
 * visitante no abra ningún PDF. `engine.ts` lo reexporta, así que `import { PdfPasswordError } from
 * './engine'` sigue valiendo y es EXACTAMENTE la misma clase (los `instanceof` no se rompen).
 */
export class PdfPasswordError extends Error {
  constructor(message = 'Contraseña de PDF incorrecta o ausente') {
    super(message);
    this.name = 'PdfPasswordError';
  }
}
