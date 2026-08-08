import { AVISO_LEGAL, PRIVACIDAD, TERMINOS } from './textos';

export interface SeccionLegal {
  id: string;
  titulo: string;
  cuerpo: string;
}

// Las tres secciones legales, en el orden en que se publican. El pie legal ya NO se pinta con
// JavaScript: lo emite el generador de páginas (src/content/generar.ts) dentro del HTML, que es
// lo que la LSSI quiere —accesible de forma directa— y lo que hace falta para que un usuario sin
// JavaScript, o un rastreador que no lo ejecute, lea el aviso legal.
export function legalSections(): SeccionLegal[] {
  return [
    { id: 'aviso-legal', titulo: 'Aviso Legal', cuerpo: AVISO_LEGAL },
    { id: 'terminos', titulo: 'Términos de uso', cuerpo: TERMINOS },
    { id: 'privacidad', titulo: 'Política de privacidad', cuerpo: PRIVACIDAD },
  ];
}
