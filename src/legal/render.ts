import { AVISO_LEGAL, PRIVACIDAD, TERMINOS } from './textos';

export interface SeccionLegal {
  id: string;
  titulo: string;
  cuerpo: string;
}

export function legalSections(): SeccionLegal[] {
  return [
    { id: 'aviso-legal', titulo: 'Aviso Legal', cuerpo: AVISO_LEGAL },
    { id: 'terminos', titulo: 'Términos de uso', cuerpo: TERMINOS },
    { id: 'privacidad', titulo: 'Política de privacidad', cuerpo: PRIVACIDAD },
  ];
}

export function renderLegalFooter(root: HTMLElement): void {
  const doc = root.ownerDocument;
  const footer = doc.createElement('footer');
  footer.setAttribute('aria-label', 'Información legal');
  footer.className = 'legales';

  // Plegados (<details>): la LSSI exige que sean accesibles de forma directa, no que ocupen la
  // pantalla entera. Antes empujaban el producto fuera de la vista; siguen a un clic y en el DOM.
  for (const seccion of legalSections()) {
    const details = doc.createElement('details');
    details.id = seccion.id;

    const summary = doc.createElement('summary');
    summary.textContent = seccion.titulo;
    details.appendChild(summary);

    const body = doc.createElement('pre');
    body.textContent = seccion.cuerpo;
    details.appendChild(body);

    footer.appendChild(details);
  }

  const pie = doc.createElement('p');
  pie.className = 'pie';
  pie.textContent =
    'TachadoPDF funciona enteramente en tu navegador. Código abierto (AGPL-3.0). ' +
    'La licencia Pro la vende Gumroad.';
  footer.appendChild(pie);

  root.appendChild(footer);
}
