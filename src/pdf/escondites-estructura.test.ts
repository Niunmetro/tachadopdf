import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { loadPdf } from './engine';
import { pdfConEstructura } from '../test/pdf-crudo';
import { processDocument } from './pipeline';

/**
 * NUEVE ESCONDITES EN LA ESTRUCTURA DEL ARCHIVO.
 *
 * El barrido anterior recorria todos los objetos pero solo borraba TRES claves de una lista
 * blanca (`Metadata`, `Thumb`, `PieceInfo`), y la relectura miraba tambien sitios concretos. Asi
 * que cualquier cadena en cualquier otra clave sobrevivia Y no se releia: nueve documentos
 * distintos salian «TACHADO VERIFICADO» con el DNI dentro de los bytes entregados.
 *
 * Contra un escondite no hay lista blanca que valga —siempre queda el sitio numero diez—, asi que
 * el arreglo tiene dos mitades:
 *   BORRAR lo que se sabe borrar sin romper el documento (para que el usuario tenga salida), y
 *   RELEER TODAS las cadenas de todos los objetos (para que lo que no se sepa borrar bloquee).
 *
 * La guarda comprueba las dos: que el dato ya no esta en los bytes, y —revirtiendo el borrado—
 * que si estuviera, el informe saldria bloqueado en vez de verde.
 */
const DNI = '12345678Z';

/** Bytes con los flujos descomprimidos: sobre el binario comprimido un grep da falso negativo. */
function bytesLegibles(bytes: Uint8Array): string {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    return Buffer.from(doc.saveToBuffer({ decompress: true }).asUint8Array()).toString('latin1');
  } finally {
    doc.destroy();
  }
}

const CASOS: { nombre: string; bytes: () => Uint8Array }[] = [
  {
    nombre: '/PageLabels (prefijo de numeración de página)',
    bytes: () =>
      pdfConEstructura({ catalogoExtra: `/PageLabels << /Nums [0 << /P (Nomina ${DNI}) /S /D >>] >>` }),
  },
  {
    nombre: '/OCProperties (nombre de una capa)',
    bytes: () =>
      pdfConEstructura({
        catalogoExtra: '/OCProperties << /OCGs [6 0 R] /D << /Order [6 0 R] /ON [6 0 R] >> >>',
        extras: [{ cuerpo: `<< /Type /OCG /Name (Capa ${DNI}) >>` }],
      }),
  },
  {
    nombre: '/Names /Dests (destino con nombre)',
    bytes: () =>
      pdfConEstructura({ catalogoExtra: `/Names << /Dests << /Names [(Ficha ${DNI}) [3 0 R /Fit]] >> >>` }),
  },
  {
    nombre: '/Names /JavaScript',
    bytes: () =>
      pdfConEstructura({
        catalogoExtra: '/Names << /JavaScript << /Names [(js) 6 0 R] >> >>',
        extras: [{ cuerpo: `<< /S /JavaScript /JS (var titular = "${DNI}";) >>` }],
      }),
  },
  {
    nombre: '/OpenAction con JavaScript',
    bytes: () => pdfConEstructura({ catalogoExtra: `/OpenAction << /S /JavaScript /JS (var t = "${DNI}";) >>` }),
  },
  {
    nombre: '/Threads (hilo de artículo)',
    bytes: () =>
      pdfConEstructura({
        catalogoExtra: '/Threads [6 0 R]',
        extras: [{ cuerpo: `<< /I << /Title (Expediente ${DNI}) >> /F 3 0 R >>` }],
      }),
  },
  {
    nombre: 'clave propia dentro del diccionario de página',
    bytes: () => pdfConEstructura({ paginaExtra: `/TPDatoPrivado (${DNI})` }),
  },
  {
    nombre: '/StructTreeRoot con /T (título del elemento de estructura)',
    bytes: () =>
      pdfConEstructura({
        catalogoExtra: '/StructTreeRoot 6 0 R',
        extras: [
          { cuerpo: '<< /Type /StructTreeRoot /K 7 0 R >>' },
          { cuerpo: `<< /Type /StructElem /S /Document /T (Nomina de ${DNI}) /P 6 0 R >>` },
        ],
      }),
  },
  {
    nombre: '/Collection (esquema de portafolio)',
    bytes: () =>
      pdfConEstructura({
        catalogoExtra: `/Collection << /Type /Collection /Schema << /C1 << /Type /CollectionField /Subtype /S /N (Titular ${DNI}) >> >> >>`,
      }),
  },
];

async function tachar(bytes: Uint8Array): Promise<{ limpio: Uint8Array; informe: string; clean: boolean }> {
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
  return { limpio: resultado.cleanedBytes, informe: texto, clean: resultado.verify.clean };
}

describe('escondites en la estructura del archivo', () => {
  it.each(CASOS)('$nombre: el dato no sobrevive en los bytes entregados', async ({ bytes }) => {
    const { limpio } = await tachar(bytes());
    expect(bytesLegibles(limpio)).not.toContain(DNI);
  });

  it.each(CASOS)('$nombre: y el informe no sella verde con el dato dentro', async ({ bytes }) => {
    const { limpio, informe } = await tachar(bytes());
    if (bytesLegibles(limpio).includes(DNI)) {
      expect(informe, 'el dato sigue en el fichero: el informe NO puede decir VERIFICADO').not.toContain(
        'VERIFICADO',
      );
    }
  });
});

/**
 * EL ADJUNTO QUE NO SE IBA. Lo destapo la relectura de todas las cadenas, no una sospecha: el
 * nombre del fichero adjunto seguia apareciendo despues de purgar. Mirando por que, resulto que
 * `deleteEmbeddedFile` quita la entrada del arbol `/Names` —y `getEmbeddedFiles()` devuelve una
 * lista vacia, que es lo que miraba el inventario— pero el `/AF` del catalogo seguia apuntando al
 * Filespec, asi que el recolector no podia tirarlo y el CONTENIDO del adjunto se entregaba dentro
 * del fichero. El informe decia, mientras tanto, «Ficheros adjuntos: eliminado del archivo».
 */
describe('un adjunto eliminado no puede seguir dentro del fichero', () => {
  it('ni su nombre ni su contenido sobreviven, y el inventario dice la verdad', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]);
    await doc.attach(new TextEncoder().encode(`contenido adjunto de ${DNI}`), `nomina-${DNI}.txt`, {
      mimeType: 'text/plain',
    });

    const { stripMetadata } = await import('./metadata');
    const { bytes, objetos } = await stripMetadata(await doc.save());
    const legibles = bytesLegibles(bytes);

    expect(legibles).not.toContain('contenido adjunto');
    expect(legibles).not.toContain(DNI);
    expect(objetos.adjuntos).toBe('eliminado');
  });
});

/**
 * La segunda mitad, probada por separado: si el borrado fallara —hoy o el dia que un fichero
 * traiga el dato en el sitio numero diez—, la RELECTURA lo reencuentra y el informe se bloquea.
 * Se comprueba con un objeto que el barrido no toca a proposito (una clave inventada colgando de
 * un objeto que no es ni la pagina ni la raiz).
 */
describe('lo que no se sabe borrar, al menos bloquea', () => {
  it('una cadena en una clave que nadie mira deja el informe en TACHADO NO SUPERADO', async () => {
    const bytes = pdfConEstructura({
      catalogoExtra: '/TPAnexo 6 0 R',
      extras: [{ cuerpo: `<< /TPClaveQueNadieMira (Titular ${DNI}) >>` }],
    });
    const { informe, clean, limpio } = await tachar(bytes);

    expect(bytesLegibles(limpio)).toContain(DNI);
    expect(clean).toBe(false);
    expect(informe).toContain('TACHADO NO SUPERADO');
    expect(informe).not.toContain('VERIFICADO');
  });
});
