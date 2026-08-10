import { describe, expect, it } from 'vitest';
import { CONTENIDOS } from '../content/index';
import { LOCALES } from '../content/registro';

/**
 * EL FAQ TIENE QUE HABLAR DEL ÁMBAR, Y TIENE QUE LLAMARLO COMO LO LLAMA EL PAPEL.
 *
 * Desde que cualquier imagen en una página degrada el sello, el resultado corriente del producto
 * es E3 «COMPROBACIÓN PARCIAL»: 111 de 129 PDF reales llevan alguna imagen, casi siempre el logo
 * del membrete. La web no lo anticipaba. Un comprador que espera un verde y recibe un ámbar
 * escribe a soporte, y con un pago único de 59 € cada correo es pérdida seca sobre un ingreso ya
 * cobrado. El aviso cuesta una vez; el soporte, cada vez.
 *
 * Esta guarda ata DOS SITIOS INDEPENDIENTES: los rótulos que imprime el informe
 * (`CONTENIDOS[locale].informe.sellos`) y los rótulos que el FAQ le promete al comprador. Si
 * alguien renombra un estado del sello y no toca el FAQ, la web pasa a explicar un rótulo que el
 * papel ya no imprime — que es la forma que tiene este producto de mentir sin que nadie mienta.
 */

describe('el FAQ anticipa el ámbar, en los dos idiomas', () => {
  it.each(LOCALES)('%s: hay una pregunta que nombra el rótulo E3 y el E5 del informe', (locale) => {
    const c = CONTENIDOS[locale];
    const e3 = c.informe.sellos.E3;
    const e5 = c.informe.sellos.E5;

    const entrada = c.faq.find((f) => f.pregunta.includes(e3));
    expect(entrada, `ningún FAQ ${locale} pregunta por «${e3}»`).toBeDefined();
    // La respuesta contrasta los dos estados: sin el verde al lado, «parcial» se lee como avería.
    expect(entrada?.respuesta).toContain(e3);
    expect(entrada?.respuesta).toContain(e5);
  });

  it.each(LOCALES)('%s: la respuesta dice que el ámbar es lo NORMAL, no una avería', (locale) => {
    const c = CONTENIDOS[locale];
    const entrada = c.faq.find((f) => f.pregunta.includes(c.informe.sellos.E3));
    // Literales congelados: si la redacción pierde esto, pierde justamente lo que evita el correo
    // de soporte. No se compara contra la propia copia — eso sería compararla consigo misma.
    const esperado =
      locale === 'es'
        ? ['es el resultado normal', 'no significa que algo haya salido mal']
        : ['is the normal result', 'does not mean something went wrong'];
    for (const frase of esperado) expect(entrada?.respuesta).toContain(frase);
  });

  it.each(LOCALES)('%s: y explica POR QUÉ, que es la imagen del membrete', (locale) => {
    const c = CONTENIDOS[locale];
    const entrada = c.faq.find((f) => f.pregunta.includes(c.informe.sellos.E3));
    const motivo = locale === 'es' ? /logo del membrete/ : /letterhead logo/;
    expect(entrada?.respuesta).toMatch(motivo);
  });
});

/**
 * LA AFIRMACIÓN POR CONTRASTE. «El informe gratuito lleva una marca DEMO y no sirve como evidencia
 * archivable» no dice que el de pago sirva: lo INSINÚA, que es peor, porque no se puede citar y se
 * cree igual. Esa construcción se quitó de la marca de agua el 2026-08-08 y sobrevivió cuatro días
 * en el FAQ, que es donde más se lee (se publica además como resultado enriquecido en Google).
 */
describe('ninguna respuesta del FAQ promete valor probatorio, ni por contraste', () => {
  const PROHIBIDAS = [
    /evidencia archivable/i,
    /no sirve como evidencia/i,
    /not meant to be filed/i,
    /valid as evidence/i,
    /válido como (?:evidencia|prueba)/i,
  ];

  it.each(LOCALES)('%s: ninguna respuesta usa una fórmula prohibida', (locale) => {
    for (const entrada of CONTENIDOS[locale].faq) {
      for (const prohibida of PROHIBIDAS) {
        expect(entrada.respuesta, `${entrada.pregunta} · ${prohibida}`).not.toMatch(prohibida);
      }
    }
  });

  // El inglés acotaba el valor probatorio del informe y el español no — o sea que el idioma que
  // más promete («prueba de diligencia», LANDING_SUBTITULO) era el que menos acotaba.
  it.each(LOCALES)('%s: el FAQ acota expresamente el valor probatorio del informe', (locale) => {
    const faq = CONTENIDOS[locale].faq;
    const marca = locale === 'es' ? /prueba legal/i : /legal proof/i;
    const entrada = faq.find((f) => marca.test(f.pregunta));
    expect(entrada, `falta la pregunta del valor probatorio en ${locale}`).toBeDefined();
    const niega = locale === 'es' ? /^No, y no se vende como tal/ : /^No, and it is not sold as one/;
    expect(entrada?.respuesta).toMatch(niega);
  });
});

/**
 * LA REGLA DE REDACCIÓN DEL ÁMBAR (acta del CEO, 2026-08-10; docs/ESTADO.md).
 *
 * Toda redacción del ámbar empieza afirmando lo que SÍ se comprobó y termina acotando lo que no.
 * Si la primera oración de una línea de sello es una limitación, se rechaza la redacción. El
 * motivo es comercial y es honesto a la vez: el ámbar va a ser el 86 % de las entregas, y una
 * línea que abre en negativo convierte el resultado corriente del producto en una disculpa.
 */
describe('las tres líneas del ámbar abren afirmando lo comprobado', () => {
  const AFIRMA = /releíd|re-read/i;
  const ABRE_EN_NEGATIVO = /^\s*(pero|but|no|not|sin|without|nada|nothing)\b/i;

  it.each(LOCALES)('%s: las tres redacciones de E3 empiezan por lo que sí se hizo', (locale) => {
    const copia = CONTENIDOS[locale].informe;
    const lineas = [
      copia.lineaParcial(2, 3, 1),
      copia.lineaParcialSoloImagenes(3, 2),
      copia.lineaParcialSoloObjetos(3),
    ];
    for (const linea of lineas) {
      const primera = linea.split(/(?<=\.)\s/)[0] ?? linea;
      expect(primera, `abre en negativo: «${primera}»`).not.toMatch(ABRE_EN_NEGATIVO);
      expect(primera, `no afirma lo comprobado: «${primera}»`).toMatch(AFIRMA);
    }
  });
});
