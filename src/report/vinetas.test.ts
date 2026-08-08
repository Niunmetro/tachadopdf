import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { buildReport } from './report';

/**
 * EL FALSO VERDE QUE SOBREVIVIA EN LOS PIXELES.
 *
 * Ningun test de texto ve esto, y por eso duro tanto: en un documento entero escaneado —sello
 * ROJO, «SIN COMPROBACION AUTOMATICA», cero paginas releidas, ninguna capa de texto— el informe
 * dibujaba SIETE puntos VERDES seguidos bajo «DNI: 0 ocurrencias en el texto extraible». La frase
 * es literalmente cierta: no habia texto que leer. El punto verde afirmaba otra cosa —«comprobado
 * y limpio»— sobre la comprobacion que no llego a correr, y la mancha de color dominante de un
 * informe bloqueado seguia siendo verde.
 *
 * La guarda mide TINTA, no texto: cuenta pixeles del verde de viñeta sobre el informe rasterizado.
 * Cero pixeles verdes cuando no hubo nada que releer; muchos cuando si lo hubo.
 *
 * La regla NO es «el estado es rojo o ambar». En un ambar por imagenes la cobertura de TEXTO es
 * completa y el verde ahi es correcto: la reserva esta en la imagen y de eso habla el sello. Los
 * dos casos estan abajo para que nadie «simplifique» la regla al estado.
 */
const VERDE_VIÑETA: [number, number, number] = [22, 135, 82]; // OK = rgb(0.086, 0.53, 0.32)
const PATRONES: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

const OBJETOS: InventarioObjetos = {
  info: 'eliminado',
  xmp: 'eliminado',
  anotaciones: 'noHabia',
  formularios: 'noHabia',
  adjuntos: 'noHabia',
  marcadores: 'noHabia',
  alternativos: 'noHabia',
  ocultos: 'noHabia',
};

function datos(over: Partial<ReportData> = {}): ReportData {
  return {
    fileName: 'acta.pdf',
    sha256: 'b'.repeat(64),
    date: '2026-08-08',
    patternsSearched: PATRONES,
    totalPaginas: 3,
    boxesPerPage: [{ page: 0, count: 2 }],
    objetos: OBJETOS,
    paginasSinCapaDeTexto: [],
    paginasImagenCompleta: [],
    paginasConImagen: [],
    unverifiableManualPages: [],
    paginasTextoNoLegible: [],
    freeVersion: false,
    verify: { clean: true, residues: [] },
    ...over,
  };
}

/** Pixeles del verde de viñeta en la primera pagina del informe RENDERIZADO. */
async function pixelesVerdes(data: ReportData): Promise<number> {
  const doc = new mupdf.PDFDocument((await buildReport(data, es.informe)).slice());
  try {
    const pix = doc
      .loadPage(0)
      .toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false);
    const bytes = pix.getPixels();
    const n = pix.getNumberOfComponents();
    let cuenta = 0;
    for (let i = 0; i + n <= bytes.length; i += n) {
      const r = bytes[i] ?? 0;
      const g = bytes[i + 1] ?? 0;
      const b = bytes[i + 2] ?? 0;
      if (
        Math.abs(r - VERDE_VIÑETA[0]) <= 12 &&
        Math.abs(g - VERDE_VIÑETA[1]) <= 12 &&
        Math.abs(b - VERDE_VIÑETA[2]) <= 12
      ) {
        cuenta++;
      }
    }
    return cuenta;
  } finally {
    doc.destroy();
  }
}

describe('G12: el punto verde no puede afirmar una comprobación que no corrió', () => {
  it('un documento entero escaneado no imprime ni un punto verde', async () => {
    expect(await pixelesVerdes(datos({ paginasSinCapaDeTexto: [0, 1, 2] }))).toBe(0);
  });

  it('sin `verify`, la comprobación no llegó a ejecutarse: tampoco hay punto verde', async () => {
    const { verify, ...sinVerify } = datos();
    expect(await pixelesVerdes(sinVerify as ReportData)).toBe(0);
  });

  it('el ámbar por imágenes SÍ releyó el texto: ahí el punto verde es correcto', async () => {
    expect(await pixelesVerdes(datos({ paginasConImagen: [0, 1, 2] }))).toBeGreaterThan(50);
  });

  it('con cobertura completa y resultado limpio, los puntos son verdes', async () => {
    expect(await pixelesVerdes(datos())).toBeGreaterThan(50);
  });
});
