import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { loadPdf } from '../pdf/engine';
import { processDocument } from '../pdf/pipeline';
import { pdfCrudo, type ObjetoCrudo } from '../test/pdf-crudo';
import { detect } from './patterns';

/**
 * ONCE FORMAS DE ESCRIBIR UN DNI QUE EL DETECTOR NO VEIA.
 *
 * `SEP` solo admitia separador en las fronteras 2-3-3-1 y solo espacio, punto o guion ASCII. Pero
 * mupdf mete un espacio EL SOLO cuando el hueco entre dos glifos es grande: basta un kern de 400
 * milesimas de em, o que el maquetador haya espaciado las letras, para que el texto extraible sea
 * `1234 5678Z` o `1 2 3 4 5 6 7 8 Z`. Y Word escribe raya corta en cuanto alguien teclea dos
 * guiones. Medido: con cualquiera de esas formas el detector no enganchaba, la herramienta no
 * ofrecia caja, la guarda no lo reencontraba, y el sello salia VERDE con el DNI entero en el
 * texto del archivo entregado.
 *
 * El coste del arreglo, medido sobre 277 PDF reales del disco ANTES de aceptarlo: 2 hallazgos
 * nuevos en total, los dos IBAN con los puntos en sitios raros — es decir, aciertos. Ni un DNI,
 * NIE o NUSS de mas. El digito de control es lo que hace que ampliar las posiciones no sea un
 * coladero, y por eso el telefono y la referencia catastral se quedan como estaban.
 */
const CANONICO = '12345678Z';

describe('el mismo DNI, escrito de once maneras', () => {
  const FORMAS = [
    ['sin separadores', '12345678Z'],
    ['puntos y guion', '12.345.678-Z'],
    ['raya corta tipográfica', '12.345.678–Z'],
    ['raya larga tipográfica', '12.345.678—Z'],
    ['guion no separable', '12.345.678‑Z'],
    ['espacio duro', '12 345 678 Z'],
    ['espacio fino', '12 345 678 Z'],
    ['espacio cada dos cifras', '12 34 56 78 Z'],
    ['un espacio en medio (kern de mupdf)', '1234 5678Z'],
    ['un espacio por carácter', '1 2 3 4 5 6 7 8 Z'],
    ['minúscula', '12345678z'],
  ] as const;

  it.each(FORMAS)('%s', (_nombre, escritura) => {
    const hits = detect(`DNI: ${escritura} del titular`);
    expect(hits.map((h) => h.kind)).toContain('dni');
  });
});

/**
 * EL LIMITE DE LA AMPLIACION, dicho con lo que de verdad lo sostiene.
 *
 * Lo que impide que «un separador en cualquier posicion» sea un coladero NO es la forma: es el
 * DIGITO DE CONTROL. Ocho cifras sueltas de una tabla seguidas de una letra aislada aciertan la
 * letra una vez de cada 23, y esa es toda la exposicion que se acepta. Por eso la ampliacion
 * llega a los cuatro patrones que llevan control y no a la referencia catastral, que son veinte
 * alfanumericos sin nada con que descartarse.
 *
 * Coste real, medido sobre 277 PDF del disco antes de aceptarlo: cero hallazgos nuevos de DNI,
 * NIE o NUSS. Los dos unicos hallazgos nuevos fueron IBAN con los puntos en sitios raros.
 */
describe('el límite de la ampliación, y qué lo sostiene', () => {
  it('el dígito de control es el cortafuegos: la misma forma con la letra que no toca no se detecta', () => {
    expect(detect('Ref 00 1912 33 B').map((h) => h.kind)).toContain('dni');
    expect(detect('Ref 00 1912 33 A').map((h) => h.kind)).not.toContain('dni');
    expect(detect('Ref 00 1912 33 C').map((h) => h.kind)).not.toContain('dni');
  });

  it('la referencia catastral NO se amplía: no tiene con qué descartarse', () => {
    // La misma referencia, valida cuando va seguida, deja de reconocerse si lleva separadores:
    // veinte alfanumericos con espacios los fabrica cualquier tabla.
    expect(detect('9872023VH5797S0001WX').map((h) => h.kind)).toContain('catastro');
    expect(detect('9872 023V H579 7S00 01WX').map((h) => h.kind)).not.toContain('catastro');
  });

  it('el teléfono ya admitía separador en cualquier posición ANTES de esto: no se ha tocado', () => {
    // Se deja constancia del comportamiento heredado para que no parezca efecto de este cambio.
    expect(detect('6 1 2 3 4 5 6 7 8').map((h) => h.kind)).toContain('telefono');
  });
});

/**
 * El fin de la cadena, no solo el detector: que se DETECTE no sirve de nada si luego no se puede
 * localizar la caja para tacharlo. Se comprueba de punta a punta sobre un PDF que dibuja el DNI
 * con un kern en medio — el caso que produce mupdf solo, sin que nadie lo busque.
 */
describe('detectar no basta: hay que poder tacharlo', () => {
  function pdfConKern(): Uint8Array {
    const objetos: ObjetoCrudo[] = [
      { cuerpo: '<< /Type /Catalog /Pages 2 0 R >>' },
      { cuerpo: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      {
        cuerpo:
          '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 200] /Contents 4 0 R ' +
          '/Resources << /Font << /F1 5 0 R >> >> >>',
      },
      {
        cuerpo: '<< >>',
        stream:
          'BT /F1 12 Tf 40 150 Td (Nomina julio 2026) Tj ET\n' +
          'BT /F1 12 Tf 40 120 Td [(DNI: 1234) -400 (5678Z)] TJ ET',
      },
      { cuerpo: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>' },
    ];
    return pdfCrudo(objetos);
  }

  it('el texto extraíble lleva un espacio que nadie escribió', async () => {
    const doc = await loadPdf(pdfConKern());
    expect(doc.extractText(0)).toContain('1234 5678Z');
    expect(doc.extractText(0)).not.toContain(CANONICO);
    doc.close();
  });

  it('se detecta, se tacha y el archivo entregado ya no lo lleva', async () => {
    const resultado = await processDocument({
      bytes: pdfConKern(),
      fileName: 'nomina.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });

    const doc = await loadPdf(resultado.cleanedBytes);
    const texto = doc.extractAllText().join(' ');
    doc.close();

    expect(texto).not.toContain('1234 5678Z');
    expect(texto.replace(/[^0-9A-Za-z]/g, '')).not.toContain(CANONICO);
    expect(resultado.verify.clean).toBe(true);
    expect(resultado.boxesPerPage.reduce((t, b) => t + b.count, 0)).toBeGreaterThan(0);
  });
});

/**
 * El nombre del fichero se imprime DENTRO del informe, que es el entregable. `nombreSinDatos` usa
 * el mismo `detect`, asi que heredaba el punto ciego: `nomina-1234 5678Z.pdf` volvia a publicar
 * el DNI que se acababa de tachar.
 */
describe('el nombre del fichero hereda el arreglo', () => {
  it.each(['nomina-12345678Z.pdf', 'nomina-1234 5678Z.pdf', 'nomina-12 34 56 78 Z.pdf'])(
    '%s: el DNI se detecta dentro del nombre',
    (nombre) => {
      expect(detect(nombre).map((h) => h.kind)).toContain('dni');
    },
  );
});
