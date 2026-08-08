// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { es } from '../content/es';
import type { InventarioObjetos, PatternKind, ReportData } from '../types';
import { panelDeEntrega } from './entrega';

/**
 * EL VEREDICTO TIENE QUE ESTAR EN LA PANTALLA, Y TIENE QUE SER EL MISMO.
 *
 * Antes de esto, el sello de cinco estados no aparecia en NINGUN sitio de la interfaz: solo dentro
 * de un PDF que hay que abrir en otro programa. Desde que cualquier imagen degrada el sello, el
 * 86 % de los documentos reales salen «COMPROBACION PARCIAL», asi que un comprador que espera
 * verde se enteraba del ambar fuera del producto y sin nadie que se lo explicara.
 *
 * El riesgo evidente de enseñarlo en dos superficies es la DERIVA: dos redacciones del mismo hecho
 * acaban diciendo cosas distintas. Por eso el panel no resume nada — reutiliza literalmente
 * `sellos[estado]` y `lineaDelSello`, y esta guarda lo ata.
 */
const PATRONES: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

const OBJETOS: InventarioObjetos = {
  info: 'eliminado',
  xmp: 'eliminado',
  anotaciones: 'noHabia',
  formularios: 'noHabia',
  adjuntos: 'noHabia',
  marcadores: 'noHabia',
  alternativos: 'noHabia',
  ocultos: 'noHabia',
};

function datos(over: Partial<ReportData> = {}): ReportData {
  return {
    fileName: 'acta.pdf',
    sha256: 'f'.repeat(64),
    date: '2026-08-08',
    patternsSearched: PATRONES,
    totalPaginas: 3,
    boxesPerPage: [{ page: 0, count: 2 }],
    objetos: OBJETOS,
    paginasSinCapaDeTexto: [],
    paginasImagenCompleta: [],
    paginasConImagen: [],
    unverifiableManualPages: [],
    paginasTextoNoLegible: [],
    freeVersion: false,
    verify: { clean: true, residues: [] },
    ...over,
  };
}

function panel(data: ReportData): HTMLElement {
  return panelDeEntrega({ fileName: 'acta.pdf', reportData: data }, es.informe, 'acta-informe.pdf');
}

describe('G16: el acuse de entrega enseña el MISMO veredicto que el informe', () => {
  it('el caso corriente —ámbar por imágenes, el 86 % de los documentos— se anuncia en pantalla', () => {
    const nodo = panel(datos({ paginasConImagen: [0, 1, 2] }));

    expect(nodo.dataset['estado']).toBe('E3');
    // Literal CONGELADO: comparar el panel con `es.informe.sellos.E3` seria compararlo consigo mismo.
    expect(nodo.querySelector('.entrega__estado')?.textContent).toBe('COMPROBACIÓN PARCIAL');
    expect(nodo.querySelector('.entrega__linea')?.textContent).toContain(
      'esta herramienta no lee lo que hay dentro de una imagen',
    );
  });

  it('el verde solo cuando toca, y con su frase entera', () => {
    const nodo = panel(datos());

    expect(nodo.dataset['estado']).toBe('E5');
    expect(nodo.querySelector('.entrega__estado')?.textContent).toBe('TACHADO VERIFICADO');
    expect(nodo.querySelector('.entrega__linea')?.textContent).toContain(
      'Se han releído las 3 páginas del archivo entregado y sus metadatos',
    );
  });

  it('un documento escaneado entero no se anuncia como verde en pantalla', () => {
    const nodo = panel(datos({ paginasSinCapaDeTexto: [0, 1, 2] }));

    expect(nodo.dataset['estado']).toBe('E2');
    expect(nodo.textContent).not.toContain('VERIFICADO');
    expect(nodo.querySelector('.entrega__estado')?.textContent).toBe('SIN COMPROBACIÓN AUTOMÁTICA');
  });

  it('nombra los DOS ficheros que se ha llevado el usuario', () => {
    const nombres = [...panel(datos()).querySelectorAll('li')].map((li) => li.textContent);
    expect(nombres).toEqual(['acta.pdf', 'acta-informe.pdf']);
  });
});
