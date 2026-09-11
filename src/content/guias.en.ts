// Guías en inglés. NO son traducciones de las españolas: una guía sobre sanciones de la AEPD a
// comunidades de propietarios no tiene audiencia inglesa, y «administrador de fincas» no tiene
// equivalente. Se escriben para la intención de búsqueda inglesa, que además tiene algo que la
// española no tiene: la tarea inglesa («redaction») tiene nombre, reglamento y partida de gasto.
//
// Todo el contenido son DATOS tipados: el generador escapa cada cadena.

import type { ContenidoGuia } from './tipos';

export const GUIAS_EN: ContenidoGuia[] = [
  {
    id: 'guia-en-caja-negra',
    titulo: 'Why the black box over your PDF does not delete the text',
    tituloEnlace: 'Why the black box over your PDF does not delete the text',
    descripcion:
      'A black rectangle only covers the text: the words stay in the file and copy straight back out. How to check it in three seconds, and how to remove the text for real.',
    metaTitulo: "Black box on a PDF doesn't delete the text · TachadoPDF",
    cuerpo: [
      {
        t: 'p',
        texto:
          'It is the most common mistake made when preparing a document for release: covering the confidential part with a black rectangle. The data is still there, and whoever receives the file can recover it with no technical knowledge at all.',
      },
      { t: 'h2', texto: 'Why the rectangle does nothing' },
      {
        t: 'p',
        texto:
          'A PDF stores its text separately from what you see on screen. Drawing a black rectangle over a name, an account number or an address only adds a shape in front. The original text is still stored in the file, underneath. So:',
      },
      {
        t: 'ul',
        items: [
          'Select across the rectangle with the mouse, copy, and the hidden text appears.',
          'Open the PDF in a different program, or convert it, and the data comes back.',
          'Move or delete the rectangle and the data is simply on display again.',
        ],
      },
      {
        t: 'nota',
        texto:
          'Check it yourself: open a PDF where you covered something with a rectangle, select across it, and paste into a text editor. If the words come out, they were never deleted.',
      },
      { t: 'h2', texto: 'This is not theoretical' },
      // Sources checked 2026-08-08 (see src/legal/textos.en.ts for the full citation block):
      // Manafort = US v. Manafort 1:17-cr-00201 (D.D.C.), ECF 471 (defective) and ECF 472
      // (corrected), both 8 Jan 2019. PSNI = ICO monetary penalty £750,000, 3 Oct 2024, 9,483
      // officers and staff exposed by a hidden worksheet in an FOI spreadsheet.
      // ⚠ The third sentence — "In July 2025 the ICO published dedicated guidance…" — was RETIRED
      // on 2026-08-10 from here and from LANDING_PAIN_EN. It was never checked against the source
      // and this deploy would have been the one that published it. See textos.en.ts.
      {
        t: 'p',
        texto:
          "On 8 January 2019, lawyers for Paul Manafort filed a court document with passages blacked out. The text underneath was still live: reporters copied it straight out, it was being quoted in news reports the same day, and a corrected filing had to be entered on the public docket before the day was over. Regulators fine for the same class of mistake. In October 2024 the UK's Information Commissioner's Office fined the Police Service of Northern Ireland £750,000 after a hidden worksheet inside a spreadsheet released under freedom of information exposed the surnames, initials, ranks and roles of all 9,483 of its officers and staff.",
      },
      { t: 'h2', texto: 'What to do instead' },
      {
        t: 'p',
        texto:
          'For the data to be gone it has to be removed from the contents of the file, not covered. And if the data sits inside a scanned image, the pixels of that area have to be cleared — not patched over.',
      },
      {
        t: 'p',
        texto:
          'Doing that by hand with professional PDF software is possible but slow, and the step people skip is the one that matters: checking the finished file afterwards. A redaction you did not verify is a redaction you are only assuming worked.',
      },
      { t: 'h2', texto: 'How TachadoPDF does it' },
      {
        t: 'p',
        texto:
          'TachadoPDF removes the text from the file and clears the pixels of the areas you mark, strips the metadata, and then reopens the PDF it just produced and searches it again — including the metadata — for everything you redacted. If any of it comes back, the download is blocked and you are told which page. You also get a verification report with the SHA-256 fingerprint of the file you deliver. Everything runs in your browser; the document is never uploaded.',
      },
    ],
    enlaceComprobador: 'Check your PDF for free — see what text is still extractable',
    relacionadas: ['guia-en-comprobar', 'guia-en-sin-subir', 'guia-en-sin-acrobat'],
  },
  {
    id: 'guia-en-comprobar',
    titulo: 'How to check whether a PDF has actually been redacted',
    tituloEnlace: 'How to check whether a PDF has actually been redacted',
    descripcion:
      'Check whether a PDF is really redacted before you send it: a three-second test anyone can run, the four other places data hides, and what a check can never tell you.',
    metaTitulo: 'How to check if a PDF is really redacted · TachadoPDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Redaction fails silently. The document looks finished, the black bars are in place, and nothing warns you that the words are still inside the file. Here is how to find out before your reader does.',
      },
      { t: 'h2', texto: 'The three-second test' },
      {
        t: 'ol',
        items: [
          'Open the finished PDF.',
          'Select the whole document (Ctrl+A or Cmd+A) and copy it.',
          'Paste into a plain text editor and search for what you removed.',
        ],
      },
      {
        t: 'p',
        texto:
          'If the redacted words appear, they were never deleted. This works because a PDF draws in layers: an annotation, a highlight or a filled shape sits on top of the content stream and leaves the text underneath untouched.',
      },
      { t: 'h2', texto: 'Four other places the data hides' },
      {
        t: 'ul',
        items: [
          'Document metadata: title, author, subject and keywords often carry the original file name, a client name or a case number.',
          'XMP metadata: a second, separate block that survives many "save as" operations.',
          'Attachments and embedded files: a spreadsheet inside the PDF is not covered by anything you did to the pages.',
          'The invisible text layer under a scanned image: if the scan was made searchable, there is text under the picture even though you cannot see it.',
        ],
      },
      { t: 'h2', texto: 'What a real check looks like' },
      {
        t: 'p',
        texto:
          'A real check is done on the FINISHED file, not on the one you were editing: extract its text again, search it for each string you removed, and search the metadata too. Anything short of that is checking your intention rather than your output.',
      },
      {
        t: 'p',
        texto:
          'You can run that check on your own document right now, in your browser and without uploading anything, with the free checker on this site: it tells you what personal data is still extractable from a PDF and which pages have no text layer at all.',
      },
      { t: 'h2', texto: 'What checking cannot tell you' },
      {
        t: 'nota',
        texto:
          'On a page with no text layer — a scan, a photograph, a full-page image — there is nothing to re-read, so nothing can confirm the removal the way it can on text. Those pages need eyes. Any tool that reports such a page as clean is telling you something it cannot know.',
      },
      {
        t: 'p',
        texto:
          'That is why TachadoPDF lists the pages it could not check in the report instead of quietly counting them as fine, and why the free checker says so on the front of the verdict rather than in a footnote.',
      },
    ],
    enlaceComprobador: 'Run the free check on your own PDF now',
    relacionadas: ['guia-en-caja-negra', 'guia-en-sin-subir', 'guia-en-dsar'],
  },
  {
    id: 'guia-en-tribunales',
    titulo: 'Redacting court filings: what Rule 5.2 requires, and how filings leak anyway',
    tituloEnlace: 'Redacting court filings: what Rule 5.2 requires',
    descripcion:
      'Redacting a court filing under FRCP Rule 5.2: what it actually mandates, why the sealed-plus-public pair is where filings leak, and a pre-filing checklist.',
    metaTitulo: 'Redact a court filing right (FRCP Rule 5.2) · TachadoPDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'In federal civil practice the duty to redact sits on the filer and on counsel, not on the clerk. Rule 5.2 of the Federal Rules of Civil Procedure sets the floor, and the floor is narrower than most people remember.',
      },
      { t: 'h2', texto: 'What Rule 5.2 requires' },
      // Source checked 2026-08-08 against the rule text: Fed. R. Civ. P. 5.2(a) permits only the
      // last four digits of the social-security and taxpayer-identification number, the year of
      // birth, the minor's initials, and the last four digits of the financial-account number;
      // 5.2(f) is the option to also file an unredacted copy under seal.
      // https://www.law.cornell.edu/rules/frcp/rule_5.2
      // Two things to keep straight if this page is ever challenged: 5.2 is the CIVIL rule (the
      // criminal counterpart, Fed. R. Crim. P. 49.1, lists the same four identifiers), and 5.2(b)
      // carves out six exemptions. The 2007 Committee Note also states that the clerk is not
      // required to review filings for compliance — which is why the page says the duty sits on
      // the filer, not the clerk.
      {
        t: 'ul',
        items: [
          'Social security numbers and taxpayer identification numbers: only the last four digits.',
          'Dates of birth: only the year.',
          'Names of individuals known to be minors: initials only.',
          'Financial account numbers: only the last four digits.',
        ],
      },
      {
        t: 'p',
        texto:
          'The rule also allows a party to file an unredacted copy under seal alongside the redacted public version. That pairing is where most accidents happen: two documents with almost identical contents, one of which must never be published, moving through the same workflow on the same afternoon.',
      },
      { t: 'h2', texto: 'How filings leak' },
      // Source checked 2026-08-08: US v. Manafort, 1:17-cr-00201 (D.D.C.). The defective redacted
      // response was entered on the public docket as ECF 471 on 8 Jan 2019 and a CORRECTED
      // redacted version as ECF 472 the same day.
      // https://www.courtlistener.com/docket/6183591/united-states-v-manafort/
      // ⚠ "within minutes" was retired on 2026-08-08: nothing timestamps the interval. The
      // same-day corrected refiling is a docket fact and is the stronger claim anyway.
      {
        t: 'p',
        texto:
          'On 8 January 2019, a filing on behalf of Paul Manafort reached the public docket with passages blacked out. The black bars were drawn over live text; reporters copied the passages straight out, and a corrected version of the same filing had to be entered on the docket before the day was over. Nothing about that filing looked wrong on screen.',
      },
      {
        t: 'p',
        texto:
          'Word-processor highlighting has the same problem, and so do PDF annotation tools: both survive conversion as a shape on top of text that is still there. Flattening the file does not reliably help either — it depends on the tool and on the layer.',
      },
      { t: 'h2', texto: 'A pre-filing checklist' },
      {
        t: 'ol',
        items: [
          'Apply true redaction: the text has to be removed from the file, not covered.',
          'Strip document and XMP metadata, which often still carries the client name or the original file name.',
          'Re-extract the text of the FINAL PDF and search it for every string you redacted.',
          'Search the metadata of the final PDF for the same strings.',
          'Review the document visually, page by page, including scanned exhibits.',
          'Keep a record of the check you ran, with the date and a fingerprint of the file you filed.',
        ],
      },
      {
        t: 'nota',
        texto:
          'This page is general information about a procedural rule, not legal advice, and no tool can decide what you were required to redact. TachadoPDF performs and verifies the removal; the judgement about what must come out remains yours.',
      },
    ],
    enlaceComprobador: 'Check a filing for leftover data before you file',
    relacionadas: ['guia-en-dsar', 'guia-en-caja-negra', 'guia-en-comprobar'],
  },
  {
    id: 'guia-en-dsar',
    titulo: 'Redacting a subject access request response without exposing third parties',
    tituloEnlace: 'Redacting a subject access request response',
    descripcion:
      'Redacting a DSAR response without exposing third parties: where the data hides, what ICO enforcement looks like, and a workflow that fits the one-month clock.',
    metaTitulo: 'Redact a subject access request (DSAR) safely · TachadoPDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'A subject access request is the one disclosure where the reader will examine every line, has a statutory right to complain, and already suspects you of something. It also has a clock: normally one month.',
      },
      { t: 'h2', texto: 'Why the risk is concentrated here' },
      {
        t: 'p',
        texto:
          'A DSAR bundle is assembled quickly, from mailboxes and shared drives, by whoever is available. Third-party personal data has to come out, and the material that has to come out is scattered through email threads, attachments and spreadsheets rather than sitting in one tidy field.',
      },
      { t: 'h2', texto: 'What enforcement looks like' },
      // SOURCES, all checked 2026-08-08 against the ICO's own pages:
      //  - Guidance "Disclosing documents to the public securely: hidden personal information and
      //    how to avoid an accidental breach", published 31 July 2025. NOTE: the guidance itself
      //    does NOT name the MoD or the PSNI — the ICO's news release announcing it does, quoting
      //    Deputy Commissioner Emily Keaney. Cite the release for that link, not the guidance.
      //    https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/07/new-guidance-on-disclosing-documents-to-the-public/
      //  - PSNI: £750,000 monetary penalty, 3 Oct 2024; a hidden worksheet in an FOI spreadsheet
      //    exposed the surnames, initials, ranks and roles of all 9,483 officers and staff.
      //    https://ico.org.uk/action-weve-taken/enforcement/2024/10/police-service-of-northern-ireland-mpn/
      //  - MoD: ICO statement of 15 July 2025 — a spreadsheet shared in 2022, thought to concern a
      //    small number of applicants, held hidden data on more than 18,000 people. The ICO decided
      //    NO further regulatory action. ⚠ NEVER attach the £350,000 MoD fine to this incident: that
      //    penalty is a DIFFERENT case (a 2021 email sent using "To" instead of "BCC", 265 email
      //    addresses). Conflating them is the easiest way to get this page torn apart.
      //    https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/07/ico-statement-in-response-to-2022-mod-data-breach/
      //  - Police Scotland: £66,000 fine AND a reprimand, 11 March 2026. The incident began with an
      //    excessive phone extraction from a person who had reported a crime; the full unredacted
      //    contents then went into a misconduct disclosure bundle shared with a third party who
      //    should not have received it, with no adequate review or redaction procedures in place.
      //    https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/03/police-scotland-fined-66k-and-reprimanded-following-serious-data-mishandling/
      {
        t: 'p',
        texto:
          'On 31 July 2025 the Information Commissioner\'s Office published guidance specifically on disclosing documents to the public securely, addressing personal information hidden inside files. Announcing it, the ICO pointed to serious breaches at the Police Service of Northern Ireland and the Ministry of Defence in which documents had been disclosed without proper checks for hidden personal information. The PSNI case cost £750,000: a hidden worksheet in a spreadsheet released under freedom of information exposed the surnames, initials, ranks and roles of all 9,483 officers and staff. In the MoD case, a spreadsheet believed to concern a small number of applicants in fact carried hidden data on more than 18,000 people. And in March 2026 the ICO fined Police Scotland £66,000 and issued a reprimand after the full unredacted contents of a crime victim\'s mobile phone were put into a misconduct disclosure bundle and shared with a third party who should not have received it — the ICO found that appropriate review, redaction and security procedures were not in place.',
      },
      { t: 'h2', texto: 'The four hiding places in a bundle' },
      {
        t: 'ul',
        items: [
          'Text that was covered rather than deleted — a black box, a highlight, a white-filled shape.',
          'Hidden rows, hidden columns and filtered ranges in spreadsheets exported to PDF.',
          'Metadata and tracked changes carried over from the original documents.',
          'Scanned annexes, where nothing can be searched and only a human can see what is on the page.',
        ],
      },
      { t: 'h2', texto: 'A workflow that fits the deadline' },
      {
        t: 'ol',
        items: [
          'Assemble the bundle first and freeze it; redact once, at the end, on the final PDF.',
          'Remove third-party names, contact details and identifiers by marking them directly.',
          'Strip metadata from the finished file.',
          'Re-extract the text of the finished file and search it for the names you removed.',
          'Read the scanned annexes with your own eyes; nothing else can.',
          'Keep the verification record with the response, so that if the requester complains you can show what you checked and when.',
        ],
      },
      {
        t: 'nota',
        texto:
          'General information, not legal advice. TachadoPDF removes and verifies; deciding what a data subject is entitled to receive is a judgement it cannot make for you.',
      },
    ],
    enlaceComprobador: 'Check a DSAR bundle for hidden data — free',
    relacionadas: ['guia-en-tribunales', 'guia-en-comprobar', 'guia-en-nominas'],
  },
  {
    id: 'guia-en-sin-subir',
    titulo: 'How to redact a PDF without uploading it anywhere',
    tituloEnlace: 'How to redact a PDF without uploading it',
    descripcion:
      "Redact a PDF without uploading it: most online tools send your file to a server first. Here's how to redact entirely in your browser — and verify that claim yourself.",
    metaTitulo: 'Redact a PDF without uploading it · TachadoPDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'If the document you need to redact is the reason you cannot use an online tool — a client file, a personnel record, a case bundle — then "we delete it after an hour" is not an answer. The answer is not sending it at all.',
      },
      { t: 'h2', texto: 'Why "we delete it afterwards" is the wrong question' },
      {
        t: 'p',
        texto:
          'Once a document leaves your machine, you are relying on a retention promise, on the security of a system you cannot inspect, and often on a processing agreement nobody at your organisation has read. None of that is visible to you, and none of it is something you can demonstrate later if you are asked.',
      },
      { t: 'h2', texto: 'How to verify a no-upload claim yourself' },
      {
        t: 'ol',
        items: [
          'Load the page.',
          'Disconnect from the internet — turn off Wi-Fi, unplug the cable, enable flight mode.',
          'Redact your document and download the result.',
        ],
      },
      {
        t: 'p',
        texto:
          'If it still works, nothing was sent. That test is the whole argument, and it is the reason TachadoPDF has no server: there is no upload step, and no machine on the other end that could receive one. The single outbound request the application ever makes is checking a Pro licence key with Gumroad, and that only happens if you type one in.',
      },
      { t: 'h2', texto: 'Local does not mean unverified' },
      {
        t: 'p',
        texto:
          'Working locally usually means losing the audit trail. It does not have to. After redacting, TachadoPDF reopens the file it produced, searches it again for everything you removed, checks the metadata too, and refuses to release the download if anything survived. The verification report it generates lists what was redacted and where, which metadata was stripped, which pages could not be checked, and the SHA-256 fingerprint of the file you deliver — all produced on your own machine.',
      },
      {
        t: 'nota',
        texto:
          'The source code is open under AGPL-3.0, so the no-upload claim is not something you have to take on trust.',
      },
    ],
    enlaceComprobador: "Check what's in your PDF, in your browser — free",
    relacionadas: ['guia-en-comprobar', 'guia-en-caja-negra', 'guia-en-nominas'],
  },
  {
    id: 'guia-en-nominas',
    titulo: 'Sending payslips and HR documents as PDFs without exposing personal data',
    tituloEnlace: 'Sending payslips and HR documents as PDFs',
    descripcion:
      "Redact payslips and HR PDFs before sharing: they carry bank details, national IDs and home addresses. What to remove, and how to confirm it's really gone.",
    metaTitulo: 'Redact payslips and HR PDFs before sharing · TachadoPDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Payroll and HR documents are shared constantly — with an employee, an accountant, a lender, a tribunal — and almost every one of them carries more personal data than the recipient needs.',
      },
      { t: 'h2', texto: 'What is usually in there' },
      {
        t: 'ul',
        items: [
          'Bank account details, used for the salary payment and needed by nobody else.',
          'National identifiers and tax or social security numbers.',
          'Home address and personal phone number.',
          'Absence, sickness or disciplinary information, which is often special-category data.',
          'Other employees, when the document is a payroll summary rather than a single payslip.',
        ],
      },
      { t: 'h2', texto: 'The rule of thumb' },
      {
        t: 'p',
        texto:
          'Send what the recipient needs for the purpose they asked for, and nothing else. A lender verifying income needs gross pay and an employer name; it does not need a bank account number or a colleague\'s salary.',
      },
      { t: 'h2', texto: 'Doing it safely' },
      {
        t: 'ol',
        items: [
          'Work on a copy, never on the original record.',
          'Mark every field the recipient does not need and remove it from the file — not with a black box.',
          'Strip the metadata: exported payroll PDFs frequently carry the system user name and the original file path.',
          'Check the finished file: extract its text again and search it for the account number and the identifiers you removed.',
          'If any page is a scan, look at it yourself — no automatic check can read it.',
        ],
      },
      {
        t: 'p',
        texto:
          'TachadoPDF does steps 2 to 4 in your browser, without the document leaving your machine, and blocks the download if anything you redacted is still extractable from the result. Automatic detection currently covers email addresses and Spanish identifiers; in a payslip from any other country you mark the fields yourself, and the removal and the verification are identical either way.',
      },
      {
        t: 'nota',
        texto:
          'General information, not legal advice, and not a statement about your obligations as an employer.',
      },
    ],
    enlaceComprobador: 'Check a payslip for leftover data — free',
    relacionadas: ['guia-en-sin-subir', 'guia-en-dsar', 'guia-en-comprobar'],
  },
  {
    id: 'guia-en-sin-acrobat',
    titulo: 'How to redact a PDF without Adobe Acrobat',
    tituloEnlace: 'Redact a PDF without Adobe Acrobat',
    descripcion:
      "You don't need Acrobat to redact a PDF. Here is how to remove the text for real — not hide it behind a black box — in your browser, for free, and how to check the result before you send the file.",
    metaTitulo: 'Redact a PDF without Adobe Acrobat · TachadoPDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Adobe Acrobat Pro has a redaction tool, but it is a paid subscription, and most people who need to black out one address on one document do not have it. Redaction is a specific, well-defined operation, and you do not need Acrobat to do it. What you do need is to do it properly, because the routes that look easiest are the ones that leave the data sitting in the file.',
      },
      { t: 'h2', texto: 'What redacting a PDF actually involves' },
      {
        t: 'p',
        texto:
          'Removing a piece of information from a PDF is three separate jobs, and a tool that skips any one of them leaves data behind:',
      },
      {
        t: 'ul',
        items: [
          'Delete the text itself from the page content, so it can no longer be selected, copied or extracted.',
          'Clear the pixels where the information sits inside a scanned image: an image is not text, and deleting text does nothing to it.',
          'Strip the metadata: the document title, the author field, and the separate XMP block often still carry a name, a file path or a case number.',
        ],
      },
      { t: 'h2', texto: 'The methods people try, and where each one falls short' },
      {
        t: 'ul',
        items: [
          'A black rectangle over the text (in Preview, in a browser, or in a basic PDF editor): the rectangle is only a shape drawn on top. Select across it and the words copy straight out. Nothing was removed.',
          'Flatten or print-to-PDF: this can help, but if the page keeps a searchable text layer, or the scan was made searchable, the words are still inside the file.',
          'Free online redaction sites: these usually upload your document to someone else’s server, which is the opposite of what you want when the file is confidential.',
          'Acrobat Pro: it does the job, but it is a monthly fee, the redaction is manual, and it does not reopen the finished file to show that nothing survived. That last step is the one people skip.',
        ],
      },
      { t: 'h2', texto: 'Redact the PDF in your browser instead' },
      {
        t: 'p',
        texto:
          'TachadoPDF runs entirely in your browser, so the document is never uploaded to any server. You mark what to remove; it deletes the text from the file and clears the pixels of the areas you marked, strips the metadata, and then reopens the PDF it just produced and searches it again for everything you redacted. If any of it is still there, the download is blocked and you are told which page. You also get a verification report: a plain record of what was removed and that the finished file was re-read, which you can attach when you hand the document over.',
      },
      {
        t: 'p',
        texto:
          'Automatic detection currently covers email addresses and Spanish identifiers; anything else, such as a name, a foreign account number or a signature, you mark by hand, and the removal and the re-read are identical either way. The free tier handles a few documents a month; Pro is a one-time payment, not a subscription, for unlimited use and a report with no watermark.',
      },
      { t: 'h2', texto: 'Check it before you send, whatever tool you used' },
      {
        t: 'ol',
        items: [
          'Open the finished PDF.',
          'Select the whole document, copy it, and paste into a plain text editor.',
          'Search for what you removed. If it appears, it was never deleted: go back and remove it from the file, not with a box on top.',
        ],
      },
      {
        t: 'nota',
        texto:
          'General information, not legal advice. This describes how the file is handled, not a statement about your obligations.',
      },
    ],
    enlaceComprobador: 'Check your PDF for free — see what text is still extractable',
    relacionadas: ['guia-en-caja-negra', 'guia-en-comprobar', 'guia-en-sin-subir'],
  },

  // Trust / "how it works" page (2026-09-08). English counterpart of the Spanish `guia/como-funciona`.
  // Not a task guide: it explains the product's mechanism (in-browser processing, what does and does
  // not go to the network, the anti-false-green re-read, open source, no accounts) to address the
  // conversion barrier — trust IS the product for a privacy tool, and this market has a paid campaign.
  {
    id: 'guia-en-how-it-works',
    titulo: 'How TachadoPDF works, and why your file never leaves your browser',
    tituloEnlace: 'How TachadoPDF works',
    descripcion:
      'TachadoPDF processes your whole PDF inside your browser: the file is never uploaded to a server, there are no accounts and no tracking, and the redaction is checked before you get the document back. Here is exactly how it works — and how to verify it yourself.',
    metaTitulo: 'How TachadoPDF works: nothing is uploaded · TachadoPDF',
    enlaceComprobador: 'See for yourself: check a PDF for free, without uploading it',
    relacionadas: ['guia-en-sin-subir', 'guia-en-comprobar', 'guia-en-caja-negra'],
    cuerpo: [
      {
        t: 'p',
        texto:
          'Handing a document full of personal data to an unfamiliar website is, most of the time, an act of faith: you upload it and then you have no idea what happens to it. TachadoPDF is built so that you do not have to take our word for it — so that you can check for yourself what happens to your file. This page explains how it works under the hood.',
      },
      { t: 'h2', texto: 'The PDF is processed on your own device' },
      {
        t: 'p',
        texto:
          'When you open a file, the program that reads it, edits it and writes it back runs inside the browser tab, on your own computer or phone. There is no upload: the file does not travel across the network to a machine of ours, because there is no processing machine of ours. The engine that works on the document is compiled to WebAssembly and arrives together with the page, like an image or a stylesheet.',
      },
      {
        t: 'p',
        texto:
          'The simplest proof is one you can run yourself: open the page, turn off your Wi‑Fi or mobile data, and carry on redacting and downloading as normal. If the tool worked by sending your file away, it could do nothing at all offline.',
      },
      { t: 'h2', texto: 'What goes to the internet, and what does not' },
      {
        t: 'p',
        texto:
          'The rule is strict: not one byte of your document leaves. The only things the page asks the network for are what it needs to show itself — its own code and its typeface, served from this same site — and, if you use the paid version, a check of your licence key against the payments platform. Nothing else: not your PDF, not its text, not a summary, not a thumbnail.',
      },
      {
        t: 'p',
        texto:
          'And so that this does not rest on our good intentions, the page declares a content security policy that the browser itself enforces: it forbids connecting to any destination other than that licence check. There are no ad networks, no remote fonts, and no third‑party libraries pulled in from another server.',
      },
      { t: 'h2', texto: 'No accounts, no tracking' },
      {
        t: 'p',
        texto:
          'We do not ask you to sign up, hand over an email, or install anything. We run no analytics either: there are no tracking cookies and no counters watching what you do. You use the tool and you leave, without leaving a trail behind that then has to be protected.',
      },
      { t: 'h2', texto: 'The redaction is checked before you get it' },
      {
        t: 'p',
        texto:
          'Redacting for real means removing the data from the contents of the file, not putting something on top of it. When you finish, TachadoPDF reopens the document it has just produced and searches again for what should have disappeared. If it finds any trace, it does not pass the job and it warns you: the worst possible outcome would be handing you back a file that looks clean and is not.',
      },
      {
        t: 'p',
        texto:
          'Pages that are a scanned image, with no readable text underneath, are flagged separately and in red: there, automatic pattern detection cannot read anything, so we ask you to check them with your own eyes. We would rather tell you what we cannot cover than pretend that we cover it.',
      },
      { t: 'h2', texto: 'The code is open source' },
      {
        t: 'p',
        texto:
          'All of TachadoPDF is public and released under the AGPL‑3.0 licence. Anyone — you, or someone you trust who can read code — can review exactly what the tool does with your file, without having to believe this page. A privacy promise you cannot inspect is worth little; this one you can.',
      },
      { t: 'h2', texto: 'Free, and a paid version with no subscription' },
      {
        t: 'p',
        texto:
          'You can redact documents for free every month, with a limit set for ordinary use. If you need more, there is a Pro version that is a one‑time payment — not a subscription — which lifts that limit. The charge and the receipts are handled by an external payments platform; all we do is check that your key is valid. Even paying, your document does not leave the browser.',
      },
    ],
    faqs: [
      {
        pregunta: 'Is my document really not uploaded anywhere?',
        respuesta:
          'No. The PDF is processed inside your browser and does not travel to any machine of ours. You can prove it by disconnecting from the internet once the page has loaded: the tool keeps redacting and downloading, because all the work happens on your device.',
      },
      {
        pregunta: 'How can I verify that this is true?',
        respuesta:
          'Three ways: use the tool offline and see that it still works; notice that it never asks for an account or an email; and, if you want to go further, read the code, which is open source (AGPL‑3.0) and anyone can inspect.',
      },
      {
        pregunta: 'What is the only thing that does go to the internet?',
        respuesta:
          'Only two things, and neither is your document: the page itself with its code and typeface, served from this same site, and — if you use the Pro version — a check of your licence key. The browser blocks any other connection by security policy.',
      },
      {
        pregunta: 'Do you keep anything I do, or usage analytics?',
        respuesta:
          'No. There are no accounts, no tracking cookies and no analytics. We do not record which files you open or what you redact: no record of your session is kept anywhere.',
      },
    ],
  },

  // SEO alta intención EN (2026-09-12): «redact a bank statement» — consulta muy buscada en UK/US
  // (alquileres, hipotecas, préstamos: se pide el extracto para probar ingresos). Canal DISTINTO del
  // ES, sin techo de dedup (el barrido Jaccard es solo español). Funnela al comprobador. Solo EN.
  {
    id: 'guia-en-bank-statement',
    titulo: 'How to redact a bank statement PDF before you share it',
    tituloEnlace: 'How to redact a bank statement',
    descripcion:
      'A landlord, letting agent or lender asks for your bank statement, but they do not need to see every transaction, your balance or your full account number. How to remove what they do not need from a bank statement PDF — for real, in your browser, without uploading the file.',
    metaTitulo: 'How to redact a bank statement PDF · TachadoPDF',
    enlaceComprobador: 'Check your statement for free — see what is still extractable',
    relacionadas: ['guia-en-sin-subir', 'guia-en-comprobar', 'guia-en-caja-negra'],
    cuerpo: [
      {
        t: 'p',
        texto:
          'To rent a flat, apply for a loan or pass an affordability check, you are often asked for a recent bank statement. But a statement shows far more than the person asking actually needs: every purchase you made, your running balance, your full account number and sort code. You can prove what they need — that the rent or the repayment is affordable — without handing over a map of your whole financial life.',
      },
      { t: 'h2', texto: 'What usually does not need to be on there' },
      {
        t: 'ul',
        items: [
          'Transactions that have nothing to do with what you are proving.',
          'Your full account number and sort code, when the last few digits are enough.',
          'The running balance, if you are only proving a specific payment or your income.',
          'Any other account holder on a joint account.',
          'Spending that reveals private things — a pharmacy, a clinic, a betting site — that are nobody else’s business.',
        ],
      },
      { t: 'h2', texto: 'Why a black box does not remove it' },
      {
        t: 'p',
        texto:
          'Drawing a black rectangle over a line in a PDF viewer does not delete it: the text stays inside the file and whoever you send it to can select it and copy it straight back out. With a bank statement that is serious, because the recipient — a letting agency, a private landlord — can rebuild your transactions with no technical skill at all. The guide on the black box linked at the end explains why; here we go straight to removing it for real.',
      },
      { t: 'h2', texto: 'How to remove it for real, without uploading anything' },
      {
        t: 'p',
        texto:
          'With TachadoPDF the statement is processed inside your browser: it is never uploaded to a server. The tool finds account numbers and IBANs on its own; the transactions, the balance and anything else you mark by dragging over it. When you apply the redaction, the text is removed from the contents of the file (not covered), and the tool re-reads the PDF to confirm the data can no longer be extracted before it hands it to you.',
      },
      { t: 'h2', texto: 'Check it before you send it' },
      {
        t: 'p',
        texto:
          'A statement goes to strangers, so do not trust how it looks — test it. The free checker reads the file (without uploading it) and tells you what personal data is still extractable. And if your statement is a photo or a scan rather than a real PDF, there is no text to analyse: those pages have to be checked by eye, because a black box over an image is just an image over an image and can be lifted off.',
      },
    ],
    faqs: [
      {
        pregunta: 'Can I redact some transactions and keep others?',
        respuesta:
          'Yes. You mark the lines you want gone by hand and leave the rest — for example, the salary or income entries. The marked text is removed from the file, not covered, so the recipient cannot select it or recover it.',
      },
      {
        pregunta: 'What should I leave in for a rental or affordability check?',
        respuesta:
          'Usually it is enough to show the income coming in and that the rent or repayment is affordable; you can redact the rest of the transactions and the full account number. What exactly you must provide depends on who is asking, so treat this as general information, not advice.',
      },
      {
        pregunta: 'Is my bank statement uploaded anywhere?',
        respuesta:
          'No. Everything happens inside your browser and the file is not transmitted anywhere. You can prove it by disconnecting from the internet once the page has loaded: the tool keeps redacting and downloading the statement.',
      },
      {
        pregunta: 'What if my statement is a photo or a scan?',
        respuesta:
          'On an image the pixels of the area have to be cleared, not covered with a box that can be removed. TachadoPDF does that, but since an automatic check cannot read the content of an image, review those pages by eye before you send the statement.',
      },
    ],
  },

  // SEO alta intención EN (2026-09-12): «redact a utility bill» — proof of address para bancos,
  // exchanges cripto, alquileres, KYC. Consulta enorme en UK/US, distinta de bank statement. Canal EN
  // (sin techo de dedup ES). Buen encaje (PDF con texto). Funnela al comprobador. Solo inglés.
  {
    id: 'guia-en-utility-bill',
    titulo: 'How to redact a utility bill before you send it for verification',
    tituloEnlace: 'How to redact a utility bill',
    descripcion:
      'You are asked for a utility bill as proof of address — for a bank, a crypto exchange, a landlord or an ID check — but it shows your account number and more than the check needs. How to remove what they do not need from a utility bill PDF, in your browser, without uploading the file.',
    metaTitulo: 'How to redact a utility bill PDF · TachadoPDF',
    enlaceComprobador: 'Check your bill for free — see what is still extractable',
    relacionadas: ['guia-en-bank-statement', 'guia-en-sin-subir', 'guia-en-comprobar'],
    cuerpo: [
      {
        t: 'p',
        texto:
          'A bank, a crypto exchange, a letting agent or an online sign-up asks you for a recent utility bill as proof of address. The trouble is that a utility bill proves a lot more than where you live: it carries your account number with the supplier, a customer reference, sometimes your consumption and your payment details. All the recipient actually needs is your name, your address and a recent date — the rest is yours to keep.',
      },
      { t: 'h2', texto: 'What a proof-of-address check actually needs' },
      {
        t: 'p',
        texto:
          'Almost always: your name, your address, and a date recent enough to count. Everything else on the bill is extra that the person on the other end did not ask for and does not need to hold.',
      },
      {
        t: 'ul',
        items: [
          'Your utility account number and customer reference.',
          'Bank or card details and any direct-debit information.',
          'Your consumption or usage figures.',
          'Anyone else named on the bill.',
          'A barcode or QR code, which often encodes the account number even after you black out the digits.',
        ],
      },
      { t: 'h2', texto: 'Why a black box does not remove it' },
      {
        t: 'p',
        texto:
          'Drawing a black rectangle over the account number in a PDF viewer does not delete it: the text stays inside the file and whoever receives it can select it and copy it straight out. The barcode is worse — the number is still encoded in the bars even if you cover the printed digits. The guide on the black box linked at the end explains why; here we go straight to removing it for real.',
      },
      { t: 'h2', texto: 'How to remove it for real, without uploading anything' },
      {
        t: 'p',
        texto:
          'With TachadoPDF the bill is processed inside your browser and is never uploaded to a server. You mark the account number, the reference, the barcode and anything else that is not your name, address or the date; the tool removes that text from the contents of the file — not a box on top — and then re-reads the PDF to confirm it can no longer be extracted before handing it back. If your bill is a photo or a scan, the pixels of the marked area are cleared, not covered.',
      },
      { t: 'h2', texto: 'Check it before you send it' },
      {
        t: 'p',
        texto:
          'Proof of address goes to strangers and often gets stored, so do not trust how it looks — test it. The free checker reads the file, without uploading it, and tells you what is still extractable. On a scanned or photographed bill there is no text to analyse, so review those pages by eye: a black box over an image is just an image over an image, and it can be lifted off.',
      },
    ],
    faqs: [
      {
        pregunta: 'Can I hide the account number and keep just my name and address?',
        respuesta:
          'Yes. You mark the account number, the customer reference and anything else that is not needed, and leave your name, address and the date. The marked text is removed from the file, not covered, so the recipient cannot select it or recover it.',
      },
      {
        pregunta: 'The digits are covered but there is a barcode — is that a problem?',
        respuesta:
          'It can be. A barcode or QR code often encodes the same account number, so blacking out the printed digits is not enough on its own. Mark and remove the barcode too, or check the finished file to make sure nothing is still readable.',
      },
      {
        pregunta: 'Is my utility bill uploaded anywhere?',
        respuesta:
          'No. Everything happens inside your browser and the file is not transmitted anywhere. You can prove it by disconnecting from the internet once the page has loaded: the tool keeps redacting and downloading the bill.',
      },
      {
        pregunta: 'What if my bill is a photo or a scan?',
        respuesta:
          'On an image the pixels of the area have to be cleared, not covered with a box that can be lifted off. TachadoPDF does that, but since an automatic check cannot read the content of an image, review those pages by eye before you send the bill.',
      },
    ],
  },
];
