import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

describe('FAQ JSON-LD in index.html', () => {
  const indexPath = resolve(__dirname, '../index.html');
  const htmlContent = readFileSync(indexPath, 'utf-8');

  it('all JSON-LD blocks should be valid JSON', () => {
    const scriptRegex = /<script type="application\/ld\+json">([^<]+)<\/script>/g;
    const matches = Array.from(htmlContent.matchAll(scriptRegex));

    expect(matches.length).toBeGreaterThan(0);

    matches.forEach((match) => {
      const jsonString = match?.[1];
      expect(jsonString).toBeDefined();
      if (jsonString) {
        expect(() => JSON.parse(jsonString)).not.toThrow();
      }
    });
  });

  it('FAQPage should contain a question about invoice (factura)', () => {
    const faqPageRegex = /"@type"\s*:\s*"FAQPage"[^}]*"mainEntity"\s*:\s*(\[[^\]]*\])/s;
    const match = htmlContent.match(faqPageRegex);

    expect(match).toBeTruthy();
    expect(match?.[1]).toBeDefined();

    const mainEntityString = match?.[1];
    if (mainEntityString) {
      const mainEntity = JSON.parse(mainEntityString);

      const invoiceQuestion = mainEntity.find(
        (q: { '@type'?: string; name?: string }) =>
          q['@type'] === 'Question' && typeof q.name === 'string' && q.name.includes('factura')
      );

      expect(invoiceQuestion).toBeTruthy();
      if (invoiceQuestion && typeof invoiceQuestion.name === 'string') {
        expect(invoiceQuestion.name).toContain('¿Necesito factura de la licencia Pro?');
      }
    }
  });

  it('FAQPage invoice question should contain admin@tachadopdf.com in answer', () => {
    const faqPageRegex = /"@type"\s*:\s*"FAQPage"[^}]*"mainEntity"\s*:\s*(\[[^\]]*\])/s;
    const match = htmlContent.match(faqPageRegex);

    expect(match).toBeTruthy();
    expect(match?.[1]).toBeDefined();

    const mainEntityString = match?.[1];
    if (mainEntityString) {
      const mainEntity = JSON.parse(mainEntityString);

      const invoiceQuestion = mainEntity.find(
        (q: { '@type'?: string; name?: string }) =>
          q['@type'] === 'Question' && typeof q.name === 'string' && q.name.includes('factura')
      );

      expect(invoiceQuestion).toBeTruthy();
      if (invoiceQuestion) {
        const answerText = (invoiceQuestion as any).acceptedAnswer?.text as string | undefined;
        expect(answerText).toBeTruthy();
        if (answerText) {
          expect(answerText).toContain('admin@tachadopdf.com');
        }
      }
    }
  });
});
