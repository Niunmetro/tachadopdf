import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { pdfConMarcadores } from '../test/fixtures';
import { loadPdf } from './engine';
import { extractMetadataStrings, stripMetadata } from './metadata';
import { processDocument } from './pipeline';

/**
 * MARCADORES DEL DOCUMENTO — el falso verde que estaba VIVO en el producto que ya se vende.
 *
 * `grep -rn "Outlines|outline|getToc|bookmark" src/` devolvia UNA coincidencia, y era CSS. Un DNI
 * dentro del titulo de un marcador sobrevivia al tachado, la guarda anti-falso-verde no lo miraba
 * (porque solo relee `extractAllText()` y los metadatos) y el informe lo firmaba en verde.
 *
 * Se lee el ARBOL /Outlines del binario entregado, no `extractText`: por eso el defecto era
 * invisible para toda la suite.
 */
function titulosDeMarcadores(bytes: Uint8Array): string[] {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    const titulos: string[] = [];
    const raiz = doc.getTrailer().get('Root').get('Outlines');
    if (raiz.isNull()) return titulos;
    let nodo = raiz.get('First');
    let vueltas = 0;
    while (!nodo.isNull() && vueltas < 100) {
      const titulo = nodo.get('Title');
      if (titulo.isString()) titulos.push(titulo.asString());
      nodo = nodo.get('Next');
      vueltas++;
    }
    return titulos;
  } finally {
    doc.destroy();
  }
}

const DNI_EN_MARCADOR = 'Nomina de julio - 12345678Z';

describe('la fixture reproduce el escondite', () => {
  it('el PDF de entrada lleva de verdad el dato en un marcador', async () => {
    const bytes = await pdfConMarcadores([DNI_EN_MARCADOR]);
    expect(titulosDeMarcadores(bytes)).toEqual([DNI_EN_MARCADOR]);
  });

  it('y ese dato NO está en el texto de la página: por eso el detector nunca lo vio', async () => {
    const doc = await loadPdf(await pdfConMarcadores([DNI_EN_MARCADOR]));
    const texto = doc.extractAllText().join(' ');
    doc.close();
    expect(texto).not.toContain('12345678Z');
  });
});

describe('el limpiado de metadatos se lleva los marcadores', () => {
  it('el archivo entregado ya no tiene marcadores, y el dato no se puede sacar de ahí', async () => {
    const { bytes } = await stripMetadata(await pdfConMarcadores([DNI_EN_MARCADOR]));

    expect(titulosDeMarcadores(bytes)).toEqual([]);
    expect(new TextDecoder('latin1').decode(bytes)).not.toContain('12345678Z');
  });

  it('el inventario del informe pasa de NO EXAMINADO a eliminado', async () => {
    const conMarcadores = await stripMetadata(await pdfConMarcadores([DNI_EN_MARCADOR]));
    expect(conMarcadores.objetos.marcadores).toBe('eliminado');
  });

  it('un documento sin marcadores declara «no había», no «eliminado»', async () => {
    const { pdfConTexto } = await import('../test/fixtures');
    const sinMarcadores = await stripMetadata(await pdfConTexto('Sin indice.'));
    expect(sinMarcadores.objetos.marcadores).toBe('noHabia');
  });
});

// La red de seguridad: si algun dia el borrado falla o un PDF trae marcadores que mupdf no
// reescribe, la guarda TIENE que verlos. Antes no los leia, asi que no podia fallar cerrado.
describe('la guarda anti-falso-verde relee los títulos de los marcadores', () => {
  it('extractMetadataStrings devuelve el título de cada marcador presente', async () => {
    const cadenas = await extractMetadataStrings(
      await pdfConMarcadores([DNI_EN_MARCADOR, 'Anexo II']),
    );
    expect(cadenas).toContain(DNI_EN_MARCADOR);
    expect(cadenas).toContain('Anexo II');
  });

  it('recorre también los marcadores anidados, no solo el primer nivel', async () => {
    const bytes = await pdfConMarcadores(['Padre']);
    // Se cuelga un hijo del primer marcador para comprobar el descenso.
    const doc = new mupdf.PDFDocument(bytes.slice());
    const primero = doc.getTrailer().get('Root').get('Outlines').get('First');
    const hijo = doc.addObject(doc.newDictionary());
    hijo.put('Title', doc.newString('Hijo con 12345678Z'));
    primero.put('First', hijo);
    primero.put('Last', hijo);
    const conHijo = doc.saveToBuffer({}).asUint8Array().slice();
    doc.destroy();

    expect(await extractMetadataStrings(conHijo)).toContain('Hijo con 12345678Z');
  });
});

describe('extremo a extremo: un dato en un marcador ya no puede salir en verde', () => {
  it('processDocument entrega un archivo sin el dato y el informe no lo firma en verde', async () => {
    const result = await processDocument({
      bytes: await pdfConMarcadores([DNI_EN_MARCADOR]),
      fileName: 'nomina.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });

    expect(titulosDeMarcadores(result.cleanedBytes)).toEqual([]);

    const informe = await loadPdf(result.reportBytes);
    const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
    informe.close();
    // Ya no hay agujero conocido que declarar: el inventario dice «eliminado», no NO EXAMINADO.
    expect(texto).toContain('Marcadores del documento (índice)');
    expect(texto).not.toContain('NO EXAMINADO');
  });
});
