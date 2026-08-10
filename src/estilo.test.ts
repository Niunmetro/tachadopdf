import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MARCA_RUTA, enlacePreloadFuente, sistemaCss, sistemaFuente } from './estilo/sistema';
import { generarPagina } from './content/generar';
import { PAGINAS, localesDe, navHref, rutaDe } from './content/registro';

/** Contraste WCAG de dos colores `#rrggbb`. */
function contraste(a: string, b: string): number {
  const luz = (hex: string): number => {
    const canal = (i: number): number => {
      const v = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
  };
  const [x, y] = [luz(a), luz(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const cssPath = join(__dirname, 'estilo.css');
const cssContent = readFileSync(cssPath, 'utf-8');

describe('estilo.css', () => {
  /**
   * UN GRIS DE TEMA OSCURO SOBRE FONDO BLANCO. `--gris` era #94a3b8 —2,56:1 sobre blanco— y le
   * habia tocado, por casualidad, a las dos frases que peor pueden faltar: la que le dice al
   * visitante «esto es para ti» y la que sostiene la promesa central del producto (que el archivo
   * no sale del navegador) junto con la licencia. `--enlace` no existia: donde no habia regla, el
   * navegador ponia su #0000EE por defecto.
   *
   * Las superficies de esta hoja son TODAS claras, asi que el umbral se comprueba contra blanco.
   */
  const BLANCO = '#ffffff';
  const token = (nombre: string): string =>
    new RegExp(`--${nombre}:\\s*(#[0-9a-f]{6})`, 'i').exec(cssContent)?.[1] ?? '';

  it.each([
    ['gris', 4.5],
    ['enlace', 4.5],
    ['tinta-suave', 4.5],
  ])('el token --%s se lee sobre blanco (>= %s:1)', (nombre, minimo) => {
    const valor = token(nombre);
    expect(valor, `--${nombre} declarado en hexadecimal`).toMatch(/^#[0-9a-f]{6}$/i);
    expect(contraste(valor, BLANCO)).toBeGreaterThanOrEqual(minimo);
  });

  it('hay un color de enlace propio y se aplica a TODOS los enlaces sin clase', () => {
    expect(cssContent).toMatch(/\ba\s*\{\s*color:\s*var\(--enlace\)/);
  });

  it('debe contener flex-wrap y gap en .tachar-todas', () => {
    const tachadaTodasRegex = /\.tachar-todas\s*\{[^}]*flex-wrap[^}]*\}|\.tachar-todas\s*\{[^}]*gap[^}]*\}/;
    const hasFlexWrap = /\.tachar-todas\s*\{[^}]*flex-wrap[^}]*\}/s.test(cssContent);
    const hasGap = /\.tachar-todas\s*\{[^}]*gap[^}]*\}/s.test(cssContent);

    expect(hasFlexWrap).toBe(true);
    expect(hasGap).toBe(true);
  });

  /**
   * ESTA GUARDA ESTABA AL REVES Y FIJABA EL DEFECTO. Exigia `text-overflow: ellipsis` con
   * `white-space: nowrap` y `max-width: 300px`, que es exactamente lo que recortaba el boton: los
   * 33 primeros caracteres de los nueve botones son identicos («Tachar todas las apariciones de
   * «») y lo unico que los distingue —el valor— va al final. Medido en la pantalla: en escritorio
   * sobrevivian tres caracteres («12.3…», «ES9…», «876…») y en el movil UNO («1…», «E…», «8…»).
   * Nueve barras negras indistinguibles en la pantalla donde se decide que se tacha.
   *
   * La regla correcta es la contraria: ese boton AJUSTA en varias lineas y no se recorta.
   */
  it('el botón de tachar todas las apariciones no recorta el valor', () => {
    const bloque = /\.tachar-todas\s+button\s*\{([^}]*)\}/s.exec(cssContent)?.[1] ?? '';

    expect(bloque).not.toBe('');
    expect(bloque).not.toMatch(/text-overflow\s*:\s*ellipsis/);
    expect(bloque).not.toMatch(/white-space\s*:\s*nowrap/);
    expect(bloque).toMatch(/white-space\s*:\s*normal/);
  });

  /**
   * `.hit-box` y `.hit-box--selected` no tenian NI UNA regla, asi que las detecciones heredaban el
   * estilo global de `button` (navy macizo, esquinas redondeadas): identicas a un tachado ya
   * consumado, dibujadas antes de tachar nada, y una elegida indistinguible de una sin elegir.
   */
  it('una detección sin elegir y una elegida se dibujan distinto, y ninguna como un tachado hecho', () => {
    const sinElegir = /button\.hit-box\s*\{([^}]*)\}/s.exec(cssContent)?.[1] ?? '';
    const elegida = /button\.hit-box--selected\s*\{([^}]*)\}/s.exec(cssContent)?.[1] ?? '';

    expect(sinElegir).toMatch(/border\s*:[^;]*dashed/);
    expect(elegida).toMatch(/border\s*:[^;]*solid/);
    expect(elegida).toMatch(/background\s*:\s*var\(--tinta\)/);
    // El candidato deja ver el dato que hay debajo: su relleno es translucido.
    expect(sinElegir).toMatch(/background\s*:\s*rgba\(/);
  });
});

/**
 * LA TIPOGRAFIA AUTO-ALOJADA Y SU JAULA.
 *
 * La CSP declara `font-src 'self'` y hasta esta rama ese permiso estaba VACIO: la hoja pedia
 * "Segoe UI" y la letra del producto era la que hubiera en la maquina del visitante. Auto-alojar
 * es la unica forma de estrenar tipografia sin tocar la CSP, y trae dos trampas que estos tests
 * cierran:
 *
 *  1. El 404 SILENCIOSO. Dieciseis de las dieciocho paginas llevan su CSS dentro de un <style>,
 *     y ahi las URL se resuelven contra EL DOCUMENTO. Un `url(fuentes/...)` escrito una sola vez
 *     sirve la fuente en la portada y da 404 en /guia/loquesea/ — sin ruido, sin error de
 *     consola visible, y con la portada en Plex y las guias en la letra del sistema. Por eso la
 *     ruta lleva el prefijo de profundidad de cada pagina.
 *  2. LA BASE DE EMERGENCIA. Una ruta raiz-absoluta (/fuentes/...) apunta fuera del sitio bajo
 *     base '/tachadopdf/', que es justo el modo pensado para cuando el dominio se cae.
 */
describe('la tipografia se sirve desde el propio repositorio', () => {
  const RAIZ = resolve(__dirname, '..');
  const FICHEROS = [
    'public/fuentes/ibm-plex-sans/ibm-plex-sans-latin-wght-normal.woff2',
    'public/fuentes/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2',
  ];

  it.each(FICHEROS)('%s existe en el repositorio', (ruta) => {
    expect(existsSync(join(RAIZ, ruta))).toBe(true);
  });

  /** Cada kilobyte lo paga el visitante y este producto presume de ligero: el tope es explicito.
   *  Medido hoy: 45.712 B el sans variable y 14.708 B el mono. */
  it('las dos familias juntas no pasan de 64 kB', () => {
    const total = FICHEROS.reduce((suma, ruta) => suma + statSync(join(RAIZ, ruta)).size, 0);
    expect(total).toBeLessThanOrEqual(64 * 1024);
  });

  /** La OFL 1.1 exige que la licencia viaje CON la fuente. Sin este fichero, publicar el .woff2
   *  es una infraccion de licencia en un producto que se vende como diligente. */
  it.each(['ibm-plex-sans', 'ibm-plex-mono'])('%s viaja con su licencia OFL', (familia) => {
    const ofl = readFileSync(join(RAIZ, 'public', 'fuentes', familia, 'OFL.txt'), 'utf-8');
    expect(ofl).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(ofl).toContain('Copyright');
  });

  it('el sistema declara las dos familias con font-display: optional', () => {
    const sistema = sistemaFuente();
    const caras = [...sistema.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1] ?? '');
    expect(caras.length).toBe(2);
    for (const cara of caras) {
      // `swap` mueve el titular debajo de los ojos de quien ya esta leyendo; `optional` no.
      expect(cara).toMatch(/font-display:\s*optional/);
      expect(cara).not.toMatch(/font-display:\s*(swap|fallback|block)/);
      expect(cara).toContain(MARCA_RUTA);
    }
  });

  it('la fuente del sistema NO trae rutas ya resueltas ni absolutas', () => {
    const sistema = sistemaFuente();
    expect(sistema).not.toMatch(/url\(["']?\//);
    expect(sistema).not.toMatch(/url\(["']?https?:/);
  });

  /**
   * TRAMPA MEDIDA, no supuesta. `sangrar()` deja de sangrar en cuanto ve un `<pre` y no vuelve
   * a sangrar hasta el `</pre>`, porque dentro de un bloque preformateado los espacios son
   * CONTENIDO (ahi se publica el Aviso Legal). Un `<pre` escrito dentro de un COMENTARIO de la
   * hoja del sistema —cosa facil: la hoja habla de los bloques legales— desactiva la sangria del
   * resto del <head> de las dieciocho paginas. Costo una vuelta encontrarlo; que no cueste dos.
   */
  it('la hoja del sistema no nombra un <pre, que desactivaria la sangria del head', () => {
    expect(sistemaFuente()).not.toContain('<pre');
  });

  it('sistemaCss sustituye la marca por el prefijo de la pagina', () => {
    const raiz = sistemaCss('./');
    expect(raiz).not.toContain(MARCA_RUTA);
    expect(raiz).toContain('url("./fuentes/ibm-plex-sans/ibm-plex-sans-latin-wght-normal.woff2")');
    expect(sistemaCss('../../../')).toContain('url("../../../fuentes/ibm-plex-mono/');
  });

  /**
   * LO QUE SE REVISA Y LO QUE SE PUBLICA NO PESAN LO MISMO. Los comentarios de esta casa son
   * largos a proposito —son la memoria de por que cada decision es la que es— pero el bloque del
   * sistema va incrustado en las DIECIOCHO paginas: publicarlos seria cobrarle al visitante, en
   * cada visita y en cada pagina, una explicacion escrita para quien revisa el repositorio.
   * Medido: 8,0 kB documentado frente a 1,1 kB de reglas.
   */
  it('lo que se publica son las reglas, no los comentarios, y cabe en 2 kB', () => {
    const publicado = sistemaCss('./');
    expect(publicado).not.toContain('/*');
    expect(publicado).not.toContain('*/');
    expect(Buffer.byteLength(publicado, 'utf-8')).toBeLessThanOrEqual(2048);
    // Y aun asi lleva TODO lo que importa: las dos caras y los siete pasos de la escala.
    expect([...publicado.matchAll(/@font-face/g)].length).toBe(2);
    expect([...publicado.matchAll(/--t-\d00:/g)].length).toBe(7);
  });

  /** El preload es lo que hace que la ventana de bloqueo de `optional` baste casi siempre.
   *  `crossorigin` es OBLIGATORIO aunque el fichero sea nuestro: sin el, doble descarga. */
  it('el preload es del sans, y solo del sans, y va en modo CORS', () => {
    const enlace = enlacePreloadFuente('./');
    expect(enlace).toContain('rel="preload"');
    expect(enlace).toContain('as="font"');
    expect(enlace).toContain('type="font/woff2"');
    expect(enlace).toContain('crossorigin');
    expect(enlace).toContain('ibm-plex-sans');
    expect(enlace).not.toContain('ibm-plex-mono');
  });
});

/**
 * LA TRAMPA MEDIDA: la tipografia tiene que llegar a las paginas que NO enlazan hoja externa.
 * Este test recorre TODAS las paginas generadas y comprueba que cada una pide la fuente por una
 * ruta que, resuelta contra su propia URL, cae en la raiz del sitio.
 */
describe('todas las paginas generadas reciben el sistema, con SU ruta', () => {
  const generadas = PAGINAS.filter((p) => p.origen === 'generado').flatMap((p) =>
    localesDe(p).map((l) => ({ pagina: p, locale: l, ruta: rutaDe(p, l) ?? '' })),
  );

  it('el barrido ve las diez paginas generadas', () => {
    expect(generadas.length).toBe(10);
  });

  it.each(generadas.map((g) => [`${g.ruta || '/'} (${g.locale})`, g] as const))(
    '%s incrusta los tokens y precarga el sans con su prefijo',
    (_nombre, g) => {
      const html = generarPagina(g.pagina, g.locale);
      const prefijo = navHref(g.ruta, '');
      // El generador sangra el <head> dos niveles; los bytes del sistema son los mismos.
      const sinSangria = html
        .split('\n')
        .map((linea) => linea.replace(/^ {4}/, ''))
        .join('\n');

      expect(sinSangria).toContain(sistemaCss(prefijo));
      expect(html).toContain(enlacePreloadFuente(prefijo));
      expect(html).not.toContain(MARCA_RUTA);

      // La profundidad del prefijo tiene que ser la de la pagina: ni una barra de menos.
      const niveles = g.ruta.split('/').filter((s) => s.length > 0).length;
      expect(prefijo).toBe(niveles === 0 ? './' : '../'.repeat(niveles));

      // Y el bloque del sistema va ANTES que el <style> propio de la pagina: los tokens se
      // declaran primero y lo de la pagina manda encima.
      const iSistema = html.indexOf('--fuente:');
      const iPropio = html.indexOf('<style>', iSistema + 1);
      if (iPropio > -1) expect(iSistema).toBeLessThan(iPropio);
    },
  );
});

/**
 * LA ESCALA ES CERRADA: si un tamaño no esta en la tabla, no existe.
 * Antes de esta rama la portada usaba ONCE tamaños distintos y nueve cabian en 4,5 px, con
 * saltos de x1,03: el ojo no distingue 13,5 de 14, asi que la pagina no tenia jerarquia, tenia
 * textura. Esta guarda barre la hoja de la aplicacion Y los <style> incrustados del generador.
 */
describe('la escala tipografica es cerrada', () => {
  const PASOS = ['--t-100', '--t-200', '--t-300', '--t-400', '--t-500', '--t-600', '--t-700'];

  it('el sistema declara los siete pasos y ninguno mas', () => {
    const sistema = sistemaFuente();
    const declarados = [...sistema.matchAll(/^\s*(--t-\d+):/gm)].map((m) => m[1]);
    expect(declarados).toEqual(PASOS);
  });

  it('los pasos van en rem, no en px: un navegador con la letra subida tiene que obedecer', () => {
    const sistema = sistemaFuente();
    for (const paso of PASOS) {
      const valor = new RegExp(`${paso}:\\s*([^;]+);`).exec(sistema)?.[1] ?? '';
      expect(valor, `${paso} declarado`).not.toBe('');
      expect(valor, `${paso} no va en px`).not.toMatch(/\d+px/);
      expect(valor).toMatch(/rem/);
    }
  });

  /** HOY NO HAY NINGUNA EXCEPCION, y por eso la lista esta vacia y no ausente. El dia que haga
   *  falta una, se escribe AQUI con su motivo; jamas se saca un fichero del barrido. Es la
   *  doctrina que costo el fallo entero de precios: una excepcion a un guardian sobrevive a la
   *  razon que la creo. */
  const EXCEPCIONES: RegExp[] = [];

  it('ni la hoja de la aplicacion ni los <style> del generador escriben un tamaño a mano', () => {
    const hojas: [string, string][] = [
      ['src/estilo.css', cssContent],
      ['src/estilo/sistema.css', sistemaFuente()],
      ['<style> del comprobador', generarPagina(PAGINAS[1] ?? PAGINAS[0]!, 'es')],
    ];
    for (const [nombre, css] of hojas) {
      const literales = [...css.matchAll(/font-size:\s*([^;]+);/g)]
        .map((m) => m[0])
        .filter((decl) => !/var\(--t-\d+\)/.test(decl))
        .filter((decl) => !EXCEPCIONES.some((e) => e.test(decl)));
      expect(literales, `${nombre} escribe tamaños fuera de la escala`).toEqual([]);
    }
  });

  it('ninguna hoja declara ya su propia pila tipografica', () => {
    // Habia TRES pilas y DOS tamaños base distintos (16/1,6, 16/1,55, 17/1,65). Ahora la
    // tipografia se hereda de `body` y solo el sistema la nombra.
    const fuera = [...cssContent.matchAll(/font-family:\s*([^;]+);/g)]
      .map((m) => m[1]?.trim() ?? '')
      .filter((v) => !v.startsWith('var(--fuente'));
    expect(fuera).toEqual([]);
  });
});
