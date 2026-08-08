import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('estilo.css', () => {
  const cssPath = join(__dirname, 'estilo.css');
  const cssContent = readFileSync(cssPath, 'utf-8');

  it('debe contener flex-wrap y gap en .tachar-todas', () => {
    const tachadaTodasRegex = /\.tachar-todas\s*\{[^}]*flex-wrap[^}]*\}|\.tachar-todas\s*\{[^}]*gap[^}]*\}/;
    const hasFlexWrap = /\.tachar-todas\s*\{[^}]*flex-wrap[^}]*\}/s.test(cssContent);
    const hasGap = /\.tachar-todas\s*\{[^}]*gap[^}]*\}/s.test(cssContent);

    expect(hasFlexWrap).toBe(true);
    expect(hasGap).toBe(true);
  });

  /**
   * ESTA GUARDA ESTABA AL REVES Y FIJABA EL DEFECTO. Exigia `text-overflow: ellipsis` con
   * `white-space: nowrap` y `max-width: 300px`, que es exactamente lo que recortaba el boton: los
   * 33 primeros caracteres de los nueve botones son identicos («Tachar todas las apariciones de
   * «») y lo unico que los distingue —el valor— va al final. Medido en la pantalla: en escritorio
   * sobrevivian tres caracteres («12.3…», «ES9…», «876…») y en el movil UNO («1…», «E…», «8…»).
   * Nueve barras negras indistinguibles en la pantalla donde se decide que se tacha.
   *
   * La regla correcta es la contraria: ese boton AJUSTA en varias lineas y no se recorta.
   */
  it('el botón de tachar todas las apariciones no recorta el valor', () => {
    const bloque = /\.tachar-todas\s+button\s*\{([^}]*)\}/s.exec(cssContent)?.[1] ?? '';

    expect(bloque).not.toBe('');
    expect(bloque).not.toMatch(/text-overflow\s*:\s*ellipsis/);
    expect(bloque).not.toMatch(/white-space\s*:\s*nowrap/);
    expect(bloque).toMatch(/white-space\s*:\s*normal/);
  });

  /**
   * `.hit-box` y `.hit-box--selected` no tenian NI UNA regla, asi que las detecciones heredaban el
   * estilo global de `button` (navy macizo, esquinas redondeadas): identicas a un tachado ya
   * consumado, dibujadas antes de tachar nada, y una elegida indistinguible de una sin elegir.
   */
  it('una detección sin elegir y una elegida se dibujan distinto, y ninguna como un tachado hecho', () => {
    const sinElegir = /button\.hit-box\s*\{([^}]*)\}/s.exec(cssContent)?.[1] ?? '';
    const elegida = /button\.hit-box--selected\s*\{([^}]*)\}/s.exec(cssContent)?.[1] ?? '';

    expect(sinElegir).toMatch(/border\s*:[^;]*dashed/);
    expect(elegida).toMatch(/border\s*:[^;]*solid/);
    expect(elegida).toMatch(/background\s*:\s*var\(--tinta\)/);
    // El candidato deja ver el dato que hay debajo: su relleno es translucido.
    expect(sinElegir).toMatch(/background\s*:\s*rgba\(/);
  });
});
