// Formas del contenido publicable. Todo el texto de las páginas estáticas vive como DATOS
// (bloques tipados), nunca como HTML crudo: así el generador puede escapar cada cadena y ningún
// texto de contenido puede inyectar marcado por descuido.

/** Un bloque de prosa dentro del cuerpo de una guía. */
export type Bloque =
  | { t: 'p'; texto: string }
  | { t: 'h2'; texto: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'nota'; texto: string };

export interface EntradaFaq {
  pregunta: string;
  respuesta: string;
}

/**
 * Una guía informativa. `cuerpo` vacío significa "la página existe pero su HTML no lo genera
 * este motor" (las guías españolas son ficheros estáticos escritos a mano en public/guia/*).
 * De esas guías solo se usan el id y `tituloEnlace`, para el índice de la home y el sitemap.
 */
export interface ContenidoGuia {
  id: string;
  titulo: string;
  tituloEnlace: string;
  descripcion: string;
  cuerpo: Bloque[];
}
