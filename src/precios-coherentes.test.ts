import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { PRECIO_PRO } from './config';
import { FREE_MAX_PAGES, FREE_MONTHLY_LIMIT } from './freemium/quota';
import { CONTENIDOS } from './content/index';
import { LOCALES } from './content/registro';

const RAIZ = resolve(__dirname, '..');
const SALTAR = new Set(['node_modules', 'dist', '.git', '.forja', 'forja', '.claude', 'arte-gumroad']);

/**
 * UNA sola fuente para el número de documentos gratis, el tope de páginas, el precio y el modelo
 * de cobro. El JSON-LD de la portada decía «Gratuito (3 documentos/mes)» mientras la misma página
 * decía 5 tres párrafos más abajo: la web se contradecía a sí misma delante de Google.
 *
 * ⚠ PARADA (ruta sensible = precios, requiere APROBADO-ANGEL, ver docs/BITACORA.md).
 * `public/actas/index.html` y `public/nominas/index.html` están EXCLUIDAS de este barrido porque
 * hoy dicen cosas que el código y los Términos no sostienen:
 *   - «59 €/año» y «149 €/año», cuando TERMINOS §5 dice pago único y config.ts tiene un solo SKU;
 *   - un tramo «Despacho» de 3 puestos con logo en el informe que no existe en license/gumroad.ts
 *     ni en report/report.ts;
 *   - una garantía de devolución de 30 días que los Términos no recogen y que gestiona Gumroad.
 * No se corrigen aquí porque son decisiones de precio del owner. Cuando se corrijan, quita las
 * dos rutas de esta lista y el barrido las cubrirá sin tocar nada más.
 */
const PENDIENTES_DEL_OWNER = new Set(['public/actas/index.html', 'public/nominas/index.html']);

function listarHtml(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (SALTAR.has(entrada.name)) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...listarHtml(ruta));
    else if (entrada.name.endsWith('.html')) salida.push(ruta);
  }
  return salida;
}

const PAGINAS = listarHtml(RAIZ)
  .map((f) => relative(RAIZ, f).split('\\').join('/'))
  .filter((r) => !PENDIENTES_DEL_OWNER.has(r));

describe('coherencia de cuota y precio en todas las páginas', () => {
  it('el barrido no está vacío y cubre las páginas generadas', () => {
    expect(PAGINAS).toContain('index.html');
    expect(PAGINAS).toContain('en/index.html');
    expect(PAGINAS.length).toBeGreaterThanOrEqual(16);
  });

  it.each(PAGINAS)('%s: ninguna cifra de documentos/mes contradice el código', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    const cifras = [
      ...Array.from(html.matchAll(/(\d+)\s*documentos?\s*(?:al mes|\/mes|este mes)/gi)),
      ...Array.from(html.matchAll(/(\d+)\s*documents?\s*(?:a month|\/month|this month)/gi)),
    ].map((m) => Number(m[1]));
    for (const cifra of cifras) expect(cifra).toBe(FREE_MONTHLY_LIMIT);
  });

  it.each(PAGINAS)('%s: ninguna cifra de páginas por documento contradice el código', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    const cifras = [
      ...Array.from(html.matchAll(/hasta\s*(\d+)\s*páginas/gi)),
      ...Array.from(html.matchAll(/up to\s*(\d+)\s*pages/gi)),
    ].map((m) => Number(m[1]));
    for (const cifra of cifras) expect(cifra).toBe(FREE_MAX_PAGES);
  });

  it.each(PAGINAS)('%s: no vende una suscripción anual (los Términos dicen pago único)', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    expect(html).not.toMatch(/\d+\s*€\s*\/\s*(año|year)/i);
    expect(html).not.toMatch(/€\s*\d+\s*\/\s*(año|year)/i);
    expect(html).not.toMatch(/\bper year\b/i);
  });

  // Solo los importes en CONTEXTO DE COMPRA. El texto del dolor cita sanciones de la AEPD
  // («15.000 € por exponer un acta de junta», expediente PS/00378/2019), que son cifras del
  // mundo, no precios nuestros: un barrido de «todo importe en euros» las marcaría y el test se
  // volvería ruido que nadie mira.
  // (El ejemplo que había aquí antes, «6.000 € por un listado de morosos», se retiró el
  //  2026-08-08 de toda la web: no tenía ningún expediente detrás. Ver docs/BITACORA.md.)
  const COMPRA = /(pro\b|licenc|pago|precio|price|payment|purchase|comprar|get pro)/i;

  it.each(PAGINAS)('%s: todo importe citado como precio es el precio único', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    const esperado = PRECIO_PRO.replace(/[^\d]/g, '');
    for (const m of html.matchAll(/([\d.,]*\d)\s*€/g)) {
      const inicio = m.index ?? 0;
      const contexto = html.slice(Math.max(0, inicio - 80), inicio + 80);
      if (!COMPRA.test(contexto)) continue;
      expect(m[1]).toBe(esperado);
    }
  });
});

describe('la copia deriva las cifras del código, no las escribe a mano', () => {
  it.each(LOCALES)('%s: la oferta gratuita del JSON-LD lleva las cifras reales', (locale) => {
    const c = CONTENIDOS[locale];
    expect(c.home.ofertaGratis).toContain(String(FREE_MONTHLY_LIMIT));
    expect(c.home.ofertaGratis).toContain(String(FREE_MAX_PAGES));
  });

  it.each(LOCALES)('%s: el argumento de Pro lleva el precio real y dice pago único', (locale) => {
    const c = CONTENIDOS[locale];
    expect(c.pro.argumento).toContain(PRECIO_PRO);
    expect(c.app.comprarPro).toContain(PRECIO_PRO);
  });
});
