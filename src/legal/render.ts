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
  const footer = root.ownerDocument.createElement('footer');
  footer.setAttribute('aria-label', 'Información legal');

  for (const seccion of legalSections()) {
    const section = root.ownerDocument.createElement('section');
    section.id = seccion.id;

    const heading = root.ownerDocument.createElement('h2');
    heading.textContent = seccion.titulo;
    section.appendChild(heading);

    const body = root.ownerDocument.createElement('pre');
    body.textContent = seccion.cuerpo;
    section.appendChild(body);

    footer.appendChild(section);
  }

  root.appendChild(footer);
}
