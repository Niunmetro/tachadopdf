// Limpiador de metadatos de IMÁGENES en el navegador. Primero REVELA qué lleva escondido la foto
// (ubicación GPS, cámara, fecha...) leyendo el EXIF con el detector puro; luego descarga una copia
// recodificada sobre <canvas>, que por construcción NO copia esos campos. La imagen no sale del
// navegador: el análisis y la limpieza ocurren en local.
import { contenidoDe, localeDelDocumento } from '../content/index';
import { analizarMetadatos, type CategoriaMeta } from './exif';

const COPIA = contenidoDe(localeDelDocumento(document)).metadatos;

interface Elementos {
  dropzone: HTMLElement;
  file: HTMLInputElement;
  stage: HTMLElement;
  resultado: HTMLElement;
  download: HTMLButtonElement;
  error: HTMLElement;
}

let fichero: File | null = null;
let tipoSalida = 'image/png';

function localizar(): Elementos | null {
  const dropzone = document.getElementById('md-dropzone');
  const file = document.getElementById('md-file');
  const stage = document.getElementById('md-stage');
  const resultado = document.getElementById('md-resultado');
  const download = document.getElementById('md-download');
  const error = document.getElementById('md-error');
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

function pintarRevelado(el: Elementos, categorias: CategoriaMeta[]): void {
  el.resultado.textContent = '';
  if (categorias.length === 0) {
    const p = document.createElement('p');
    p.className = 'md-limpia';
    p.textContent = COPIA.sinMetadatos;
    el.resultado.appendChild(p);
    return;
  }
  const titulo = document.createElement('p');
  titulo.className = 'md-titulo-lista';
  titulo.textContent = COPIA.conMetadatos;
  el.resultado.appendChild(titulo);
  const ul = document.createElement('ul');
  ul.className = 'md-lista';
  for (const c of categorias) {
    const li = document.createElement('li');
    li.textContent = COPIA.etiquetas[c];
    if (c === 'ubicacion') li.className = 'md-alerta'; // la ubicación es la que más asusta: se resalta
    ul.appendChild(li);
  }
  el.resultado.appendChild(ul);
}

async function analizar(f: File, el: Elementos): Promise<void> {
  el.error.textContent = '';
  if (!f.type.startsWith('image/')) {
    el.error.textContent = COPIA.noEsImagen;
    return;
  }
  fichero = f;
  tipoSalida = f.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const bytes = new Uint8Array(await f.arrayBuffer());
  pintarRevelado(el, analizarMetadatos(bytes).categorias);
  el.dropzone.hidden = true;
  el.stage.hidden = false;
}

function descargar(el: Elementos): void {
  const f = fichero;
  if (f === null) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    URL.revokeObjectURL(url);
    if (ctx === null) {
      el.error.textContent = COPIA.errorGenerico;
      return;
    }
    ctx.drawImage(img, 0, 0); // recodifica: los metadatos del original no pasan al lienzo
    const calidad = tipoSalida === 'image/jpeg' ? 0.95 : undefined;
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          el.error.textContent = COPIA.errorGenerico;
          return;
        }
        const ext = tipoSalida === 'image/jpeg' ? 'jpg' : 'png';
        const nombre = f.name.replace(/\.[^.]+$/, '') || 'imagen';
        const enlace = document.createElement('a');
        const href = URL.createObjectURL(blob);
        enlace.href = href;
        enlace.download = `${nombre}${COPIA.sufijoDescarga}.${ext}`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      },
      tipoSalida,
      calidad,
    );
  };
  img.onerror = () => {
    el.error.textContent = COPIA.errorGenerico;
    URL.revokeObjectURL(url);
  };
  img.src = url;
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
  el.download.addEventListener('click', () => descargar(el));
}

inicializar();
