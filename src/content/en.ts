// English content. `Contenido` is `typeof es`, so a missing key does not compile: TypeScript is
// the i18n linter here, and `npx --no-install tsc --noEmit` is already in the verification chain.
//
// Two things this file deliberately does NOT do:
//  - it does not invent a foreign seller (the operator is the same Spanish individual trader);
//  - it does not promise detection it does not have. Of the seven detectors, only the email one
//    works outside Spain: the IBAN pattern requires an ES prefix, the phone pattern requires nine
//    digits in Spanish ranges, and DNI/NIE/social-security/cadastral all carry Spanish check
//    digits. So the landing states the real coverage instead of implying a broader one — a
//    marketing false green is still a false green.

import { PRECIO_PRO } from '../config';
import { FREE_MAX_PAGES, FREE_MONTHLY_LIMIT } from '../freemium/quota';
import {
  LANDING_AUDIENCE_EN,
  LANDING_BULLETS_EN,
  LANDING_DETECTION_NOTE_EN,
  LANDING_HEADLINE_EN,
  LANDING_LOCAL_PROCESSING_EN,
  LANDING_PAIN_EN,
  LANDING_SUBHEAD_EN,
  LEGAL_NOTICE_EN,
  PRIVACY_EN,
  SCOPE_NOTICE_EN,
  TERMS_EN,
} from '../legal/textos.en';
import type { Contenido } from './es';
import { GUIAS_EN } from './guias.en';
import type {
  CopiaApp,
  CopiaComprobador,
  CopiaInforme,
  EntradaFaq,
  EtiquetasPatron,
} from './tipos';

// Las etiquetas dicen QUÉ detecta de verdad: «Spanish social security number», no «social
// security number». El rótulo honesto vende el alcance real en vez de insinuar otro.
const ETIQUETAS_PATRON: EtiquetasPatron = {
  dni: 'Spanish national ID (DNI)',
  nie: 'Spanish foreigner ID (NIE)',
  iban: 'Spanish IBAN',
  nuss: 'Spanish social security number',
  telefono: 'Spanish phone number',
  email: 'Email address',
  catastro: 'Spanish cadastral reference',
};

const FAQ_EN: EntradaFaq[] = [
  {
    pregunta: 'Is my document uploaded anywhere?',
    respuesta:
      'No. The whole process happens inside your browser and the file is never transmitted. You can check this yourself: disconnect from the internet and the tool still redacts and downloads your document.',
  },
  {
    pregunta: 'Is the text really deleted, or just covered?',
    respuesta:
      'It is removed from the contents of the file, not hidden behind a rectangle. When it finishes, the tool reopens the PDF it produced and searches it again — if anything you redacted is still readable, it tells you and refuses to release the file.',
  },
  {
    pregunta: 'What does it find on its own, and what do I mark myself?',
    respuesta:
      'Automatically: email addresses, and Spanish identifiers (DNI, NIE, Spanish IBAN, social security number, cadastral reference). It does not yet recognise UK or US identifiers such as National Insurance numbers, NHS numbers, Social Security numbers or local phone formats. Everything else — names, addresses, signatures, photographs, figures — you mark by dragging a box over it. What gets deleted, and what gets checked afterwards, is identical either way.',
  },
  {
    pregunta: 'What if it misses something?',
    respuesta:
      'Automatic detection covers set formats and will not catch everything. That is why you can redact any area by hand, and why you must review the finished document page by page before sending it. This tool does not replace human review.',
  },
  // "is not meant to be filed" asserted BY CONTRAST that the paid report is — the most expensive
  // promise in the product, hidden in the answer that also ships as a Google rich result. Same
  // construction that was removed from the Spanish watermark on 2026-08-08. What differs between
  // the two reports is the printed mark; the checks are the same.
  {
    pregunta: "What's the difference between free and Pro?",
    respuesta: `Free redacts ${FREE_MONTHLY_LIMIT} documents a month, up to ${FREE_MAX_PAGES} pages each. The redaction itself is complete and identical to Pro. What changes is the report: the free report carries a DEMO watermark and the Pro report does not; the checks themselves are identical. Pro is a one-time payment of ${PRECIO_PRO} — not a subscription — and adds unlimited documents and batch processing of several files at once.`,
  },
  {
    pregunta: 'Does it work on scanned documents?',
    respuesta:
      'On a scanned page the pixels inside the area you mark are cleared. Automatic detection reads text, not images, so on a scan you mark the areas yourself. Note that on a page with no text layer there is nothing for the tool to re-read afterwards, so it cannot confirm the removal the way it does on text — the report says so explicitly for those pages, and you must check them visually.',
  },
  // THE AMBER EXPECTATION GAP. Any image on a page degrades the seal, and 111 of 129 real PDFs
  // carry one (the letterhead logo), so "PARTIAL CHECK" is the ordinary result of this product.
  // Announcing it up front sells exactly what the buyer came for — a tool that does not tell you
  // everything is fine when it cannot know that.
  //
  // The two labels quoted are frozen literals of `en.ts` INFORME_EN.sellos (E3 and E5). If they
  // change there, this answer lies: `src/legal/faq-ambar.test.ts` ties the two together.
  {
    pregunta: 'Why does my report say "PARTIAL CHECK" instead of "REDACTION VERIFIED"?',
    respuesta:
      'Because the document contains an image — usually the letterhead logo — and this tool does not read what is inside an image. In that case the report says "PARTIAL CHECK" and spells out what it did do: it re-read the text of every page of the delivered file and its metadata, no data matching the searched patterns remains, and it lists one by one the pages whose image content is left out. "REDACTION VERIFIED" is reserved for text-only documents, where nothing falls outside the scope. Most minutes and payslips carry a logo, so "PARTIAL CHECK" is the normal result and does not mean something went wrong: it is the report stating how far it reached. If one of those images contains data, mark it by hand and its pixels will be cleared, but the page will still be listed as not fully checked: there is no text left to re-read to confirm it, which is why the report asks you to review it visually.',
  },
  {
    pregunta: 'Can I use the report as legal proof?',
    respuesta:
      'No, and it is not sold as one. The report is a technical record of what the tool did: which areas were redacted, which metadata was removed, which patterns were searched in the finished file, which pages could not be checked, and the SHA-256 fingerprint of the file you deliver. It documents that you carried out and verified the removal. It makes no statement about your legal obligations, and no tool can decide what you were required to redact.',
  },
  {
    pregunta: 'Who runs TachadoPDF?',
    respuesta:
      'It is operated from Spain by an individual trader — the details are in the legal notice at the bottom of this page. The source code is open under AGPL-3.0, so anyone can verify that nothing is uploaded. Payment and invoicing are handled by Gumroad as merchant of record.',
  },
];

const APP_EN: CopiaApp = {
  licenciaPlaceholder: 'Pro licence key (Gumroad)',
  verificarLicencia: 'Verify licence',
  licenciaValida: 'Pro licence verified.',
  licenciaNoActiva: (motivo) => `Licence not active (${motivo}). Running in free mode.`,
  botonEjemplo: 'Try it with a sample document',
  pistaEjemplo:
    'No PDF to hand, or not ready to load a real one yet? Load a sample document with made-up data and see in five seconds how it detects and redacts.',
  ejemploFallido: "The sample document couldn't be loaded. Try uploading your own PDF instead.",
  tipoDocumento: 'Document type',
  presets: {
    generico: 'General',
    acta: 'Meeting minutes',
    nomina: 'Payslip',
  },
  checkboxRevisado: 'I have reviewed the finished document visually, page by page',
  botonDescargar: 'Download documents and reports',
  sufijoInforme: 'report',
  comprarPro: `Get Pro — ${PRECIO_PRO} (one-time)`,
  comprarProCuotaAgotada: (limite) =>
    `You've used your ${limite} free documents this month · Get Pro — ${PRECIO_PRO} (one-time)`,
  cuotaPro: 'Pro licence active: unlimited documents, batch processing.',
  cuotaGratis: (usados, limite, maxPaginas) =>
    `Free mode: ${usados}/${limite} documents this month · up to ${maxPaginas} pages per document.`,
  cuotaAgotada: "You've used your free documents for this month. Get a Pro licence to carry on.",
  loteRequierePro: 'Batch processing requires a Pro licence.',
  limitePaginas: (fichero, paginas, maxPaginas) =>
    `"${fichero}" has ${paginas} pages. The free version redacts documents of up to ${maxPaginas} pages; for longer files you'll need a Pro licence (${PRECIO_PRO}, one-time).`,
  noSePudoAbrir: (fichero) =>
    `"${fichero}" couldn't be opened. Is it a valid PDF? If it's password-protected, try again and enter the password.`,
  passwordPrompt: 'PDF password',
  errorRender: 'The page could not be rendered',
  errorProcesado: (detalle) =>
    `Something went wrong processing the document in your browser. Reload the page and try again; if it keeps happening, the file may not be supported. (Technical detail: ${detalle})`,
  residuosEnLote:
    'Residual data was found in at least one document in the batch. Nothing has been downloaded.',
  avisoEscaneadas: (paginas) =>
    `Warning — these pages have no text layer (probably scanned) and need checking by eye: ${paginas}.`,
  comoTachar:
    'Detected data is marked for you — click to choose what to redact. To redact anything else (a name, a signature, a photo), drag the mouse across it to draw a box. Every box has an "x" if you want to remove it.',
  revisionVisual: (paginas) =>
    `Pages needing a visual check (no text layer, or a full-page image): ${paginas}.`,
  paginaEscaneada: (numero) =>
    `Page ${numero}: no text layer (scanned). No automatic detection here — redact the areas with data by hand.`,
  tacharTodas: (valor, ocurrencias) => `Redact all occurrences of "${valor}" (${ocurrencias})`,
  seleccionarHits: (pagina) => `Page ${pagina}: select all detected items`,
  quitarTachado: 'Remove this redaction',
};

const INFORME_EN: CopiaInforme = {
  titulo: 'Redaction verification report',
  subtituloBanda: 'Technical record of the redaction and of the check that followed',
  referencia: (ref, fecha) => `Reference ${ref}   ·   Issued ${fecha}`,
  sellos: {
    E1: 'REDACTION CHECK FAILED',
    E2: 'NO AUTOMATIC CHECK POSSIBLE',
    E3: 'PARTIAL CHECK',
    E4: 'NOTHING REDACTED',
    E5: 'REDACTION VERIFIED',
  },
  lineaBloqueadoResiduos:
    'Data matching the searched patterns was found again in the resulting file. Do not deliver this file: redact it again.',
  lineaBloqueadoSinComprobacion:
    'The post-redaction check could not be run on this file. Nothing below has been confirmed.',
  lineaSinComprobacion: (totalPaginas) =>
    `None of the ${totalPaginas} pages has a text layer: there is nothing to re-read, so the automatic check could not be applied to this document. Pixels inside the areas you marked were cleared. Review it visually, page by page.`,
  lineaParcial: (releidas, total, conReserva) =>
    `${releidas} of ${total} pages were re-read and no data matching the searched patterns remains in them. On ${conReserva} page(s) the automatic check does not reach all of the content: pages with no text layer, pages containing images, pages drawing text that cannot be re-read and unconfirmed redactions are listed one by one under "Coverage". Review them visually.`,
  lineaParcialSoloImagenes: (total, paginasConImagen) =>
    `All ${total} pages of the delivered file and its metadata were re-read, and no data matching the searched patterns remains in the text. What is left out is the content of ${paginasConImagen} page(s) containing images: this tool does not read what is inside an image, so data in a photograph or a scan is not detected. Review them visually; they are listed under "Coverage".`,
  lineaParcialSoloObjetos: (total) =>
    `All ${total} pages of the file and its metadata were re-read, and no data matching the searched patterns remains in them. But this document contains objects that the check does not examine: they are listed under "File objects".`,
  clausulaObjetosSinExaminar:
    'This document also contains objects that the check does not examine: they are listed under "File objects".',
  lineaSinTachados: (total) =>
    `No data was removed from this document: no area was marked. Its ${total} pages and its metadata were re-read and no data matching the searched patterns appears. This report records no removal.`,
  lineaVerificado: (total, zonas) =>
    `All ${total} pages of the delivered file and its metadata were re-read: no data matching the searched patterns remains, and neither does the text that was inside the ${zonas} areas you redacted. Scope and limits below.`,
  encabezadoDatos: 'Document details',
  encabezadoComprobaciones: 'Checks performed',
  encabezadoCobertura: 'Coverage of this check',
  encabezadoObjetos: 'File objects',
  encabezadoAlcance: 'Scope and limits',
  encabezadoVerificacion: 'How to check this report',
  filaArchivo: 'File checked',
  nombreOculto: '[data hidden]',
  avisoNombreOculto:
    'The file name contained data matching the searched patterns and has been hidden here. The name of the file you deliver is your own choice and this tool does not change it: check it before sending.',
  filaFecha: 'Date issued',
  filaReferencia: 'Report reference',
  filaHuella: 'SHA-256 fingerprint of the delivered file',
  filaPaginasTotal: 'Pages in the document',
  filaPaginasReleidas: 'Pages re-read after redaction',
  filaPaginasSinTexto: 'Pages with no text layer (cannot be checked)',
  filaPaginasImagenCompleta: 'Pages with a full-page image',
  filaPaginasConImagen: 'Pages containing images (their visual content was not checked)',
  filaZonasTachadas: 'Areas redacted',
  filaTachadosSinConfirmar: 'Redactions with no later confirmation',
  filaPaginasTextoNoLegible: 'Pages drawing text that cannot be re-read',
  conPaginas: (cifra, paginas) => `${cifra}   ·   pages ${paginas}`,
  zonasEnPaginas: (zonas, paginas) => `${zonas} across ${paginas} page(s)`,
  objetoInfo: 'Info metadata (Title, Author, Subject, Keywords, Producer, Creator)',
  objetoXmp: 'XMP metadata (document and pages)',
  objetoAnotaciones: 'Annotations and comments',
  objetoFormularios: 'Form fields',
  objetoAdjuntos: 'Attached files',
  objetoMarcadores: 'Document bookmarks (outline)',
  objetoAlternativos: 'Alternative text and accessibility tags',
  objetoOcultos:
    'Internal objects carrying text that no reader displays (thumbnails, nested XMP, private data, page labels, layer names, actions and JavaScript)',
  estadoEliminado: 'removed from the file',
  estadoNoHabia: 'none present',
  estadoNoExaminado: 'NOT EXAMINED',
  subPatrones: 'Patterns searched in the text',
  subZonas: 'Areas redacted, by page',
  subSinCapaDeTexto: 'Pages with no text layer',
  subImagenCompleta: 'Pages with a full-page image',
  subNoVerificables: 'Redactions that could not be verified',
  subTextoNoLegible: 'Pages with text the tool cannot re-read',
  paginaTextoNoLegible: (pagina, caracteres) =>
    `Page ${pagina}: ${caracteres} characters are drawn on this page that the tool cannot re-read (the file declares codes for them that do not match what is shown). They are visible when the document is opened, but automatic detection cannot reach them: review this page visually.`,
  noVerificablePagina: (pagina) =>
    `Page ${pagina}: the redacted area contained no extractable text, so removal could not be confirmed by re-reading the file. Check this page visually.`,
  paginaSinCapaDeTexto: (pagina) =>
    `Page ${pagina}: no text layer, nothing to re-read. Not checked automatically.`,
  paginaImagenCompleta: (pagina) =>
    `Page ${pagina}: an image covers the page. Its text was checked; the content of the image was not.`,
  patronLimpio: (etiqueta) => `${etiqueta}: 0 occurrences in extractable text`,
  patronSucio: (etiqueta, ocurrencias, paginas) =>
    `${etiqueta}: ${ocurrencias} occurrence(s) in extractable text (pages: ${paginas})`,
  zonasPagina: (pagina, cuenta) => `Page ${pagina}: ${cuenta} area(s)`,
  alcanceParrafos: [
    'What was checked. After redacting, TachadoPDF reopened the file you are given and re-read the text of its pages, its metadata fields and the other text strings the file keeps inside, searching for seven formats: Spanish national ID (DNI), Spanish foreigner ID (NIE), Spanish IBAN, Spanish social security number, Spanish phone number, Spanish cadastral reference and email address. Apart from email, all of them are Spanish formats with a check digit and do not recognise identifiers from other countries. It also checked that the text that was inside the areas you marked by hand does not reappear.',
    'What was NOT searched for. Automatic pattern detection does not recognise names, postal addresses, signatures, photographs, vehicle plates or non-Spanish account numbers: you mark those yourself. The visual content of images you did not mark was not read either: the pages that contain images are listed under "Coverage". Pages with no text layer cannot be checked automatically: pixels inside the marked areas are cleared, but no text remains to re-read, so the removal is not confirmed. Those pages are listed one by one under "Coverage", and the file objects that are not examined under "File objects".',
    'What the redaction leaves behind. The text is removed from the file, not covered up. What remains is the gap it occupied, and its width can be measured exactly, because the file keeps the offset of the text that followed. That measurement narrows down how much text was there and, when there are few candidates — a name from a known list — it can be enough to tell which one it was: different names measure differently. If that matters for a particular document, convert it to an image before sending it.',
    'What this report does not say. It does not say the document is free of personal data, and it makes no judgement about whether the right things were redacted: the person sending the file decides that. It is the technical record of what the tool removed and what it re-checked afterwards, with the file fingerprint so that anyone can cross-check it. It does not replace human review.',
  ],
  verificacionParrafos: [
    'Checking by a third party. The file that comes with this report must have exactly the SHA-256 fingerprint shown above. On Windows: certutil -hashfile file.pdf SHA256. On macOS or Linux: shasum -a 256 file.pdf. If it does not match, the file is not the one that was checked.',
    'Human review. Downloading this report requires ticking the box confirming a visual review of the final document, page by page. That is a statement by whoever used the tool, not a check performed by the tool.',
  ],
  lineaHerramienta: (version, fecha) =>
    `Tool: TachadoPDF v${version} · mupdf engine · issued ${fecha}`,
  lineaGratis: 'Generated with TachadoPDF (free version)',
  marcaAgua: 'DEMO - free version',
  pie: 'Document generated automatically by TachadoPDF · tachadopdf.com',
  numeroPagina: (indice, total) => `Page ${indice} of ${total}`,
  etiquetas: ETIQUETAS_PATRON,
};

const COMPROBADOR_EN: CopiaComprobador = {
  etiquetas: ETIQUETAS_PATRON,
  alcance:
    'This diagnosis only READS the file: it redacts nothing and changes nothing in your document. It searches for seven Spanish formats (national ID, foreigner ID, IBAN, social security number, phone number, cadastral reference) and for email addresses in the text that can be extracted. It does not recognise names, postal addresses, signatures or photographs, and it does not read the visual content of images or of pages with no text layer. It does not replace human review.',
  analizando: 'Analysing the PDF in your browser…',
  noEsPdf: "That file doesn't look like a PDF. Please choose a valid .pdf file.",
  passwordRequerida:
    'This PDF is password-protected. Enter the password in the password field and select the file again.',
  errorGenerico:
    "The PDF couldn't be analysed. Check that the file isn't damaged and try again.",
  avisoEscaneadas:
    "This page has no extractable text (probably scanned). Automatic detection can't read it — check it visually.",
  pagina: (numero) => `Page ${numero}`,
  cta: `Redact them now — free, ${FREE_MONTHLY_LIMIT} documents a month`,
  veredictoNada: "No detectable personal data found in this PDF's text.",
  veredictoDatos: (total) => `This PDF contains ${total} detectable pieces of personal data.`,
  veredictoDatosYEscaneos: (total, escaneadas) =>
    `This PDF contains ${total} detectable pieces of personal data, and ${escaneadas} page(s) that could not be read at all.`,
  veredictoSoloEscaneos: (escaneadas) =>
    `${escaneadas} page(s) in this PDF have no readable text, so they could not be checked. Nothing detectable was found on the rest.`,
};

export const en: Contenido = {
  htmlLang: 'en',
  // en_GB, no en_US: el dolor traducible es el RGPD británico, Irlanda y las empresas de la UE
  // que operan en inglés. Una sola página inglesa sirve a todas las regiones; el día que haya
  // precio en dólares se añade en-US y el esquema aguanta.
  ogLocale: 'en_GB',
  nombreIdioma: 'English',
  marca: 'TachadoPDF',

  home: {
    metaTitulo: 'Redact a PDF and verify it worked — TachadoPDF',
    metaDescripcion:
      "A black box doesn't delete anything: the text stays in the PDF and copies back out. TachadoPDF removes it from the file, re-checks the result, and gives you a verification report. Runs entirely in your browser — nothing is uploaded.",
    ogTitulo: 'Redact a PDF. Then prove the text is gone.',
    ogDescripcion:
      "Black boxes don't delete text. This removes it from the file, checks the finished PDF, and blocks the download if anything survived.",
    twitterDescripcion:
      "Black boxes don't delete text. This removes it from the file, checks the finished PDF, and blocks the download if anything survived.",
    jsonLdDescripcion:
      'Redacts personal data from a PDF by deleting it from the file, entirely in the browser, with a technical verification report.',
    sistemaOperativo: 'Web browser',
    ofertaGratis: `Free (${FREE_MONTHLY_LIMIT} documents/month, up to ${FREE_MAX_PAGES} pages)`,
    ofertaPro: 'Pro (one-time payment, unlimited documents)',
  },

  landing: {
    titular: LANDING_HEADLINE_EN,
    dolor: LANDING_PAIN_EN,
    subtitulo: LANDING_SUBHEAD_EN,
    bullets: LANDING_BULLETS_EN,
    notaDeteccion: LANDING_DETECTION_NOTE_EN,
    nicho: LANDING_AUDIENCE_EN,
    procesadoLocal: LANDING_LOCAL_PROCESSING_EN,
    avisoPrincipal: SCOPE_NOTICE_EN,
  },

  secciones: {
    trabajo: 'Redact your document',
    pro: 'Pro version',
    faq: 'Frequently asked questions',
    guias: 'Guides',
    legal: 'Legal',
    idiomas: 'Language',
  },

  guiaCta: 'Redact your PDF now — free, and without uploading it to any server',

  pro: {
    argumento: `Pro is a one-time payment of ${PRECIO_PRO} and is not a subscription: it does not renew and does not generate recurring charges. It adds unlimited documents, no page limit, batch processing of several files at once, and a verification report with no watermark.`,
    gratis: `Free mode redacts ${FREE_MONTHLY_LIMIT} documents a month, up to ${FREE_MAX_PAGES} pages each, with exactly the same real deletion as Pro.`,
  },

  faq: FAQ_EN,

  guias: GUIAS_EN,

  legal: {
    secciones: [
      { id: 'legal-notice', titulo: 'Legal notice', cuerpo: LEGAL_NOTICE_EN },
      { id: 'terms', titulo: 'Terms of use', cuerpo: TERMS_EN },
      { id: 'privacy', titulo: 'Privacy policy', cuerpo: PRIVACY_EN },
    ],
    pie: 'TachadoPDF runs entirely in your browser. Open source (AGPL-3.0). The Pro licence is sold by Gumroad.',
    // Las dos landings de sector son españolas (administradores de fincas, gestorías) y NO se
    // traducen: no tienen equivalente inglés y no se llevan a un segundo mercado. El 2026-08-10
    // se CORRIGIERON (pago único de 59 €, sin el tramo inventado, sin garantía de devolución),
    // que no es lo mismo que relanzarlas: ver docs/BITACORA.md.
    enlaceActas: '',
    enlaceNominas: '',
    enlaceComprobador: 'Check for free what data your PDF contains',
  },

  comprobador: {
    metaTitulo: 'Check what personal data your PDF actually contains',
    metaDescripcion:
      'Load a PDF and find out what personal data it contains before you share it. Free, entirely in your browser: the file never leaves your machine. This check does not redact anything.',
    ogTitulo: 'Check what personal data your PDF actually contains',
    ogDescripcion:
      'Find out what personal data your PDF contains before you share it. Free, entirely in your browser: the file never leaves your machine.',
    jsonLdNombre: 'TachadoPDF checker',
    titular: 'Check what personal data your PDF actually contains',
    intro:
      'This tool analyses your PDF and tells you what personal data it contains, using automatic pattern detection. It is a diagnosis: it does not redact or modify the file.',
    introLocal:
      'The PDF never leaves your machine: the whole analysis happens in your browser, verifiably. No document is sent to any server.',
    dropzone: 'Drag your PDF here, or click to select it',
    passwordPlaceholder: 'PDF password (if it has one)',
    avisoAlcance:
      'Scope: this check covers the extractable text of the PDF. Scanned pages (images with no text layer) are listed separately and need human review; this tool does not replace that review.',
    cta: COMPROBADOR_EN.cta,
  },

  app: APP_EN,
  informe: INFORME_EN,
  comprobadorUi: COMPROBADOR_EN,
};
