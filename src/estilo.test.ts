import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Contraste WCAG de dos colores `#rrggbb`. */
function contraste(a: string, b: string): number {
  const luz = (hex: string): number => {
    const canal = (i: number): number => {
      const v = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
  };
  const [x, y] = [luz(a), luz(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('estilo.css', () => {
  const cssPath = join(__dirname, 'estilo.css');
  const cssContent = readFileSync(cssPath, 'utf-8');

  /**
   * UN GRIS DE TEMA OSCURO SOBRE FONDO BLANCO. `--gris` era #94a3b8 —2,56:1 sobre blanco— y le
   * habia tocado, por casualidad, a las dos frases que peor pueden faltar: la que le dice al
   * visitante «esto es para ti» y la que sostiene la promesa central del producto (que el archivo
   * no sale del navegador) junto con la licencia. `--enlace` no existia: donde no habia regla, el
   * navegador ponia su #0000EE por defecto.
   *
   * Las superficies de esta hoja son TODAS claras, asi que el umbral se comprueba contra blanco.
   */
  const BLANCO = '#ffffff';
  const token = (nombre: string): string =>
    new RegExp(`--${nombre}:\\s*(#[0-9a-f]{6})`, 'i').exec(cssContent)?.[1] ?? '';

  it.each([
    ['gris', 4.5],
    ['enlace', 4.5],
    ['tinta-suave', 4.5],
  ])('el token --%s se lee sobre blanco (>= %s:1)', (nombre, minimo) => {
    const valor = token(nombre);
    expect(valor, `--${nombre} declarado en hexadecimal`).toMatch(/^#[0-9a-f]{6}$/i);
    expect(contraste(valor, BLANCO)).toBeGreaterThanOrEqual(minimo);
  });

  it('hay un color de enlace propio y se aplica a TODOS los enlaces sin clase', () => {
    expect(cssContent).toMatch(/\ba\s*\{\s*color:\s*var\(--enlace\)/);
  });

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
