import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * NINGUN ELEMENTO PULSABLE PUEDE COMPARTIR COLOR DE RELLENO CON SU FONDO.
 *
 * Medido en el navegador antes de este arreglo, con el sistema en modo oscuro: en `/actas/` y en
 * `/nominas/` el relleno de los dos CTA y el fondo de la pagina eran los dos `rgb(15,23,42)`.
 * Contraste 1:1 y cero borde: los botones DESAPARECIAN y solo quedaba el texto blanco flotando.
 * En claro se ven perfectamente, asi que el defecto no aparece en ninguna revision que no mire la
 * pagina en oscuro — y son los dos unicos botones de conversion de una landing de sector.
 *
 * La guarda lee el CSS en linea de las dos paginas y compara el relleno del CTA con el del cuerpo
 * DENTRO del bloque `prefers-color-scheme: dark`. Es texto, no pixeles, pero cierra exactamente el
 * agujero: el defecto era una regla que faltaba.
 */
const PAGINAS = ['actas', 'nominas'];

/** Ultimo valor declarado de una propiedad para un selector dentro de un trozo de CSS. */
function valorDe(css: string, selector: string, propiedad: string): string | null {
  const bloques = [...css.matchAll(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'g'))];
  let valor: string | null = null;
  for (const bloque of bloques) {
    const m = new RegExp(`(?:^|;)\\s*${propiedad}\\s*:\\s*([^;]+)`).exec(bloque[1] ?? '');
    if (m?.[1] !== undefined) valor = m[1].trim().toLowerCase();
  }
  return valor;
}

/** El trozo de CSS que solo se aplica en tema oscuro. */
function bloqueOscuro(css: string): string {
  const i = css.indexOf('@media (prefers-color-scheme: dark)');
  expect(i, 'la página declara un tema oscuro').toBeGreaterThan(-1);
  return css.slice(i);
}

describe('G17: los CTA de las landings de sector no desaparecen en modo oscuro', () => {
  it.each(PAGINAS)('/%s/ da al CTA un relleno distinto del fondo de la página', (pagina) => {
    const html = readFileSync(join(__dirname, '..', '..', 'public', pagina, 'index.html'), 'utf-8');
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
    expect(css, 'la página trae su CSS en línea').not.toBe('');

    const oscuro = bloqueOscuro(css);
    const fondoPagina = valorDe(oscuro, '\\bbody', 'background');
    const fondoCta = valorDe(oscuro, '\\.cta', 'background') ?? valorDe(css, '\\.cta', 'background');

    expect(fondoPagina, 'el tema oscuro repinta el fondo del cuerpo').not.toBeNull();
    expect(fondoCta, 'el CTA declara su relleno').not.toBeNull();
    expect(fondoCta).not.toBe(fondoPagina);
  });

  it.each(PAGINAS)('/%s/ mantiene el texto del CTA legible sobre su nuevo relleno', (pagina) => {
    const html = readFileSync(join(__dirname, '..', '..', 'public', pagina, 'index.html'), 'utf-8');
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
    const oscuro = bloqueOscuro(css);

    // Si el relleno se aclara, el texto NO puede quedarse en blanco: se invierte tambien.
    expect(valorDe(oscuro, '\\.cta', 'color')).not.toBe('#fff');
    expect(valorDe(oscuro, '\\.cta strong', 'color')).not.toBeNull();
  });
});
