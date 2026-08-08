import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VERSION_APP } from './config';

// El informe imprime la version de la herramienta: un registro de diligencia que no dice con que
// version se emitio no se puede reproducir en una disputa. Si la constante y package.json pueden
// divergir en silencio, la version impresa es decoracion.
describe('versión de la herramienta', () => {
  it('coincide exactamente con la de package.json', () => {
    const pkg: unknown = JSON.parse(
      readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'),
    );
    const version = (pkg as { version?: string }).version;
    expect(version).toBeTypeOf('string');
    expect(VERSION_APP).toBe(version);
  });

  it('tiene forma de versión', () => {
    expect(VERSION_APP).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
