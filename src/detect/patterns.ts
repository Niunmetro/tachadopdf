import type { Hit } from '../types';

const LETRAS_CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * Separadores que pueden aparecer DENTRO de un identificador.
 *
 * Dos ampliaciones, y las dos salen de medir la salida real de mupdf sobre PDFs de verdad:
 *
 *  1. La familia entera de espacios y de rayas tipograficas, no solo el espacio y el guion ASCII.
 *     Un `12.345.678–Z` con raya corta (WinAnsi 0x96) no lo veia nadie, y es lo que escribe Word
 *     en cuanto alguien teclea dos guiones.
 *  2. El separador puede ir en CUALQUIER posicion, no solo en las fronteras 2-3-3-1. mupdf mete
 *     un espacio el solo cuando el hueco entre dos glifos es grande: basta un kern de 400
 *     milesimas de em —o que el maquetador haya espaciado las letras— para que el texto extraible
 *     sea `1234 5678Z` o `1 2 3 4 5 6 7 8 Z`. Medido: el detector no enganchaba ninguno de los
 *     dos, la herramienta no ofrecia caja, la guarda no lo reencontraba, y el sello salia verde
 *     con el DNI entero en el texto del archivo entregado.
 *
 * La ampliacion vale SOLO para los patrones con digito de control (DNI, NIE, IBAN, NUSS). Con el
 * telefono y la referencia catastral no se hace: no tienen con que descartarse, y juntar dos
 * columnas de una tabla fabrica nueve digitos seguidos. Es la misma frontera que ya rige el
 * barrido de saltos de linea en `verify.ts`, por la misma razon.
 */
const ESPACIOS = ' \\u00A0\\u2000-\\u200A\\u202F\\u205F';
const GUIONES = '\\u002D\\u2010-\\u2015\\u2212';
const SEP = `[${ESPACIOS}.${GUIONES}]`;
const SEP_NUSS = `[${ESPACIOS}./${GUIONES}]`;
const TODOS_LOS_SEPARADORES = new RegExp(`[${ESPACIOS}./${GUIONES}]`, 'g');

export function normalizar(raw: string): string {
  return raw.replace(TODOS_LOS_SEPARADORES, '').toUpperCase();
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
  // Los cuatro con digito de control admiten un separador entre CUALQUIER par de caracteres. El
  // digito de control es lo que hace que eso no sea un coladero: sin el, `\d(?:SEP?\d){7}[A-Za-z]`
  // engancharia cualquier fila de una tabla.
  {
    kind: 'dni',
    regex: new RegExp(`(?<![\\dA-Za-z])\\d(?:${SEP}?\\d){7}${SEP}?[A-Za-z](?![\\dA-Za-z])`, 'g'),
    valido: esDniValido,
  },
  {
    kind: 'nie',
    regex: new RegExp(`(?<![\\dA-Za-z])[XYZxyz](?:${SEP}?\\d){7}${SEP}?[A-Za-z](?![\\dA-Za-z])`, 'g'),
    valido: esNieValido,
  },
  {
    kind: 'iban',
    regex: new RegExp(`(?<![\\dA-Za-z])ES(?:${SEP}?\\d){22}(?![\\dA-Za-z])`, 'gi'),
    valido: esIbanEsValido,
  },
  {
    kind: 'nuss',
    regex: new RegExp(`(?<![\\dA-Za-z])\\d(?:${SEP_NUSS}?\\d){11}(?![\\dA-Za-z])`, 'g'),
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
  {
    kind: 'catastro',
    regex: /(?<![\dA-Za-z])[A-Za-z0-9]{20}(?![\dA-Za-z])/g,
    valido: esRefCatastralValido,
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
