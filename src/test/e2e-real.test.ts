// Prueba de fuego con un PDF REAL de contrato: el pipeline completo que corre en producción.
// No mockea nada: genera un PDF como los que maneja el cliente (contrato con DNI, IBAN, teléfono
// y email), lo pasa por processOne y comprueba que los datos DESAPARECEN del binario final.
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf } from '../pdf/engine';
import { processDocument } from '../pdf/pipeline';

async function contratoDePrueba(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const linea = (t: string, y: number) => page.drawText(t, { x: 50, y, size: 12, font });
  page.drawText('Contrato de arrendamiento', { x: 50, y: 780, size: 18, font });
  linea('Arrendatario: Juan Perez Gomez', 730);
  linea('DNI: 12345678Z', 710);
  linea('IBAN: ES9121000418450200051332', 690);
  linea('Telefono: 612 345 678', 670);
  linea('Email: juan.perez@example.com', 650);
  linea('Cuota mensual: 850 euros', 630);
  return doc.save();
}

describe('e2e con un contrato real', () => {
  it('borra DNI, IBAN, telefono y email del archivo y da el informe en verde', async () => {
    const bytes = await contratoDePrueba();

    const r = await processDocument({
      bytes,
      fileName: 'contrato.pdf',
      freeVersion: true,
      manual: [],
    });

    // 1) La verificación post-borrado del propio producto dice que está limpio.
    expect(r.verify.clean).toBe(true);
    expect(r.verify.residues).toEqual([]);

    // 2) Y lo comprobamos por nuestra cuenta contra los BYTES del PDF final: ninguno de los
    //    datos personales puede aparecer, ni siquiera como resto suelto en el binario.
    const crudo = Buffer.from(r.cleanedBytes).toString('latin1');
    for (const dato of ['12345678Z', 'ES9121000418450200051332', '612 345 678', 'juan.perez@example.com']) {
      expect(crudo).not.toContain(dato);
    }

    // 3) Lo que NO es dato personal sobrevive: el documento sigue siendo útil. (Se comprueba
    //    re-extrayendo el texto del PDF final: el binario lleva los streams comprimidos, así que
    //    un grep de bytes no serviría para lo que SÍ debe seguir estando.)
    const final = await loadPdf(r.cleanedBytes);
    const textoFinal = final.extractAllText().join('\n');
    expect(textoFinal).toContain('Contrato de arrendamiento');
    expect(textoFinal).toContain('Cuota mensual: 850 euros');
    expect(textoFinal).not.toContain('12345678Z');

    // 4) El informe existe y es un PDF de verdad.
    expect(r.reportBytes.length).toBeGreaterThan(500);
    expect(Buffer.from(r.reportBytes.slice(0, 5)).toString('latin1')).toBe('%PDF-');

    // 5) Cuántas cajas se aplicaron (4 datos en la página 0).
    expect(r.boxesPerPage[0]?.count).toBeGreaterThanOrEqual(4);
  }, 60_000);
});
