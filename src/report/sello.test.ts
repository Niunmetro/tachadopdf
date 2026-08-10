import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { loadPdf } from '../pdf/engine';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { coberturaComprobada } from './estado';
import { buildReport } from './report';

const COPIA = es.informe;

/**
 * EL PAPEL. Se renderiza el informe de verdad, se extrae su texto y se afirma sobre LITERALES
 * CONGELADOS, nunca sobre `COPIA.loQueSea`: un test que se compara con su propio generador da
 * verde pase lo que pase (es lo que le ocurria a `toContain(COPIA.alcance)`).
 *
 * El literal que se usa para negar el verde es 'VERIFICADO' a secas, no 'TACHADO VERIFICADO':
 * asi la misma asercion caza tambien el sello ANTERIOR, que era exactamente ese participio
 * suelto. Cada uno de estos cuatro casos estampaba VERIFICADO antes de este cambio.
 */
const VERDE_A_SECAS = 'VERIFICADO';

const PATRONES: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

function objetos(over: Partial<InventarioObjetos> = {}): InventarioObjetos {
  const base: InventarioObjetos = {
    info: 'eliminado',
    xmp: 'noHabia',
    anotaciones: 'noHabia',
    formularios: 'noHabia',
    adjuntos: 'noHabia',
    marcadores: 'noHabia',
    alternativos: 'noHabia',
    ocultos: 'noHabia',
  };
  return { ...base, ...over };
}

function datos(over: Partial<ReportData> = {}): ReportData {
  return {
    fileName: 'contrato.pdf',
    sha256: 'a'.repeat(64),
    date: '2026-08-08',
    patternsSearched: PATRONES,
    totalPaginas: 3,
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

/**
 * Los cuatro casos de mas abajo estampaban VERIFICADO antes de este cambio. Para que eso se pueda
 * COMPROBAR —y no solo afirmar— este fichero se ejecuta tal cual contra el codigo anterior:
 * `git stash push -- src` y `npx vitest run src/report/sello.test.ts`. Lo unico que hace falta
 * son los dos campos del esquema viejo que el informe anterior leia. Ni el codigo nuevo ni las
 * aserciones los tocan; existen para que la demostracion fail-to-pass siga siendo reproducible.
 */
function datosConAliasDelEsquemaAnterior(over: Partial<ReportData> = {}): ReportData {
  const base = datos(over);
  return { ...base, scannedPages: base.paginasSinCapaDeTexto, metadataRemoved: [] } as ReportData;
}

async function texto(data: ReportData): Promise<string> {
  const doc = await loadPdf(await buildReport(data, COPIA));
  const t = doc.extractAllText().join(' ');
  doc.close();
  return t.replace(/\s+/g, ' ');
}

// G2 · el falso verde numero uno: 26,8 % de los PDF reales tienen alguna pagina sin capa de texto.
describe('G2: una página sin capa de texto no puede salir verde', () => {
  it('sella COMPROBACIÓN PARCIAL, dice cuántas páginas comprobó y no dice VERIFICADO', async () => {
    const t = await texto(datosConAliasDelEsquemaAnterior({ paginasSinCapaDeTexto: [1] }));

    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).toContain('COMPROBACIÓN PARCIAL');
    // Dos cifras, cada una con su significado: RELEIDAS (2 de 3) y CON RESERVA (1). La redaccion
    // anterior, «Comprobadas 2 de 3», restaba las reservas del numerador — y con las imagenes
    // dentro de las reservas eso convertia una pagina releida con un logo en «no comprobada».
    expect(t).toContain('Se han releído 2 de 3 páginas');
    expect(t).toContain('En 1 página(s) la comprobación automática no llega a todo el contenido');
    expect(t).toContain('Página 2: sin capa de texto, no hay nada que releer');
  });
});

// G3 · «Zonas tachadas: Ninguna» bajo un sello verde era el contrasentido que abrio todo esto.
describe('G3: sin zonas tachadas no puede salir verde', () => {
  it('sella SIN TACHADOS y dice en voz alta que no eliminó nada', async () => {
    const t = await texto(datosConAliasDelEsquemaAnterior({ boxesPerPage: [] }));

    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).toContain('SIN TACHADOS');
    expect(t).toContain('No se ha eliminado ningún dato de este documento');
    expect(t).toContain('Este informe no registra ningún borrado');
  });
});

// G4 · el documento escaneado entero: no es que falte una parte, es que no hubo comprobacion.
describe('G4: un documento entero sin capa de texto no es «parcial», es «sin comprobación»', () => {
  it('sella SIN COMPROBACIÓN AUTOMÁTICA, ni verde ni parcial', async () => {
    const t = await texto(datosConAliasDelEsquemaAnterior({ paginasSinCapaDeTexto: [0, 1, 2] }));

    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).not.toContain('COMPROBACIÓN PARCIAL');
    expect(t).toContain('SIN COMPROBACIÓN AUTOMÁTICA');
    expect(t).toContain('Ninguna de las 3 páginas tiene capa de texto');
  });
});

// G5 · falla cerrado. Los dos motivos comparten sello porque piden la misma conducta.
describe('G5: la comprobación que no corre, y los residuos, bloquean igual', () => {
  it('sin `verify` el informe queda bloqueado y lo dice', async () => {
    const { verify, ...sinVerify } = datos();
    const t = await texto(sinVerify as ReportData);

    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).toContain('TACHADO NO SUPERADO');
    expect(t).toContain('Nada de lo que sigue está confirmado');
  });

  it('con residuos re-encontrados, el informe manda repetir el tachado', async () => {
    const t = await texto(
      datos({ verify: { clean: false, residues: [{ kind: 'dni', value: '12345678Z', page: 0 }] } }),
    );

    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).toContain('TACHADO NO SUPERADO');
    expect(t).toContain('No entregues este archivo: repite el tachado');
    expect(t).toContain('DNI: 1 ocurrencia(s) en el texto extraíble');
  });

  it('un documento de cero páginas no puede sellar nada verde', async () => {
    const t = await texto(datos({ totalPaginas: 0 }));
    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).toContain('TACHADO NO SUPERADO');
  });
});

// G6 · la guarda que impide que el agujero de los marcadores vuelva en silencio.
describe('G6: un objeto presente y no examinado degrada el sello y consta en el inventario', () => {
  it('con marcadores sin examinar no hay verde, y el informe lo nombra', async () => {
    const t = await texto(datosConAliasDelEsquemaAnterior({ objetos: objetos({ marcadores: 'noExaminado' }) }));

    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).toContain('COMPROBACIÓN PARCIAL');
    expect(t).toContain('objetos que la comprobación no examina');
    expect(t).toContain('Marcadores del documento (índice)');
    expect(t).toContain('NO EXAMINADO');
  });

  /**
   * LA FRASE DUPLICADA. Cuando el ambar se debe UNICAMENTE a un objeto no examinado (ninguna
   * pagina con reserva), el sello imprimia la misma oracion dos veces seguidas:
   * `lineaParcialSoloObjetos` ya nombra los objetos y encima se le encolaba
   * `clausulaObjetosSinExaminar`. Y no era un caso raro: con cero reservas de pagina, la unica
   * forma de estar en E3 es tener un objeto sin examinar, asi que era el caso ENTERO.
   *
   * El literal va CONGELADO. La cuenta se hace sobre la oracion nuclear —sin el «Ademas,» ni el
   * «Pero» que las distingue— para que cazar las dos redacciones no dependa de la puntuacion.
   */
  const NUCLEO = 'este documento contiene objetos que la comprobación no examina';

  function veces(texto: string, aguja: string): number {
    return texto.split(aguja).length - 1;
  }

  it('con SOLO un objeto sin examinar, el sello dice la frase UNA vez, no dos', async () => {
    const t = await texto(datosConAliasDelEsquemaAnterior({ objetos: objetos({ marcadores: 'noExaminado' }) }));

    expect(veces(t, NUCLEO)).toBe(1);
    // Y sigue diciendo lo que tiene que decir: la frase esta, y esta la parte afirmativa.
    expect(t).toContain('Se han releído las 3 páginas del archivo y sus metadatos');
    expect(t).toContain('constan en «Objetos del archivo»');
  });

  it('con una reserva de pagina ADEMAS del objeto, la coletilla SI se anade', async () => {
    // Aqui la base es `lineaParcial`/`lineaParcialSoloImagenes`, que NO nombra los objetos: sin la
    // coletilla el sello se callaria su propia reserva. Es la rama que el arreglo no puede tocar.
    const t = await texto(
      datosConAliasDelEsquemaAnterior({
        paginasConImagen: [1],
        objetos: objetos({ marcadores: 'noExaminado' }),
      }),
    );

    expect(veces(t, NUCLEO)).toBe(1);
    expect(t).toContain('Además, este documento contiene objetos que la comprobación no examina');
  });
});

describe('el verde, cuando de verdad toca', () => {
  it('con cobertura total, resultado limpio y algo eliminado, sella TACHADO VERIFICADO', async () => {
    const t = await texto(datos());

    expect(t).toContain('TACHADO VERIFICADO');
    expect(t).toContain('Se han releído las 3 páginas del archivo entregado y sus metadatos');
    expect(t).toContain('ni el texto que había en las 2 zonas que tachaste');
  });
});

// El informe afirmaba de una pagina CON texto tapada por una imagen que no tenia capa de texto.
describe('imagen a página completa y «sin capa de texto» son dos cosas distintas', () => {
  it('una página tapada por una imagen no se declara «sin capa de texto»', async () => {
    const t = await texto(datos({ paginasImagenCompleta: [2] }));

    expect(t).not.toContain(VERDE_A_SECAS);
    expect(t).toContain('Página 3: una imagen cubre la página');
    expect(t).toContain('Su texto sí se ha comprobado; el contenido de la imagen, no');
    expect(t).not.toContain('Página 3: sin capa de texto');
  });
});

describe('la cobertura lleva SIEMPRE su cifra y su denominador', () => {
  it('imprime las seis filas de cobertura, también las que valen cero', async () => {
    const t = await texto(datos());

    expect(t).toContain('Cobertura de esta comprobación'.toUpperCase());
    expect(t).toContain('Páginas del documento 3');
    expect(t).toContain('Páginas releídas tras el tachado 3');
    expect(t).toContain('Páginas sin capa de texto (no comprobables) 0');
    expect(t).toContain('Páginas con imagen a página completa 0');
    expect(t).toContain('Zonas tachadas 2 en 1 página(s)');
    expect(t).toContain('Tachados sin confirmación posterior 0');
  });

  it('«Ninguna» ya no aparece en el informe: un cero se escribe con su número', async () => {
    const t = await texto(datos());
    expect(t).not.toContain('Ninguna');
    expect(t).not.toContain('Ninguno');
  });

  it('cuando hay páginas afectadas, la cifra va acompañada de la lista', async () => {
    const t = await texto(datos({ paginasSinCapaDeTexto: [0, 2] }));
    expect(t).toContain('Páginas sin capa de texto (no comprobables) 2 · páginas 1, 3');
  });
});

/**
 * EL NUMERADOR DEL MEDIDOR TIENE QUE ESTAR ESCRITO, NO SOLO DIBUJADO.
 *
 * El disco del sello ambar se llena en la proporcion `paginas sin ninguna reserva / paginas del
 * documento`. Hasta el 2026-08-10 ese numerador no se imprimia en ningun sitio: la tabla daba el
 * total, las releidas, las sin capa de texto, las que llevan imagenes… y ninguna era la cifra que
 * el dibujo afirma. O sea que en un producto cuya seccion estrella se titula «Como comprobar este
 * informe», el unico dato que un tercero NO podia contrastar era justamente el que solo existia
 * como dibujo.
 *
 * Estas dos aserciones son las que impiden que el dibujo y el texto deriven: la fila se ata a
 * `coberturaComprobada`, que es la misma funcion que dibuja el aro.
 */
describe('la cifra que dibuja el medidor consta ademas en «Cobertura»', () => {
  it('la fila va pegada al total, para que el par se lea como fraccion', async () => {
    const t = await texto(datos({ paginasConImagen: [1] }));
    expect(t).toContain(
      'Páginas del documento 3 Páginas comprobadas del todo (sin nada fuera de alcance) 2',
    );
  });

  it('el caso corriente: releidas 3 y comprobadas del todo 0 son las dos ciertas', async () => {
    // Un acta de tres paginas con el logo del membrete en todas: se releyo el texto de las tres y
    // en ninguna se llego a todo el contenido. El medidor sale VACIO y la tabla ya no se calla
    // por que.
    const t = await texto(datos({ paginasConImagen: [0, 1, 2] }));
    expect(t).toContain('Páginas comprobadas del todo (sin nada fuera de alcance) 0');
    expect(t).toContain('Páginas releídas tras el tachado 3');
  });

  it.each([
    { nombre: 'sin reservas', over: {} },
    { nombre: 'una imagen', over: { paginasConImagen: [1] } },
    { nombre: 'todas con imagen', over: { paginasConImagen: [0, 1, 2] } },
    { nombre: 'una sin capa de texto', over: { paginasSinCapaDeTexto: [2] } },
    { nombre: 'mezcla', over: { paginasConImagen: [0], unverifiableManualPages: [1] } },
  ])('$nombre: la cifra impresa es la que llena el disco', async ({ over }) => {
    const data = datos(over as Partial<ReportData>);
    const esperada = Math.round(coberturaComprobada(data) * data.totalPaginas);
    const t = await texto(data);
    expect(t).toContain(`Páginas comprobadas del todo (sin nada fuera de alcance) ${esperada}`);
  });
});

describe('el inventario de objetos es una lista FIJA', () => {
  it('las seis categorías salen siempre, con su estado', async () => {
    const t = await texto(datos({ objetos: objetos({ xmp: 'eliminado', adjuntos: 'noHabia' }) }));

    expect(t).toContain('Metadatos Info (Título, Autor, Asunto, Palabras clave, Productor, Creador)');
    expect(t).toContain('Metadatos XMP (documento y páginas)');
    expect(t).toContain('Anotaciones y comentarios');
    expect(t).toContain('Campos de formulario');
    expect(t).toContain('Ficheros adjuntos');
    expect(t).toContain('Marcadores del documento (índice)');
    expect(t).toContain('eliminado del archivo');
    expect(t).toContain('no había');
  });
});

/**
 * G11 · EL VEREDICTO VIAJA CON EL PAPEL.
 *
 * El defecto medido: la pagina 2 del informe que dice TACHADO NO SUPERADO y la pagina 2 del que
 * dice TACHADO VERIFICADO eran el MISMO texto, palabra por palabra. El veredicto vivia solo en la
 * mitad superior de la primera pagina, asi que una hoja suelta —impresa, grapada, archivada o
 * reenviada— no decia si el archivo se podia entregar. Un sello que solo esta en un sitio no es un
 * sello: es un parrafo.
 *
 * Los rotulos van CONGELADOS y ENTEROS: la regla G8 (ningun rotulo es subcadena de otro) es lo que
 * permite que este test distinga los estados, y abreviar el pie a «PARCIAL» la rompe.
 */
describe('G11: el rótulo del estado consta en TODAS las páginas, no solo en la primera', () => {
  const ROTULOS: Record<string, string> = {
    E1: 'TACHADO NO SUPERADO',
    E2: 'SIN COMPROBACIÓN AUTOMÁTICA',
    E3: 'COMPROBACIÓN PARCIAL',
    E4: 'SIN TACHADOS',
    E5: 'TACHADO VERIFICADO',
  };

  const CASOS: { nombre: keyof typeof ROTULOS; data: ReportData }[] = [
    { nombre: 'E1', data: datos({ verify: { clean: false, residues: [] } }) },
    { nombre: 'E2', data: datos({ paginasSinCapaDeTexto: [0, 1, 2] }) },
    { nombre: 'E3', data: datos({ paginasConImagen: [1] }) },
    { nombre: 'E4', data: datos({ boxesPerPage: [] }) },
    { nombre: 'E5', data: datos() },
  ];

  async function porPagina(data: ReportData): Promise<string[]> {
    const doc = await loadPdf(await buildReport(data, COPIA));
    const paginas = doc.extractAllText().map((t) => t.replace(/\s+/g, ' '));
    doc.close();
    return paginas;
  }

  it.each(CASOS)('$nombre imprime su rótulo en cada página', async ({ nombre, data }) => {
    const paginas = await porPagina(data);
    expect(paginas.length).toBeGreaterThan(1);
    for (const [i, texto] of paginas.entries()) {
      expect(texto, `página ${i + 1}`).toContain(ROTULOS[nombre]);
    }
  });

  it('la última página de un informe bloqueado ya NO es igual que la de uno verificado', async () => {
    const bloqueado = await porPagina(datos({ verify: { clean: false, residues: [] } }));
    const verificado = await porPagina(datos());
    const ultimaBloqueado = bloqueado[bloqueado.length - 1] ?? '';
    const ultimaVerificado = verificado[verificado.length - 1] ?? '';

    expect(ultimaBloqueado).not.toBe(ultimaVerificado);
    expect(ultimaBloqueado).toContain('TACHADO NO SUPERADO');
    expect(ultimaVerificado).not.toContain('TACHADO NO SUPERADO');
  });
});

// G9 · lista negra de sobre-afirmacion. Lo que el informe NO puede llegar a decir nunca.
describe('G9: ningún estado del sello sobre-afirma', () => {
  const CASOS: { nombre: string; data: ReportData }[] = [
    { nombre: 'E1', data: datos({ verify: { clean: false, residues: [] } }) },
    { nombre: 'E2', data: datos({ paginasSinCapaDeTexto: [0, 1, 2] }) },
    { nombre: 'E3', data: datos({ paginasSinCapaDeTexto: [1] }) },
    { nombre: 'E4', data: datos({ boxesPerPage: [] }) },
    { nombre: 'E5', data: datos() },
  ];

  const PROHIBIDAS = [
    'documento limpio',
    'sin datos personales',
    'garantiza',
    'anonimiz',
    'certific',
    'rgpd garantizado',
    'inteligencia artificial',
    ' ia ',
    'válido como evidencia',
    'prueba de tachado',
  ];

  it.each(CASOS)('$nombre no contiene ninguna afirmación prohibida', async ({ data }) => {
    const t = (await texto(data)).toLowerCase();
    for (const prohibida of PROHIBIDAS) {
      expect(t, `prohibida: ${prohibida}`).not.toContain(prohibida);
    }
  });

  it.each(CASOS)('$nombre solo nombra «libre de datos personales» para NEGARLO', async ({ data }) => {
    const t = (await texto(data)).toLowerCase();
    let desde = 0;
    let encontrado = false;
    for (;;) {
      const i = t.indexOf('libre de datos personales', desde);
      if (i === -1) break;
      encontrado = true;
      expect(t.slice(Math.max(0, i - 60), i)).toMatch(/\bno\b/);
      desde = i + 1;
    }
    expect(encontrado).toBe(true);
  });
});

// G10 · el alcance no puede encogerse. Sustituye al `toContain(COPIA.alcance)` tautologico.
describe('G10: el alcance enumera, ítem por ítem, lo que NO se ha buscado', () => {
  const ITEMS = [
    // qué se buscó: los siete formatos, por su nombre
    'DNI',
    'NIE',
    'IBAN español',
    'número de la Seguridad Social',
    'teléfono español',
    'referencia catastral',
    'correo electrónico',
    // qué NO se buscó
    'nombres ni apellidos',
    'direcciones postales',
    'firmas',
    'fotografías',
    'matrículas',
    'cuentas extranjeras',
    'contenido visual de las imágenes que no marcaste',
    'sin capa de texto',
    // el límite conocido que no tiene arreglo sin rehacer el motor: se DECLARA
    'el hueco que ocupaba',
    'su anchura se puede medir con exactitud',
    'puede bastar para distinguir cuál era',
    'conviértelo a imagen antes de entregarlo',
    // qué no dice, y cómo lo contrasta un tercero
    'No sustituye a la revisión humana',
    'certutil -hashfile',
    'shasum -a 256',
    'TachadoPDF v',
    'motor mupdf',
  ];

  it.each(ITEMS)('el informe declara «%s»', async (item) => {
    expect(await texto(datos())).toContain(item);
  });
});
