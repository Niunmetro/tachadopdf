// Limpiador de metadatos de PDF en el navegador. REVELA qué guarda el PDF por dentro (autor, software
// con que se creó, fechas, marcadores, adjuntos, anotaciones) con `analizarPdf`, y descarga una copia
// LIMPIA con `stripMetadata` —el mismo borrado verificado del producto, que relee el binario para
// confirmar que los campos se fueron—. El PDF no sale del navegador.
import { contenidoDe, localeDelDocumento } from '../content/index';
import { analizarPdf, type AnalisisPdf, stripMetadata } from '../pdf/metadata';

const COPIA = contenidoDe(localeDelDocumento(document)).metadatosPdf;

interface Elementos {
  dropzone: HTMLElement;
  file: HTMLInputElement;
  stage: HTMLElement;
  resultado: HTMLElement;
  download: HTMLButtonElement;
  error: HTMLElement;
}

let fichero: File | null = null;

function localizar(): Elementos | null {
  const dropzone = document.getElementById('mdp-dropzone');
  const file = document.getElementById('mdp-file');
  const stage = document.getElementById('mdp-stage');
  const resultado = document.getElementById('mdp-resultado');
  const download = document.getElementById('mdp-download');
  const error = document.getElementById('mdp-error');
  if (
    !(dropzone instanceof HTMLElement) ||
    !(file instanceof HTMLInputElement) ||
    !(stage instanceof HTMLElement) ||
    !(resultado instanceof HTMLElement) ||
    !(download instanceof HTMLButtonElement) ||
    !(error instanceof HTMLElement)
  ) {
    return null;
  }
  return { dropzone, file, stage, resultado, download, error };
}

function esPdf(f: File): boolean {
  return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
}

/** "D:20240115103000+01'00'" → "2024-01-15". Si no encaja el patrón, se muestra tal cual. */
function formatearFecha(valor: string): string {
  const m = valor.match(/^D:(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : valor;
}

function etiquetaInfo(clave: string): string {
  const mapa = COPIA.etiquetas as Record<string, string>;
  return mapa[clave] ?? clave;
}

function pintarRevelado(el: Elementos, a: AnalisisPdf): void {
  el.resultado.textContent = '';
  const items: { texto: string; alerta: boolean }[] = [];
  for (const campo of a.info) {
    const valor =
      campo.clave === 'CreationDate' || campo.clave === 'ModDate'
        ? formatearFecha(campo.valor)
        : campo.valor;
    // El AUTOR es el que más identifica: se resalta.
    items.push({ texto: `${etiquetaInfo(campo.clave)}: ${valor}`, alerta: campo.clave === 'Author' });
  }
  if (a.xmp) items.push({ texto: COPIA.etiquetas.xmp, alerta: false });
  if (a.adjuntos) items.push({ texto: COPIA.etiquetas.adjuntos, alerta: true });
  if (a.marcadores) items.push({ texto: COPIA.etiquetas.marcadores, alerta: false });
  if (a.anotaciones) items.push({ texto: COPIA.etiquetas.anotaciones, alerta: false });

  if (items.length === 0) {
    const p = document.createElement('p');
    p.className = 'mdp-limpia';
    p.textContent = COPIA.sinMetadatos;
    el.resultado.appendChild(p);
    return;
  }
  const titulo = document.createElement('p');
  titulo.className = 'mdp-titulo-lista';
  titulo.textContent = COPIA.conMetadatos;
  el.resultado.appendChild(titulo);
  const ul = document.createElement('ul');
  ul.className = 'mdp-lista';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item.texto;
    if (item.alerta) li.className = 'mdp-alerta';
    ul.appendChild(li);
  }
  el.resultado.appendChild(ul);
}

async function analizar(f: File, el: Elementos): Promise<void> {
  el.error.textContent = '';
  if (!esPdf(f)) {
    el.error.textContent = COPIA.noEsPdf;
    return;
  }
  fichero = f;
  try {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const analisis = await analizarPdf(bytes);
    pintarRevelado(el, analisis);
    el.dropzone.hidden = true;
    el.stage.hidden = false;
  } catch {
    el.error.textContent = COPIA.errorGenerico;
  }
}

async function descargar(el: Elementos): Promise<void> {
  const f = fichero;
  if (f === null) return;
  el.error.textContent = '';
  const etiquetaPrevia = el.download.textContent ?? COPIA.botonDescargar;
  el.download.disabled = true;
  el.download.textContent = COPIA.procesando;
  try {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const { bytes: limpio } = await stripMetadata(bytes);
    const nombre = f.name.replace(/\.[^.]+$/, '') || 'documento';
    const blob = new Blob([limpio as BlobPart], { type: 'application/pdf' });
    const href = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = href;
    enlace.download = `${nombre}${COPIA.sufijoDescarga}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    el.error.textContent = COPIA.errorGenerico;
  } finally {
    el.download.disabled = false;
    el.download.textContent = etiquetaPrevia;
  }
}

export function inicializar(): void {
  const el = localizar();
  if (el === null) return;
  el.file.addEventListener('change', () => {
    const f = el.file.files?.[0];
    if (f) void analizar(f, el);
  });
  el.dropzone.addEventListener('dragover', (e) => e.preventDefault());
  el.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) void analizar(f, el);
  });
  el.download.addEventListener('click', () => void descargar(el));
}

inicializar();
