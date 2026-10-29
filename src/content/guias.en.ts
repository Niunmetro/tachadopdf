// Guías en inglés. NO son traducciones de las españolas: una guía sobre sanciones de la AEPD a
// comunidades de propietarios no tiene audiencia inglesa, y «administrador de fincas» no tiene
// equivalente. Se escriben para la intención de búsqueda inglesa, que además tiene algo que la
// española no tiene: la tarea inglesa («redaction») tiene nombre, reglamento y partida de gasto.
//
// Todo el contenido son DATOS tipados: el generador escapa cada cadena.

import { URL_REPO } from '../config';
import type { ContenidoGuia } from './tipos';

export const GUIAS_EN: ContenidoGuia[] = [
  {
    id: 'guia-en-caja-negra',
    fuentes: [
      {
        etiqueta: 'United States v. Manafort docket: the redacted and corrected filings of 8 January 2019 (CourtListener)',
        url: 'https://www.courtlistener.com/docket/6183591/united-states-v-manafort/',
      },
      {
        etiqueta: "Mother Jones, 8 January 2019: Paul Manafort's lawyers tried and failed to redact a filing",
        url: 'https://www.motherjones.com/politics/2019/01/paul-manafort-failed-redaction/',
      },
      {
        etiqueta: 'ICO: £750,000 monetary penalty to the Police Service of Northern Ireland (3 October 2024)',
        url: 'https://ico.org.uk/action-weve-taken/enforcement/2024/10/police-service-of-northern-ireland-mpn/',
      },
      {
        etiqueta: 'ICO penalty notice to the PSNI (PDF, 76 pages)',
        url: 'https://ico.org.uk/media2/migrated/4031177/psni-penalty-notice.pdf',
      },
    ],
    titulo: 'Why the black box over your PDF does not delete the text',
    tituloEnlace: 'Why the black box over your PDF does not delete the text',
    descripcion:
      'A black box over PDF text only covers it: the words stay in the file and copy straight out. Test it in 3 seconds, then remove the text for real.',
    metaTitulo: "Black box on a PDF doesn't delete the text · TachadoPDF",
    cuerpo: [
      {
        t: 'p',
        texto:
          'A black box over text in a PDF is not redaction: it is a shape drawn on top, and the text underneath can usually still be selected, copied and searched. To check, select across the box and paste into a text editor. It is the most common mistake made when preparing a document for release: covering the confidential part with a black rectangle. The data is still there, and whoever receives the file can recover it with no technical knowledge at all.',
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
    relacionadas: ['guia-en-comprobar', 'guia-en-recuperar', 'guia-en-sin-subir', 'guia-en-sin-acrobat'],
  },
  {
    id: 'guia-en-comprobar',
    titulo: 'How to check whether a PDF has actually been redacted',
    tituloEnlace: 'How to check whether a PDF has actually been redacted',
    descripcion:
      'Check whether a PDF is really redacted before you send it: a three-second test, the four other places data hides, and what a check can never tell you.',
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
    relacionadas: ['guia-en-caja-negra', 'guia-en-recuperar', 'guia-en-sin-subir', 'guia-en-dsar'],
  },
  {
    id: 'guia-en-tribunales',
    fuentes: [
      {
        etiqueta: 'United States v. Manafort docket: the redacted and corrected filings of 8 January 2019 (CourtListener)',
        url: 'https://www.courtlistener.com/docket/6183591/united-states-v-manafort/',
      },
      {
        etiqueta: "Mother Jones, 8 January 2019: Paul Manafort's lawyers tried and failed to redact a filing",
        url: 'https://www.motherjones.com/politics/2019/01/paul-manafort-failed-redaction/',
      },
    ],
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
    fuentes: [
      {
        etiqueta: 'ICO: £750,000 monetary penalty to the Police Service of Northern Ireland (3 October 2024)',
        url: 'https://ico.org.uk/action-weve-taken/enforcement/2024/10/police-service-of-northern-ireland-mpn/',
      },
      {
        etiqueta: 'ICO penalty notice to the PSNI (PDF, 76 pages)',
        url: 'https://ico.org.uk/media2/migrated/4031177/psni-penalty-notice.pdf',
      },
    ],
    titulo: 'Redacting a subject access request response without exposing third parties',
    tituloEnlace: 'Redacting a subject access request response',
    descripcion:
      'Redacting a DSAR response without exposing third parties: where the data hides, what ICO enforcement looks like, and a workflow for the one-month clock.',
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
      "Redact a PDF without uploading it: most online tools send your file to a server first. How to redact entirely in your browser, and check that yourself.",
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
      'A redacted payslip has private details removed (NI or ID number, bank account, address) while pay and employer stay visible. What to hide, and how.',
    metaTitulo: 'Redacted payslip: what it means and how to make one',
    cuerpo: [
      {
        t: 'p',
        texto:
          'A redacted payslip is a payslip with some details permanently removed — usually the NI or national ID number, the bank account and the home address — so that what the other person needs (employer, pay period, gross and net pay) stays readable. Redacted means removed from the file, not just covered with a black box, which anyone can copy back out.',
      },
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
    faqs: [
      {
        pregunta: 'What does a redacted payslip mean?',
        respuesta:
          'It is a payslip with sensitive details, such as the NI or national ID number, the bank account and the home address, removed before it is shared, while the figures the other person needs stay visible.',
      },
      {
        pregunta: 'What can I redact on a payslip?',
        respuesta:
          'Anything the recipient did not ask for and does not need: typically the NI or national ID number, bank account details, the home address and details of other employees. Keep what the purpose needs, usually the employer, the pay period and the pay figures; if unsure, ask the person requesting it what they need.',
      },
    ],
  },
  {
    id: 'guia-en-sin-acrobat',
    titulo: 'How to redact a PDF without Adobe Acrobat',
    tituloEnlace: 'Redact a PDF without Adobe Acrobat',
    descripcion:
      "You don't need Acrobat to redact a PDF. How to remove the text for real, not hide it behind a black box, free in your browser, and check it before sending.",
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
    fuentes: [{ etiqueta: 'TachadoPDF source code on GitHub (AGPL-3.0 licence)', url: URL_REPO }],
    titulo: 'How TachadoPDF works, and why your file never leaves your browser',
    tituloEnlace: 'How TachadoPDF works',
    descripcion:
      'TachadoPDF processes your PDF in your browser: never uploaded, no accounts, no tracking, and the redaction is checked. How it works and how to verify it.',
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
      'A landlord or lender needs your bank statement, not every transaction or your full account number. Redact the statement PDF in your browser, no upload.',
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
      'Proof of address usually needs only your name, address and date. How to remove the account number, barcode and payment details from a utility bill PDF.',
    metaTitulo: 'How to redact a utility bill for proof of address',
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

  // SEO alta intención EN (2026-09-12): «redact a passport / ID» — la consulta KYC de mayor volumen y
  // ansiedad (robo de identidad: alquileres, empleo, exchanges). Casi siempre es una IMAGEN, así que
  // promociona el REDACTOR DE IMÁGENES (/en/redact-image/, poco tráfico). Canal EN sin techo de dedup.
  {
    id: 'guia-en-passport',
    titulo: 'How to redact a passport or ID before you send a copy',
    tituloEnlace: 'How to redact a passport or ID',
    descripcion:
      'Asked for a copy of your passport or ID? Hide the document number and the machine-readable lines and still prove who you are. In your browser, no upload.',
    metaTitulo: 'How to redact a passport or ID copy · TachadoPDF',
    enlaceComprobador: 'Check a PDF for free — see what personal data is still extractable',
    relacionadas: ['guia-en-caja-negra', 'guia-en-sin-subir', 'guia-en-comprobar'],
    cuerpo: [
      {
        t: 'p',
        texto:
          'A rental, a new job, a crypto exchange or an online sign-up asks you to send a copy of your passport or ID card. A full, clean copy is exactly what an identity thief wants: the document number, your date of birth, and the two dense lines of characters at the bottom — the machine-readable zone — which encode most of the document in one place. You can usually prove what the check needs without handing all of that over.',
      },
      { t: 'h2', texto: 'What to hide, and what to leave' },
      {
        t: 'p',
        texto:
          'It depends on why they need it, so decide before you send. Many checks only need to see your name, your photo and the expiry date; the document number and the machine-readable zone can go. A common, sensible extra is to write across the copy what it is for and the date (for example, "copy for [X] only") so it cannot be reused elsewhere.',
      },
      {
        t: 'ul',
        items: [
          'The passport or document number.',
          'The machine-readable zone — the two lines of letters, numbers and chevrons at the bottom, which encode the number, your name and your date of birth.',
          'Your signature.',
          'Your date of birth and place of birth, if the check does not need them.',
        ],
      },
      { t: 'h2', texto: 'It is usually an image, so a black box is doubly useless' },
      {
        t: 'p',
        texto:
          'A passport copy is almost always a photo or a scan — an image. A black rectangle drawn over it in an image editor can sometimes be lifted off as a separate layer, and if it is inside a PDF the text beneath a box copies straight out. On an image the only safe way is to delete the pixels of that area, so there is nothing underneath to recover.',
      },
      { t: 'h2', texto: 'How to remove it for real, in your browser' },
      {
        t: 'p',
        texto:
          'For a photo of your passport, use the image tool: you drag a box over the number and the machine-readable zone, and it replaces those pixels with solid black on the real image and re-exports it — which also drops the photo’s hidden metadata, including where it was taken. For a passport inside a PDF, the redaction removes the marked area the same way. Everything happens inside your browser; the copy is never uploaded to a server.',
      },
      { t: 'h2', texto: 'Before you send it' },
      {
        t: 'p',
        texto:
          'Because a passport copy is an image, an automatic check cannot read it — so look at the result yourself, zoomed in. Make sure the number and the machine-readable lines are solid black with nothing showing through, and that they cannot be made out even when enlarged. If anything is still legible, redo that area before you send the copy.',
      },
    ],
    faqs: [
      {
        pregunta: 'Do I need to hide the machine-readable zone, not just the number?',
        respuesta:
          'Yes. The two lines at the bottom encode the document number, your name and your date of birth, so blacking out the printed number alone still leaves all of that readable. Cover the machine-readable zone as well.',
      },
      {
        pregunta: 'Is a black box in Preview or Paint safe?',
        respuesta:
          'Not always. On an image editor the box can be a separate layer that lifts off, or the original may survive underneath. The reliable way is to clear the pixels of that area and re-export the image, and then check the result by eye.',
      },
      {
        pregunta: 'Is my passport copy uploaded anywhere?',
        respuesta:
          'No. Everything happens inside your browser and the file is not transmitted anywhere. You can prove it by disconnecting from the internet once the page has loaded: the tool keeps working and lets you download the redacted copy.',
      },
      {
        pregunta: 'Can I add "for [purpose] only" across the copy?',
        respuesta:
          'Yes, and it is a good idea: a note across the copy saying what it is for and the date makes it harder to reuse elsewhere. It does not replace removing the number and the machine-readable zone, though — do both.',
      },
    ],
  },

  // SEO EN, pieza de AUTORIDAD / AEO (2026-10-29), punto 16 del plan SEO (.seo-audit/ACTION-PLAN.md).
  // Search Console mostraba consultas inglesas sin página buena («how to see redacted text in pdf»,
  // «can a redacted pdf be unredacted») mientras la pieza española equivalente (guia-recuperar-tachado)
  // es la mejor del sitio. NO es una traducción literal: mismo esqueleto, lista de escondites SOLO con
  // los que ya describen el sitio (la pieza española, check-pdf-redaction, el limpiador de metadatos),
  // y la sección de comprobación honesta sobre lo que el comprobador SÍ lee (texto de página + patrones).
  // Hechos del estudio, de Manafort: .seo-audit/findings/fuentes.md (comprobado contra las fuentes).
  // ⚠ Lo que dice del estudio: once herramientas; dos dejaban el texto; las otras nueve lo quitaban
  // pero conservaban rastro de posición (como mínimo la anchura del hueco, en varias el desplazamiento
  // de las letras vecinas); los autores ACOTARON nombres descartando candidatos de una lista, no
  // «recuperaron el texto de cientos de documentos». No nombra PDFescape/PDFzorro (PDFzorro tiene un
  // flujo «lock» que rasteriza). Manafort: 8-ene-2019, sin «en minutos». No hay "guardados
  // incrementales" porque ninguna página del sitio los describe todavía.
  {
    id: 'guia-en-recuperar',
    fuentes: [
      // Orden = el de aparición en el texto (Manafort, luego el estudio). Importa un detalle más: el test
      // traduccion-completa compara las hojas de ES y EN POR POSICIÓN, y la guía española equivalente
      // (guia-recuperar-tachado) cita las mismas cuatro URL; con el estudio primero, las URL idénticas
      // caerían en la misma posición y el test las leería como «cadena sin traducir».
      {
        etiqueta: 'United States v. Manafort docket: the redacted and corrected filings of 8 January 2019 (CourtListener)',
        url: 'https://www.courtlistener.com/docket/6183591/united-states-v-manafort/',
      },
      {
        etiqueta: "Mother Jones, 8 January 2019: Paul Manafort's lawyers tried and failed to redact a filing",
        url: 'https://www.motherjones.com/politics/2019/01/paul-manafort-failed-redaction/',
      },
      {
        etiqueta: 'Bland, Iyer and Levchenko: "Story Beyond the Eye: Glyph Positions Break PDF Text Redaction" (arXiv 2206.02285)',
        url: 'https://arxiv.org/abs/2206.02285',
      },
      {
        etiqueta: 'The same study in Proceedings on Privacy Enhancing Technologies, 2023 (DOI)',
        url: 'https://doi.org/10.56553/popets-2023-0069',
      },
    ],
    titulo: 'Can redacted text in a PDF be recovered? Why many redactions can be undone',
    tituloEnlace: 'Can redacted text in a PDF be recovered?',
    descripcion:
      'Often, yes: if the redaction is only a black box, the text is still in the file and copies out. Where covered text survives, and how to check your own PDF.',
    metaTitulo: 'Can redacted text in a PDF be recovered? Often, yes',
    enlaceComprobador: 'Check your own PDF for free, without uploading it, to see what is still recoverable',
    relacionadas: ['guia-en-caja-negra', 'guia-en-comprobar', 'guia-en-sin-subir'],
    cuerpo: [
      {
        t: 'p',
        texto:
          'Often, yes. If a PDF was "redacted" by drawing a black box over the text, the words are still in the file, and anyone can select them, copy them and paste them somewhere else. Whether redacted text can be recovered depends on the method used to cover it, not on how the page looks. The useful question is not "can I see it?" but "is the data still inside the file?"',
      },
      {
        t: 'p',
        texto:
          'This page goes through which redactions can be undone and which cannot, with real cases and figures from our own tests. It also covers a limit that applies even to a redaction done properly: it can leave a trace of where the text was, and ours does too. Read it as a way to check your own documents before you send them.',
      },
      { t: 'h2', texto: 'Why a black box does not remove anything' },
      {
        t: 'p',
        texto:
          'Because the box is a shape drawn in front of the page, not an eraser. The text lives in the content of the PDF and the rectangle sits on top of it, like an opaque sticker on a written sheet. Peel the sticker off, or copy through it, and the sentence is still there in full. Most PDF editors let you draw that rectangle in two clicks, which is why it is the most common mistake.',
      },
      {
        t: 'p',
        texto:
          'The best-known case involved the lawyers of Paul Manafort. On 8 January 2019 they filed a response in a US federal court with passages blacked out. Reporters copied the text from underneath the black boxes, and a corrected version of the filing was entered on the court docket the same day. The redaction was only a layer on top. It was not a rare technical glitch: it is what happens to any PDF covered with a rectangle.',
      },
      { t: 'h2', texto: 'Five places where data survives a redaction that looks finished' },
      {
        t: 'p',
        texto:
          'A PDF has many more corners than the part you see. We keep a set of test documents with invented data, one for each hiding place, and each one measures whether the data can still be recovered after redaction. These are the kinds of leak that come up again and again, apart from the gap described in the next section:',
      },
      {
        t: 'ol',
        items: [
          'A box laid over live text: the black is a shape or annotation drawn on top, while the text stays in the page content and copies out. This is the Manafort case and the most common one.',
          'A scanned page: a black box on an image is one image laid over another, so it can often be lifted off, or the contrast raised until what lies beneath shows through. A plain scan has no text layer at all, so a check that reads only text passes over it in silence. And if the scan was made searchable, there may be invisible text under the picture even though you cannot see it.',
          'A bookmark: data typed into the title of a bookmark in the document outline does not show on the page and survives the redaction, and a check of the page text does not look there.',
          'Attachments and metadata: an embedded file, the thumbnail the PDF keeps of each page (which can be a picture of the page without the redaction), the alternative text of an image, annotations, the title, author, subject and keywords fields (which often carry a file name, a client name or a case number) and the separate XMP block can all keep the data even when the page looks clean.',
          'A switched-off layer: data drawn inside an optional layer that the document declares hidden does not appear when the file opens, but it is in the page content and one click in the layers panel brings it back.',
        ],
      },
      {
        t: 'p',
        texto:
          'The lesson is not "this tool fails and that one works". It is that covering and deleting are different things, and that a file can look clean on screen while carrying the data in several of these places at once.',
      },
      { t: 'h2', texto: 'If the text is really deleted, is it safe?' },
      {
        t: 'p',
        texto:
          'Almost, but not entirely. When text is genuinely removed, the gap it occupied stays. The word that followed does not move to fill the space, so a blank remains whose width is exactly that of the deleted text, and that width carries information. In our own tests, the test ID number 12345678Z with a space on each side, set in 11-point Helvetica, leaves a gap of 61.765 points, and twenty common Spanish first names in the same font and size come out at twenty different widths. With a short list of candidates, measuring the gap can be enough to work out which word was removed.',
      },
      {
        t: 'p',
        texto:
          'This is not only our observation. A study, "Story Beyond the Eye: Glyph Positions Break PDF Text Redaction", by Maxwell Bland, Anushya Iyer and Kirill Levchenko (University of Illinois Urbana-Champaign), circulated as an arXiv preprint in 2022 and published in 2023 in Proceedings on Privacy Enhancing Technologies. It examined eleven PDF redaction tools, Adobe Acrobat among them. Two left the text marked for redaction inside the file; the other nine removed it but kept traces of its position: at least the width of the gap and, in several, the displacement of the neighbouring letters. Using that, the authors narrowed down the redacted names in hundreds of real redactions in official reports and freedom-of-information responses from the United States. They did not recover the text outright: they ruled out candidates from a list, and in only a few cases was a single possible name left.',
      },
      {
        t: 'p',
        texto:
          'The same study also measured the cruder failure at scale. It reports more than 6,000 redacted names, in more than 700 publicly accessible court documents, where the redaction had not removed the text at all, so the names could be read by copying and pasting.',
      },
      {
        t: 'nota',
        texto:
          'This applies to us too, and we say so because it is true. TachadoPDF removes the text from the file but does not close up the line, so the gap stays. The report says so in plain words and, if it matters for a particular document, tells you to convert it to an image before you send it. The study found that turning the page into an image appears to be an effective defence, although some of the tools that did so still leaked the approximate width of the text.',
      },
      { t: 'h2', texto: 'How can I check whether my own redaction can be undone?' },
      {
        t: 'p',
        texto: 'Run the copy-and-paste test on the finished file, the one you are about to send:',
      },
      {
        t: 'ol',
        items: [
          'Open the redacted PDF.',
          'Select across the black box, or select the whole document with Ctrl+A (Cmd+A on a Mac), and copy.',
          'Paste into a plain text editor and search for what you meant to remove.',
        ],
      },
      {
        t: 'p',
        texto:
          'If the words appear, they were covered, not deleted. If the document is a scan or a photo, also raise the brightness and contrast over the black area and see whether anything shows through. This quick test catches the most common failure, the box laid over live text. It cannot see the others: the gap, a bookmark, an attachment, the metadata or a switched-off layer do not show up by eye.',
      },
      {
        t: 'p',
        texto:
          'For a more thorough read of the page text, use the free checker on this site. It opens the PDF in your own browser, so the file is never uploaded, and lists which of the data formats it recognises are still extractable and on which pages. It looks for email addresses and Spanish identifiers, not for names, and it names the pages that have no text layer, which it cannot read and which need checking by eye. For the metadata, bookmarks and attachments, the free PDF metadata tool shows what the file carries and offers a clean copy.',
      },
      { t: 'h2', texto: 'What does it take for data to disappear for real?' },
      {
        t: 'p',
        texto:
          'The data has to be removed from the contents of the file, not covered. If it sits on a scanned image, the pixels of that area have to be cleared. And then someone has to reopen the finished file and search again to confirm it is gone. That last step is what separates a reliable redaction from an assumption.',
      },
      {
        t: 'p',
        texto:
          'TachadoPDF removes the text and clears the pixels of the areas you mark, then reopens the file it produced and re-reads the text of its pages, its metadata and the other text strings it keeps inside. Automatic detection covers email addresses and Spanish identifiers; anything else you mark by hand. If something comes back, the download is blocked and you are told which page. If something cannot be checked, such as a scanned page, the report says so instead of marking it clean. And where the method itself has a limit, the gap, the report states it rather than leaving it out. The rule in the end is simple: do not trust that data "does not show"; check that it is no longer inside the file.',
      },
    ],
    faqs: [
      {
        pregunta: 'Can a redacted PDF be unredacted?',
        respuesta:
          'Sometimes, depending on how it was redacted. If the redaction is only a black box over live text, the text is still in the file and copies straight out. If the text was truly removed, the words are gone, but the gap they occupied can still help narrow down what they said.',
      },
      {
        pregunta: 'How do I see the text under a black box in a PDF?',
        respuesta:
          'Select across the black box, copy, and paste into a plain text editor: if the box only covered the text, the words appear. That is a check for your own documents. On a scanned page, raise brightness and contrast over the box. Use it on files you are about to send, to find out whether the redaction would hold.',
      },
      {
        pregunta: 'Does real redaction leave any trace?',
        respuesta:
          'Yes, it can leave the gap. When text is truly removed, the words that followed do not move, so a gap of the exact width remains, and that width can help rule out candidates from a short list. A study found position traces in all nine tools that removed the text. TachadoPDF does too, and its report says so.',
      },
      {
        pregunta: 'Is a black box over a scanned document safe?',
        respuesta:
          'Not on its own. On a scan, a box added in a PDF editor is one image laid over another, so it can often be lifted off, or the contrast raised until what lies beneath shows through. If the scan was made searchable, invisible text may also sit under the picture. The pixels of that area have to be cleared.',
      },
    ],
  },
];
