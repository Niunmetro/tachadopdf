// Detección PURA de metadatos ocultos en una imagen: sin DOM, sin librerías (la CSP las prohíbe),
// así que se testea en Node. NO extrae los valores (no falta: para el revelado basta con decir QUÉ
// tipo de dato lleva la foto —«ubicación GPS», «modelo de cámara»—, y no leer coordenadas evita dar
// una precisión que luego habría que verificar). El borrado real (recodificar y soltar los
// metadatos) vive en main.ts sobre <canvas>; aquí solo se decide qué se le enseña al usuario.

export type CategoriaMeta =
  | 'ubicacion'
  | 'camara'
  | 'software'
  | 'fecha'
  | 'autor'
  | 'otros';

export interface AnalisisMeta {
  /** El formato reconocido; `null` si no se pudo interpretar como imagen conocida. */
  formato: 'jpeg' | 'png' | null;
  /** Categorías de metadatos DETECTADAS, sin repetir y en orden estable. */
  categorias: CategoriaMeta[];
}

// `noUncheckedIndexedAccess` hace que bytes[i] sea `number | undefined`; fuera de rango vale 0. Las
// llamadas ya acotan el rango antes, así que el 0 solo aparecería en un fichero truncado, y ahí un 0
// es la lectura segura (corta el recorrido sin romper).
function b(bytes: Uint8Array, i: number): number {
  return bytes[i] ?? 0;
}

function u16(bytes: Uint8Array, off: number, little: boolean): number {
  return little ? b(bytes, off) | (b(bytes, off + 1) << 8) : (b(bytes, off) << 8) | b(bytes, off + 1);
}

function u32(bytes: Uint8Array, off: number, little: boolean): number {
  return little
    ? (b(bytes, off) | (b(bytes, off + 1) << 8) | (b(bytes, off + 2) << 16) | (b(bytes, off + 3) << 24)) >>> 0
    : ((b(bytes, off) << 24) | (b(bytes, off + 1) << 16) | (b(bytes, off + 2) << 8) | b(bytes, off + 3)) >>> 0;
}

/** Etiqueta EXIF (de IFD0) → categoría que se le enseña al usuario. */
function categoriaDeTag(tag: number): CategoriaMeta | null {
  switch (tag) {
    case 0x8825: // GPSInfo IFD pointer
      return 'ubicacion';
    case 0x010f: // Make
    case 0x0110: // Model
      return 'camara';
    case 0x0131: // Software
      return 'software';
    case 0x0132: // DateTime
      return 'fecha';
    case 0x013b: // Artist
    case 0x8298: // Copyright
      return 'autor';
    case 0x8769: // Exif SubIFD pointer (lleva fecha original, ajustes, etc.)
      return 'otros';
    default:
      return null;
  }
}

function ordenar(cats: Set<CategoriaMeta>): CategoriaMeta[] {
  const orden: CategoriaMeta[] = ['ubicacion', 'camara', 'fecha', 'software', 'autor', 'otros'];
  return orden.filter((c) => cats.has(c));
}

/** Recorre el IFD0 de un bloque TIFF (el que abre un segmento EXIF) y reúne las categorías. */
function leerIfd0(bytes: Uint8Array, tiff: number, cats: Set<CategoriaMeta>): void {
  if (tiff + 8 > bytes.length) return;
  const marca = u16(bytes, tiff, false);
  const little = marca === 0x4949; // "II" = little-endian; "MM" = big-endian
  if (!little && marca !== 0x4d4d) return;
  const ifd0 = tiff + u32(bytes, tiff + 4, little);
  if (ifd0 + 2 > bytes.length) return;
  const n = u16(bytes, ifd0, little);
  for (let i = 0; i < n; i += 1) {
    const entrada = ifd0 + 2 + i * 12;
    if (entrada + 2 > bytes.length) break;
    const tag = u16(bytes, entrada, little);
    const cat = categoriaDeTag(tag);
    if (cat !== null) cats.add(cat);
  }
}

function analizarJpeg(bytes: Uint8Array): CategoriaMeta[] {
  const cats = new Set<CategoriaMeta>();
  let off = 2; // tras SOI (FF D8)
  while (off + 4 <= bytes.length) {
    if (bytes[off] !== 0xff) break;
    const marcador = bytes[off + 1];
    if (marcador === 0xd9 || marcador === 0xda) break; // EOI o inicio del scan: ya no hay cabeceras
    const longitud = u16(bytes, off + 2, false);
    if (longitud < 2) break;
    if (marcador === 0xe1) {
      // APP1: ¿es EXIF? ("Exif\0\0")
      const s = off + 4;
      if (
        s + 6 <= bytes.length &&
        bytes[s] === 0x45 &&
        bytes[s + 1] === 0x78 &&
        bytes[s + 2] === 0x69 &&
        bytes[s + 3] === 0x66 &&
        bytes[s + 4] === 0x00 &&
        bytes[s + 5] === 0x00
      ) {
        leerIfd0(bytes, s + 6, cats);
      }
    }
    off += 2 + longitud;
  }
  return ordenar(cats);
}

function analizarPng(bytes: Uint8Array): CategoriaMeta[] {
  const cats = new Set<CategoriaMeta>();
  let off = 8; // tras la firma PNG
  while (off + 8 <= bytes.length) {
    const longitud = u32(bytes, off, false);
    const tipo = String.fromCharCode(
      b(bytes, off + 4),
      b(bytes, off + 5),
      b(bytes, off + 6),
      b(bytes, off + 7),
    );
    if (tipo === 'IEND') break;
    if (tipo === 'tEXt' || tipo === 'iTXt' || tipo === 'zTXt') cats.add('otros');
    else if (tipo === 'tIME') cats.add('fecha');
    else if (tipo === 'eXIf') leerIfd0(bytes, off + 8, cats);
    off += 12 + longitud; // longitud(4) + tipo(4) + datos + crc(4)
  }
  return ordenar(cats);
}

export function analizarMetadatos(bytes: Uint8Array): AnalisisMeta {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { formato: 'jpeg', categorias: analizarJpeg(bytes) };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { formato: 'png', categorias: analizarPng(bytes) };
  }
  return { formato: null, categorias: [] };
}
