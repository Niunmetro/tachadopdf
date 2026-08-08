import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { detect } from '../detect/patterns';
import { pdfDniEnDosLineas, pdfImportesEnDosLineas } from '../test/fixtures';
import { loadPdf } from './engine';
import { processDocument } from './pipeline';
import { verifyRedaction } from './verify';

/**
 * UN DNI PARTIDO POR UN SALTO DE LINEA — el caso de la celda estrecha de tabla.
 *
 * Medido antes de tocar nada:
 *   texto extraido      "DNI del titular:\n1234\n5678Z"
 *   detect(texto)       []            <- ni se detecta ni se tacha
 *   searchText(...)     []            <- mupdf TAMPOCO lo encuentra: no hay caja que ofrecer
 *   sin saltos          "DNI del titular:12345678Z"  -> detect encuentra el DNI
 *
 * O sea: el dato SIGUE siendo extraible del archivo entregado, y el informe lo sellaba en verde.
 * Como no se puede tachar solo, la unica salida honesta es que la guarda lo vea y BLOQUEE, con
 * su pagina y su patron, para que el usuario lo tache a mano.
 */
describe('el defecto, medido', () => {
  it('el detector no ve el DNI partido, pero quitando los saltos aparece', async () => {
    const doc = await loadPdf(await pdfDniEnDosLineas());
    const texto = doc.extractText(0);
    const cajas = doc.searchText(0, '12345678Z');
    doc.close();

    expect(detect(texto)).toEqual([]);
    expect(cajas).toEqual([]);
    expect(detect(texto.replace(/\s+/g, '')).map((h) => h.value)).toContain('12345678Z');
  });
});

describe('la guarda junta las líneas y falla cerrado', () => {
  it('processDocument no puede dar por limpio un documento con el DNI partido', async () => {
    const result = await processDocument({
      bytes: await pdfDniEnDosLineas(),
      fileName: 'tabla.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });

    expect(result.verify.clean).toBe(false);
    expect(result.verify.residues.map((r) => r.kind)).toContain('dni');
  });

  it('y el informe lo dice: bloqueado, con el patrón y la página', async () => {
    const result = await processDocument({
      bytes: await pdfDniEnDosLineas(),
      fileName: 'tabla.pdf',
      freeVersion: false,
      manual: [],
      copia: es.informe,
    });

    const informe = await loadPdf(result.reportBytes);
    const texto = informe.extractAllText().join(' ').replace(/\s+/g, ' ');
    informe.close();

    expect(texto).not.toContain('VERIFICADO');
    expect(texto).toContain('TACHADO NO SUPERADO');
    expect(texto).toContain('DNI: 1 ocurrencia(s) en el texto extraíble');
    expect(texto).toContain('páginas: 1');
  });

  it('tachando a mano las dos líneas, el documento vuelve a ser entregable', async () => {
    const result = await processDocument({
      bytes: await pdfDniEnDosLineas(),
      fileName: 'tabla.pdf',
      freeVersion: false,
      // Una caja que cubre los dos fragmentos: es lo que el usuario puede hacer y la
      // herramienta no. Que exista esta salida es lo que hace aceptable bloquear.
      // OJO con las coordenadas: `extractTextInRect` trabaja en el espacio de mupdf, con el
      // origen ARRIBA a la izquierda, no en el de pdf-lib. Verificado midiendo el rectangulo.
      manual: [{ page: 0, rects: [{ x: 45, y: 70, w: 120, h: 30 }] }],
      copia: es.informe,
    });

    expect(result.verify.clean).toBe(true);
  });
});

// El limite de la tecnica, medido y elegido a proposito: juntar dos lineas puede FABRICAR una
// coincidencia. Por eso el barrido solo mira los patrones que llevan digito de control (y el
// correo, que necesita una arroba). Un telefono partido en dos lineas NO se reencuentra — es un
// residual conocido, y es preferible a bloquear para siempre el informe de una tabla de importes,
// que ademas seria un bloqueo del que el usuario no podria salir.
describe('el barrido de saltos de línea no fabrica residuos', () => {
  it('una tabla de importes en dos líneas sigue siendo entregable', async () => {
    const result = await processDocument({
      bytes: await pdfImportesEnDosLineas(),
      fileName: 'importes.pdf',
      freeVersion: false,
      manual: [{ page: 0, rects: [{ x: 45, y: 55, w: 60, h: 16 }] }],
      copia: es.informe,
    });

    expect(result.verify.clean).toBe(true);
  });

  it('unitario: el DNI partido se reencuentra; los nueve dígitos de dos importes, no', () => {
    expect(verifyRedaction(['DNI del titular:\n1234\n5678Z'], []).clean).toBe(false);
    expect(verifyRedaction(['7500\n43210'], []).clean).toBe(true);
  });

  it('unitario: también reencuentra un IBAN y un correo partidos', () => {
    expect(verifyRedaction(['ES9121000418\n450200051332'], []).clean).toBe(false);
    expect(verifyRedaction(['persona@\nejemplo.es'], []).clean).toBe(false);
  });

  it('unitario: un tachado manual que reaparece partido en dos líneas se reencuentra', () => {
    expect(verifyRedaction(['Fulanito de\nTal'], ['Fulanito deTal']).clean).toBe(false);
  });
});
