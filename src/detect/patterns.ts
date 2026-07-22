import type { Hit } from '../types';

const LETRAS_CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';

const SEP = '[ .\\-]';
const SEP_NUSS = '[ ./\\-]';

export function normalizar(raw: string): string {
  return raw.replace(/[ ./\-]/g, '').toUpperCase();
}

export function esDniValido(v: string): boolean {
  const n = normalizar(v);
  if (!/^\d{8}[A-Z]$/.test(n)) return false;
  const num = parseInt(n.slice(0, 8), 10);
  const letra = n[8];
  return LETRAS_CONTROL[num % 23] === letra;
}

export function esNieValido(v: string): boolean {
  const n = normalizar(v);
  if (!/^[XYZ]\d{7}[A-Z]$/.test(n)) return false;
  const mapaPrefijo: Record<string, string> = { X: '0', Y: '1', Z: '2' };
  const digitos = (mapaPrefijo[n.charAt(0)] ?? '') + n.slice(1, 8);
  const num = parseInt(digitos, 10);
  const letra = n.charAt(8);
  return LETRAS_CONTROL[num % 23] === letra;
}

function mod97DeCadena(digitos: string): number {
  let resto = 0;
  for (const ch of digitos) {
    resto = (resto * 10 + Number(ch)) % 97;
  }
  return resto;
}

export function esIbanEsValido(v: string): boolean {
  const n = normalizar(v);
  if (!/^ES\d{22}$/.test(n)) return false;
  const reordenado = n.slice(4) + n.slice(0, 4);
  const expandido = reordenado.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
  return mod97DeCadena(expandido) === 1;
}

export function esNussValido(v: string): boolean {
  const n = normalizar(v);
  if (!/^\d{12}$/.test(n)) return false;
  const base = n.slice(0, 10);
  const control = n.slice(10, 12);
  let resto = parseInt(base, 10) % 97;
  if (resto === 0) resto = 97;
  const esperado = String(resto).padStart(2, '0');
  return esperado === control;
}

export function esRefCatastralValido(v: string): boolean {
  const n = normalizar(v);
  if (!/^[A-Z0-9]{20}$/.test(n)) return false;
  if (/^\d{20}$/.test(n)) return false;
  if (/^[A-Z]{20}$/.test(n)) return false;
  return true;
}

interface Candidato {
  kind: Hit['kind'];
  regex: RegExp;
  valido?: (valor: string) => boolean;
}

const CANDIDATOS: Candidato[] = [
  {
    kind: 'dni',
    regex: new RegExp(`(?<![\\dA-Za-z])\\d{2}${SEP}?\\d{3}${SEP}?\\d{3}${SEP}?[A-Za-z](?![\\dA-Za-z])`, 'g'),
    valido: esDniValido,
  },
  {
    kind: 'nie',
    regex: new RegExp(`(?<![\\dA-Za-z])[XYZxyz]${SEP}?\\d{3}${SEP}?\\d{4}${SEP}?[A-Za-z](?![\\dA-Za-z])`, 'g'),
    valido: esNieValido,
  },
  {
    kind: 'iban',
    regex: new RegExp(`(?<![\\dA-Za-z])ES${SEP}?\\d{2}(?:${SEP}?\\d{4}){5}(?![\\dA-Za-z])`, 'gi'),
    valido: esIbanEsValido,
  },
  {
    kind: 'nuss',
    regex: new RegExp(`(?<![\\dA-Za-z])\\d{2}${SEP_NUSS}?\\d{8}${SEP_NUSS}?\\d{2}(?![\\dA-Za-z])`, 'g'),
    valido: esNussValido,
  },
  {
    kind: 'telefono',
    regex: /(?<![\d+])(?:(?:\+34|0034)[ .\-]?)?[6-9](?:[ .\-]?\d){8}(?!\d)/g,
  },
  {
    kind: 'email',
    regex: /(?<![\w.+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?![\w.-])/g,
  },
];

export function detect(text: string): Hit[] {
  const hits: Hit[] = [];
  for (const candidato of CANDIDATOS) {
    candidato.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = candidato.regex.exec(text)) !== null) {
      const valor = m[0];
      if (!candidato.valido || candidato.valido(valor)) {
        hits.push({
          kind: candidato.kind,
          value: valor,
          start: m.index,
          end: m.index + valor.length,
        });
      }
      if (m[0].length === 0) {
        candidato.regex.lastIndex++;
      }
    }
  }
  return hits;
}
