import { describe, expect, it } from 'vitest';
import { inyectarResiduo, pdfConTexto } from '../test/fixtures';
import { loadPdf } from './engine';
import { verifyRedaction } from './verify';

describe('verifyRedaction (unidades sobre texto)', () => {
  it('clean=true cuando no hay patrones ni strings manuales residuales', () => {
    const resultado = verifyRedaction(['Este documento no contiene datos personales.'], []);
    expect(resultado.clean).toBe(true);
    expect(resultado.residues).toEqual([]);
  });

  it('detecta un residuo de patrón (DNI) e indica kind y página 0-based', () => {
    const resultado = verifyRedaction(['Texto limpio.', 'DNI 12345678Z sigue aquí.'], []);
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toEqual([
      { kind: 'dni', value: '12345678Z', page: 1 },
    ]);
  });

  it('detecta un string manual que sobrevive con kind="manual"', () => {
    const resultado = verifyRedaction(['El propietario es Juan Pérez López.'], ['Juan Pérez López']);
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toEqual([
      { kind: 'manual', value: 'Juan Pérez López', page: 0 },
    ]);
  });

  it('ignora strings manuales vacías o solo espacios (no marca falso residuo)', () => {
    const resultado = verifyRedaction(['Texto cualquiera.'], ['', '   ']);
    expect(resultado.clean).toBe(true);
    expect(resultado.residues).toEqual([]);
  });

  it('combina residuos de patrón y manuales de varias páginas', () => {
    const resultado = verifyRedaction(
      ['Contacto: a@b.com', 'Sin datos.', 'Referencia: expediente-123-ABC'],
      ['expediente-123-ABC'],
    );
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'email', value: 'a@b.com', page: 0 });
    expect(resultado.residues).toContainEqual({ kind: 'manual', value: 'expediente-123-ABC', page: 2 });
  });

  it('no decide sobre imágenes: una página sin texto no genera residuos por sí sola', () => {
    const resultado = verifyRedaction([''], ['algo']);
    expect(resultado.clean).toBe(true);
  });
});

describe('verifyRedaction (tercer parámetro: metadataTexts)', () => {
  it('un string manual que sobrevive en pageTexts se señala como residuo manual (comportamiento base intacto)', () => {
    const resultado = verifyRedaction(['El propietario es Juan Pérez López.'], ['Juan Pérez López']);
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'manual', value: 'Juan Pérez López', page: 0 });
  });

  it('un DNI válido residual en metadataTexts da clean=false y señala el residuo con page=null', () => {
    const resultado = verifyRedaction([], [], ['/Cliente (Juan 12345678Z)']);
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'dni', value: '12345678Z', page: null });
  });

  it('sin residuos en ninguna fuente da clean=true', () => {
    const resultado = verifyRedaction(['texto limpio'], [], []);
    expect(resultado.clean).toBe(true);
    expect(resultado.residues).toEqual([]);
  });
});

describe('verifyRedaction (cuarto parámetro: datos ofrecidos y rechazados por el usuario)', () => {
  it('un dato detectado que el usuario RECHAZÓ tachar no bloquea: va a datosNoTachados y clean=true', () => {
    const resultado = verifyRedaction(
      ['El DNI del titular es 12345678Z.'],
      [],
      [],
      new Set(['12345678Z']),
    );
    expect(resultado.clean).toBe(true);
    expect(resultado.residues).toEqual([]);
    expect(resultado.datosNoTachados).toContainEqual({ kind: 'dni', value: '12345678Z', page: 0 });
  });

  it('un dato detectado que NO está en el conjunto de rechazados sigue bloqueando (falla cerrado)', () => {
    const resultado = verifyRedaction(
      ['El DNI del titular es 12345678Z.'],
      [],
      [],
      new Set(['99999999R']), // se rechazó OTRO valor; este no
    );
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'dni', value: '12345678Z', page: 0 });
    expect(resultado.datosNoTachados).toEqual([]);
  });

  it('rechazar un dato NO desactiva la guarda para OTROS: un residuo distinto sigue bloqueando', () => {
    const resultado = verifyRedaction(
      ['DNI 12345678Z e IBAN ES9121000418450200051332.'],
      [],
      [],
      new Set(['12345678Z']), // solo el DNI se rechazó; el IBAN no
    );
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'iban', value: 'ES9121000418450200051332', page: 0 });
    expect(resultado.datosNoTachados).toContainEqual({ kind: 'dni', value: '12345678Z', page: 0 });
  });

  it('una caja MANUAL que sobrevive bloquea aunque su texto coincida con un valor rechazado', () => {
    const resultado = verifyRedaction(
      ['Frase secreta que había que borrar.'],
      ['Frase secreta que había que borrar'],
      [],
      new Set(['Frase secreta que había que borrar']),
    );
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({
      kind: 'manual',
      value: 'Frase secreta que había que borrar',
      page: 0,
    });
  });

  it('un dato PARTIDO en dos renglones bloquea: nunca se pudo ofrecer, así que no está entre los rechazados', () => {
    // El detector directo no ve '1234\n5678Z'; solo la guarda de saltos lo reencuentra al juntar
    // las líneas. En el pipeline real ese valor jamás llega a `offeredValues` (detect no lo ve en el
    // texto crudo), así que nunca puede estar entre los rechazados — aquí se pasa OTRO valor
    // rechazado para dejarlo explícito. Como no se pudo ofrecer, el usuario no pudo elegir dejarlo:
    // residuo bloqueante.
    const resultado = verifyRedaction(['1234\n5678Z'], [], [], new Set(['99999999R']));
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'dni', value: '12345678Z', page: 0 });
  });

  it('un dato en METADATOS bloquea aunque su valor esté entre los rechazados: no se elige por objeto', () => {
    const resultado = verifyRedaction([], [], ['/Cliente (12345678Z)'], new Set(['12345678Z']));
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'dni', value: '12345678Z', page: null });
  });

  it('sin cuarto parámetro (undefined) el comportamiento antiguo se conserva: todo detectado bloquea', () => {
    const resultado = verifyRedaction(['DNI 12345678Z.'], []);
    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'dni', value: '12345678Z', page: 0 });
    expect(resultado.datosNoTachados).toEqual([]);
  });
});

describe('verifyRedaction (integración con motor mupdf y fixtures de T2/T3)', () => {
  it('un PDF ya limpio (sin datos) da clean=true', async () => {
    const bytes = await pdfConTexto('Documento sin ningún dato identificativo.');
    const doc = await loadPdf(bytes);
    const resultado = verifyRedaction(doc.extractAllText(), []);
    doc.close();
    expect(resultado.clean).toBe(true);
    expect(resultado.residues).toEqual([]);
  });

  it('un PDF con un DNI redactado pero un residuo inyectado da clean=false y lo señala', async () => {
    const base = await pdfConTexto('Nombre: Juan. DNI 12345678Z. Fin.');
    const doc = await loadPdf(base);
    const boxes = doc.searchText(0, 'DNI 12345678Z');
    doc.applyRedactions([{ page: 0, rects: boxes }]);
    const bytesRedactado = doc.save();
    doc.close();

    const conResiduo = await inyectarResiduo(bytesRedactado, 'IBAN ES9121000418450200051332');
    const docFinal = await loadPdf(conResiduo);
    const resultado = verifyRedaction(docFinal.extractAllText(), []);
    docFinal.close();

    expect(resultado.clean).toBe(false);
    expect(resultado.residues.some((r) => r.kind === 'iban' && r.value.includes('ES91'))).toBe(true);
  });

  it('un string tachado manualmente que sobrevive en el PDF final se señala como residuo manual', async () => {
    const bytes = await pdfConTexto('Referencia interna: Juan Pérez López');
    const doc = await loadPdf(bytes);
    const resultado = verifyRedaction(doc.extractAllText(), ['Juan Pérez López']);
    doc.close();

    expect(resultado.clean).toBe(false);
    expect(resultado.residues).toContainEqual({ kind: 'manual', value: 'Juan Pérez López', page: 0 });
  });
});
