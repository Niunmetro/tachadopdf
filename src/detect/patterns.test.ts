import { describe, expect, it } from 'vitest';
import { detect, esDniValido, esIbanEsValido, esNieValido, esNussValido, normalizar } from './patterns';
import type { Hit } from '../types';

function telefonos(hits: Hit[]): string[] {
  return hits.filter((h) => h.kind === 'telefono').map((h) => h.value);
}

describe('normalizar', () => {
  it('quita puntos, guiones y espacios y pasa a mayúsculas', () => {
    expect(normalizar('12.345.678-z')).toBe('12345678Z');
    expect(normalizar('ES91 2100 0418 4502 0005 1332')).toBe('ES9121000418450200051332');
    expect(normalizar('  x-1234567-l  ')).toBe('X1234567L');
  });
});

describe('esDniValido', () => {
  it('acepta un DNI válido sin separadores', () => {
    expect(esDniValido('12345678Z')).toBe(true);
  });

  it('acepta el mismo DNI con separadores (puntos y guion)', () => {
    expect(esDniValido('12.345.678-Z')).toBe(true);
    expect(esDniValido('12 345 678 Z')).toBe(true);
  });

  it('acepta minúsculas', () => {
    expect(esDniValido('12345678z')).toBe(true);
  });

  it('rechaza letra de control incorrecta', () => {
    expect(esDniValido('12345678A')).toBe(false);
  });

  it('rechaza formato inválido (longitud, sin letra)', () => {
    expect(esDniValido('1234567Z')).toBe(false);
    expect(esDniValido('123456789')).toBe(false);
    expect(esDniValido('')).toBe(false);
  });
});

describe('esNieValido', () => {
  it('acepta un NIE válido (X) sin separadores', () => {
    expect(esNieValido('X1234567L')).toBe(true);
  });

  it('acepta el mismo NIE con separadores', () => {
    expect(esNieValido('X-1234567-L')).toBe(true);
    expect(esNieValido('X 1234567 L')).toBe(true);
  });

  it('calcula igual con prefijos Y y Z (mapeados a 1 y 2)', () => {
    // Y1234567 -> dígitos '11234567'; Z1234567 -> dígitos '21234567'
    const letraY = ['T', 'R', 'W', 'A', 'G', 'M', 'Y', 'F', 'P', 'D', 'X', 'B', 'N', 'J', 'Z', 'S', 'Q', 'V', 'H', 'L', 'C', 'K', 'E'][11234567 % 23];
    const letraZ = ['T', 'R', 'W', 'A', 'G', 'M', 'Y', 'F', 'P', 'D', 'X', 'B', 'N', 'J', 'Z', 'S', 'Q', 'V', 'H', 'L', 'C', 'K', 'E'][21234567 % 23];
    expect(esNieValido(`Y1234567${letraY}`)).toBe(true);
    expect(esNieValido(`Z1234567${letraZ}`)).toBe(true);
  });

  it('rechaza letra de control incorrecta', () => {
    expect(esNieValido('X1234567A')).toBe(false);
  });

  it('rechaza prefijo inválido o formato incorrecto', () => {
    expect(esNieValido('A1234567L')).toBe(false);
    expect(esNieValido('X123456L')).toBe(false);
  });
});

describe('esIbanEsValido', () => {
  it('acepta un IBAN español válido sin espacios', () => {
    expect(esIbanEsValido('ES9121000418450200051332')).toBe(true);
  });

  it('acepta el mismo IBAN con espacios cada 4 caracteres', () => {
    expect(esIbanEsValido('ES91 2100 0418 4502 0005 1332')).toBe(true);
  });

  it('rechaza un IBAN con dígito de control mod-97 incorrecto', () => {
    expect(esIbanEsValido('ES9121000418450200051333')).toBe(false);
    expect(esIbanEsValido('ES0021000418450200051332')).toBe(false);
  });

  it('rechaza formato inválido (país, longitud)', () => {
    expect(esIbanEsValido('FR9121000418450200051332')).toBe(false);
    expect(esIbanEsValido('ES912100041845020005133')).toBe(false);
  });
});

describe('esNussValido', () => {
  it('acepta un NUSS válido sin separadores', () => {
    expect(esNussValido('281234567840')).toBe(true);
  });

  it('acepta el mismo NUSS con separadores', () => {
    expect(esNussValido('28.12345678.40')).toBe(true);
    expect(esNussValido('28-12345678-40')).toBe(true);
    expect(esNussValido('28 12345678 40')).toBe(true);
  });

  it('rechaza dígitos de control incorrectos', () => {
    expect(esNussValido('281234567841')).toBe(false);
    expect(esNussValido('281234567800')).toBe(false);
  });

  it('rechaza formato inválido (longitud)', () => {
    expect(esNussValido('28123456784')).toBe(false);
    expect(esNussValido('2812345678400')).toBe(false);
  });
});

describe('detect', () => {
  it('encuentra un DNI válido y calcula offsets sobre el texto original', () => {
    const texto = 'Mi DNI es 12.345.678-Z, gracias.';
    const hits = detect(texto);
    const dni = hits.find((h) => h.kind === 'dni');
    expect(dni).toBeDefined();
    expect(dni?.value).toBe('12.345.678-Z');
    expect(texto.slice(dni!.start, dni!.end)).toBe('12.345.678-Z');
  });

  it('no marca un DNI con letra de control incorrecta', () => {
    const texto = 'DNI incorrecto: 12345678A.';
    const hits = detect(texto);
    expect(hits.some((h) => h.kind === 'dni')).toBe(false);
  });

  it('encuentra un NIE válido', () => {
    const texto = 'NIE: X1234567L';
    const hits = detect(texto);
    const nie = hits.find((h) => h.kind === 'nie');
    expect(nie).toBeDefined();
    expect(nie?.value).toBe('X1234567L');
  });

  it('encuentra un IBAN válido con espacios y calcula offsets correctos', () => {
    const texto = 'Transferencia a ES91 2100 0418 4502 0005 1332 antes del viernes.';
    const hits = detect(texto);
    const iban = hits.find((h) => h.kind === 'iban');
    expect(iban).toBeDefined();
    expect(iban?.value).toBe('ES91 2100 0418 4502 0005 1332');
    expect(texto.slice(iban!.start, iban!.end)).toBe('ES91 2100 0418 4502 0005 1332');
  });

  it('no marca un IBAN con mod-97 incorrecto', () => {
    const texto = 'Cuenta ES9121000418450200051333 no válida.';
    const hits = detect(texto);
    expect(hits.some((h) => h.kind === 'iban')).toBe(false);
  });

  it('encuentra un NUSS válido con separadores', () => {
    const texto = 'Número de la Seguridad Social: 28-12345678-40.';
    const hits = detect(texto);
    const nuss = hits.find((h) => h.kind === 'nuss');
    expect(nuss).toBeDefined();
    expect(nuss?.value).toBe('28-12345678-40');
  });

  it('encuentra un teléfono español con y sin +34 y espacios', () => {
    const texto1 = 'Llámame al 612 345 678 cuando puedas.';
    const texto2 = 'Contacto: +34 712345678';
    expect(detect(texto1).some((h) => h.kind === 'telefono' && h.value.includes('612 345 678'))).toBe(true);
    expect(detect(texto2).some((h) => h.kind === 'telefono' && h.value.includes('712345678'))).toBe(true);
  });

  it('no marca como teléfono un número que no empieza por 6/7/8/9', () => {
    const texto = 'Código postal 512345678 no es teléfono válido en este formato.';
    const hits = detect(texto);
    // empieza por 5, no debe capturarse como teléfono con esta forma exacta
    expect(hits.some((h) => h.kind === 'telefono' && h.value.replace(/\D/g, '') === '512345678')).toBe(false);
  });

  it('encuentra un email', () => {
    const texto = 'Escríbeme a persona.ejemplo@dominio.es para más información.';
    const hits = detect(texto);
    const email = hits.find((h) => h.kind === 'email');
    expect(email).toBeDefined();
    expect(email?.value).toBe('persona.ejemplo@dominio.es');
  });

  it('devuelve varios hits distintos cuando hay varios datos en el mismo texto', () => {
    const texto = 'DNI 12345678Z, tel 612345678, email a@b.com';
    const hits = detect(texto);
    const kinds = hits.map((h) => h.kind).sort();
    expect(kinds).toEqual(['dni', 'email', 'telefono']);
  });

  it('no produce falsos positivos en un texto sin datos personales', () => {
    const texto = 'Este documento no contiene ningún dato identificativo relevante.';
    expect(detect(texto)).toEqual([]);
  });

  describe('teléfonos con separadores (A4)', () => {
    it.each([
      ['612 34 56 78', '612 34 56 78'],
      ['91 234 56 78', '91 234 56 78'],
      ['612-345-678', '612-345-678'],
      ['612.345.678', '612.345.678'],
      ['0034612345678', '0034612345678'],
      ['+34 612 345 678', '+34 612 345 678'],
      ['612 345 678', '612 345 678'],
      ['612345678', '612345678'],
    ])('detecta el teléfono %s', (entrada, esperado) => {
      const texto = `Teléfono: ${entrada}.`;
      const hits = telefonos(detect(texto));
      expect(hits).toContain(esperado);
    });

    it('no marca como teléfono más de 9 dígitos pegados', () => {
      const texto = 'Referencia 6123456789 no es un teléfono.';
      const hits = telefonos(detect(texto));
      expect(hits.some((v) => v.replace(/\D/g, '') === '6123456789')).toBe(false);
    });
  });

  describe('IBAN con punto/guion (M1)', () => {
    it('encuentra un IBAN válido con guiones cada 4 caracteres', () => {
      const texto = 'IBAN: ES91-2100-0418-4502-0005-1332.';
      const hits = detect(texto);
      const iban = hits.find((h) => h.kind === 'iban');
      expect(iban).toBeDefined();
      expect(iban?.value).toBe('ES91-2100-0418-4502-0005-1332');
    });

    it('encuentra un IBAN válido con puntos cada 4 caracteres', () => {
      const texto = 'IBAN: ES91.2100.0418.4502.0005.1332.';
      const hits = detect(texto);
      const iban = hits.find((h) => h.kind === 'iban');
      expect(iban).toBeDefined();
      expect(iban?.value).toBe('ES91.2100.0418.4502.0005.1332');
    });

    it('no marca un IBAN con dígito de control mod-97 incorrecto y separadores', () => {
      const texto = 'IBAN: ES91-2100-0418-4502-0005-1333.';
      const hits = detect(texto);
      expect(hits.some((h) => h.kind === 'iban')).toBe(false);
    });
  });

  describe('referencia catastral', () => {
    it('encuentra una referencia catastral válida con kind catastro', () => {
      const texto = 'Ref. catastral: 9872023VH5797S0001WX en el recibo.';
      const hits = detect(texto);
      const catastro = hits.find((h) => h.kind === 'catastro');
      expect(catastro).toBeDefined();
      expect(catastro?.value).toBe('9872023VH5797S0001WX');
    });

    it('no marca como catastro una cadena alfanumérica de 19 caracteres', () => {
      const texto = 'Código: A123456789012345678 fin.';
      const hits = detect(texto);
      expect(hits.some((h) => h.kind === 'catastro')).toBe(false);
    });

    it('no marca como catastro una cadena alfanumérica de 21 caracteres', () => {
      const texto = 'Código: A12345678901234567890 fin.';
      const hits = detect(texto);
      expect(hits.some((h) => h.kind === 'catastro')).toBe(false);
    });
  });

  describe('NUSS con barra (M2)', () => {
    it('encuentra un NUSS válido separado por barras', () => {
      const texto = 'Nº Seguridad Social: 28/12345678/40.';
      const hits = detect(texto);
      const nuss = hits.find((h) => h.kind === 'nuss');
      expect(nuss).toBeDefined();
      expect(nuss?.value).toBe('28/12345678/40');
    });

    it('esNussValido acepta el NUSS separado por barras', () => {
      expect(esNussValido('28/12345678/40')).toBe(true);
    });

    it('no marca una fecha (28/12/2024) como NUSS', () => {
      const texto = 'Fecha: 28/12/2024.';
      const hits = detect(texto);
      expect(hits.some((h) => h.kind === 'nuss')).toBe(false);
    });

    it('sigue aceptando NUSS con espacio, punto y guion', () => {
      expect(detect('28 12345678 40').some((h) => h.kind === 'nuss')).toBe(true);
      expect(detect('28.12345678.40').some((h) => h.kind === 'nuss')).toBe(true);
      expect(detect('28-12345678-40').some((h) => h.kind === 'nuss')).toBe(true);
    });
  });
});
