/**
 * Carga PEREZOSA del motor PDF (mupdf: JS + 10 MB de wasm).
 *
 * El paquete `mupdf` instancia el wasm con un `await` a nivel de módulo: quien lo importa de forma
 * estática no ejecuta ni una línea hasta que el wasm se ha bajado y compilado. Con `import` estático
 * en `src/main.ts`, la portada tardaba en cablear sus botones (y gastaba datos del visitante) aunque
 * este nunca abriera un PDF, que es lo que hace la mayoría de quienes llegan de un buscador.
 *
 * Por eso la interfaz NO importa `engine`/`pipeline` de forma estática: los pide aquí, con `import()`.
 * Cada página empieza a bajarlos EN SEGUNDO PLANO nada más arrancar (`precargar…` en su `init`): los
 * botones ya funcionan mientras baja, y cuando la página ha terminado de cargar el motor está en
 * memoria, que es lo que promete la web («corta la conexión una vez cargada la página y la
 * herramienta sigue funcionando»). Si nadie lo hubiera pedido antes, se pide al cargar un PDF. Cada cargador es una promesa compartida (el módulo se pide una
 * sola vez) que se descarta si FALLA, para no fijar el error en esta capa. OJO: Chromium además
 * memoriza el `import()` fallido de una URL durante toda la vida del documento (medido: el segundo
 * intento ni sale a la red), así que tras un fallo de red la salida real es recargar la página, que
 * es lo que dice el mensaje de error de la interfaz (`errorProcesado`).
 *
 * Este módulo no importa nada de forma estática. Lo vigila `perezoso.test.ts`.
 */

type Engine = typeof import('./engine');
type Pipeline = typeof import('./pipeline');
type Metadatos = typeof import('./metadata');

/**
 * El motor no se pudo DESCARGAR (sin conexión, fragmento no disponible). No es un problema del
 * fichero del usuario: la interfaz lo distingue para pedir que recargue en vez de culpar al PDF.
 */
export class MotorNoCargadoError extends Error {
  constructor(causa: unknown) {
    super('No se pudo cargar el motor PDF', { cause: causa });
    this.name = 'MotorNoCargadoError';
  }
}

function motorNoCargado(causa: unknown): never {
  throw new MotorNoCargadoError(causa);
}

/** Exportada solo para probar la política de reintento (ver `perezoso.test.ts`). */
export function memorizar<T>(cargar: () => Promise<T>): () => Promise<T> {
  let promesa: Promise<T> | null = null;
  return () => {
    promesa ??= cargar().catch((causa: unknown) => {
      promesa = null;
      throw causa;
    });
    return promesa;
  };
}

/** `loadPdf` y `PdfDoc`. Descarga mupdf la primera vez. */
export const cargarEngine: () => Promise<Engine> = memorizar(() =>
  import('./engine').catch(motorNoCargado),
);

/** `detectAutomaticBoxes` y `processDocument` (arrastra el motor y el generador del informe). */
export const cargarPipeline: () => Promise<Pipeline> = memorizar(() =>
  import('./pipeline').catch(motorNoCargado),
);

/** `analizarPdf` y `stripMetadata` del limpiador de metadatos de PDF (también tiran de mupdf). */
export const cargarMetadatos: () => Promise<Metadatos> = memorizar(() =>
  import('./metadata').catch(motorNoCargado),
);

/**
 * Empieza a bajar el motor SIN esperar y sin hacer ruido: se llama cuando el visitante muestra
 * intención de cargar un PDF (abre el selector de ficheros, arrastra uno encima), para que la
 * descarga corra mientras elige el archivo. Si falla, se calla: el error visible lo da la carga del
 * PDF (que espera a este mismo módulo), no un aviso suelto antes de que el visitante haya pedido nada.
 */
export function precargarEngine(): void {
  void cargarEngine().catch(() => undefined);
}

/** Igual que `precargarEngine` para el limpiador de metadatos de PDF. */
export function precargarMetadatos(): void {
  void cargarMetadatos().catch(() => undefined);
}

/** Igual que `precargarEngine` para la herramienta completa (motor + pipeline del informe). */
export function precargarPipeline(): void {
  void cargarPipeline().catch(() => undefined);
}
