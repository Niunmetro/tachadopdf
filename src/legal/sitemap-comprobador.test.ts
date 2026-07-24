import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('sitemap.xml contiene /comprobador/', () => {
  const SITEMAP_PATH = path.resolve(__dirname, '..', '..', 'public', 'sitemap.xml');
  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');

  it('contiene la URL https://www.tachadopdf.com/comprobador/', () => {
    expect(sitemap).toContain('https://www.tachadopdf.com/comprobador/');
  });

  it('el sitemap es XML bien formado', () => {
    expect(sitemap).toMatch(/^<\?xml/);
    expect(sitemap).toMatch(/<urlset[^>]*>/);
    expect(sitemap).toMatch(/<\/urlset>\s*$/);
  });
});
