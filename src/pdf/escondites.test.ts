import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { pdfConEscondites, pdfConTexto } from '../test/fixtures';
import { loadPdf } from './engine';
import { extractMetadataStrings, stripMetadata } from './metadata';
import { processDocument } from './pipeline';

/**
 * LOS ESCONDITES QUE QUEDABAN, todos reproducidos sobre nuestra propia salida:
 *
 *  - XMP colgado de un XObject (no del documento ni de la pagina). `stripMetadata` solo miraba
 *    `/Root/Metadata` y `/Page/Metadata`.
 *  - `/Thumb`: la miniatura de la pagina es un retrato de la pagina SIN tachar.
 *  - `/PieceInfo`: datos privados de la aplicacion que genero el PDF.
 *  - `/Alt` y `/ActualText` del arbol de estructura: el texto alternativo que Word pone a cada
 *    imagen insertada, que es justo donde acaba un DNI escaneado.
 *
 * SE BUSCA SOBRE EL BINARIO DESCOMPRIMIDO. `stripMetadata` guarda con `compress:true`, asi que
 * un grep crudo sobre los bytes entregados da falso NEGATIVO y el escondite parece cerrado
 * cuando no lo esta. Esto costo una pasada entera del mapa de falsos verdes.
 */
function textoDelBinario(bytes: Uint8Array): string {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    return new TextDecoder('latin1').decode(
      doc.saveToBuffer({ decompress: true }).asUint8Array(),
    );
  } finally {
    doc.destroy();
  }
}

function tienenClave(bytes: Uint8Array, clave: string): boolean {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    const total = doc.countObjects();
    for (let num = 1; num < total; num++) {
      const obj = doc.newIndirect(num).resolve();
      if (obj.isDictionary() && !obj.get(clave).isNull()) return true;
    }
    return false;
  } finally {
    doc.destroy();
  }
}

const DATO = 'Wenceslao Mommbrun 12345678Z';

describe('la fixture reproduce los cuatro escondites', () => {
  it('el dato está en el binario de entrada y NO en el texto de la página', async () => {
    const bytes = await pdfConEscondites(DATO);
    expect(textoDelBinario(bytes)).toContain(DATO);

    const doc = await loadPdf(bytes);
    const texto = doc.extractAllText().join(' ');
    doc.close();
    expect(texto).not.toContain('12345678Z');
  });
});

describe('el limpiado se lleva los cuatro', () => {
  it('el dato ya no está en el binario entregado, ni comprimido ni sin comprimir', async () => {
    const { bytes } = await stripMetadata(await pdfConEscondites(DATO));
    expect(textoDelBinario(bytes)).not.toContain(DATO);
    expect(textoDelBinario(bytes)).not.toContain('12345678Z');
  });

  it.each(['Metadata', 'Thumb', 'PieceInfo', 'Alt'])(
    'ningún objeto del archivo entregado conserva la clave /%s',
    async (clave) => {
      const { bytes } = await stripMetadata(await pdfConEscondites(DATO));
      expect(tienenClave(bytes, clave)).toBe(false);
    },
  );

  it('el inventario del informe declara los dos grupos como eliminados', async () => {
    const { objetos } = await stripMetadata(await pdfConEscondites(DATO));
    expect(objetos.alternativos).toBe('eliminado');
    expect(objetos.ocultos).toBe('eliminado');
  });

  it('un documento que no los lleva declara «no había», no «eliminado»', async () => {
    const { objetos } = await stripMetadata(await pdfConTexto('Documento liso.'));
    expect(objetos.alternativos).toBe('noHabia');
    expect(objetos.ocultos).toBe('noHabia');
  });
});

// La red: si el borrado fallara, el dato tiene que llegar a la guarda y bloquear el informe.
describe('la guarda anti-falso-verde relee los textos alternativos', () => {
  it('extractMetadataStrings devuelve el /Alt del árbol de estructura y el XMP anidado', async () => {
    const cadenas = (await extractMetadataStrings(await pdfConEscondites(DATO))).join(' ');
    expect(cadenas).toContain(DATO);
  });
});

describe('extremo a extremo: ninguno de los cuatro puede salir en verde', () => {
  it('processDocument entrega un archivo sin el dato y el informe no declara nada sin examinar', async () => {
    const result = await processDocument({
      bytes: await pdfConEscondites(DATO),
      fileName: 'acta.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });

    expect(textoDelBinario(result.cleanedBytes)).not.toContain('12345678Z');

    const informe = await loadPdf(result.reportBytes);
    const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
    informe.close();
    expect(texto).toContain('Textos alternativos y etiquetas de accesibilidad');
    expect(texto).toContain('Objetos internos con texto que ningún lector enseña');
    expect(texto).not.toContain('NO EXAMINADO');
  });
});
