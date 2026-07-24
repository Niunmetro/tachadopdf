import type { PatternKind } from '../types';
import { SCOPE_TEXT } from '../report/report';
import type { ResumenComprobacion } from './types';

const PATTERN_LABELS: Record<PatternKind, string> = {
  dni: 'DNI',
  nie: 'NIE',
  iban: 'IBAN',
  nuss: 'Número de la Seguridad Social',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  catastro: 'Referencia catastral',
};

const AVISO_ESCANEADAS =
  'Esta página no contiene texto extraíble (probablemente escaneada). La detección automática no puede leerla: revísala visualmente.';

const CTA_TEXT = 'Táchalos ahora (gratis, 5 documentos al mes)';

export function renderResumen(root: HTMLElement, resumen: ResumenComprobacion): void {
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
    label.textContent = PATTERN_LABELS[categoria.kind];
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
    aviso.textContent = AVISO_ESCANEADAS;
    escaneadas.appendChild(aviso);

    const lista = document.createElement('ul');
    for (const pagina of resumen.paginasEscaneadas) {
      const li = document.createElement('li');
      li.textContent = `Página ${pagina + 1}`;
      lista.appendChild(li);
    }
    escaneadas.appendChild(lista);

    root.appendChild(escaneadas);
  }

  const cta = document.createElement('a');
  cta.className = 'cp-cta';
  cta.href = '/?utm_source=comprobador';
  cta.textContent = CTA_TEXT;
  root.appendChild(cta);

  const aviso = document.createElement('div');
  aviso.className = 'cp-aviso';
  aviso.textContent = SCOPE_TEXT;
  root.appendChild(aviso);
}
