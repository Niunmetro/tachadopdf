import { PdfPasswordError } from '../pdf/engine';
import { FicheroNoPdfError, analizarPdf } from './analyze';
import { renderResumen } from './render';

const MENSAJE_NO_PDF = 'El fichero no parece un PDF. Selecciona un archivo .pdf válido.';
const MENSAJE_PASSWORD =
  'Este PDF está protegido con contraseña. Escríbela en el campo de contraseña y vuelve a seleccionar el archivo.';
const MENSAJE_ERROR_GENERICO =
  'No se ha podido analizar el PDF. Comprueba que el archivo no esté dañado e inténtalo de nuevo.';
const MENSAJE_ANALIZANDO = 'Analizando el PDF en tu navegador…';

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
  if (causa instanceof FicheroNoPdfError) return MENSAJE_NO_PDF;
  if (causa instanceof PdfPasswordError) return MENSAJE_PASSWORD;
  return MENSAJE_ERROR_GENERICO;
}

export async function procesarFichero(fichero: File, elementos: ElementosComprobador): Promise<void> {
  elementos.error.textContent = '';
  elementos.resultado.textContent = MENSAJE_ANALIZANDO;
  try {
    const bytes = new Uint8Array(await fichero.arrayBuffer());
    const password = elementos.password.value.length > 0 ? elementos.password.value : undefined;
    const resumen = await analizarPdf(bytes, password);
    renderResumen(elementos.resultado, resumen);
  } catch (causa) {
    elementos.resultado.textContent = '';
    elementos.error.textContent = mensajeDeError(causa);
  }
}

export function inicializarComprobador(): void {
  const elementos = localizarElementos();
  if (!elementos) return;

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
