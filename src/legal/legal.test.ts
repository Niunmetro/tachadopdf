import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AVISO_LEGAL,
  AVISO_PRINCIPAL,
  CASOS_USO,
  LANDING_TITULAR,
  PRIVACIDAD,
  TERMINOS,
} from './textos';

describe('textos legales: contenido requerido', () => {
  it('AVISO_PRINCIPAL es exactamente el literal obligatorio', () => {
    expect(AVISO_PRINCIPAL).toBe(
      'TachadoPDF elimina del archivo el texto seleccionado y los píxeles de las zonas marcadas. No garantiza que el documento quede libre de datos personales ni sustituye la revisión humana.',
    );
  });

  it('AVISO_LEGAL contiene los placeholders y referencia el artículo 10 LSSI', () => {
    expect(AVISO_LEGAL).toContain('[NOMBRE]');
    expect(AVISO_LEGAL).toContain('[NIF]');
    expect(AVISO_LEGAL).toContain('[DOMICILIO]');
    expect(AVISO_LEGAL).toContain('[EMAIL]');
    expect(AVISO_LEGAL).toContain('artículo 10');
  });

  it('TERMINOS cubre preparación para terceros/publicación, prohibición de alterar valor probatorio, responsabilidad limitada y licencia Pro anual cancelable', () => {
    expect(TERMINOS).toContain('terceros');
    expect(TERMINOS).toContain('publicación');
    expect(TERMINOS).toContain('valor probatorio');
    expect(TERMINOS).toContain('prohibido');
    expect(TERMINOS).toContain('responsabilidad');
    expect(TERMINOS).toContain('limitada al precio pagado');
    expect(TERMINOS).toContain('anual');
    expect(TERMINOS).toContain('renovación automática');
    expect(TERMINOS).toContain('cancelable');
    expect(TERMINOS).toContain('Gumroad');
  });

  it('PRIVACIDAD cubre procesamiento 100% local, no transmisión, único egress a Gumroad, sin cookies/analítica/banner y merchant of record', () => {
    expect(PRIVACIDAD).toContain('100%');
    expect(PRIVACIDAD).toContain('nunca se transmite');
    expect(PRIVACIDAD).toContain('Gumroad');
    expect(PRIVACIDAD.toLowerCase()).toContain('sin cookies');
    expect(PRIVACIDAD.toLowerCase()).toContain('analítica');
    expect(PRIVACIDAD.toLowerCase()).toContain('banner');
    expect(PRIVACIDAD).toContain('merchant of record');
  });

  it('CASOS_USO incluye los tres segmentos objetivo', () => {
    expect(CASOS_USO).toContain('administradores de fincas');
    expect(CASOS_USO).toContain('gestorías');
    expect(CASOS_USO).toContain('RRHH');
  });

  it('LANDING_TITULAR NO contiene "ya no esta en el archivo"', () => {
    expect(LANDING_TITULAR.toLowerCase()).not.toContain('ya no esta en el archivo');
  });

  it('LANDING_TITULAR NO contiene vocabulario prohibido', () => {
    const prohibited = ['anonimiz', 'certific', 'rgpd garantizado', 'inteligencia artificial', ' ia '];
    for (const word of prohibited) {
      expect(LANDING_TITULAR.toLowerCase()).not.toContain(word);
    }
  });
});

describe('guardián de vocabulario: palabras prohibidas y competidores', () => {
  // Se excluyen los ficheros *.test.ts: los tests (incluido este) necesitan citar
  // literalmente las palabras prohibidas para comprobar que el texto/informe NO las
  // contiene (ver src/report/report.test.ts). El guardián vigila el código de producto
  // (UI, landing, informe, textos legales), no las aserciones negativas de los tests.
  const SRC_DIR = path.resolve(__dirname, '..');

  const PALABRAS_PROHIBIDAS = [
    'anonim',
    'certifica',
    'certificado',
    'rgpd garantizado',
    'inteligencia artificial',
    ' ia ',
  ];

  const COMPETIDORES = ['ilovepdf', 'anondocs'];

  function listarFicheros(dir: string): string[] {
    const resultado: string[] = [];
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const rutaCompleta = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === 'node_modules') continue;
        resultado.push(...listarFicheros(rutaCompleta));
      } else if (!entrada.name.endsWith('.test.ts')) {
        resultado.push(rutaCompleta);
      }
    }
    return resultado;
  }

  const ficheros = listarFicheros(SRC_DIR);

  it('recorre al menos un fichero de src/ (el escaneo no está vacío)', () => {
    expect(ficheros.length).toBeGreaterThan(0);
  });

  it.each(PALABRAS_PROHIBIDAS)('ningún fichero de src/ contiene la palabra prohibida "%s"', (palabra) => {
    const infractores = ficheros.filter((fichero) =>
      fs.readFileSync(fichero, 'utf-8').toLowerCase().includes(palabra),
    );
    expect(infractores).toEqual([]);
  });

  it.each(COMPETIDORES)('ningún fichero de src/ nombra al competidor "%s"', (competidor) => {
    const infractores = ficheros.filter((fichero) =>
      fs.readFileSync(fichero, 'utf-8').toLowerCase().includes(competidor),
    );
    expect(infractores).toEqual([]);
  });
});
