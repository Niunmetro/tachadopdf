import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { pdfConTexto } from '../test/fixtures';
import { pdfCrudo, type ObjetoCrudo } from '../test/pdf-crudo';
import { loadPdf, MIN_RACHA_ILEGIBLE } from './engine';
import { processDocument } from './pipeline';

/**
 * EL `/ToUnicode` QUE MIENTE.
 *
 * Un PDF puede DIBUJAR `12345678Z` y declarar a la vez que esos codigos significan otra cosa. Es
 * el defecto mas comun del mundo PDF —el «copio de un PDF y sale basura»— y no hace falta mala fe
 * para producirlo: lo genera cualquier subconjunto de fuente mal hecho.
 *
 * El humano lee lo que se dibuja; el detector y la guarda leen lo que dice el `/ToUnicode`. Asi
 * que ese DNI no se detectaba, no se tachaba, no se reencontraba, y el informe firmaba «TACHADO
 * VERIFICADO» con el dato a tamaño de titular en el archivo entregado.
 *
 * Prevalencia real, medida sobre 2.125 paginas de PDF del disco: 13 dibujan texto y no extraen
 * nada; 11 pasan del 10 % de caracteres no mapeables; 8 ficheros afectados. Uno de cada 37.
 *
 * No tiene arreglo por deteccion —no se puede adivinar el caracter que el fichero se niega a
 * declarar— asi que lo que hace la herramienta es MEDIRLO y decirlo: la pagina deja de contar
 * como comprobada y el informe la nombra con el numero de caracteres afectados.
 */
const DNI = '12345678Z';

/** CMap que declara que los digitos y la Z son caracteres de uso privado (U+E0xx). */
function cmapMentiroso(): string {
  const pares: string[] = [];
  for (let c = 0x30; c <= 0x39; c++) {
    pares.push(`<${c.toString(16).padStart(2, '0')}> <${(0xe000 + c).toString(16).padStart(4, '0')}>`);
  }
  pares.push('<5a> <e05a>');
  return (
    '/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n' +
    '/CMapName /Roto def /CMapType 2 def\n' +
    '1 begincodespacerange <00> <ff> endcodespacerange\n' +
    `${pares.length} beginbfchar\n${pares.join('\n')}\nendbfchar\n` +
    'endcmap CMapName currentdict /CMap defineresource pop end end'
  );
}

/** `texto` se dibuja con la fuente que miente; el resto de la pagina, con una normal. */
function pdfConToUnicodeRoto(texto: string): Uint8Array {
  const objetos: ObjetoCrudo[] = [
    { cuerpo: '<< /Type /Catalog /Pages 2 0 R >>' },
    { cuerpo: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    {
      cuerpo:
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 260] /Contents 4 0 R ' +
        '/Resources << /Font << /F1 5 0 R /F2 7 0 R >> >> >>',
    },
    {
      cuerpo: '<< >>',
      stream:
        'BT /F2 13 Tf 40 210 Td (NOMINA - JULIO 2026) Tj ET\n' +
        'BT /F2 12 Tf 40 180 Td (Contacto: gestoria@ejemplo.es) Tj ET\n' +
        'BT /F2 12 Tf 40 120 Td (DNI: ) Tj ET\n' +
        `BT /F1 12 Tf 70 120 Td (${texto}) Tj ET`,
    },
    {
      cuerpo:
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding /ToUnicode 6 0 R >>',
    },
    { cuerpo: '<< >>', stream: cmapMentiroso() },
    { cuerpo: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>' },
  ];
  return pdfCrudo(objetos);
}

async function textoDelInforme(bytes: Uint8Array): Promise<string> {
  const resultado = await processDocument({
    bytes,
    fileName: 'nomina.pdf',
    freeVersion: false,
    manual: [],
    copia: es.informe,
  });
  const informe = await loadPdf(resultado.reportBytes);
  const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
  informe.close();
  return texto;
}

describe('el punto ciego, medido', () => {
  it('el DNI se dibuja y NO sale por el texto extraíble: el detector no puede verlo', async () => {
    const doc = await loadPdf(pdfConToUnicodeRoto(DNI));
    expect(doc.extractText(0)).not.toContain(DNI);
    expect(doc.extractText(0)).toContain('NOMINA');
    doc.close();
  });

  it('el motor SÍ sabe contar los caracteres que no puede releer', async () => {
    const doc = await loadPdf(pdfConToUnicodeRoto(DNI));
    expect(doc.pagesWithUnreadableText()).toEqual([{ page: 0, caracteres: DNI.length }]);
    doc.close();
  });
});

describe('lo que no se puede releer, no se declara comprobado', () => {
  it('el sello baja a COMPROBACIÓN PARCIAL y deja de decir VERIFICADO', async () => {
    const texto = await textoDelInforme(pdfConToUnicodeRoto(DNI));

    expect(texto).not.toContain('VERIFICADO');
    expect(texto).toContain('COMPROBACIÓN PARCIAL');
  });

  it('el informe nombra la página y CUÁNTOS caracteres son', async () => {
    const texto = await textoDelInforme(pdfConToUnicodeRoto(DNI));

    expect(texto).toContain('Páginas con texto dibujado que no se puede releer 1 · páginas 1');
    expect(texto).toContain('Página 1: hay 9 caracteres dibujados en la página');
    expect(texto).toContain('la detección automática no los alcanza');
  });

  // La linea del sello enumera las reservas. Si esta reserva no esta en la enumeracion, el lector
  // lee una lista que no incluye el motivo por el que su documento esta en ambar.
  it('la línea del sello enumera esta reserva junto a las demás', async () => {
    const texto = await textoDelInforme(pdfConToUnicodeRoto(DNI));
    expect(texto).toContain('las que dibujan texto que no se puede releer');
  });

  it('un documento normal no se marca: la cifra es 0 y no hay lista', async () => {
    const texto = await textoDelInforme(await pdfConTexto('Acta normal: gestoria@ejemplo.es'));

    expect(texto).toContain('Páginas con texto dibujado que no se puede releer 0');
    expect(texto).not.toContain('caracteres dibujados en la página');
  });
});

/**
 * El umbral no es una cifra al gusto: el dato mas corto que busca esta herramienta son SEIS
 * caracteres (`a@b.co`), asi que en una racha mas corta no cabe ninguno de los formatos
 * declarados, y un simbolo suelto de una fuente rara —una viñeta, una ligadura— no tiene por que
 * degradar el sello de nadie. Medido sobre 665 paginas reales: contando glifos sueltos se
 * marcarian 27 paginas; contando rachas de cuatro, 9.
 */
describe('el umbral de la racha, y su porqué', () => {
  it('cuatro es menor que el dato más corto que la herramienta busca (a@b.co, seis)', () => {
    expect(MIN_RACHA_ILEGIBLE).toBeLessThan('a@b.co'.length);
  });

  it('una racha más corta que el umbral no degrada nada', async () => {
    const doc = await loadPdf(pdfConToUnicodeRoto('12'));
    expect(doc.pagesWithUnreadableText()).toEqual([]);
    doc.close();
  });

  it('una racha justo del tamaño del umbral sí cuenta', async () => {
    const doc = await loadPdf(pdfConToUnicodeRoto('1234'));
    expect(doc.pagesWithUnreadableText()).toEqual([{ page: 0, caracteres: MIN_RACHA_ILEGIBLE }]);
    doc.close();
  });
});
