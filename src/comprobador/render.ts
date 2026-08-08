import type { CopiaComprobador } from '../content/tipos';
import type { ResumenComprobacion } from './types';

// El destino del CTA lo publica el HTML generado en `data-cta-href`, ya calculado RELATIVO AL
// DOCUMENTO. Antes era '/?utm_source=comprobador': una ruta raíz-absoluta que, con la base de
// emergencia '/tachadopdf/', apunta fuera del sitio — justo en el modo pensado para cuando el
// dominio está caído.
const CTA_HREF_POR_DEFECTO = '../?utm_source=comprobador';

export function renderResumen(
  root: HTMLElement,
  resumen: ResumenComprobacion,
  copia: CopiaComprobador,
  alcance: CopiaComprobador['alcance'],
): void {
  root.textContent = '';

  const veredicto = document.createElement('div');
  veredicto.className = 'cp-veredicto';
  veredicto.textContent = resumen.veredicto;
  root.appendChild(veredicto);

  for (const categoria of resumen.categorias) {
    const bloque = document.createElement('div');
    bloque.className = 'cp-categoria';

    const label = document.createElement('span');
    label.className = 'cp-categoria-label';
    label.textContent = copia.etiquetas[categoria.kind];
    bloque.appendChild(label);

    const count = document.createElement('span');
    count.className = 'cp-categoria-count';
    count.textContent = String(categoria.count);
    bloque.appendChild(count);

    const ejemplos = document.createElement('ul');
    ejemplos.className = 'cp-categoria-ejemplos';
    for (const ejemplo of categoria.ejemplos) {
      const li = document.createElement('li');
      li.textContent = ejemplo;
      ejemplos.appendChild(li);
    }
    bloque.appendChild(ejemplos);

    root.appendChild(bloque);
  }

  if (resumen.paginasEscaneadas.length > 0) {
    const escaneadas = document.createElement('div');
    escaneadas.className = 'cp-escaneadas';

    const aviso = document.createElement('p');
    aviso.textContent = copia.avisoEscaneadas;
    escaneadas.appendChild(aviso);

    const lista = document.createElement('ul');
    for (const pagina of resumen.paginasEscaneadas) {
      const li = document.createElement('li');
      li.textContent = copia.pagina(pagina + 1);
      lista.appendChild(li);
    }
    escaneadas.appendChild(lista);

    root.appendChild(escaneadas);
  }

  const cta = document.createElement('a');
  cta.className = 'cp-cta';
  cta.href = root.dataset['ctaHref'] ?? CTA_HREF_POR_DEFECTO;
  cta.textContent = copia.cta;
  root.appendChild(cta);

  const aviso = document.createElement('div');
  aviso.className = 'cp-aviso';
  aviso.textContent = alcance;
  root.appendChild(aviso);
}
