// Textos legales y de landing de TachadoPDF. Ruta sensible: cambios requieren APROBADO-ANGEL.
// Fuente de verdad del alcance y vocabulario obligatorio: idea.txt y CLAUDE.md.

export const AVISO_PRINCIPAL =
  'TachadoPDF elimina del archivo el texto seleccionado y los píxeles de las zonas marcadas. No garantiza que el documento quede libre de datos personales ni sustituye la revisión humana.';

export const AVISO_LEGAL = `Aviso Legal

En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa a los usuarios de los siguientes datos del titular de este sitio web:

Titular: Ángel Talón Villa
NIF: 48611594J
Domicilio: Murcia (España). Dirección postal a disposición de quien acredite interés legítimo, solicitándola en el correo de contacto.
Correo electrónico de contacto: ccsshaft@gmail.com

El acceso y uso de este sitio web atribuye la condición de usuario y supone la aceptación plena de las condiciones incluidas en este Aviso Legal, en los Términos de uso y en la Política de privacidad.

TachadoPDF es una herramienta que se ejecuta enteramente en el navegador del usuario. El titular no accede, almacena ni transmite el contenido de los documentos procesados por la aplicación.`;

export const TERMINOS = `Términos de uso

1. Objeto. TachadoPDF es una herramienta para la preparación de documentos PDF antes de su entrega a terceros o su publicación, mediante la eliminación real de texto y de píxeles de las zonas marcadas por el usuario.

2. Uso prohibido. Queda prohibido utilizar TachadoPDF para alterar documentos con valor probatorio o cuya integridad esté protegida por ley, contrato o resolución judicial. El usuario es el único responsable del uso que haga de la herramienta y de comprobar que el documento resultante cumple sus obligaciones legales.

3. Ausencia de garantía. TachadoPDF no garantiza que el documento resultante quede libre de datos personales ni sustituye la revisión humana. El usuario debe revisar visualmente el documento final página a página antes de darlo por válido.

4. Responsabilidad. En la máxima medida permitida por la ley, la responsabilidad del titular frente al usuario por cualquier daño derivado del uso de TachadoPDF queda limitada al precio pagado por la licencia, en su caso.

5. Licencia Pro. La licencia Pro se adquiere mediante un pago único y no es una suscripción: no se renueva ni genera cobros periódicos. La contratación y el cobro los gestiona Gumroad como plataforma de venta.

6. Modificaciones. Estos Términos de uso pueden actualizarse; la versión vigente es la publicada en cada momento en este sitio.`;

export const PRIVACIDAD = `Política de privacidad

Procesamiento 100% local. TachadoPDF procesa los documentos enteramente en el navegador del usuario. El documento nunca se transmite a ningún servidor ni a terceros.

Único dato que sale del navegador: cuando el usuario activa una licencia Pro, la clave de licencia se envía a Gumroad para su verificación. Ningún otro dato ni el contenido de los documentos sale nunca del navegador.

Sin cookies ni analítica: esta aplicación no utiliza cookies de seguimiento ni herramientas de analítica, por lo que no se muestra ningún banner de consentimiento.

Gumroad Inc. actúa como vendedor (merchant of record) de la licencia Pro y procesa los datos de pago conforme a su propia política de privacidad.`;

export const CASOS_USO: string[] = [
  'administradores de fincas',
  'gestorías',
  'RRHH',
];

export const LANDING_TITULAR = 'TachadoPDF: la prueba tecnica de que el texto tachado ya no es extraible del PDF';

export const LANDING_SUBTITULO =
  'Elimina de verdad datos personales de tus PDF antes de entregarlos a terceros, y descarga un informe de comprobación técnica que puedes archivar como prueba de diligencia.';

export const LANDING_CASOS_USO_TEXTO =
  'Pensado para administradores de fincas que reparten actas con datos de propietarios, gestorías que envían documentación de clientes y departamentos de RRHH que gestionan expedientes.';

export const LANDING_PUBLICIDAD_GENERICA =
  'Las herramientas de tachado online habituales envían tus documentos a un servidor. TachadoPDF procesa todo en tu propio navegador: el archivo nunca sale de tu equipo.';

// Preguntas frecuentes. Responden HONESTAMENTE las dudas que frenan la compra de un profesional
// (¿no lo hace ya Acrobat?, ¿es seguro?, ¿de verdad se borra?). También se publican como datos
// estructurados FAQPage en index.html para que aparezcan como resultado enriquecido en Google.
// Ruta sensible al vocabulario prohibido (ver guard.test.ts): nada de garantías absolutas.
export const FAQ: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿No hace esto ya Acrobat Pro?',
    respuesta:
      'Acrobat Pro también elimina texto de un PDF. TachadoPDF está pensado para quien no paga esa suscripción: funciona en el navegador sin instalar nada, reconoce por sí solo los formatos españoles (DNI, NIE, IBAN, Nº de la Seguridad Social, teléfonos), es un pago único de 59 € en lugar de una cuota anual, y deja un informe de comprobación. Si ya usas Acrobat Pro a diario, es probable que no lo necesites.',
  },
  {
    pregunta: '¿Se sube mi documento a algún servidor?',
    respuesta:
      'No. Todo el proceso ocurre dentro de tu navegador y el archivo no se transmite a ningún sitio. Puedes comprobarlo desconectando internet: la herramienta sigue tachando y descargando el documento sin conexión.',
  },
  {
    pregunta: '¿De verdad se borra el dato o solo se tapa?',
    respuesta:
      'Se elimina del contenido del archivo, no se cubre con un rectángulo por encima. Además, al terminar, la herramienta vuelve a leer el PDF resultante y busca de nuevo los datos: si quedara cualquier resto, te avisa y no da el trabajo por bueno.',
  },
  {
    pregunta: '¿Y si se le escapa un dato?',
    respuesta:
      'La detección automática cubre los formatos habituales, pero puede no verlo todo. Por eso puedes tachar a mano cualquier zona arrastrando el ratón, y debes revisar el documento final página a página antes de entregarlo. La herramienta no sustituye la revisión humana.',
  },
  {
    pregunta: '¿Qué diferencia hay entre el modo gratuito y Pro?',
    respuesta:
      'El modo gratuito permite 5 documentos al mes. Pro es un pago único de 59 € (no una suscripción) que quita ese límite. El tachado y el informe son idénticos en ambos; Pro solo levanta el tope mensual.',
  },
  {
    pregunta: '¿Funciona con documentos escaneados?',
    respuesta:
      'Sobre una imagen escaneada se borran los píxeles de la zona que marques a mano. La detección automática lee texto, no imágenes, así que en un escaneado debes señalar tú las zonas a tachar y revisar el resultado.',
  },
];
