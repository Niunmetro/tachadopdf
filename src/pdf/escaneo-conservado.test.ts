import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { pdfEscaneadoJpeg, tintaEnFranja } from '../test/fixtures';
import { processDocument } from './pipeline';

/**
 * EL ESCANEO QUE VOLVIA EN BLANCO.
 *
 * Defecto MEDIDO, no supuesto: una nomina escaneada (JPEG a pagina completa) con una caja manual
 * encima salia del tachado como una pagina BLANCA con una barra negra. Desaparecia la imagen
 * entera — el documento del cliente — y el informe no decia ni una palabra: iba del lado seguro,
 * pero el comprador entrega una nomina vacia con un informe que dice que todo fue bien.
 *
 * La causa NO es `REDACT_IMAGE_PIXELS`, que hace exactamente lo que promete (se comprobo por
 * separado: borra los pixeles de la caja y respeta el resto de la imagen). La causa es la
 * combinacion de DOS cosas nuestras dentro de `stripMetadata`:
 *
 *   1. el barrido por numero de objeto que busca las claves ocultas — resuelve TODOS los objetos;
 *   2. guardar en esa misma pasada con `garbage >= 2`.
 *
 * Medido en la matriz completa: con `garbage: 1` el escaneo sobrevive; con `garbage: 2`, `3` o `4`
 * y los objetos resueltos, mupdf pierde el flujo de la imagen (de 16.108 a 3.711 bytes, y la
 * tinta de la pagina cae de 2.402 pixeles a 1.776, que son justo los de la barra negra).
 *
 * La guarda mide TINTA EN EL PAPEL, no bloques de imagen: `onImageBlock` sigue contando 1 aunque
 * la imagen ya no se pueda decodificar, asi que contar bloques da verde sobre una pagina en blanco.
 */
const LINEAS = ['NOMINA JULIO 2026', 'DNI 12345678Z', 'LOPEZ GARCIA, MARIA', 'Empresa: Olmos SL'];

// La caja va sobre la segunda linea. En el espacio de pagina de mupdf la Y crece HACIA ABAJO:
// la linea dibujada en y=710 (coordenadas PDF) cae en y=842-710-20.
const CAJA = { page: 0, rects: [{ x: 55, y: 110, w: 240, h: 32 }] };

// Franja por debajo de la caja: ahi estan «LOPEZ GARCIA, MARIA» y «Empresa: Olmos SL», que la
// caja no toca y que tienen que seguir en el papel.
const FRANJA: [number, number] = [150, 260];

async function tachar(bytes: Uint8Array): Promise<Uint8Array> {
  const resultado = await processDocument({
    bytes,
    fileName: 'nomina-escaneada.pdf',
    freeVersion: false,
    manual: [CAJA],
    copia: es.informe,
  });
  return resultado.cleanedBytes;
}

describe('una nómina escaneada no puede volver en blanco', () => {
  it('el texto que la caja NO cubre sigue dibujado en el archivo entregado', async () => {
    const original = await pdfEscaneadoJpeg(LINEAS);
    const antes = tintaEnFranja(original, 0, ...FRANJA);
    expect(antes, 'el fixture no dibuja nada: la guarda no probaría nada').toBeGreaterThan(200);

    const entregado = await tachar(original);
    const despues = tintaEnFranja(entregado, 0, ...FRANJA);

    // No se exige igualdad exacta: el JPEG se recomprime al redactar. Se exige que siga habiendo
    // documento — una pagina en blanco da 0.
    expect(despues).toBeGreaterThan(antes * 0.8);
  });

  it('el archivo entregado no encoge a una fracción de su tamaño (la imagen sigue dentro)', async () => {
    const original = await pdfEscaneadoJpeg(LINEAS);
    const entregado = await tachar(original);
    expect(entregado.length).toBeGreaterThan(original.length * 0.5);
  });

  it('y la zona tachada sí queda cubierta: el borrado no se ha desactivado para arreglar esto', async () => {
    const original = await pdfEscaneadoJpeg(LINEAS);
    const entregado = await tachar(original);
    // La barra negra ocupa la caja entera: mucha mas tinta que el texto que habia debajo.
    const tapada = tintaEnFranja(entregado, 0, 112, 140);
    expect(tapada).toBeGreaterThan(240 * 28 * 0.9);
  });
});
