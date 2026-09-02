// Geometría pura del tachado de imágenes: sin DOM ni canvas, así que se testea en Node.
// El borrado real (rellenar de negro y reexportar) vive en main.ts, sobre <canvas>; aquí solo
// van las cuentas que deciden QUÉ zona se rellena, que es donde estaría el fallo de un píxel de más.

export interface Region {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** De dos puntos de un arrastre (en cualquier orden) a un rectángulo de dimensiones positivas. */
export function regionDesdePuntos(x0: number, y0: number, x1: number, y1: number): Region {
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    ancho: Math.abs(x1 - x0),
    alto: Math.abs(y1 - y0),
  };
}

/**
 * Recorta una región a los límites [0, anchoImg] × [0, altoImg] de la imagen y devuelve la parte
 * que cae DENTRO. Devuelve `null` si, tras recortar, no cubre ni un píxel (un clic sin arrastrar o
 * un arrastre enteramente fuera de la imagen): así el borrado nunca intenta rellenar fuera del lienzo
 * ni añade una zona vacía que el usuario creería tachada.
 */
export function recortar(region: Region, anchoImg: number, altoImg: number): Region | null {
  const x = Math.max(0, Math.min(region.x, anchoImg));
  const y = Math.max(0, Math.min(region.y, altoImg));
  const x2 = Math.max(0, Math.min(region.x + region.ancho, anchoImg));
  const y2 = Math.max(0, Math.min(region.y + region.alto, altoImg));
  const ancho = x2 - x;
  const alto = y2 - y;
  if (ancho < 1 || alto < 1) return null;
  return { x, y, ancho, alto };
}

/** Escala una región por un factor (de coordenadas de pantalla a coordenadas de imagen, o al revés). */
export function escalar(region: Region, factor: number): Region {
  return {
    x: region.x * factor,
    y: region.y * factor,
    ancho: region.ancho * factor,
    alto: region.alto * factor,
  };
}
