import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { pdfConImagen, pdfConTexto } from '../test/fixtures';
import { IMAGE_COVERAGE_THRESHOLD, loadPdf } from './engine';
import { processDocument } from './pipeline';

/**
 * LA IMAGEN QUE NO LLEGA AL UMBRAL.
 *
 * `IMAGE_COVERAGE_THRESHOLD` vale 0,6. Medido: al 25 %, al 50 % y al 59 % del area de la pagina
 * NO habia ningun aviso — ni «escaneada» ni «revision visual» —, asi que una foto de un DNI
 * pegada en un acta pasaba muda y el informe firmaba en verde sin nombrarla en ninguna parte.
 *
 * El arreglo NO es bajar el umbral (¿a cuanto? cualquier cifra es igual de arbitraria): es que
 * el informe DIGA en que paginas hay imagenes, porque su contenido visual no se comprueba. El
 * umbral sigue existiendo para lo que sirve: distinguir la pagina TAPADA por una imagen, que se
 * parece a un escaneo y si degrada el sello.
 */
async function textoDelInforme(bytes: Uint8Array): Promise<string> {
  const result = await processDocument({
    bytes,
    fileName: 'acta.pdf',
    freeVersion: false,
    manual: [],
    copia: es.informe,
  });
  const informe = await loadPdf(result.reportBytes);
  const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
  informe.close();
  return texto;
}

describe('el punto ciego, medido', () => {
  it.each([0.25, 0.5, 0.59])(
    'una imagen al %s del área no dispara ni «escaneada» ni «imagen a página completa»',
    async (fraccion) => {
      const doc = await loadPdf(await pdfConImagen(fraccion));
      expect(doc.scannedPages()).toEqual([]);
      expect(doc.pagesNeedingVisualReview()).toEqual([]);
      doc.close();
    },
  );

  it('el umbral sigue donde estaba: por encima, la página sí se marca', async () => {
    expect(IMAGE_COVERAGE_THRESHOLD).toBe(0.6);
    const doc = await loadPdf(await pdfConImagen(0.7));
    expect(doc.pagesNeedingVisualReview()).toEqual([0]);
    doc.close();
  });
});

describe('el motor sabe qué páginas llevan imágenes', () => {
  it('las enumera aunque no lleguen al umbral', async () => {
    const doc = await loadPdf(await pdfConImagen(0.25));
    expect(doc.pagesWithImages()).toEqual([0]);
    doc.close();
  });

  it('una página sin imágenes no aparece', async () => {
    const doc = await loadPdf(await pdfConTexto('Solo texto.'));
    expect(doc.pagesWithImages()).toEqual([]);
    doc.close();
  });
});

describe('el informe nombra las páginas con imágenes', () => {
  it('una imagen al 59 % consta en la cobertura, con su página', async () => {
    const texto = await textoDelInforme(await pdfConImagen(0.59));

    expect(texto).toContain('Páginas con imágenes (su contenido visual no se ha comprobado) 1 · páginas 1');
    // Y no se disfraza de lo que no es: no es una pagina tapada ni una pagina sin texto.
    expect(texto).toContain('Páginas con imagen a página completa 0');
    expect(texto).toContain('Páginas sin capa de texto (no comprobables) 0');
  });

  it('un documento sin imágenes lo dice con un cero, no callándose', async () => {
    const texto = await textoDelInforme(await pdfConTexto('Solo texto, sin imagenes.'));
    expect(texto).toContain('Páginas con imágenes (su contenido visual no se ha comprobado) 0');
  });

  it('el alcance remite a esa fila en vez de dejar el descargo suelto', async () => {
    const texto = await textoDelInforme(await pdfConImagen(0.25));
    expect(texto).toContain('las páginas que llevan imágenes constan en «Cobertura»');
  });
});
