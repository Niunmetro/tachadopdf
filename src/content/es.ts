// Contenido publicable en español. FUENTE ÚNICA: de aquí salen a la vez el HTML estático que
// se indexa (scripts/gen-pages.ts) y lo que pinta la aplicación en el navegador. Duplicar un
// texto entre el HTML y el código es exactamente lo que pudrió el FAQ («marches» en textos.ts
// frente a «marques» en el JSON-LD): no se vuelve a hacer.
//
// Los textos legales y de landing siguen viviendo en src/legal/textos.ts (ruta sensible,
// APROBADO-ANGEL): aquí se importan, no se copian.

import { PRECIO_PRO } from '../config';
import { FREE_MAX_PAGES, FREE_MONTHLY_LIMIT } from '../freemium/quota';
import {
  AVISO_PRINCIPAL,
  FAQ,
  LANDING_CASOS_USO_TEXTO,
  LANDING_DOLOR,
  LANDING_PUBLICIDAD_GENERICA,
  LANDING_SUBTITULO,
  LANDING_TITULAR,
} from '../legal/textos';
import { legalSections } from '../legal/render';
import type { ContenidoGuia, EntradaFaq } from './tipos';

const GUIAS_ES: ContenidoGuia[] = [
  {
    id: 'guia-tachar-dni',
    titulo: 'Cómo tachar un DNI de un PDF sin que se pueda recuperar',
    tituloEnlace: 'Cómo tachar un DNI de un PDF sin que se pueda recuperar',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-rectangulo-negro',
    titulo: 'Por qué el rectángulo negro no borra el dato',
    tituloEnlace: 'Por qué el rectángulo negro no borra el dato',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-fincas',
    titulo: 'Datos personales en actas y documentos de comunidades',
    tituloEnlace: 'Datos personales en actas y documentos de comunidades',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-sin-subir',
    titulo: 'Cómo tachar datos de un PDF sin subirlo a internet',
    tituloEnlace: 'Cómo tachar datos de un PDF sin subirlo a internet',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-sanciones',
    titulo: 'Sanciones de la AEPD a comunidades de propietarios',
    tituloEnlace: 'Sanciones de la AEPD a comunidades de propietarios',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-nominas',
    titulo: 'Enviar nóminas en PDF sin exponer datos personales',
    tituloEnlace: 'Enviar nóminas en PDF sin exponer datos personales',
    descripcion: '',
    cuerpo: [],
  },
];

const FAQ_ES: EntradaFaq[] = FAQ.map((item) => ({ ...item }));

export const es = {
  htmlLang: 'es',
  ogLocale: 'es_ES',
  /** Rótulo del idioma en el selector, escrito SIEMPRE en su propio idioma (nunca banderas:
   *  una bandera es un país, no un idioma). */
  nombreIdioma: 'Español',
  marca: 'TachadoPDF',

  home: {
    metaTitulo: 'TachadoPDF · El rectángulo negro no borra: tacha de verdad los datos de un PDF',
    metaDescripcion:
      'El DNI que tapas con un rectángulo negro sigue dentro del PDF y se copia en dos clics — la AEPD ya ha sancionado actas y listados con datos expuestos. TachadoPDF elimina el dato del archivo, 100% en tu navegador, con informe de comprobación. Para gestorías, administradores de fincas y RRHH.',
    ogTitulo: 'TachadoPDF · El rectángulo negro no borra: tacha de verdad',
    ogDescripcion:
      'El dato tapado con un recuadro sigue en el PDF y se copia en dos clics; la AEPD ya ha sancionado actas con datos expuestos. Elimínalo de verdad, en tu navegador.',
    twitterDescripcion:
      'El dato tapado con un recuadro sigue en el PDF y se copia en dos clics. Elimínalo de verdad, en tu navegador, con informe de comprobación.',
    jsonLdDescripcion:
      'Tacha datos personales de un PDF eliminándolos del archivo, 100% en el navegador, con informe de comprobación técnica.',
    sistemaOperativo: 'Navegador web',
    ofertaGratis: `Gratuito (${FREE_MONTHLY_LIMIT} documentos/mes, hasta ${FREE_MAX_PAGES} páginas)`,
    ofertaPro: 'Pro (pago único, documentos ilimitados)',
  },

  landing: {
    titular: LANDING_TITULAR,
    dolor: LANDING_DOLOR,
    subtitulo: LANDING_SUBTITULO,
    bullets: [
      'El texto se elimina del archivo, no se tapa con un rectángulo negro.',
      'Todo ocurre en tu navegador: el documento no se sube a ningún servidor.',
      'Detección automática por patrones de DNI, NIE, IBAN, Nº de la Seguridad Social, referencias catastrales, teléfonos y emails.',
      'Informe de comprobación técnica descargable para tu expediente.',
    ],
    nicho: LANDING_CASOS_USO_TEXTO,
    procesadoLocal: LANDING_PUBLICIDAD_GENERICA,
    avisoPrincipal: AVISO_PRINCIPAL,
  },

  secciones: {
    trabajo: 'Tacha tu documento',
    pro: 'Versión Pro',
    faq: 'Preguntas frecuentes',
    guias: 'Guías',
    legal: 'Información legal',
    idiomas: 'Idioma',
  },

  /** Llamada a la acción al pie de cada guía generada. */
  guiaCta: 'Tacha tu PDF ahora, gratis y sin subirlo a ningún servidor',

  pro: {
    argumento: `Pro es un pago único de ${PRECIO_PRO} y no es una suscripción: no se renueva ni genera cobros periódicos. Incluye documentos ilimitados, sin tope de páginas, procesado por lotes de varios ficheros a la vez e informe de comprobación sin marca de agua.`,
    gratis: `El modo gratuito tacha ${FREE_MONTHLY_LIMIT} documentos al mes, de hasta ${FREE_MAX_PAGES} páginas cada uno, con el mismo borrado real que Pro.`,
  },

  faq: FAQ_ES,

  guias: GUIAS_ES,

  legal: {
    secciones: legalSections().map((s) => ({ id: s.id, titulo: s.titulo, cuerpo: s.cuerpo })),
    pie: 'TachadoPDF funciona enteramente en tu navegador. Código abierto (AGPL-3.0). La licencia Pro la vende Gumroad.',
    enlaceActas: 'Para administradores de fincas',
    enlaceNominas: 'Para gestorías y RRHH',
    enlaceComprobador: 'Comprueba gratis qué datos contiene tu PDF',
  },

  comprobador: {
    metaTitulo: 'Comprobador: qué datos personales contiene tu PDF',
    metaDescripcion:
      'Sube un PDF y descubre qué datos personales contiene (DNI, IBAN, teléfonos, direcciones...) antes de compartirlo. Gratis, 100% en tu navegador: el archivo nunca sale de tu equipo. Esta comprobación no tacha nada.',
    ogTitulo: 'Comprobador: qué datos personales contiene tu PDF',
    ogDescripcion:
      'Descubre qué datos personales contiene tu PDF antes de compartirlo. Gratis, 100% en tu navegador: el archivo nunca sale de tu equipo.',
    jsonLdNombre: 'Comprobador TachadoPDF',
    titular: 'Comprobador: ¿qué datos personales contiene tu PDF?',
    intro:
      'Esta herramienta analiza tu PDF y te dice qué datos personales contiene (DNI, NIE, IBAN, teléfonos, direcciones, correos...) mediante detección automática por patrones. Es un diagnóstico: no tacha ni modifica el archivo.',
    introLocal:
      'El PDF nunca sale de tu equipo: todo el análisis ocurre 100% en tu navegador, de forma verificable. No se sube ningún documento a ningún servidor.',
    dropzone: 'Arrastra tu PDF aquí o haz clic para seleccionarlo',
    passwordPlaceholder: 'Contraseña del PDF (si tiene)',
    avisoAlcance:
      'Aviso de alcance: la comprobación se limita al texto extraíble del PDF. Las páginas escaneadas (imágenes sin capa de texto) se señalan aparte y requieren revisión humana; esta herramienta no sustituye esa revisión.',
    cta: `Táchalos ahora (gratis, ${FREE_MONTHLY_LIMIT} documentos al mes)`,
  },
};

/** El español es el MOLDE: `en` (y cualquier idioma futuro) se declara con este tipo, así que
 *  olvidar una traducción rompe `tsc --noEmit`, que ya está en la cadena de verificación. */
export type Contenido = typeof es;
