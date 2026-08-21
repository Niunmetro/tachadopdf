import { describe, expect, it } from 'vitest';
import { CONTENIDOS } from './index';
import { LOCALE_POR_DEFECTO, LOCALES, type Locale } from './registro';

/**
 * Las claves que FALTAN ya las caza `tsc --noEmit` (`Contenido = typeof es`). Lo que el
 * compilador no puede ver es una clave presente pero vacía, o rellenada pegando la frase
 * española sin traducir. Eso es lo que vigila este test.
 */

type Hoja = { ruta: string; valor: string };

function hojas(valor: unknown, ruta: string[] = []): Hoja[] {
  if (typeof valor === 'string') return [{ ruta: ruta.join('.'), valor }];
  if (typeof valor === 'function') return [];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => hojas(v, [...ruta, String(i)]));
  if (valor !== null && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([k, v]) => hojas(v, [...ruta, k]));
  }
  return [];
}

// Cadenas que DEBEN coincidir entre idiomas: nombres propios y siglas técnicas.
const IGUALDAD_PERMITIDA = new Set([
  'TachadoPDF',
  'Gumroad',
  'PDF',
  'DNI',
  'NIE',
  'IBAN',
  'SHA-256',
  'None',
  'Ninguna',
  'Ninguno',
]);

/**
 * Claves deliberadamente VACÍAS en inglés. Las dos landings de sector son españolas
 * (administradores de fincas, gestorías) y no existen en `/en/`, así que su rótulo no se pinta
 * nunca. Inventarles un texto inglés sería peor: sería una etiqueta para una página que no
 * existe.
 *
 * (Hasta el 2026-08-10 esta nota añadía «además venden un tramo de 149 €/año sin SKU detrás».
 *  Ese tramo se retiró de las dos landings ese día; el motivo para no traducirlas es solo el
 *  primero. La variante sigue viva en Gumroad hasta que el dueño la borre: docs/ESTADO.md.)
 */
const VACIAS_PERMITIDAS = new Set(['legal.enlaceActas', 'legal.enlaceNominas']);

/**
 * Las guías españolas son ficheros estáticos escritos a mano en public/guia/*: de ellas el
 * registro solo usa el id y el rótulo del enlace, así que su `descripcion` y su `cuerpo` están
 * vacíos a propósito (el HTML de esas páginas no lo posee este motor).
 */
function esGuiaEstatica(ruta: string): boolean {
  return /^guias\.\d+\.(descripcion|cuerpo)/.test(ruta);
}

/**
 * Listas cuyo TAMAÑO depende legítimamente del idioma: el FAQ inglés tiene ocho preguntas y el
 * español seis; la landing inglesa lleva un bullet más; y las guías no son traducciones cruzadas.
 * La comparación de forma se hace sobre el resto, y estas se comprueban aparte (no vacías).
 */
const LISTAS_VARIABLES = ['guias.', 'faq.', 'landing.bullets.', 'legal.secciones.'];

function enListaVariable(ruta: string): boolean {
  return LISTAS_VARIABLES.some((prefijo) => ruta.startsWith(prefijo));
}

const otrosIdiomas: Locale[] = LOCALES.filter((l) => l !== LOCALE_POR_DEFECTO);

describe('traducciones completas', () => {
  const base = new Map(hojas(CONTENIDOS[LOCALE_POR_DEFECTO]).map((h) => [h.ruta, h.valor]));

  it('el idioma por defecto no tiene ninguna cadena vacía', () => {
    const vacias = [...base.entries()]
      .filter(([k, v]) => v.trim() === '' && !esGuiaEstatica(k))
      .map(([k]) => k);
    expect(vacias).toEqual([]);
  });

  it.each(otrosIdiomas)('%s: ninguna cadena está vacía', (locale) => {
    const vacias = hojas(CONTENIDOS[locale])
      .filter(
        (h) => h.valor.trim() === '' && !VACIAS_PERMITIDAS.has(h.ruta) && !esGuiaEstatica(h.ruta),
      )
      .map((h) => h.ruta);
    expect(vacias).toEqual([]);
  });

  it.each(LOCALES)('%s: las listas de contenido no están vacías', (locale) => {
    const c = CONTENIDOS[locale];
    expect(c.faq.length).toBeGreaterThan(3);
    expect(c.landing.bullets.length).toBeGreaterThan(2);
    expect(c.guias.length).toBeGreaterThan(0);
    expect(c.legal.secciones.length).toBe(3);
  });

  it.each(otrosIdiomas)('%s: ninguna cadena es idéntica a la española sin traducir', (locale) => {
    const sinTraducir = hojas(CONTENIDOS[locale])
      .filter((h) => {
        const original = base.get(h.ruta);
        if (original === undefined) return false;
        if (h.valor.trim() === '') return false;
        if (IGUALDAD_PERMITIDA.has(h.valor.trim())) return false;
        return h.valor === original;
      })
      .map((h) => h.ruta);
    expect(sinTraducir).toEqual([]);
  });

  it.each(otrosIdiomas)('%s: tiene exactamente la misma forma que el español', (locale) => {
    const rutas = hojas(CONTENIDOS[locale]).map((h) => h.ruta);
    const filtrar = (r: string[]): string[] => r.filter((x) => !enListaVariable(x)).sort();
    expect(filtrar(rutas)).toEqual(filtrar([...base.keys()]));
  });
});

describe('interpolaciones traducidas', () => {
  // Las cadenas con sustitución son FUNCIONES, no plantillas posicionales: TypeScript comprueba
  // la aridad. Lo que queda por comprobar es que devuelven algo que contiene el dato.
  it.each(LOCALES)('%s: las funciones del informe y de la app interpolan sus argumentos', (locale) => {
    const c = CONTENIDOS[locale];
    expect(c.informe.numeroPagina(3, 7)).toContain('3');
    expect(c.informe.numeroPagina(3, 7)).toContain('7');
    expect(c.informe.zonasPagina(2, 5)).toContain('2');
    expect(c.informe.zonasPagina(2, 5)).toContain('5');
    expect(c.informe.noVerificablePagina(4)).toContain('4');
    expect(c.app.cuotaGratis(1, 5, 3)).toContain('1/5');
    expect(c.app.limitePaginas('acta.pdf', 9, 3)).toContain('acta.pdf');
    expect(c.app.tacharTodas('12345678Z', 2)).toContain('12345678Z');
    expect(c.app.destacharTodas('12345678Z', 2)).toContain('12345678Z');
    expect(c.comprobadorUi.veredictoSoloEscaneos(2)).toContain('2');
  });
});
