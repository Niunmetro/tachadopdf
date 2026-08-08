import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { coberturaComprobada } from './estado';
import { buildReport } from './report';

/**
 * EL MEDIDOR QUE NO MEDÍA NADA.
 *
 * El icono del sello ámbar tiene forma de medidor de cobertura — un disco que se llena — y salía
 * medio lleno SIEMPRE, porque el relleno era un dibujo fijo por estado. Medido sobre los dos
 * informes parciales de ejemplo, rasterizados: el que comprueba del todo 3 de sus 6 páginas y el
 * que no puede comprobar del todo NINGUNA de sus 4 (todas llevan imágenes) dibujaban exactamente
 * la misma media luna, píxel a píxel. El segundo es el que importa: cobertura real cero, dibujo
 * de media cobertura. Un error que va en la dirección que nos favorece, que es siempre la peor.
 *
 * Efecto colateral: las dos variantes del ámbar —el estado que se lee el 86 % de las veces— eran
 * indistinguibles salvo leyendo el párrafo.
 *
 * Esta guarda mide el NIVEL DE LLENADO sobre el informe RENDERIZADO, no el código: localiza el
 * disco por su aro, busca la línea de llenado y la compara con la proporción real. Un test de
 * texto no ve nada de esto, y por eso el defecto sobrevivió a una pasada de diseño entera.
 *
 * Las cifras esperadas van CONGELADAS a mano, no calculadas con el mismo `coberturaComprobada`
 * que usa el informe: comparar el dibujo con su propio generador es un test que no puede fallar.
 */

const AMBAR_TINTA: [number, number, number] = [124, 74, 3]; // rgb(0.486, 0.29, 0.012)
const TOPE_MEDIDOR = 0.8; // el 100 % se dibuja al 80 % del diámetro; ver `report.ts`
const ESCALA = 8;

// Ventana en espacio de PÁGINA (Y hacia abajo) alrededor del icono: la banda del sello está a una
// altura fija en la primera hoja. Deja fuera la barra lateral de la banda (x < 57) y el rótulo
// (x >= 112), que van de la misma tinta.
const VENTANA = { x0: 62, y0: 106, x1: 110, y1: 158 };

const PATRONES: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

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
    sha256: 'c'.repeat(64),
    date: '2026-08-08',
    patternsSearched: PATRONES,
    totalPaginas: 4,
    boxesPerPage: [{ page: 0, count: 2 }],
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

interface Medida {
  /** Fracción del DIÁMETRO que queda por debajo de la línea de llenado. */
  llenado: number;
  /** Píxeles del interior del disco que son blancos: la pista, lo que hace que el vacío se lea. */
  blancoInterior: number;
  /** Píxeles del interior del disco, en total. */
  interior: number;
  /** Píxeles entintados del casquete superior del disco: al tope tiene que quedar sin llenar. */
  tintaEnElCasquete: number;
  /** Nivel de gris del relleno y de la pista, para la prueba de la fotocopia. */
  grisRelleno: number;
  grisPista: number;
}

/** Recorta el icono de la primera página y lo mide píxel a píxel. */
async function medir(data: ReportData, gris = false): Promise<Medida> {
  const doc = new mupdf.PDFDocument((await buildReport(data, es.informe)).slice());
  try {
    const page = doc.loadPage(0);
    const bbox: [number, number, number, number] = [
      VENTANA.x0 * ESCALA,
      VENTANA.y0 * ESCALA,
      VENTANA.x1 * ESCALA,
      VENTANA.y1 * ESCALA,
    ];
    const lienzo = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, bbox, false);
    lienzo.clear(255);
    page.run(new mupdf.DrawDevice(mupdf.Matrix.scale(ESCALA, ESCALA), lienzo), mupdf.Matrix.identity);
    const pix = gris ? lienzo.convertToColorSpace(mupdf.ColorSpace.DeviceGray) : lienzo;
    const bytes = pix.getPixels();
    const n = pix.getNumberOfComponents();
    const W = pix.getWidth();
    const H = pix.getHeight();
    const en = (x: number, y: number): number[] => {
      const i = (y * W + x) * n;
      return Array.from({ length: n }, (_, k) => bytes[i + k] ?? 0);
    };
    // «Tinta» = el ámbar oscuro del medidor, en color o en su gris equivalente. El fondo de la
    // banda (251,240,210) y la pista blanca quedan los dos muy lejos del umbral.
    const esTinta = (p: number[]): boolean =>
      gris
        ? (p[0] ?? 255) < 150
        : Math.abs((p[0] ?? 0) - AMBAR_TINTA[0]) <= 40 &&
          Math.abs((p[1] ?? 0) - AMBAR_TINTA[1]) <= 40 &&
          Math.abs((p[2] ?? 0) - AMBAR_TINTA[2]) <= 40;

    // 1. El disco se localiza por su ARO, que se dibuja siempre y con cualquier llenado.
    let x0 = W;
    let x1 = -1;
    let y0 = H;
    let y1 = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (esTinta(en(x, y))) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    expect(x1 - x0, 'no se ha encontrado el disco del medidor').toBeGreaterThan(20 * ESCALA);
    const R = (x1 - x0) / 2;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    // El aro mide 2,2 pt: se descuentan 3,4 pt para dejar fuera también su antialias.
    const RADIO_INTERIOR = R - 3.4 * ESCALA;

    // 2. La línea de llenado: la fila más alta del interior del disco que está entintada de lado
    //    a lado. El aro queda fuera por construcción (solo se miran píxeles dentro del interior).
    let filaLlenado = -1;
    let interior = 0;
    let blancoInterior = 0;
    let tintaEnElCasquete = 0;
    let sumaRelleno = 0;
    let cuentaRelleno = 0;
    let sumaPista = 0;
    let cuentaPista = 0;
    for (let y = 0; y < H; y++) {
      let dentro = 0;
      let conTinta = 0;
      for (let x = 0; x < W; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > RADIO_INTERIOR * RADIO_INTERIOR) continue;
        const p = en(x, y);
        dentro++;
        interior++;
        const tinta = esTinta(p);
        if (tinta) conTinta++;
        if (!gris && (p[0] ?? 0) > 245 && (p[1] ?? 0) > 245 && (p[2] ?? 0) > 245) blancoInterior++;
        if (gris && (p[0] ?? 0) > 245) blancoInterior++;
        // El casquete superior del disco: por encima de 0,68 R, o sea del 84 % del diámetro. Al
        // tope (0,8 del diámetro) el relleno llega a 0,6 R, así que ahí NUNCA puede haber tinta.
        if (dy < -0.68 * R && tinta) tintaEnElCasquete++;
        if (tinta) {
          sumaRelleno += p[0] ?? 0;
          cuentaRelleno++;
        } else if ((p[0] ?? 0) > 245) {
          sumaPista += p[0] ?? 0;
          cuentaPista++;
        }
      }
      if (filaLlenado < 0 && dentro >= 6 && conTinta / dentro >= 0.6) filaLlenado = y;
    }
    const llenado = filaLlenado < 0 ? 0 : (cy + R - filaLlenado) / (2 * R);
    return {
      llenado,
      blancoInterior,
      interior,
      tintaEnElCasquete,
      grisRelleno: cuentaRelleno > 0 ? sumaRelleno / cuentaRelleno : 255,
      grisPista: cuentaPista > 0 ? sumaPista / cuentaPista : 0,
    };
  } finally {
    doc.destroy();
  }
}

/** Los cuatro informes ámbar de referencia, con su cobertura real. */
const NINGUNA = datos({ paginasConImagen: [0, 1, 2, 3] }); //              0 de 4
const MITAD = datos({
  totalPaginas: 6,
  paginasSinCapaDeTexto: [4],
  paginasImagenCompleta: [4],
  paginasConImagen: [0, 2, 4],
  unverifiableManualPages: [4],
  paginasTextoNoLegible: [{ page: 2, caracteres: 118 }],
  boxesPerPage: [
    { page: 0, count: 4 },
    { page: 2, count: 1 },
  ],
}); //                                                                     3 de 6
const CASI_TODA = datos({ totalPaginas: 6, paginasConImagen: [3] }); //    5 de 6
const TODA = datos({ objetos: objetos({ ocultos: 'noExaminado' }) }); //   4 de 4

describe('G18: el medidor de cobertura mide de verdad', () => {
  it('la proporción es «páginas sin ninguna reserva» sobre «páginas del documento»', () => {
    expect(coberturaComprobada(NINGUNA)).toBe(0);
    expect(coberturaComprobada(MITAD)).toBe(0.5);
    expect(coberturaComprobada(CASI_TODA)).toBeCloseTo(5 / 6, 6);
    expect(coberturaComprobada(TODA)).toBe(1);
    // Un documento sin páginas no puede dividir por cero ni dibujar cobertura.
    expect(coberturaComprobada(datos({ totalPaginas: 0 }))).toBe(0);
  });

  it('el relleno del disco sigue a la proporción real, y no a un dibujo fijo', async () => {
    // Congelado a mano: proporción × 0,8 (el tope del medidor).
    expect((await medir(NINGUNA)).llenado).toBeCloseTo(0, 1);
    expect((await medir(MITAD)).llenado).toBeCloseTo(0.4, 1);
    expect((await medir(CASI_TODA)).llenado).toBeCloseTo(0.667, 1);
    expect((await medir(TODA)).llenado).toBeCloseTo(0.8, 1);
  });

  it('los dos informes parciales de ejemplo dejan de ser el mismo dibujo', async () => {
    const ninguna = (await medir(NINGUNA)).llenado;
    const mitad = (await medir(MITAD)).llenado;
    const casi = (await medir(CASI_TODA)).llenado;
    const toda = (await medir(TODA)).llenado;
    expect(ninguna).toBeLessThan(mitad);
    expect(mitad).toBeLessThan(casi);
    expect(casi).toBeLessThan(toda);
    // El caso que motivó la guarda: cobertura cero NO se puede dibujar medio lleno.
    expect(ninguna).toBeLessThan(0.05);
    expect(mitad - ninguna).toBeGreaterThan(0.25);
  });

  it('cobertura cero se dibuja como un recipiente VACÍO, no como un icono ausente', async () => {
    const m = await medir(NINGUNA);
    // La pista blanca ocupa el interior entero: se ve que hay una medida tomada, y el disco no se
    // confunde con el fondo de la banda ni con una casilla que no aplica.
    expect(m.interior).toBeGreaterThan(1000);
    expect(m.blancoInterior / m.interior).toBeGreaterThan(0.9);
  });

  it('cobertura completa NO se dibuja como el disco lleno del estado verificado', async () => {
    const m = await medir(TODA);
    // El casquete de arriba se queda siempre sin llenar: en E3 siempre queda algo pendiente, y un
    // disco lleno del todo junto a «COMPROBACIÓN PARCIAL» insinuaría el verde que no se ha dado.
    expect(m.llenado).toBeLessThan(0.85);
    expect(m.tintaEnElCasquete).toBe(0);
    // Y el casquete vacío se VE: medido, el 7,5 % del interior del disco sigue en blanco.
    expect(m.blancoInterior / m.interior).toBeGreaterThan(0.05);
  });

  it('en ESCALA DE GRISES el medidor se lee igual: el informe se imprime y se fotocopia', async () => {
    for (const [caso, esperado] of [
      [NINGUNA, 0],
      [MITAD, 0.4],
      [CASI_TODA, 0.667],
      [TODA, 0.8],
    ] as const) {
      const m = await medir(caso, true);
      expect(m.llenado).toBeCloseTo(esperado, 1);
    }
    // Y el contraste que sostiene la lectura no es entre dos ámbares parecidos: relleno contra
    // pista, con el papel de por medio.
    const m = await medir(MITAD, true);
    expect(m.grisPista - m.grisRelleno).toBeGreaterThan(100);
  });

  it('el tope escala la medida, no la recorta: 5 de 6 y 4 de 4 no dibujan lo mismo', async () => {
    const casi = (await medir(CASI_TODA)).llenado;
    const toda = (await medir(TODA)).llenado;
    expect(toda - casi).toBeGreaterThan(0.08);
    expect(toda).toBeLessThanOrEqual(TOPE_MEDIDOR + 0.03);
  });
});
