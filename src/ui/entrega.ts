import type { CopiaInforme } from '../content/tipos';
import { estadoDelSello } from '../report/estado';
import { lineaDelSello } from '../report/report';
import type { ReportData } from '../types';

/**
 * ACUSE DE ENTREGA. Entre antes y despues de pulsar «Descargar documentos e informes» cambiaban
 * exactamente dos cosas: la marca de la casilla y el color del boton. Se escribian DOS ficheros en
 * el disco y la pantalla no lo reconocia — el usuario no sabia ni que se llevaba dos archivos ni
 * cual de los dos es la prueba que tiene que archivar.
 *
 * Y sobre todo: el veredicto de cinco estados no aparecia en NINGUN sitio de la interfaz. Solo
 * existia dentro de un PDF que hay que abrir en otro programa. Desde que cualquier imagen degrada
 * el sello, el 86 % de los documentos reales salen «COMPROBACION PARCIAL»: un comprador que espera
 * verde se enteraba del ambar fuera del producto, sin nadie que se lo explicara. Ahi es donde
 * escribe a soporte.
 *
 * El panel reutiliza LITERALMENTE las cadenas del informe —`sellos[estado]` y `lineaDelSello`— y
 * el estado sale de `estadoDelSello`, la misma funcion pura que dibuja el sello del PDF. Dos
 * redacciones del mismo hecho es deriva garantizada; aqui no hay segunda redaccion.
 */
export function panelDeEntrega(
  archivo: { fileName: string; reportData: ReportData },
  copiaInforme: CopiaInforme,
  nombreInforme: string,
): HTMLElement {
  const estado = estadoDelSello(archivo.reportData);
  const panel = document.createElement('div');
  panel.className = 'entrega';
  panel.dataset['estado'] = estado;

  const rotulo = document.createElement('p');
  rotulo.className = 'entrega__estado';
  rotulo.textContent = copiaInforme.sellos[estado];

  const linea = document.createElement('p');
  linea.className = 'entrega__linea';
  linea.textContent = lineaDelSello(estado, archivo.reportData, copiaInforme);

  const lista = document.createElement('ul');
  lista.className = 'entrega__ficheros';
  for (const nombre of [archivo.fileName, nombreInforme]) {
    const item = document.createElement('li');
    item.textContent = nombre;
    lista.appendChild(item);
  }

  panel.append(rotulo, linea, lista);
  return panel;
}
