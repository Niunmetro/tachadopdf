import { describe, expect, it } from 'vitest';
import { es } from '../content/es';

const COPIA = es.informe;
import { pdfConTexto, pdfSoloImagen } from '../test/fixtures';
import { loadPdf } from './engine';
import { detectAutomaticBoxes, processDocument } from './pipeline';

describe('processDocument (T10: pipeline DOM-free)', () => {
  it('tacha manualmente un nombre que no casa con ningún patrón automático: clean=true y el nombre desaparece del texto final', async () => {
    const nombre = 'Fulanito de Tal';
    const bytes = await pdfConTexto(`Contrato firmado por ${nombre} el día de hoy.`);

    const previo = await loadPdf(bytes);
    const rects = previo.searchText(0, nombre);
    previo.close();
    expect(rects.length).toBeGreaterThan(0);

    const result = await processDocument({
      bytes,
      fileName: 'contrato.pdf',
      freeVersion: true,
      copia: COPIA,
      manual: [{ page: 0, rects }],
    });

    expect(result.verify.clean).toBe(true);
    expect(result.unverifiableManualPages).toEqual([]);

    const finalDoc = await loadPdf(result.cleanedBytes);
    const textoFinal = finalDoc.extractText(0);
    finalDoc.close();
    expect(textoFinal).not.toContain(nombre);
  });

  it('una caja manual sobre una página sin texto no aporta texto capturable: la página consta en unverifiableManualPages', async () => {
    const bytes = await pdfSoloImagen();

    const result = await processDocument({
      bytes,
      fileName: 'imagen.pdf',
      freeVersion: true,
      copia: COPIA,
      manual: [{ page: 0, rects: [{ x: 40, y: 700, w: 500, h: 100 }] }],
    });

    expect(result.unverifiableManualPages).toEqual([0]);
  });

  it('un DNI válido detectado automáticamente se redacta sin intervención manual: clean=true', async () => {
    const bytes = await pdfConTexto('DNI 12345678Z, gracias por su colaboración.');

    const result = await processDocument({
      bytes,
      fileName: 'dni.pdf',
      freeVersion: true,
      copia: COPIA,
      manual: [],
    });

    expect(result.verify.clean).toBe(true);
    expect(result.boxesPerPage.some((b) => b.page === 0 && b.count > 0)).toBe(true);
  });
});

// El usuario quiere tachar SOLO una frase y dejar el DNI a la vista. Antes esto era imposible: la
// guarda reencontraba el DNI y bloqueaba la descarga («residuos… no se ha descargado ningún
// fichero»). Ahora un dato que la herramienta OFRECIÓ y el usuario RECHAZÓ no bloquea: se entrega,
// consta como «sin tachar» y el sello baja a ámbar (nunca verde). Es el caso que reportó Ángel.
describe('tachar solo una frase y dejar un dato detectado a propósito', () => {
  it('entrega el fichero (clean=true), lista el DNI en datosNoTachados y el informe es ámbar, no verde', async () => {
    const dni = '12345678Z';
    const frase = 'Frase secreta a borrar';
    const bytes = await pdfConTexto(`El DNI ${dni}. ${frase}.`);

    // La herramienta detecta el DNI y ofrece su caja; el usuario la DESMARCA y solo tacha la frase.
    const previo = await loadPdf(bytes);
    const cajas = detectAutomaticBoxes(previo, previo.pagesNeedingVisualReview());
    const rectsFrase = previo.searchText(0, frase);
    previo.close();
    expect(cajas.length).toBeGreaterThan(0);
    expect(cajas.every((c) => c.value === dni)).toBe(true);
    expect(rectsFrase.length).toBeGreaterThan(0);

    const result = await processDocument({
      bytes,
      fileName: 'contrato.pdf',
      freeVersion: true,
      copia: COPIA,
      manual: [{ page: 0, rects: rectsFrase }],
      selectedAutomatic: cajas.map(() => false), // ninguna caja automática seleccionada
    });

    // Se ENTREGA: no hay residuo bloqueante.
    expect(result.verify.clean).toBe(true);
    // Pero el DNI consta como dato dejado sin tachar (por decisión del usuario).
    expect(result.verify.datosNoTachados ?? []).toContainEqual({ kind: 'dni', value: dni, page: 0 });

    // La frase manual desapareció; el DNI permanece a propósito.
    const finalDoc = await loadPdf(result.cleanedBytes);
    const textoFinal = finalDoc.extractText(0);
    finalDoc.close();
    expect(textoFinal).not.toContain(frase);
    expect(textoFinal).toContain(dni);

    // El informe NO es verde y nombra el DNI como sin tachar.
    const informe = await loadPdf(result.reportBytes);
    const textoInforme = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
    informe.close();
    expect(textoInforme).not.toContain('VERIFICADO');
    expect(textoInforme).toContain('PARCIAL');
    expect(textoInforme).toContain('sin tachar, siguen en el documento');
  });
});

// El campo se calculaba y se tiraba: llegaba a ProcessResult pero NUNCA a ReportData, asi que el
// informe podia decir VERIFICADO sobre un tachado que jamas fue verificable.
describe('el informe recibe las paginas no verificables', () => {
  it('una caja manual sobre una pagina sin texto consta en el informe, no solo en el resultado', async () => {
    const bytes = await pdfSoloImagen();

    const result = await processDocument({
      bytes,
      fileName: 'imagen.pdf',
      freeVersion: false,
      manual: [{ page: 0, rects: [{ x: 40, y: 700, w: 500, h: 100 }] }],
      copia: COPIA,
    });

    expect(result.unverifiableManualPages).toEqual([0]);

    const informe = await loadPdf(result.reportBytes);
    const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
    informe.close();
    expect(texto).toContain(COPIA.subNoVerificables);
    expect(texto).toContain(COPIA.noVerificablePagina(1).slice(0, 40));
    // Literales congelados: el sello NO puede ser verde y el motivo se nombra.
    expect(texto).not.toContain('VERIFICADO');
    expect(texto).toContain('SIN COMPROBACIÓN AUTOMÁTICA');
  });
});

// ALL_PATTERNS omitia 'catastro': el informe declaraba menos patrones buscados de los que de
// verdad se buscan y se verifican.
describe('patrones declarados en el informe', () => {
  it('el informe declara los SIETE tipos que la deteccion reconoce', async () => {
    const bytes = await pdfConTexto('Documento sin datos personales.');

    const result = await processDocument({
      bytes,
      fileName: 'vacio.pdf',
      freeVersion: false,
      manual: [],
      copia: COPIA,
    });

    const informe = await loadPdf(result.reportBytes);
    const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
    informe.close();
    for (const etiqueta of Object.values(COPIA.etiquetas)) {
      expect(texto).toContain(etiqueta);
    }
  });
});
