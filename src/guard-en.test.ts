import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '..');

/**
 * Vocabulario prohibido en INGLÉS, y barrido de TODAS las páginas del repositorio.
 *
 * El guardián español (src/guard.test.ts) mira `public/` e `index.html` y busca subcadenas.
 * Esa técnica no sirve tal cual en inglés: una prohibición por subcadena de "ai" casaría con
 * email, available, detail, again, main, fail y said. Aquí las fronteras de palabra son
 * obligatorias, y la prohibición del token suelto "AI" es SENSIBLE A MAYÚSCULAS por el mismo
 * motivo.
 *
 * Y el barrido: `comprobador/index.html` vive en la raíz del repo, fuera de `public/` y fuera
 * de `index.html`, así que nunca lo miró NADIE — ni por vocabulario ni por CSP. Este barrido
 * recorre todo .html del repositorio salvo dist/ y node_modules/, y exige un mínimo de ficheros
 * vistos para que un fallo del recorrido no se disfrace de verde.
 */

interface Prohibida {
  nombre: string;
  regex: RegExp;
  /** Se permite si aparece precedida (en 40 caracteres) por una negación: los descargos
   *  honestos NECESITAN decir "does not guarantee". */
  admiteNegacion?: boolean;
}

export const PROHIBIDAS_EN: Prohibida[] = [
  { nombre: 'anonymize/anonymisation', regex: /anonymi/i },
  { nombre: 'de-identify / pseudonymisation', regex: /\b(de-?identif|pseudonymi)/i },
  { nombre: 'certified / certification', regex: /certif/i },
  {
    nombre: 'GDPR/HIPAA/CCPA compliant',
    regex: /\b(gdpr|hipaa|ccpa)[- ]?(compliant|compliance|ready|approved)/i,
  },
  { nombre: 'AI (token suelto)', regex: /\bA\.?I\.?\b/ },
  { nombre: 'AI-powered', regex: /\bai[- ]powered\b/i },
  { nombre: 'artificial intelligence', regex: /\bartificial intelligence\b/i },
  { nombre: 'machine learning', regex: /\bmachine learning\b/i },
  { nombre: 'guarantee sin negación', regex: /\bguarantee(s|d)?\b/i, admiteNegacion: true },
  {
    nombre: 'teatro de confianza (100% secure, bank-level, unhackable...)',
    regex: /\b(100% (secure|safe|compliant|guaranteed)|fully compliant|bank[- ]level|military[- ]grade|unhackable)\b/i,
  },
  {
    nombre: 'reclamos de admisibilidad',
    regex: /\b(court[- ]admissible|legally binding|admissible (as|in) evidence|court[- ]ready|legally valid)\b/i,
  },
  {
    nombre: 'recuperación imposible',
    regex: /\b(impossible to recover|unrecoverable|irreversibly destroyed|permanently unrecoverable)\b/i,
  },
  { nombre: 'promesas de ingresos', regex: /\b(make money|revenue|profit|roi)\b/i },
];

const NEGACIONES = /(not|no|never|cannot|can't|doesn't|does not|isn't|is not)\b[^.]{0,40}$/i;

function infracciones(texto: string): { nombre: string; muestra: string }[] {
  const salida: { nombre: string; muestra: string }[] = [];
  for (const prohibida of PROHIBIDAS_EN) {
    const buscador = new RegExp(prohibida.regex.source, `${prohibida.regex.flags}g`);
    let m: RegExpExecArray | null = buscador.exec(texto);
    while (m !== null) {
      const antes = texto.slice(Math.max(0, m.index - 60), m.index);
      const permitido = prohibida.admiteNegacion === true && NEGACIONES.test(antes);
      if (!permitido) {
        salida.push({
          nombre: prohibida.nombre,
          muestra: texto.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' '),
        });
      }
      m = buscador.exec(texto);
    }
  }
  return salida;
}

function listar(dir: string, extension: string, saltar: Set<string>): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (saltar.has(entrada.name)) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      salida.push(...listar(ruta, extension, saltar));
    } else if (entrada.name.endsWith(extension)) {
      salida.push(ruta);
    }
  }
  return salida;
}

const SALTAR = new Set(['node_modules', 'dist', '.git', '.forja', 'forja', '.claude', 'arte-gumroad']);

const HTML = listar(RAIZ, '.html', SALTAR);
const TS_EN = [
  resolve(__dirname, 'content', 'en.ts'),
  resolve(__dirname, 'content', 'guias.en.ts'),
  resolve(__dirname, 'legal', 'textos.en.ts'),
];

describe('barrido de páginas: cobertura', () => {
  it('recorre TODAS las páginas del repo, incluida comprobador/index.html (que estaba fuera)', () => {
    const relativos = HTML.map((f) => relative(RAIZ, f).split('\\').join('/'));
    expect(relativos).toContain('index.html');
    expect(relativos).toContain('comprobador/index.html');
    expect(relativos).toContain('en/index.html');
    expect(relativos).toContain('en/checker/index.html');
    // Mínimo defensivo: si el recorrido se rompe y devuelve 3 ficheros, esto lo dice.
    expect(relativos.length).toBeGreaterThanOrEqual(18);
  });
});

describe('vocabulario prohibido en inglés', () => {
  it.each(HTML.map((f) => relative(RAIZ, f).split('\\').join('/')))('%s está limpio', (relativo) => {
    const contenido = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    expect(infracciones(contenido)).toEqual([]);
  });

  it.each(TS_EN.map((f) => relative(RAIZ, f).split('\\').join('/')))(
    '%s (fuente de la copia inglesa) está limpio',
    (relativo) => {
      const contenido = readFileSync(resolve(RAIZ, relativo), 'utf-8');
      expect(infracciones(contenido)).toEqual([]);
    },
  );
});

describe('el guardián inglés distingue de verdad', () => {
  it('NO marca palabras corrientes que contienen "ai"', () => {
    expect(infracciones('email, available, detail, again, main, fail, said')).toEqual([]);
  });

  it('marca "AI-powered" y el token suelto "AI"', () => {
    expect(infracciones('An AI-powered tool').length).toBeGreaterThan(0);
    expect(infracciones('Built with AI.').length).toBeGreaterThan(0);
  });

  it('marca "GDPR compliant" pero deja nombrar el reglamento sin reclamar cumplimiento', () => {
    expect(infracciones('Fully GDPR compliant').length).toBeGreaterThan(0);
    expect(infracciones('The UK GDPR applies to this disclosure.')).toEqual([]);
  });

  it('deja pasar "does not guarantee" y marca "guaranteed removal"', () => {
    expect(infracciones('This tool does not guarantee the document is clean.')).toEqual([]);
    expect(infracciones('Guaranteed removal of every identifier').length).toBeGreaterThan(0);
  });

  it('marca "certified" y "certificate"', () => {
    expect(infracciones('A certified report').length).toBeGreaterThan(0);
    expect(infracciones('You get a certificate').length).toBeGreaterThan(0);
  });

  it('marca reclamos de admisibilidad y de recuperación imposible', () => {
    expect(infracciones('court-admissible evidence').length).toBeGreaterThan(0);
    expect(infracciones('impossible to recover').length).toBeGreaterThan(0);
  });
});
