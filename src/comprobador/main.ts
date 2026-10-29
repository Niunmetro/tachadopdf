import { contenidoDe, localeDelDocumento } from '../content/index';
import type { CopiaComprobador } from '../content/tipos';
import { PdfPasswordError } from '../pdf/errores';
import { MotorNoCargadoError, precargarEngine } from '../pdf/perezoso';
import { FicheroNoPdfError, analizarPdf } from './analyze';
import { renderResumen } from './render';

// El idioma sale de la RUTA: el HTML generado ya fija <html lang> según dónde vive la página.
const CONTENIDO = contenidoDe(localeDelDocumento(document));
const COPIA: CopiaComprobador = CONTENIDO.comprobadorUi;
// El alcance del COMPROBADOR, no el del informe: aqui no se tacha nada, asi que reutilizar el
// texto del informe («los pixeles de las zonas marcadas») describia algo que no ocurre.
const ALCANCE: CopiaComprobador['alcance'] = COPIA.alcance;

export interface ElementosComprobador {
  dropzone: HTMLElement;
  fichero: HTMLInputElement;
  password: HTMLInputElement;
  resultado: HTMLElement;
  error: HTMLElement;
}

function localizarElementos(): ElementosComprobador | null {
  const dropzone = document.getElementById('cp-dropzone');
  const fichero = document.getElementById('cp-file');
  const password = document.getElementById('cp-password');
  const resultado = document.getElementById('cp-resultado');
  const error = document.getElementById('cp-error');
  if (
    !(dropzone instanceof HTMLElement) ||
    !(fichero instanceof HTMLInputElement) ||
    !(password instanceof HTMLInputElement) ||
    !(resultado instanceof HTMLElement) ||
    !(error instanceof HTMLElement)
  ) {
    return null;
  }
  return { dropzone, fichero, password, resultado, error };
}

function mensajeDeError(causa: unknown): string {
  if (causa instanceof FicheroNoPdfError) return COPIA.noEsPdf;
  if (causa instanceof PdfPasswordError) return COPIA.passwordRequerida;
  if (causa instanceof MotorNoCargadoError) return COPIA.errorMotor;
  return COPIA.errorGenerico;
}

export async function procesarFichero(fichero: File, elementos: ElementosComprobador): Promise<void> {
  elementos.error.textContent = '';
  elementos.resultado.textContent = COPIA.analizando;
  try {
    const bytes = new Uint8Array(await fichero.arrayBuffer());
    const password = elementos.password.value.length > 0 ? elementos.password.value : undefined;
    const resumen = await analizarPdf(bytes, COPIA, password);
    renderResumen(elementos.resultado, resumen, COPIA, ALCANCE);
  } catch (causa) {
    elementos.resultado.textContent = '';
    elementos.error.textContent = mensajeDeError(causa);
  }
}

export function inicializarComprobador(): void {
  const elementos = localizarElementos();
  if (!elementos) return;

  // mupdf se baja EN SEGUNDO PLANO desde ya: la página no espera por él (los controles funcionan
  // al momento) y, una vez cargada, analiza aunque se corte la conexión, como promete la web. Si
  // falla, se calla aquí: el error visible lo da el análisis, que vuelve a pedirlo.
  precargarEngine();

  elementos.fichero.addEventListener('change', () => {
    const fichero = elementos.fichero.files?.[0];
    if (fichero) void procesarFichero(fichero, elementos);
  });

  elementos.dropzone.addEventListener('dragover', (evento) => {
    evento.preventDefault();
  });

  elementos.dropzone.addEventListener('drop', (evento) => {
    evento.preventDefault();
    const fichero = evento.dataTransfer?.files?.[0];
    if (fichero) void procesarFichero(fichero, elementos);
  });
}

inicializarComprobador();
