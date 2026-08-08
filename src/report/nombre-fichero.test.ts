import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import { loadPdf } from '../pdf/engine';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { buildReport, nombreSinDatos } from './report';

/**
 * EL INFORME PUBLICABA EL DATO QUE ACABABA DE TACHAR.
 *
 * `report.ts` imprimia `data.fileName` tal cual. Con la convencion de nombrado de cualquier
 * gestoria — `nomina-12345678Z-julio.pdf` — el DNI quedaba DENTRO del entregable, y el
 * entregable es justo el documento que se guarda como registro de diligencia. Sello en verde.
 */
const COPIA = es.informe;
const PATRONES: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

const OBJETOS: InventarioObjetos = {
  info: 'eliminado',
  xmp: 'noHabia',
  anotaciones: 'noHabia',
  formularios: 'noHabia',
  adjuntos: 'noHabia',
  marcadores: 'noHabia',
  alternativos: 'noHabia',
  ocultos: 'noHabia',
};

function datos(fileName: string): ReportData {
  return {
    fileName,
    sha256: 'a'.repeat(64),
    date: '2026-08-08',
    patternsSearched: PATRONES,
    totalPaginas: 1,
    boxesPerPage: [{ page: 0, count: 1 }],
    objetos: OBJETOS,
    paginasSinCapaDeTexto: [],
    paginasImagenCompleta: [],
    paginasConImagen: [],
    unverifiableManualPages: [],
    paginasTextoNoLegible: [],
    freeVersion: false,
    verify: { clean: true, residues: [] },
  };
}

async function texto(fileName: string): Promise<string> {
  const doc = await loadPdf(await buildReport(datos(fileName), COPIA));
  const t = doc.extractAllText().join(' ');
  doc.close();
  return t.replace(/\s+/g, ' ');
}

describe('nombreSinDatos', () => {
  it('oculta un DNI dentro del nombre y conserva el resto', () => {
    expect(nombreSinDatos('nomina-12345678Z-julio.pdf', '[X]')).toBe('nomina-[X]-julio.pdf');
  });

  it('oculta varias coincidencias en el mismo nombre', () => {
    const salida = nombreSinDatos('12345678Z-y-X1234567L.pdf', '[X]');
    expect(salida).not.toContain('12345678Z');
    expect(salida).not.toContain('X1234567L');
    expect(salida).toBe('[X]-y-[X].pdf');
  });

  it('un nombre limpio no se toca', () => {
    expect(nombreSinDatos('acta-junta-2026.pdf', '[X]')).toBe('acta-junta-2026.pdf');
  });

  it('un correo en el nombre también se oculta', () => {
    expect(nombreSinDatos('para-juan@ejemplo.es.pdf', '[X]')).not.toContain('juan@ejemplo.es');
  });
});

describe('el informe no publica los datos del nombre del archivo', () => {
  it('el DNI del nombre no aparece en ninguna parte del informe', async () => {
    const t = await texto('nomina-12345678Z-julio.pdf');

    expect(t).not.toContain('12345678Z');
    expect(t).toContain('nomina-[dato oculto]-julio.pdf');
  });

  it('y lo dice, en vez de ocultarlo en silencio', async () => {
    const t = await texto('nomina-12345678Z-julio.pdf');
    expect(t).toContain('El nombre del archivo contenía un dato de los patrones buscados');
    // El nombre del fichero entregado lo elige el usuario: decirselo es parte del encargo.
    expect(t).toContain('esta herramienta no lo cambia');
  });

  it('con un nombre limpio no aparece el aviso ni el marcador', async () => {
    const t = await texto('acta-junta-2026.pdf');
    expect(t).toContain('acta-junta-2026.pdf');
    expect(t).not.toContain('[dato oculto]');
    expect(t).not.toContain('El nombre del archivo contenía');
  });
});
