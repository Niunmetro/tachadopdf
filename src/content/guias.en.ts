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
      {
        t: 'p',
        texto:
          "In January 2019, lawyers for Paul Manafort filed a court document with passages blacked out. Reporters copied the text out within minutes and the redacted material was public the same day. In July 2025 the UK's Information Commissioner's Office published dedicated guidance on hidden personal information in documents released to the public, issued after breaches at the Ministry of Defence and the Police Service of Northern Ireland.",
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
  },
  {
    id: 'guia-en-comprobar',
    titulo: 'How to check whether a PDF has actually been redacted',
    tituloEnlace: 'How to check whether a PDF has actually been redacted',
    descripcion:
      'A three-second test anyone can run, the four other places data hides in a PDF, and what checking can never tell you.',
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
  },
  {
    id: 'guia-en-tribunales',
    titulo: 'Redacting court filings: what Rule 5.2 requires, and how filings leak anyway',
    tituloEnlace: 'Redacting court filings: what Rule 5.2 requires',
    descripcion:
      'What FRCP 5.2 actually mandates, why the sealed-plus-public pairing is where mistakes happen, and a pre-filing checklist.',
    cuerpo: [
      {
        t: 'p',
        texto:
          'In federal civil practice the duty to redact sits on the filer and on counsel, not on the clerk. Rule 5.2 of the Federal Rules of Civil Procedure sets the floor, and the floor is narrower than most people remember.',
      },
      { t: 'h2', texto: 'What Rule 5.2 requires' },
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
      {
        t: 'p',
        texto:
          "On 8 January 2019, a filing on behalf of Paul Manafort was submitted with passages blacked out. The black bars were drawn over live text; reporters copied the passages out within minutes and the material was public before the day was over. Nothing about that filing looked wrong on screen.",
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
  },
  {
    id: 'guia-en-dsar',
    titulo: 'Redacting a subject access request response without exposing third parties',
    tituloEnlace: 'Redacting a subject access request response',
    descripcion:
      'DSAR responses are the highest-risk disclosure a small organisation makes. Where the data hides, what enforcement looks like, and a workflow that fits the one-month clock.',
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
      {
        t: 'p',
        texto:
          'In July 2025 the Information Commissioner\'s Office published guidance specifically on disclosing documents to the public securely, addressing personal information hidden inside files. It followed two well-known incidents: a Ministry of Defence spreadsheet whose hidden data exposed more than 18,000 people, and a Police Service of Northern Ireland disclosure. In March 2026 the ICO fined Police Scotland £66,000 and issued a reprimand after an insufficiently reviewed misconduct bundle was disclosed to a third party.',
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
  },
  {
    id: 'guia-en-sin-subir',
    titulo: 'How to redact a PDF without uploading it anywhere',
    tituloEnlace: 'How to redact a PDF without uploading it',
    descripcion:
      'Most online redaction tools send your document to a server first. Here is how to redact entirely in your browser, and how to verify that claim yourself.',
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
  },
  {
    id: 'guia-en-nominas',
    titulo: 'Sending payslips and HR documents as PDFs without exposing personal data',
    tituloEnlace: 'Sending payslips and HR documents as PDFs',
    descripcion:
      'Payroll and HR files carry bank details, national identifiers and home addresses. What to remove before sharing, and how to confirm it is gone.',
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
  },
];
