import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { pdfConEstructura } from '../test/pdf-crudo';
import { loadPdf } from './engine';
import { processDocument } from './pipeline';

/**
 * LA CAPA APAGADA.
 *
 * Un PDF puede llevar el dato DIBUJADO en la pagina, dentro de una capa opcional que el
 * documento declara apagada (`/OCProperties /D /OFF`). `extractText` no lo devuelve: ni el
 * detector ofrecia caja para tacharlo, ni la guarda podia reencontrarlo, y el informe lo firmaba
 * «TACHADO VERIFICADO». En Acrobat se ve con un clic en el panel de capas.
 *
 * Es el peor de la familia de escondites porque el dato no esta en un metadato oscuro: esta en el
 * contenido de la pagina, que es exactamente lo que este producto promete comprobar.
 *
 * El arreglo NO es degradar el sello: es ENCENDER las capas antes de leer, con lo que el dato se
 * detecta, se tacha y se relee como cualquier otro. Y el archivo entregado no cambia de aspecto:
 * el `/OFF` sigue donde estaba.
 */
const DNI = '12345678Z';

function pdfConCapaApagada(): Uint8Array {
  return pdfConEstructura({
    catalogoExtra:
      '/OCProperties << /OCGs [6 0 R] /D << /Order [6 0 R] /OFF [6 0 R] >> >>',
    recursosExtra: '/Properties << /MC0 6 0 R >>',
    contenidoExtra: `/OC /MC0 BDC BT /F1 12 Tf 40 180 Td (DNI: ${DNI}) Tj ET EMC`,
    extras: [{ cuerpo: '<< /Type /OCG /Name (Borrador) >>' }],
  });
}

function bytesLegibles(bytes: Uint8Array): string {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    return Buffer.from(doc.saveToBuffer({ decompress: true }).asUint8Array()).toString('latin1');
  } finally {
    doc.destroy();
  }
}

describe('una capa apagada no es un escondite', () => {
  it('el motor la enciende al abrir, y el texto oculto pasa a ser extraíble', async () => {
    const doc = await loadPdf(pdfConCapaApagada());
    expect(doc.extractText(0)).toContain(DNI);
    doc.close();
  });

  it('el dato de la capa apagada se tacha, no solo se avisa', async () => {
    const resultado = await processDocument({
      bytes: pdfConCapaApagada(),
      fileName: 'nomina.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });

    // El grep va sobre los bytes DESCOMPRIMIDOS: sobre el binario comprimido da falso negativo.
    expect(bytesLegibles(resultado.cleanedBytes)).not.toContain(DNI);
    expect(resultado.verify.clean).toBe(true);
  });

  it('y el archivo entregado se sigue viendo como su autor lo dejó: la capa sigue apagada', async () => {
    const resultado = await processDocument({
      bytes: pdfConCapaApagada(),
      fileName: 'nomina.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });

    const doc = new mupdf.PDFDocument(resultado.cleanedBytes.slice());
    try {
      expect(doc.countLayers()).toBe(1);
      expect(doc.isLayerVisible(0)).toBe(false);
    } finally {
      doc.destroy();
    }
  });

  it('si el borrado fallara, la guarda lo reencuentra y bloquea (las dos mitades)', async () => {
    // Se comprueba sobre la MISMA lectura que usa la verificacion: si un dia dejara de
    // encenderse la capa, este texto volveria a ser invisible y el bloqueo no llegaria.
    const doc = await loadPdf(pdfConCapaApagada());
    const textos = doc.extractAllText();
    doc.close();
    expect(textos.join(' ')).toContain(DNI);
  });
});
