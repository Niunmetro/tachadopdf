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

  it('debe contener max-width y text-overflow en .tachar-todas button', () => {
    const hasMaxWidth = /\.tachar-todas\s+button\s*\{[^}]*max-width[^}]*\}/s.test(cssContent);
    const hasTextOverflow = /\.tachar-todas\s+button\s*\{[^}]*text-overflow\s*:\s*ellipsis[^}]*\}/s.test(cssContent);

    expect(hasMaxWidth).toBe(true);
    expect(hasTextOverflow).toBe(true);
  });
});
