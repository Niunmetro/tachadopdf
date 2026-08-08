import { describe, expect, it } from 'vitest';
import {
  LOCALES,
  LOCALE_POR_DEFECTO,
  PAGINAS,
  entradasVite,
  ficheroDe,
  localesDe,
  navHref,
  prefijoDe,
  rutaDe,
  urlCanonica,
} from './registro';
import { esLocale, localeDelDocumento } from './index';

describe('rutas del sitio', () => {
  it('el idioma por defecto vive en la raíz y NO lleva prefijo', () => {
    expect(prefijoDe(LOCALE_POR_DEFECTO)).toBe('');
  });

  it('cada idioma declarado tiene un prefijo distinto de los demás', () => {
    const prefijos = LOCALES.map(prefijoDe);
    expect(new Set(prefijos).size).toBe(prefijos.length);
  });

  it('la portada del idioma por defecto es la raíz del sitio', () => {
    const home = PAGINAS.find((p) => p.id === 'home');
    expect(home).toBeDefined();
    if (home === undefined) return;
    expect(rutaDe(home, LOCALE_POR_DEFECTO)).toBe('');
    expect(urlCanonica(home, LOCALE_POR_DEFECTO)).toBe('https://www.tachadopdf.com/');
    expect(ficheroDe(home, LOCALE_POR_DEFECTO)).toBe('index.html');
  });

  it('ninguna página declara la misma ruta que otra en el mismo idioma', () => {
    for (const locale of LOCALES) {
      const rutas = PAGINAS.map((p) => rutaDe(p, locale)).filter((r): r is string => r !== null);
      expect(new Set(rutas).size).toBe(rutas.length);
    }
  });

  it('toda página existe al menos en un idioma', () => {
    for (const pagina of PAGINAS) {
      expect(localesDe(pagina).length).toBeGreaterThan(0);
    }
  });

  it('las entradas de Vite son exactamente las páginas de destino "entrada"', () => {
    const esperadas = PAGINAS.filter((p) => p.destino === 'entrada').flatMap((p) =>
      localesDe(p).map((l) => ficheroDe(p, l)),
    );
    expect(Object.values(entradasVite()).sort()).toEqual(esperadas.sort());
  });
});

// Un href de navegación que empiece por '/' apunta fuera del sitio cuando la base es
// '/tachadopdf/' — el modo de emergencia, que se usa justo cuando el dominio está caído.
describe('navHref: enlaces relativos AL DOCUMENTO, nunca raíz-absolutos', () => {
  it('desde la raíz baja sin subir niveles', () => {
    expect(navHref('', 'comprobador/')).toBe('comprobador/');
  });

  it('desde un nivel sube uno', () => {
    expect(navHref('comprobador/', '')).toBe('../');
    expect(navHref('comprobador/', 'actas/')).toBe('../actas/');
  });

  it('desde dos niveles sube dos', () => {
    expect(navHref('en/checker/', '')).toBe('../../');
    expect(navHref('en/checker/', 'en/')).toBe('../../en/');
  });

  it('nunca devuelve una cadena vacía ni algo que empiece por "/"', () => {
    for (const desde of ['', 'comprobador/', 'guia/x/', 'en/guide/y/']) {
      for (const hacia of ['', 'comprobador/', 'en/']) {
        const href = navHref(desde, hacia);
        expect(href.length).toBeGreaterThan(0);
        expect(href.startsWith('/')).toBe(false);
      }
    }
  });
});

describe('el idioma se resuelve desde la RUTA (el <html lang> que fija el generador)', () => {
  function docConLang(lang: string): Document {
    return { documentElement: { getAttribute: () => lang } } as unknown as Document;
  }

  it('reconoce cada idioma declarado', () => {
    for (const locale of LOCALES) {
      expect(esLocale(locale)).toBe(true);
      expect(localeDelDocumento(docConLang(locale))).toBe(locale);
    }
  });

  it('acepta variantes regionales quedándose con la base (en-GB -> en)', () => {
    for (const locale of LOCALES) {
      expect(localeDelDocumento(docConLang(`${locale}-XX`))).toBe(locale);
    }
  });

  it('un idioma desconocido cae al idioma por defecto en vez de romper la página', () => {
    expect(esLocale('zz')).toBe(false);
    expect(localeDelDocumento(docConLang('zz'))).toBe(LOCALE_POR_DEFECTO);
    expect(localeDelDocumento(docConLang(''))).toBe(LOCALE_POR_DEFECTO);
  });
});
