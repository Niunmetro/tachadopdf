import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { buildReport } from './report';

/**
 * LA FILA QUE PIDE ALGO NO PUEDE DIBUJARSE COMO LA QUE NO PIDE NADA.
 *
 * El sello delega la unica instruccion concreta del informe: «constan en «Cobertura»». Y en
 * «Cobertura», la linea accionable —«Paginas con imagenes (su contenido visual no se ha
 * comprobado)  4 · paginas 1, 2, 3, 4»— se dibujaba con el mismo gris, el mismo cuerpo y el mismo
 * interlineado que «Paginas del documento  4» y que «Tachados sin confirmacion posterior  0».
 * Ocho filas identicas: el «4» que exige revisar cuatro paginas y el «0» inocuo se imprimian igual.
 *
 * Un test de texto no ve esto (las dos filas «estan»), asi que la guarda mide la FUENTE con la que
 * se dibuja cada cifra sobre el PDF renderizado. El recurso no es nuevo: es el mismo que el
 * informe ya usaba bien con «NO EXAMINADO» en el inventario de objetos.
 */
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
    sha256: 'd'.repeat(64),
    date: '2026-08-08',
    patternsSearched: PATRONES,
    totalPaginas: 4,
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

interface Linea {
  texto: string;
  negritas: boolean[];
}

/** Las lineas del informe renderizado, con la fuente de CADA glifo. */
async function lineas(data: ReportData): Promise<Linea[]> {
  const doc = new mupdf.PDFDocument((await buildReport(data, es.informe)).slice());
  try {
    const porLinea = new Map<string, { c: string; negrita: boolean }[]>();
    for (let p = 0; p < doc.countPages(); p++) {
      doc
        .loadPage(p)
        .toStructuredText()
        .walk({
          onChar(c, _origen, fuente, _tam, quad) {
            const clave = `${p}:${Math.round(Math.min(quad[1], quad[3]))}`;
            const nombre = String(fuente.getName());
            porLinea.set(clave, [...(porLinea.get(clave) ?? []), { c, negrita: /Bold/i.test(nombre) }]);
          },
        });
    }
    return [...porLinea.values()].map((glifos) => ({
      texto: glifos.map((g) => g.c).join(''),
      negritas: glifos.map((g) => g.negrita),
    }));
  } finally {
    doc.destroy();
  }
}

/**
 * La cifra de una fila: sus DIGITOS. Ninguna etiqueta de «Cobertura» lleva numeros, asi que los
 * digitos de la linea son exactamente el valor — y no hay que contar caracteres para saber donde
 * acaba una etiqueta que ademas se parte en dos lineas.
 */
function cifraDe(todas: Linea[], etiqueta: string): boolean[] {
  // Con `startsWith` a secas se cazaba antes el SUBTITULO homonimo de la lista de detalle
  // («Paginas con imagen a pagina completa» es a la vez subtitulo y fila): la fila es la que
  // ademas lleva cifra.
  const linea = todas.find((l) => l.texto.startsWith(etiqueta) && /[0-9]/.test(l.texto));
  if (linea === undefined) throw new Error(`no encuentro la fila «${etiqueta}»`);
  return linea.negritas.filter((_, i) => /[0-9]/.test(linea.texto[i] ?? ''));
}

describe('G13: en «Cobertura», la fila con reserva se distingue de la fila de inventario', () => {
  it('la cifra de una fila con reserva va en negrita y la de inventario no', async () => {
    const todas = await lineas(datos({ paginasConImagen: [0, 1, 2, 3] }));

    // Etiquetas CONGELADAS: comparar el informe con `COPIA.loQueSea` es compararlo consigo mismo.
    const conReserva = cifraDe(todas, 'Páginas con imágenes');
    const inventario = cifraDe(todas, 'Páginas del documento');

    expect(conReserva.length).toBeGreaterThan(0);
    expect(inventario.length).toBeGreaterThan(0);
    expect(conReserva.every((n) => n)).toBe(true);
    expect(inventario.some((n) => n)).toBe(false);
  });

  it('la misma fila a CERO no se destaca: lo que marca es la reserva, no la etiqueta', async () => {
    const todas = await lineas(datos());
    expect(cifraDe(todas, 'Páginas con imágenes').some((n) => n)).toBe(false);
    expect(cifraDe(todas, 'Tachados sin confirmación posterior').some((n) => n)).toBe(false);
  });

  it('las cinco filas que bajan el sello se destacan cuando tienen contenido', async () => {
    const todas = await lineas(
      datos({
        paginasSinCapaDeTexto: [3],
        paginasImagenCompleta: [3],
        paginasConImagen: [0, 3],
        unverifiableManualPages: [3],
        paginasTextoNoLegible: [{ page: 1, caracteres: 90 }],
      }),
    );

    for (const etiqueta of [
      'Páginas sin capa de texto',
      'Páginas con imagen a página completa',
      'Páginas con imágenes',
      'Tachados sin confirmación posterior',
      'Páginas con texto dibujado que no se puede releer',
    ]) {
      expect(cifraDe(todas, etiqueta).every((n) => n), etiqueta).toBe(true);
    }
    expect(cifraDe(todas, 'Zonas tachadas').some((n) => n)).toBe(false);
  });

  /**
   * LA FILA DEL NUMERADOR DEL MEDIDOR NO ES UNA RESERVA. Cuenta las paginas que quedaron LIMPIAS
   * del todo, asi que destacarla seria pintar de ambar la buena noticia y confundir al lector
   * sobre que le pide accion. En el caso corriente ademas vale 0, y un 0 en negrita sobre fondo
   * ambar se lee como una alarma que no existe.
   */
  it('la fila «Páginas comprobadas del todo» va en redonda, tenga el valor que tenga', async () => {
    const conTodo = await lineas(datos({ paginasConImagen: [0, 1, 2, 3] })); // vale 0
    const sinNada = await lineas(datos()); // vale 4

    expect(cifraDe(conTodo, 'Páginas comprobadas del todo').some((n) => n)).toBe(false);
    expect(cifraDe(sinNada, 'Páginas comprobadas del todo').some((n) => n)).toBe(false);
  });
});
