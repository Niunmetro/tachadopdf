// Constructores de HTML mínimos para el generador de páginas. Todo el texto pasa por `esc` o
// `escTexto`: el contenido son datos, nunca marcado.

/** Escapa un nodo de texto. Las comillas NO se escapan aquí: dentro de un nodo de texto son
 *  legales y escaparlas solo ensucia el HTML que hay que poder revisar en un pull request. */
export function escTexto(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escapa un valor de atributo entre comillas dobles. */
export function esc(texto: string): string {
  return escTexto(texto).replace(/"/g, '&quot;');
}

/** Serializa atributos en el orden en que se declaran (el orden es contractual: hay tests que
 *  buscan `rel="canonical" href="..."` con esa forma exacta). */
export function atributos(mapa: Record<string, string>): string {
  return Object.entries(mapa)
    .map(([clave, valor]) => ` ${clave}="${esc(valor)}"`)
    .join('');
}

export function etiqueta(nombre: string, attrs: Record<string, string>, interior: string): string {
  return `<${nombre}${atributos(attrs)}>${interior}</${nombre}>`;
}

export function texto(nombre: string, attrs: Record<string, string>, contenido: string): string {
  return etiqueta(nombre, attrs, escTexto(contenido));
}

/**
 * Sangra bloques de HTML. Dentro de <pre> NO sangra: ahí los saltos y los espacios son
 * CONTENIDO (el aviso legal se publica en un <pre>), y sangrarlos metería espacios visibles en
 * un texto de ruta sensible.
 */
export function sangrar(lineas: string[], nivel: number): string {
  const espacios = ' '.repeat(nivel * 2);
  const salida: string[] = [];
  let dentroDePre = false;
  for (const entrada of lineas) {
    if (entrada.length === 0) continue;
    for (const sub of entrada.split('\n')) {
      salida.push(dentroDePre || sub.length === 0 ? sub : espacios + sub);
      const abre = sub.lastIndexOf('<pre');
      const cierra = sub.lastIndexOf('</pre>');
      if (abre > cierra) dentroDePre = true;
      else if (cierra > abre) dentroDePre = false;
    }
  }
  return salida.join('\n');
}

/**
 * Bloque de datos estructurados. El JSON se emite tal cual dentro de <script>: dentro de un
 * elemento script el navegador NO decodifica entidades, así que escapar aquí corrompería el
 * JSON. Lo único que puede romper el elemento es la secuencia `</`; si aparece, es un error de
 * contenido y se para en seco en vez de publicar una página rota.
 */
export function jsonLd(datos: unknown): string {
  const json = JSON.stringify(datos, null, 2);
  if (json.includes('</')) {
    throw new Error('JSON-LD contiene "</": rompería el elemento <script>');
  }
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
