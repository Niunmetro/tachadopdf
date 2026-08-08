/**
 * Constructor de PDF CRUDO para las guardas de estructura. Solo se usa en tests.
 *
 * pdf-lib sirve para lo normal (texto, imagenes, marcadores), pero los escondites de esta familia
 * viven en sitios que pdf-lib no expone comodamente: `/PageLabels`, `/Threads`, `/Collection`,
 * una capa opcional apagada, una clave propia dentro del diccionario de pagina. Escribir el
 * fichero a mano es la unica forma de fabricar EXACTAMENTE el documento que hay que resistir, y
 * de que la guarda hable del defecto y no de las limitaciones de la libreria.
 *
 * Los objetos se numeran 1..n en el orden en que llegan; la raiz es el 1 salvo que se diga otra.
 */
export interface ObjetoCrudo {
  cuerpo: string;
  stream?: string;
}

export function pdfCrudo(objetos: ObjetoCrudo[], raiz = 1): Uint8Array {
  const cabecera = '%PDF-1.7\n%\xE2\xE3\xCF\xD3\n';
  const trozos: string[] = [cabecera];
  const desplazamientos: number[] = [];
  let posicion = Buffer.byteLength(cabecera, 'latin1');

  objetos.forEach((objeto, indice) => {
    const numero = indice + 1;
    let texto: string;
    if (objeto.stream !== undefined) {
      const largo = Buffer.byteLength(objeto.stream, 'latin1');
      const diccionario = objeto.cuerpo.trim().replace(/>>$/, ` /Length ${largo} >>`);
      texto = `${numero} 0 obj\n${diccionario}\nstream\n${objeto.stream}\nendstream\nendobj\n`;
    } else {
      texto = `${numero} 0 obj\n${objeto.cuerpo}\nendobj\n`;
    }
    desplazamientos.push(posicion);
    trozos.push(texto);
    posicion += Buffer.byteLength(texto, 'latin1');
  });

  const inicioXref = posicion;
  let xref = `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const desplazamiento of desplazamientos) {
    xref += `${String(desplazamiento).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objetos.length + 1} /Root ${raiz} 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;
  trozos.push(xref);

  return new Uint8Array(Buffer.from(trozos.join(''), 'latin1'));
}

const FUENTE = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';

/**
 * Cuerpo comun de los documentos de las guardas de estructura: una pagina con un correo que la
 * herramienta SI tacha. Hace falta que haya algo que tachar para que el sello pueda llegar a
 * verde; si no, el documento saldria E4 «SIN TACHADOS» y la guarda no probaria nada.
 *
 * `catalogoExtra`, `paginaExtra`, `recursosExtra` y `extras` son los huecos donde cada guarda
 * planta su escondite. Los objetos extra empiezan en el numero 6.
 */
export function pdfConEstructura(opciones: {
  catalogoExtra?: string;
  paginaExtra?: string;
  recursosExtra?: string;
  contenidoExtra?: string;
  extras?: ObjetoCrudo[];
}): Uint8Array {
  return pdfCrudo([
    { cuerpo: `<< /Type /Catalog /Pages 2 0 R ${opciones.catalogoExtra ?? ''} >>` },
    { cuerpo: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    {
      cuerpo:
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 300] /Contents 4 0 R ' +
        `/Resources << /Font << /F1 5 0 R >> ${opciones.recursosExtra ?? ''} >> ` +
        `${opciones.paginaExtra ?? ''} >>`,
    },
    {
      cuerpo: '<< >>',
      stream:
        'BT /F1 12 Tf 40 250 Td (Nomina julio 2026) Tj ET\n' +
        'BT /F1 12 Tf 40 220 Td (Contacto: gestoria@ejemplo.es) Tj ET\n' +
        (opciones.contenidoExtra ?? ''),
    },
    { cuerpo: FUENTE },
    ...(opciones.extras ?? []),
  ]);
}
