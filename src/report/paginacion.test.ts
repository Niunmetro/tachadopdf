import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { buildReport } from './report';

/**
 * LO QUE SE VE AL PASAR LAS HOJAS.
 *
 * Dos defectos que ningun test de texto nota porque el texto ESTA, solo que en el sitio
 * equivocado:
 *
 *  1. Un encabezado de seccion cerrando la hoja sin una sola fila debajo, y la hoja siguiente
 *     arrancando con una fila huerfana sin encabezado encima. Medido en su dia: la pagina 2
 *     empezaba por «Paginas con texto dibujado que no se puede releer  0», sola. En un documento
 *     que se archiva como prueba de diligencia, eso parece un fallo de impresion.
 *  2. La marca de agua «DEMO — version gratuita» cruzaba la pagina por el centro y depositaba
 *     miles de pixeles DENTRO de la banda del sello y sobre la fila de la huella SHA-256: la
 *     version que ve el 100 % de los usuarios nuevos degradaba justo el veredicto y el dato con
 *     el que un tercero contrasta el archivo.
 */
const PATRONES: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];
const ENCABEZADOS = [
  'DATOS DEL DOCUMENTO',
  'COMPROBACIONES REALIZADAS',
  'COBERTURA DE ESTA COMPROBACIÓN',
  'OBJETOS DEL ARCHIVO',
  'ALCANCE Y LÍMITES',
  'CÓMO COMPROBAR ESTE INFORME',
];

function objetos(over: Partial<InventarioObjetos> = {}): InventarioObjetos {
  return {
    info: 'eliminado',
    xmp: 'eliminado',
    anotaciones: 'noHabia',
    formularios: 'noHabia',
    adjuntos: 'noHabia',
    marcadores: 'noHabia',
    alternativos: 'noHabia',
    ocultos: 'noHabia',
    ...over,
  };
}

function datos(over: Partial<ReportData> = {}): ReportData {
  return {
    fileName: 'acta.pdf',
    sha256: 'e'.repeat(64),
    date: '2026-08-08',
    patternsSearched: PATRONES,
    totalPaginas: 4,
    boxesPerPage: [
      { page: 0, count: 3 },
      { page: 1, count: 2 },
    ],
    objetos: objetos(),
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

/** Las lineas de cada pagina, de arriba abajo, SIN el pie. */
async function lineasPorPagina(data: ReportData): Promise<string[][]> {
  const doc = new mupdf.PDFDocument((await buildReport(data, es.informe)).slice());
  try {
    const salida: string[][] = [];
    for (let p = 0; p < doc.countPages(); p++) {
      const porY = new Map<number, string>();
      doc
        .loadPage(p)
        .toStructuredText()
        .walk({
          onChar(c, _origen, _fuente, _tam, quad) {
            const yy = Math.round(Math.min(quad[1], quad[3]));
            // El pie vive por debajo de y = 760 en espacio de pagina.
            if (yy > 760) return;
            porY.set(yy, (porY.get(yy) ?? '') + c);
          },
        });
      salida.push(
        [...porY.entries()].sort((a, b) => a[0] - b[0]).map(([, texto]) => texto.trim()),
      );
    }
    return salida;
  } finally {
    doc.destroy();
  }
}

const CASOS: { nombre: string; data: ReportData }[] = [
  { nombre: 'bloqueado con residuos', data: datos({ verify: { clean: false, residues: [{ kind: 'dni', value: '1', page: 0 }] } }) },
  { nombre: 'escaneado entero', data: datos({ totalPaginas: 2, paginasSinCapaDeTexto: [0, 1], paginasImagenCompleta: [0, 1], paginasConImagen: [0, 1], unverifiableManualPages: [0] }) },
  {
    nombre: 'parcial con todas las reservas',
    data: datos({
      totalPaginas: 6,
      paginasSinCapaDeTexto: [4],
      paginasImagenCompleta: [4],
      paginasConImagen: [0, 2, 4],
      unverifiableManualPages: [4],
      paginasTextoNoLegible: [{ page: 2, caracteres: 118 }],
      objetos: objetos({ ocultos: 'noExaminado' }),
    }),
  },
  { nombre: 'parcial solo por imágenes', data: datos({ paginasConImagen: [0, 1, 2, 3] }) },
  { nombre: 'sin tachados', data: datos({ boxesPerPage: [] }) },
  { nombre: 'verificado', data: datos() },
];

describe('G14: ningún encabezado de sección se queda colgando al final de una hoja', () => {
  it.each(CASOS)('$nombre', async ({ data }) => {
    const paginas = await lineasPorPagina(data);
    for (const [i, lineas] of paginas.entries()) {
      const ultima = lineas[lineas.length - 1] ?? '';
      expect(ENCABEZADOS, `página ${i + 1} termina en «${ultima}»`).not.toContain(ultima);
    }
  });

  it.each(CASOS)('$nombre — ninguna hoja empieza por una fila suelta de tabla', async ({ data }) => {
    const paginas = await lineasPorPagina(data);
    // Una hoja que arranca con UNA linea y a continuacion un encabezado es una fila huerfana.
    for (const [i, lineas] of paginas.slice(1).entries()) {
      const segunda = lineas[1] ?? '';
      if (ENCABEZADOS.includes(segunda)) {
        expect.fail(`la página ${i + 2} empieza con la fila huérfana «${lineas[0]}»`);
      }
    }
  });
});

describe('G15: la marca de agua DEMO no toca el veredicto', () => {
  /** Pixeles que cambian entre la version gratuita y la de pago: eso ES la marca de agua. */
  async function marcaDeAgua(data: ReportData): Promise<{ y: number[]; altoPagina: number; fondoSello: number }> {
    const render = async (free: boolean): Promise<mupdf.Pixmap> => {
      const doc = new mupdf.PDFDocument((await buildReport({ ...data, freeVersion: free }, es.informe)).slice());
      const pix = doc.loadPage(0).toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false);
      doc.destroy();
      return pix;
    };
    const pro = await render(false);
    const gratis = await render(true);
    const a = pro.getPixels();
    const b = gratis.getPixels();
    const n = pro.getNumberOfComponents();
    const w = pro.getWidth();
    const ys: number[] = [];
    // El relleno del sello verde (VERDE_BG) solo existe en la banda del veredicto: sirve para
    // localizarla sin cablear coordenadas.
    let fondoSello = 0;
    for (let i = 0; i + n <= a.length; i += n) {
      const fila = Math.floor(i / n / w);
      const [r, g, bb] = [a[i] ?? 0, a[i + 1] ?? 0, a[i + 2] ?? 0];
      if (Math.abs(r - 227) <= 3 && Math.abs(g - 245) <= 3 && Math.abs(bb - 234) <= 3) {
        fondoSello = Math.max(fondoSello, fila);
      }
      if (r !== (b[i] ?? 0) || g !== (b[i + 1] ?? 0) || bb !== (b[i + 2] ?? 0)) ys.push(fila);
    }
    return { y: ys, altoPagina: pro.getHeight(), fondoSello };
  }

  it('ni un solo píxel de la marca cae dentro de la banda del sello', async () => {
    const { y, fondoSello } = await marcaDeAgua(datos());
    expect(y.length).toBeGreaterThan(500); // la marca existe: si no, el test no probaría nada
    expect(fondoSello).toBeGreaterThan(0); // hemos sabido localizar la banda
    expect(Math.min(...y)).toBeGreaterThan(fondoSello);
  });

  it('la marca vive en la mitad inferior del papel, lejos de la huella SHA-256', async () => {
    const { y, altoPagina } = await marcaDeAgua(datos());
    expect(Math.min(...y)).toBeGreaterThan(altoPagina / 2);
  });
});
