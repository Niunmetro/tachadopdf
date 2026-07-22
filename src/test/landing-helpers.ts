// Analiza el HTML de una landing y detecta referencias a recursos EXTERNOS que violarían la
// CSP estricta (cero CDNs, cero fuentes remotas). Metadatos como <link rel=canonical>, og:url y
// og:image no cuentan: no generan una petición de red al cargar la página.

const EXTERNAL_URL = /^(?:[a-z]+:)?\/\/|^https?:\/\//i;

function isExternal(url: string): boolean {
  return EXTERNAL_URL.test(url.trim());
}

export function externalResourceRefs(html: string): string[] {
  const hallazgos: string[] = [];

  for (const match of html.matchAll(/<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1] ?? '';
    if (isExternal(src)) hallazgos.push(match[0]);
  }

  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attrs = match[1] ?? '';
    const relMatch = attrs.match(/\srel=["']([^"']+)["']/i);
    const hrefMatch = attrs.match(/\shref=["']([^"']+)["']/i);
    const rel = (relMatch?.[1] ?? '').toLowerCase();
    const href = hrefMatch?.[1] ?? '';
    if (rel === 'canonical') continue;
    if (href && isExternal(href)) hallazgos.push(match[0]);
  }

  for (const match of html.matchAll(/<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1] ?? '';
    if (isExternal(src)) hallazgos.push(match[0]);
  }

  for (const match of html.matchAll(
    /\b(?:fetch|XMLHttpRequest\s*\(\s*\)\s*\.open)\s*\(\s*["']([^"']+)["']/gi,
  )) {
    const url = match[1] ?? '';
    if (isExternal(url)) hallazgos.push(match[0]);
  }

  for (const match of html.matchAll(/\.open\s*\(\s*["'][A-Za-z]+["']\s*,\s*["']([^"']+)["']/gi)) {
    const url = match[1] ?? '';
    if (isExternal(url)) hallazgos.push(match[0]);
  }

  return hallazgos;
}
