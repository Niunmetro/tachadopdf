import * as mupdf from 'mupdf';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { loadPdf } from './engine';
import { processDocument } from './pipeline';

/**
 * EL HUECO DE GLIFOS — un limite CONOCIDO Y DECLARADO, no un falso verde.
 *
 * Al tachar, el texto se elimina de verdad, pero el texto que venia detras NO SE MUEVE: queda un
 * hueco cuya anchura es exactamente la del texto borrado. Es el ataque de arXiv 2206.02285, que
 * des-tacho cientos de PDF reales.
 *
 * NO tiene arreglo razonable con este motor, y esto se ha comprobado, no supuesto:
 *   - mupdf solo ofrece REDACT_TEXT_REMOVE y REDACT_TEXT_NONE. No hay opcion de recomponer.
 *   - Recomponer la linea exigiria reescribir los operadores de posicionamiento (Td/TJ/Tm) de
 *     cada pagina: es rehacer la maquetacion, y romperia tablas y columnas.
 *   - Rellenar el hueco con glifos falsos no quita la fuga: la fuga ES la anchura.
 *   - Rasterizar la pagina si lo cierra, pero destruye la capa de texto — que es justo sobre lo
 *     que se sostiene toda la comprobacion posterior de este producto. Es una decision del
 *     usuario para un documento concreto, y por eso el informe se la propone.
 *
 * Asi que se DECLARA en el informe. Este fichero ata la declaracion a la medida: si algun dia el
 * motor recompone la linea, estos numeros dejan de cuadrar y alguien tendra que venir a cambiar
 * tambien el texto. Un limite declarado que se queda sin su medida vuelve a ser una promesa.
 */

function posiciones(bytes: Uint8Array): { finTitular: number; inicioMadrid: number } {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    const chars: { c: string; x0: number; x1: number }[] = [];
    doc
      .loadPage(0)
      .toStructuredText()
      .walk({
        onChar(c, _origen, _fuente, _tam, quad) {
          chars.push({ c, x0: Math.min(quad[0], quad[6]), x1: Math.max(quad[2], quad[4]) });
        },
      });
    const texto = chars.map((ch) => ch.c).join('');
    const iMadrid = texto.indexOf('Madrid');
    const iFin = texto.indexOf('Titular') + 'Titular'.length - 1;
    const madrid = chars[iMadrid];
    const fin = chars[iFin];
    if (madrid === undefined || fin === undefined) throw new Error('no se encontro el texto guia');
    return { finTitular: fin.x1, inicioMadrid: madrid.x0 };
  } finally {
    doc.destroy();
  }
}

async function documentoConDni(): Promise<{ bytes: Uint8Array; anchura: number }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('Titular 12345678Z Madrid', { x: 50, y: 780, size: 11, font });
  return { bytes: await doc.save(), anchura: font.widthOfTextAtSize(' 12345678Z ', 11) };
}

describe('el hueco que deja el tachado, medido', () => {
  it('el texto posterior no se mueve ni un punto: el hueco vale lo que valía lo borrado', async () => {
    const { bytes, anchura } = await documentoConDni();
    const antes = posiciones(bytes);

    const result = await processDocument({
      bytes,
      fileName: 'titular.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });
    const despues = posiciones(result.cleanedBytes);

    // El dato SI se ha ido del archivo: esto no es un falso verde, es un rastro geometrico.
    const final = await loadPdf(result.cleanedBytes);
    const texto = final.extractAllText().join(' ');
    final.close();
    expect(texto).not.toContain('12345678Z');

    expect(despues.inicioMadrid).toBeCloseTo(antes.inicioMadrid, 2);
    expect(despues.inicioMadrid - despues.finTitular).toBeCloseTo(anchura, 2);
    // 61,765 pt = 55,649 del DNI en Helvetica 11, mas los dos espacios que lo flanqueaban.
    expect(anchura).toBeCloseTo(61.765, 3);
  });

  it('la anchura identifica: veinte nombres de pila dan veinte anchuras distintas', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const nombres = [
      'Antonio', 'Manuel', 'Jose', 'Francisco', 'David', 'Juan', 'Javier', 'Daniel', 'Carlos',
      'Jesus', 'Alejandro', 'Miguel', 'Rafael', 'Pablo', 'Sergio', 'Fernando', 'Jorge', 'Luis',
      'Alberto', 'Alvaro',
    ];
    const anchuras = nombres.map((n) => Math.round(font.widthOfTextAtSize(n, 11) * 1000));
    expect(new Set(anchuras).size).toBe(nombres.length);
  });
});

describe('el informe declara el rastro, con qué hacer al respecto', () => {
  it('lo dice entero: qué queda, qué revela y qué hacer si importa', async () => {
    const { bytes } = await documentoConDni();
    const result = await processDocument({
      bytes,
      fileName: 'titular.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });
    const informe = await loadPdf(result.reportBytes);
    const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
    informe.close();

    expect(texto).toContain('El texto se elimina del archivo, no se tapa');
    expect(texto).toContain('Lo que permanece es el hueco que ocupaba');
    expect(texto).toContain('su anchura sigue indicando cuánto texto había ahí');
    expect(texto).toContain('conviértelo a imagen antes de entregarlo');
  });
});
