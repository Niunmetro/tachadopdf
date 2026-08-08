import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { buildReport } from './report';

/**
 * LO QUE NINGUN TEST DE TEXTO VE.
 *
 * Extraer el texto del informe y buscar cadenas da verde aunque la etiqueta se dibuje ENCIMA de
 * su propio valor o aunque la huella SHA-256 se salga del papel: las dos cosas estaban pasando y
 * solo aparecieron al rasterizar el PDF y mirarlo. `drawText` de pdf-lib no ajusta ni recorta.
 *
 * Esta guarda mide las posiciones de los glifos:
 *   1) ninguno se sale de los margenes,
 *   2) dos glifos de la misma linea no se pisan.
 *
 * Se comprueba sobre la version Pro a proposito: la marca de agua DEMO es texto girado 45 grados
 * que cruza la pagina por diseño y dispararia la segunda regla.
 */
const ANCHO = 595;
const MARGEN = 50;
const COPIA = es.informe;
const PATRONES: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

const OBJETOS: InventarioObjetos = {
  info: 'eliminado',
  xmp: 'eliminado',
  anotaciones: 'noHabia',
  formularios: 'noHabia',
  adjuntos: 'noHabia',
  marcadores: 'noExaminado',
  alternativos: 'noHabia',
  ocultos: 'noHabia',
};

interface Glifo {
  pagina: number;
  c: string;
  x0: number;
  x1: number;
  linea: number;
}

function glifos(bytes: Uint8Array): Glifo[] {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    const salida: Glifo[] = [];
    for (let p = 0; p < doc.countPages(); p++) {
      doc
        .loadPage(p)
        .toStructuredText()
        .walk({
          onChar(c, _origen, _fuente, _tam, quad) {
            if (c.trim() === '') return;
            salida.push({
              pagina: p,
              c,
              x0: Math.min(quad[0], quad[6]),
              x1: Math.max(quad[2], quad[4]),
              linea: Math.round(Math.min(quad[1], quad[3])),
            });
          },
        });
    }
    return salida;
  } finally {
    doc.destroy();
  }
}

/** Caso denso a proposito: etiquetas largas, huella de 64 caracteres, nombre con dato oculto y
 *  las tres listas de detalle a la vez. Es donde se rompia. */
const DENSO: ReportData = {
  fileName: 'nomina-12345678Z-julio.pdf',
  sha256: 'c1a9'.repeat(16),
  date: '2026-08-08',
  patternsSearched: PATRONES,
  totalPaginas: 12,
  boxesPerPage: [
    { page: 0, count: 2 },
    { page: 3, count: 7 },
  ],
  objetos: OBJETOS,
  paginasSinCapaDeTexto: [6],
  paginasImagenCompleta: [3],
  paginasConImagen: [3, 5],
  unverifiableManualPages: [6],
  freeVersion: false,
  verify: { clean: true, residues: [] },
};

describe('maquetación del informe', () => {
  it('ningún glifo se sale de los márgenes de la página', async () => {
    const fuera = glifos(await buildReport(DENSO, COPIA))
      .filter((g) => g.x0 < MARGEN - 1 || g.x1 > ANCHO - MARGEN + 1)
      .map((g) => `p${g.pagina + 1} «${g.c}» x=${g.x0.toFixed(1)}..${g.x1.toFixed(1)}`);

    expect(fuera.slice(0, 10)).toEqual([]);
  });

  it('dos textos de la misma línea no se pisan (una etiqueta encima de su valor)', async () => {
    const porLinea = new Map<string, Glifo[]>();
    for (const g of glifos(await buildReport(DENSO, COPIA))) {
      const clave = `${g.pagina}:${g.linea}`;
      porLinea.set(clave, [...(porLinea.get(clave) ?? []), g]);
    }

    const choques: string[] = [];
    for (const [clave, lista] of porLinea) {
      const ordenados = [...lista].sort((a, b) => a.x0 - b.x0);
      for (let i = 1; i < ordenados.length; i++) {
        const anterior = ordenados[i - 1];
        const actual = ordenados[i];
        if (anterior === undefined || actual === undefined) continue;
        // 1,5 pt de holgura: las letras contiguas de una palabra se tocan, y algunas fuentes
        // dan pares con solape minimo. Un choque de columnas mide decenas de puntos.
        if (actual.x0 < anterior.x1 - 1.5) {
          choques.push(`${clave} «${anterior.c}»/«${actual.c}» solape ${(anterior.x1 - actual.x0).toFixed(1)}pt`);
        }
      }
    }

    expect(choques.slice(0, 10)).toEqual([]);
  });

  it('el informe cabe en varias páginas sin perder el pie ni la numeración', async () => {
    const doc = new mupdf.PDFDocument((await buildReport(DENSO, COPIA)).slice());
    const total = doc.countPages();
    const textos: string[] = [];
    for (let p = 0; p < total; p++) textos.push(doc.loadPage(p).toStructuredText().asText());
    doc.destroy();

    expect(total).toBeGreaterThan(1);
    textos.forEach((t, i) => {
      expect(t).toContain('tachadopdf.com');
      expect(t.replace(/\s+/g, ' ')).toContain(`Página ${i + 1} de ${total}`);
    });
  });
});
