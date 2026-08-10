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

/** Las REGLAS, sin los comentarios. Los comentarios de esta casa hablan de colores y de
 *  espaciados —es su trabajo— y un barrido que los lea denuncia la propia documentacion. */
function reglas(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Valor hexadecimal de un token declarado en la hoja del sistema. */
function tokenDelSistema(nombre: string): string {
  return new RegExp(`--${nombre}:\\s*(#[0-9a-f]{3,8})`, 'i').exec(sistemaFuente())?.[1] ?? '';
}

/**
 * TODOS los tokens que la hoja de la aplicacion o la del sistema usan como COLOR DE TEXTO.
 * Se DERIVAN del CSS; no hay lista escrita a mano. La guarda vieja nombraba tres —`gris`,
 * `enlace` y `tinta-suave`— y da la casualidad de que eran los TRES QUE APROBABAN: el acento
 * (4,10:1 en tres sitios) y el verde (3,30:1 haciendo de ✓, o sea el elemento que dice «esto
 * esta bien») no entraban en el barrido. Un guardian que solo mira lo que ya pasa no guarda.
 */
function tokensDeTexto(): string[] {
  const hojas = reglas(`${cssContent}\n${sistemaFuente()}`);
  const encontrados = new Set<string>();
  for (const m of hojas.matchAll(/(?<![-\w])color:\s*var\(--([\w-]+)\)/g)) {
    if (m[1] !== undefined) encontrados.add(m[1]);
  }
  return [...encontrados].sort();
}

describe('estilo.css', () => {
  /**
   * EL UMBRAL SE COMPRUEBA CONTRA LAS DOS SUPERFICIES QUE EXISTEN, no contra una.
   * La pagina es `--papel` y el panel de trabajo es `--superficie` blanca: un token que aprueba
   * sobre blanco y raspa sobre papel se lee peor justo en la mitad de la pagina que NO es el
   * panel. Se calcula el contraste de verdad; no se comprueba que la cadena este escrita.
   */
  const SUPERFICIES = [
    ['papel', tokenDelSistema('papel')],
    ['superficie', tokenDelSistema('superficie')],
  ] as const;

  /**
   * `--tinta-inversa` es la unica excepcion, y esta AQUI con su motivo en vez de fuera del
   * barrido: es tinta que va ENCIMA de un relleno macizo (el boton que cobra, la banda de E1),
   * asi que no se lee sobre papel y no tiene por que. Se comprueba contra los rellenos sobre los
   * que de verdad se pinta, y con el mismo umbral.
   */
  const INVERSAS: Record<string, string[]> = { 'tinta-inversa': ['tinta', 'acento', 'acento-fuerte', 'rojo'] };

  it('el barrido encuentra los tokens de texto, y son mas de tres', () => {
    // La guarda vieja nombraba tres a mano. Si este numero baja de golpe, alguien ha dejado de
    // usar variables y ha vuelto a escribir colores a mano.
    expect(tokensDeTexto().length).toBeGreaterThanOrEqual(8);
  });

  it.each(tokensDeTexto())('el token --%s se lee a 4,5:1 sobre las dos superficies', (nombre) => {
    const valor = tokenDelSistema(nombre);
    expect(valor, `--${nombre} declarado en hexadecimal en el sistema`).toMatch(/^#[0-9a-f]{6}$/i);

    const fondos = INVERSAS[nombre];
    if (fondos !== undefined) {
      for (const fondo of fondos) {
        expect(
          contraste(valor, tokenDelSistema(fondo)),
          `--${nombre} sobre --${fondo}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      return;
    }

    for (const [nombreSup, superficie] of SUPERFICIES) {
      expect(contraste(valor, superficie), `--${nombre} sobre ${nombreSup}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  /** El contorno de un control es 1.4.11: 3:1 minimo, tambien sobre las dos superficies. */
  it('el borde de control se ve sobre las dos superficies (>= 3:1)', () => {
    const linea = tokenDelSistema('linea-fuerte');
    for (const [nombreSup, superficie] of SUPERFICIES) {
      expect(contraste(linea, superficie), `--linea-fuerte sobre ${nombreSup}`).toBeGreaterThanOrEqual(3);
    }
  });

  /** Blanco sobre el acento macizo: el contraste es SIMETRICO, y el acento viejo (#0284c7) fallaba
   *  en las dos direcciones a la vez —4,10 como texto y 4,10 para el blanco encima—, que es lo que
   *  obligo a inventar un `--enlace` aparte. */
  it('el blanco se lee encima del acento macizo', () => {
    expect(contraste(tokenDelSistema('tinta-inversa'), tokenDelSistema('acento'))).toBeGreaterThanOrEqual(4.5);
  });

  it('hay UN SOLO azul: el acento hace tambien de color de enlace', () => {
    expect(sistemaFuente()).toMatch(/\ba\s*\{\s*color:\s*var\(--acento\)/);
    // Ya no existe un token de enlace aparte (ni un `--acento-oscuro`): habia TRES azules porque
    // el azul elegido no valia como texto. Se comprueba la DECLARACION, no la palabra: el
    // comentario que cuenta por que desaparecio tiene derecho a nombrarlo.
    expect(`${cssContent}\n${sistemaFuente()}`).not.toMatch(/^\s*--enlace:/m);
    expect(`${cssContent}\n${sistemaFuente()}`).not.toMatch(/var\(--enlace\)/);
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
 * LA PRIMERA PANTALLA: GANA LA HERRAMIENTA.
 *
 * Medido con Chrome sobre `dist/` a 390x844, ANTES: la zona de carga empezaba en el pixel 1.734,
 * o sea a 2,05 PANTALLAS de scroll, y por encima del pliegue el unico elemento accionable de la
 * portada era el enlace «English». DESPUES: empieza en el pixel 533 (0,63 pantallas).
 * El criterio de aceptacion de la direccion es «por encima de 600 px a 390x844».
 *
 * Esta guarda es el PROXY de esa medida que si se puede correr sin navegador: fija el ORDEN de la
 * primera pantalla en el HTML, que es lo que de verdad se erosiona (alguien vuelve a subir un
 * parrafo). La medida en pixeles se rehace con Chrome; el orden lo vigila la suite.
 */
describe('la primera pantalla de la portada: primero la herramienta', () => {
  const home = PAGINAS.find((p) => p.id === 'home');

  it.each(localesDe(home ?? PAGINAS[0]!))('en %s, el orden del pliegue es el acordado', (locale) => {
    const html = generarPagina(home ?? PAGINAS[0]!, locale);
    const pos = (aguja: string): number => html.indexOf(aguja);

    // 1 cabecera con la marca · 2 titular · 3 subtitulo · 4 zona de carga · 5 «no sale de tu
    // equipo» · 6 documento de ejemplo · 7 aviso de alcance · 8 y solo entonces, el argumento.
    const orden = [
      'class="cabecera__marca"',
      'class="hero__titular"',
      'class="hero__sub"',
      'id="carga"',
      'class="nota-local"',
      'id="gancho"',
      'class="aviso-principal"',
      '<section class="argumento">',
    ];
    for (const aguja of orden) expect(pos(aguja), `falta ${aguja}`).toBeGreaterThan(-1);
    const posiciones = orden.map(pos);
    expect(posiciones).toEqual([...posiciones].sort((a, b) => a - b));

    // Y NADA de prosa larga por delante de la herramienta: el bloque del dolor (200 palabras) y
    // las vinetas viven por debajo. Antes el bloque rojo se comia el 35,7 % del primer pliegue.
    expect(pos('class="hero__dolor"')).toBeGreaterThan(pos('id="carga"'));
    expect(pos('class="hero__bullets"')).toBeGreaterThan(pos('id="carga"'));
    expect(pos('class="hero__deteccion"')).toBeGreaterThan(pos('id="carga"'));
  });

  it('la mancheta va en las paginas generadas, fuera del hueco de la aplicacion', () => {
    const html = generarPagina(home ?? PAGINAS[0]!, 'es');
    expect(html.indexOf('class="cabecera"')).toBeLessThan(html.indexOf('<div id="app"'));
  });

  /**
   * DIANAS TACTILES. Minimo de la casa 44x44 (WCAG 2.5.8 pide 24; 24 es el suelo absoluto y solo
   * para enlaces dentro de un parrafo). Medido a 390 px antes de esta rama: fallaban por debajo
   * de 24 tres controles en la portada ES y cuatro en la EN, y el peor era el <select> de tipo de
   * documento, a 137x19 px, justo encima de la zona de carga.
   */
  it('todo lo pulsable declara 44 px de alto', () => {
    const PULSABLES = [
      'button',
      'select',
      'input\\[type="text"\\]',
      '\\.comprar',
      '\\.idiomas > \\*',
      '\\.guias a',
      '\\.enlaces-sector a',
      'input\\[type="file"\\]::file-selector-button',
    ];
    for (const selector of PULSABLES) {
      const bloque = new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]*)\\}`, 's').exec(reglas(cssContent))?.[1];
      expect(bloque, `no hay regla para ${selector}`).toBeDefined();
      expect(bloque ?? '', `${selector} sin diana de 44 px`).toMatch(/min-height:\s*2\.75rem/);
    }
  });
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
      ['src/estilo.css', reglas(cssContent)],
      ['src/estilo/sistema.css', reglas(sistemaFuente())],
      ['<style> del comprobador', reglas(generarPagina(PAGINAS[1] ?? PAGINAS[0]!, 'es'))],
    ];
    for (const [nombre, css] of hojas) {
      const literales = [...css.matchAll(/font-size:\s*([^;]+);/g)]
        .map((m) => m[0])
        .filter((decl) => !/var\(--t-\d+\)/.test(decl))
        .filter((decl) => !EXCEPCIONES.some((e) => e.test(decl)));
      expect(literales, `${nombre} escribe tamaños fuera de la escala`).toEqual([]);
    }
  });

  it('el ritmo vertical es una escalera de 4 px y nadie se sale de ella', () => {
    // Medido antes de esta rama sobre la portada construida: VEINTIDOS valores de espaciado
    // distintos y ONCE fuera de cualquier rejilla de 4 px (-4, 9, 11, 12,5, 19,9, 22, 26, 44...).
    // Eso es lo que hace que una pagina con buen contenido se lea como una maqueta.
    const sistema = sistemaFuente();
    const escalera = [...sistema.matchAll(/^\s*(--e-\d+):\s*([\d.]+)rem;/gm)].map(([, n, v]) => ({
      nombre: n ?? '',
      px: Number(v) * 16,
    }));
    expect(escalera.length).toBe(9);
    for (const paso of escalera) {
      expect(paso.px % 4, `${paso.nombre} = ${paso.px}px no cae en la rejilla de 4`).toBe(0);
    }
  });

  /**
   * GUARDA DE SISTEMA. Ningun margin, padding, gap, border-radius ni color de la hoja de la
   * aplicacion puede llevar un valor escrito a mano: o es `var(--...)`, o es 0, o es un
   * porcentaje/auto/inherit. Sin esto, dentro de un mes vuelve a haber once tamaños y veintidos
   * espaciados — que es exactamente de donde viene esta rama.
   */
  it('la hoja de la aplicacion no escribe espaciados, radios ni colores a mano', () => {
    const PROPIEDADES =
      /(?<![-\w])(margin|margin-top|margin-bottom|margin-left|margin-right|padding|padding-top|padding-bottom|padding-left|padding-right|gap|row-gap|column-gap|border-radius|color|background|background-color|border-color)\s*:\s*([^;}]+)[;}]/g;
    const LIBRES = /^(0|none|auto|inherit|initial|transparent|revert|currentcolor)$/i;

    const sospechosos: string[] = [];
    for (const m of reglas(cssContent).matchAll(PROPIEDADES)) {
      const propiedad = m[1] ?? '';
      const valor = (m[2] ?? '').trim();
      const trozos = valor.split(/\s+/).filter((t) => t.length > 0);
      for (const trozo of trozos) {
        if (trozo.startsWith('var(--') || trozo.startsWith('calc(')) continue;
        if (LIBRES.test(trozo)) continue;
        if (/^\d+%$/.test(trozo)) continue;
        // rgba() sobre un token: el relleno translucido del candidato de tachado tiene que dejar
        // ver el dato que hay debajo, y una variable no puede llevar alfa sin duplicar el color.
        if (/^rgba\(/.test(valor) && propiedad === 'background') continue;
        // Las palabras clave de un borde (`1px solid`, `2px dashed`) no son color ni espacio.
        sospechosos.push(`${propiedad}: ${valor}`);
      }
    }
    expect(sospechosos).toEqual([]);
  });

  it('ninguna hoja declara ya su propia pila tipografica', () => {
    // Habia TRES pilas y DOS tamaños base distintos (16/1,6, 16/1,55, 17/1,65). Ahora la
    // tipografia se hereda de `body` y solo el sistema la nombra.
    const fuera = [...reglas(cssContent).matchAll(/font-family:\s*([^;]+);/g)]
      .map((m) => m[1]?.trim() ?? '')
      .filter((v) => !v.startsWith('var(--fuente'));
    expect(fuera).toEqual([]);
  });
});
