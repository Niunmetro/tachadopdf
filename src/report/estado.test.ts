import { describe, expect, it } from 'vitest';
import { CONTENIDOS } from '../content/index';
import { LOCALES } from '../content/registro';
import { detect } from '../detect/patterns';
import { ALL_PATTERNS } from '../pdf/pipeline';
import type { EstadoObjeto, EstadoSello, InventarioObjetos, ReportData } from '../types';
import {
  estadoDelSello,
  paginasConReserva,
  paginasReleidas,
  paginasSinTexto,
  reservaSoloPorImagenes,
} from './estado';

/**
 * Los ROTULOS van CONGELADOS aqui, no leidos de `es.informe.sellos`. Un test que se compara con
 * su propio generador no puede fallar nunca: es el fallo que ya documento la bitacora del
 * 22-jul con `hreflang`, y el que tenia `report.test.ts` con `toContain(COPIA.alcance)`.
 */
const SELLOS_ES: Record<EstadoSello, string> = {
  E1: 'TACHADO NO SUPERADO',
  E2: 'SIN COMPROBACIÓN AUTOMÁTICA',
  E3: 'COMPROBACIÓN PARCIAL',
  E4: 'SIN TACHADOS',
  E5: 'TACHADO VERIFICADO',
};

const SELLOS_EN: Record<EstadoSello, string> = {
  E1: 'REDACTION CHECK FAILED',
  E2: 'NO AUTOMATIC CHECK POSSIBLE',
  E3: 'PARTIAL CHECK',
  E4: 'NOTHING REDACTED',
  E5: 'REDACTION VERIFIED',
};

const ESTADOS: EstadoSello[] = ['E1', 'E2', 'E3', 'E4', 'E5'];

function objetos(marcadores: EstadoObjeto): InventarioObjetos {
  return {
    info: 'eliminado',
    xmp: 'noHabia',
    anotaciones: 'noHabia',
    formularios: 'noHabia',
    adjuntos: 'noHabia',
    marcadores,
    alternativos: 'noHabia',
    ocultos: 'noHabia',
  };
}

function datos(over: Partial<ReportData>): ReportData {
  return {
    fileName: 'x.pdf',
    sha256: 'a'.repeat(64),
    date: '2026-08-08',
    patternsSearched: ALL_PATTERNS,
    totalPaginas: 3,
    boxesPerPage: [{ page: 0, count: 1 }],
    objetos: objetos('noHabia'),
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

// G1 · la escalera es total, exclusiva y ordenada. 3 x 3 x 2 x 2 x 2 x 2 = 144 combinaciones.
describe('G1: estadoDelSello sobre el espacio completo de entradas', () => {
  const CLEAN: { nombre: string; over: Partial<ReportData> }[] = [
    { nombre: 'clean=true', over: { verify: { clean: true, residues: [] } } },
    {
      nombre: 'clean=false',
      over: { verify: { clean: false, residues: [{ kind: 'dni', value: 'x', page: 0 }] } },
    },
    { nombre: 'verify ausente', over: {} },
  ];
  const SIN_TEXTO = [
    { nombre: 'ninguna', valor: [] as number[] },
    { nombre: 'algunas', valor: [1] },
    { nombre: 'todas', valor: [0, 1, 2] },
  ];
  const IMAGEN = [
    { nombre: 'sin imagen completa', valor: [] as number[] },
    { nombre: 'con imagen completa', valor: [2] },
  ];
  // La dimension que faltaba, y por la que salia verde el caso mas comercial de todos: una foto
  // del DNI pegada en un acta, por debajo del umbral del 60 %.
  const CON_IMAGEN = [
    { nombre: 'sin imagenes', valor: [] as number[] },
    { nombre: 'con imagenes', valor: [1] },
  ];
  const NO_CONF = [
    { nombre: 'todos confirmados', valor: [] as number[] },
    { nombre: 'alguno sin confirmar', valor: [0] },
  ];
  const ZONAS = [
    { nombre: 'sin zonas', valor: [] as { page: number; count: number }[] },
    { nombre: 'con zonas', valor: [{ page: 0, count: 2 }] },
  ];
  const MARCADORES: EstadoObjeto[] = ['noHabia', 'noExaminado'];

  const casos: { etiqueta: string; data: ReportData }[] = [];
  for (const clean of CLEAN) {
    for (const sinTexto of SIN_TEXTO) {
      for (const imagen of IMAGEN) {
        for (const conImagen of CON_IMAGEN) {
          for (const noConf of NO_CONF) {
            for (const zonas of ZONAS) {
              for (const marcadores of MARCADORES) {
                const base = datos({
                  paginasSinCapaDeTexto: sinTexto.valor,
                  paginasImagenCompleta: imagen.valor,
                  paginasConImagen: conImagen.valor,
                  unverifiableManualPages: noConf.valor,
                  boxesPerPage: zonas.valor,
                  objetos: objetos(marcadores),
                });
                const { verify, ...sinVerify } = base;
                const data: ReportData =
                  clean.over.verify === undefined
                    ? (sinVerify as ReportData)
                    : { ...base, ...clean.over };
                casos.push({
                  etiqueta: `${clean.nombre} · ${sinTexto.nombre} · ${imagen.nombre} · ${conImagen.nombre} · ${noConf.nombre} · ${zonas.nombre} · marcadores=${marcadores}`,
                  data,
                });
              }
            }
          }
        }
      }
    }
  }

  it('la rejilla cubre las 288 combinaciones', () => {
    expect(casos).toHaveLength(288);
  });

  it('cada combinación devuelve exactamente uno de los cinco estados', () => {
    for (const caso of casos) {
      expect(ESTADOS, caso.etiqueta).toContain(estadoDelSello(caso.data));
    }
  });

  it('la rejilla ejercita los CINCO estados (si no, no estaría probando nada)', () => {
    const vistos = new Set(casos.map((c) => estadoDelSello(c.data)));
    expect([...vistos].sort()).toEqual(ESTADOS);
  });

  // La invariante maestra. Es la que convierte el sello verde en una afirmacion verdadera:
  // verde SOLO si corrio la comprobacion, se releyeron TODAS las paginas, no hay reservas de
  // ningun tipo, se elimino algo, y no queda ningun objeto del archivo sin examinar.
  it('E5 implica cobertura total, resultado limpio, algo eliminado y nada sin examinar', () => {
    for (const caso of casos) {
      if (estadoDelSello(caso.data) !== 'E5') continue;
      const d = caso.data;
      expect(d.verify?.clean, caso.etiqueta).toBe(true);
      expect(d.paginasSinCapaDeTexto, caso.etiqueta).toEqual([]);
      expect(d.paginasImagenCompleta, caso.etiqueta).toEqual([]);
      // Sin esta linea, el verde volvia a taparse sobre una foto del DNI pegada en un acta.
      expect(d.paginasConImagen, caso.etiqueta).toEqual([]);
      expect(d.unverifiableManualPages, caso.etiqueta).toEqual([]);
      expect(d.boxesPerPage.reduce((t, b) => t + b.count, 0), caso.etiqueta).toBeGreaterThan(0);
      expect(d.objetos.marcadores, caso.etiqueta).not.toBe('noExaminado');
    }
  });

  it('un documento entero sin capa de texto nunca es parcial ni verde: es E2', () => {
    for (const caso of casos) {
      const d = caso.data;
      if (d.verify?.clean !== true) continue;
      if (d.paginasSinCapaDeTexto.length !== d.totalPaginas) continue;
      expect(estadoDelSello(d), caso.etiqueta).toBe('E2');
    }
  });

  it('sin zonas tachadas nunca sale E5, haya lo que haya en el resto', () => {
    for (const caso of casos) {
      if (caso.data.boxesPerPage.length > 0) continue;
      expect(estadoDelSello(caso.data), caso.etiqueta).not.toBe('E5');
    }
  });

  // EL ORDEN de la escalera es parte del contrato, no un detalle: «hay una parte del documento
  // que no he comprobado» pesa mas que «no habia nada que tachar». Sin esta asercion, cambiar de
  // sitio E3 y E4 no rompia ningun test — comprobado con la mutacion.
  it('con reservas manda la reserva: E3 aunque no se haya tachado nada', () => {
    for (const caso of casos) {
      const d = caso.data;
      if (d.verify?.clean !== true) continue;
      if (paginasSinTexto(d) >= d.totalPaginas) continue;
      const hayReserva =
        paginasConReserva(d).length > 0 || d.objetos.marcadores === 'noExaminado';
      if (!hayReserva) continue;
      expect(estadoDelSello(d), caso.etiqueta).toBe('E3');
    }
  });

  it('sin reservas y sin zonas tachadas, el estado es E4', () => {
    for (const caso of casos) {
      const d = caso.data;
      if (d.verify?.clean !== true) continue;
      if (paginasConReserva(d).length > 0) continue;
      if (d.objetos.marcadores === 'noExaminado') continue;
      if (d.boxesPerPage.length > 0) continue;
      expect(estadoDelSello(d), caso.etiqueta).toBe('E4');
    }
  });

  it('un objeto presente y no examinado degrada el sello (P3)', () => {
    const perfecto = datos({});
    expect(estadoDelSello(perfecto)).toBe('E5');
    expect(estadoDelSello(datos({ objetos: objetos('noExaminado') }))).toBe('E3');
  });

  // El falso verde mas comercial: un acta con texto normal y una FOTO del DNI pegada. El umbral
  // del 60 % no la tocaba, la fila de cobertura la nombraba, y el sello seguia diciendo VERDE.
  it('una página con una imagen, sea del tamaño que sea, degrada el sello', () => {
    expect(estadoDelSello(datos({}))).toBe('E5');
    expect(estadoDelSello(datos({ paginasConImagen: [0] }))).toBe('E3');
  });

  it('«solo imágenes» se distingue de las demás reservas', () => {
    expect(reservaSoloPorImagenes(datos({ paginasConImagen: [0] }))).toBe(true);
    expect(reservaSoloPorImagenes(datos({}))).toBe(false);
    expect(
      reservaSoloPorImagenes(datos({ paginasConImagen: [0], paginasSinCapaDeTexto: [1] })),
    ).toBe(false);
    expect(
      reservaSoloPorImagenes(datos({ paginasConImagen: [0], unverifiableManualPages: [0] })),
    ).toBe(false);
    expect(
      reservaSoloPorImagenes(datos({ paginasConImagen: [0], paginasImagenCompleta: [0] })),
    ).toBe(false);
  });
});

// G7 · la aritmetica de cobertura cuadra: sin denominador no hay alcance.
describe('G7: aritmética de la cobertura', () => {
  it('páginas releídas + páginas sin capa de texto = total, en todos los casos', () => {
    for (const sinTexto of [[], [1], [0, 2], [0, 1, 2]]) {
      const d = datos({ paginasSinCapaDeTexto: sinTexto });
      expect(paginasReleidas(d) + paginasSinTexto(d)).toBe(d.totalPaginas);
    }
  });

  it('una página repetida en la entrada no infla la cuenta', () => {
    const d = datos({ paginasSinCapaDeTexto: [1, 1, 1] });
    expect(paginasSinTexto(d)).toBe(1);
    expect(paginasReleidas(d)).toBe(2);
  });
});

// G8 · disyuncion de cadenas y paridad ES/EN. Si el ambar se llamara «VERIFICADO CON RESERVAS»,
// el test «una pagina escaneada no puede salir verde» seria imposible de escribir.
describe('G8: los rótulos del sello son disjuntos y están traducidos', () => {
  it('los rótulos españoles son exactamente los congelados en este test', () => {
    expect(CONTENIDOS.es.informe.sellos).toEqual(SELLOS_ES);
  });

  it('los rótulos ingleses son exactamente los congelados en este test', () => {
    expect(CONTENIDOS.en.informe.sellos).toEqual(SELLOS_EN);
  });

  it.each(LOCALES)('%s: los cinco rótulos existen, no están vacíos y son distintos', (locale) => {
    const sellos = CONTENIDOS[locale].informe.sellos;
    const valores = ESTADOS.map((e) => sellos[e]);
    expect(valores.filter((v) => v.trim() === '')).toEqual([]);
    expect(new Set(valores).size).toBe(5);
  });

  it.each(LOCALES)('%s: ningún rótulo es subcadena de otro', (locale) => {
    const valores = ESTADOS.map((e) => CONTENIDOS[locale].informe.sellos[e]);
    const solapes: string[] = [];
    for (const a of valores) {
      for (const b of valores) {
        if (a !== b && b.includes(a)) solapes.push(`«${a}» está dentro de «${b}»`);
      }
    }
    expect(solapes).toEqual([]);
  });
});

// G11 · los patrones DECLARADOS en el informe son exactamente los que `detect()` puede emitir.
// El defecto real de julio fue justo este: faltaba 'catastro' en la lista declarada.
describe('G11: los patrones declarados son los que la detección emite', () => {
  const CONGELADOS = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

  const MUESTRA = [
    'DNI 12345678Z',
    'NIE X1234567L',
    'IBAN ES9121000418450200051332',
    'NUSS 281234567840',
    'Telefono 612345678',
    'Correo persona@ejemplo.es',
    'Catastro 9872023VH5797S0001WX',
  ].join('\n');

  it('la lista declarada coincide con la lista congelada', () => {
    expect([...ALL_PATTERNS].sort()).toEqual([...CONGELADOS].sort());
  });

  it.each(LOCALES)('%s: hay una etiqueta por patrón declarado y ninguna de más', (locale) => {
    expect(Object.keys(CONTENIDOS[locale].informe.etiquetas).sort()).toEqual(
      [...CONGELADOS].sort(),
    );
  });

  it('la detección emite de verdad los siete tipos sobre una muestra válida', () => {
    const emitidos = [...new Set(detect(MUESTRA).map((h) => h.kind))].sort();
    expect(emitidos).toEqual([...CONGELADOS].sort());
  });
});
