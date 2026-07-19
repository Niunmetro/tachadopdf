import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf } from '../pdf/engine';
import type { ReportData } from '../types';
import { REPORT_TITLE, SCOPE_TEXT, buildReport, computeSha256 } from './report';

const BASE_DATA: ReportData = {
  fileName: 'contrato.pdf',
  sha256: 'a'.repeat(64),
  date: '2026-07-16',
  patternsSearched: ['dni', 'iban', 'email'],
  boxesPerPage: [{ page: 0, count: 2 }],
  metadataRemoved: ['Title', 'Author', 'XMP'],
  scannedPages: [1],
  freeVersion: true,
  verify: { clean: true, residues: [] },
};

async function extractNormalizedText(bytes: Uint8Array): Promise<string> {
  const doc = await loadPdf(bytes);
  const texto = doc.extractAllText().join(' ');
  doc.close();
  return texto.replace(/\s+/g, ' ');
}

describe('buildReport', () => {
  it('devuelve un PDF válido y cargable', async () => {
    const bytes = await buildReport(BASE_DATA);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(0);
  });

  it('el texto extraído contiene el título exacto y el texto de ámbito literal', async () => {
    const bytes = await buildReport(BASE_DATA);
    const texto = await extractNormalizedText(bytes);

    expect(texto).toContain(REPORT_TITLE);
    expect(texto).toContain(SCOPE_TEXT);
  });

  it('incluye la lista de patrones con "0 ocurrencias en el texto extraíble" cuando verify está limpio', async () => {
    const bytes = await buildReport(BASE_DATA);
    const texto = await extractNormalizedText(bytes);

    expect(texto).toContain('DNI: 0 ocurrencias en el texto extraíble');
    expect(texto).toContain('IBAN: 0 ocurrencias en el texto extraíble');
    expect(texto).toContain('Correo electrónico: 0 ocurrencias en el texto extraíble');
    expect(texto).not.toContain('RESIDUOS DETECTADOS');
  });

  it('cuando hay residuos, el patrón afectado muestra el recuento real y la página, con cabecera de residuos', async () => {
    const bytes = await buildReport({
      ...BASE_DATA,
      verify: { clean: false, residues: [{ kind: 'dni', value: '12345678Z', page: 0 }] },
    });
    const texto = await extractNormalizedText(bytes);

    expect(texto).toContain('RESULTADO: RESIDUOS DETECTADOS - no apto como prueba de tachado');
    expect(texto).not.toContain('DNI: 0 ocurrencias en el texto extraíble');
    expect(texto).toContain('DNI: 1 ocurrencia(s) en el texto extraíble');
    expect(texto).toContain('páginas: 1');
  });

  it('cuando verify no está presente, el informe se marca como no verde con la cabecera de residuos', async () => {
    const { verify, ...sinVerify } = BASE_DATA;
    const bytes = await buildReport(sinVerify);
    const texto = await extractNormalizedText(bytes);

    expect(texto).toContain('RESULTADO: RESIDUOS DETECTADOS - no apto como prueba de tachado');
  });

  it('incluye la línea de versión gratuita solo cuando freeVersion es true', async () => {
    const bytesGratis = await buildReport({ ...BASE_DATA, freeVersion: true });
    const textoGratis = await extractNormalizedText(bytesGratis);
    expect(textoGratis).toContain('Generado con TachadoPDF (versión gratuita)');

    const bytesPro = await buildReport({ ...BASE_DATA, freeVersion: false });
    const textoPro = await extractNormalizedText(bytesPro);
    expect(textoPro).not.toContain('Generado con TachadoPDF (versión gratuita)');
  });

  it('advierte las páginas sin capa de texto', async () => {
    const bytes = await buildReport(BASE_DATA);
    const texto = await extractNormalizedText(bytes);
    expect(texto).toContain('sin capa de texto');
  });

  it('no contiene palabras prohibidas', async () => {
    const bytes = await buildReport(BASE_DATA);
    const texto = (await extractNormalizedText(bytes)).toLowerCase();

    expect(texto).not.toContain('certifica');
    expect(texto).not.toContain('certificado');
    expect(texto).not.toContain('anonimización');
    expect(texto).not.toContain('rgpd garantizado');
    expect(texto).not.toContain(' ia ');
  });
});

describe('computeSha256', () => {
  it('coincide con el vector conocido de la cadena vacía', async () => {
    const hash = await computeSha256(new Uint8Array());
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('coincide con el vector conocido de "abc"', async () => {
    const bytes = new TextEncoder().encode('abc');
    const hash = await computeSha256(bytes);
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('devuelve hexadecimal en minúsculas', async () => {
    const hash = await computeSha256(new TextEncoder().encode('TachadoPDF'));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
