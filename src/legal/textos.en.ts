// Legal and landing copy in English. SENSITIVE ROUTE: changes require APROBADO-ANGEL.
//
// The operator does not change. TachadoPDF is run from Spain by the same individual trader that
// the Spanish pages identify; nothing here invents a foreign entity, a foreign establishment or a
// different seller. Gumroad remains the merchant of record.
//
// The statutory particulars required by Spanish law (tax number, address) are NOT reproduced on
// the English page: it links to the Spanish legal notice, which is the binding version and is
// already published on this same site. Publishing those particulars on a second surface is an
// owner decision, not an engineering one — see docs/BITACORA.md.

export const LEGAL_NOTICE_EN = `Legal notice

This website is operated from Spain and is subject to Spanish law, including Law 34/2002 on information society services and electronic commerce (LSSI-CE).

Operator: Ángel Talón Villa, an individual trader established in Spain. There is no company.
Contact email: ccsshaft@gmail.com

The operator's full statutory details — Spanish tax identification number and address — are published in the Spanish version of this legal notice, at https://www.tachadopdf.com/ (section "Aviso Legal"), which is the binding version.

Using this website means you accept this legal notice, the Terms of use and the Privacy policy.

TachadoPDF runs entirely in the user's browser. The operator does not access, store or transmit the contents of any document processed by the application.`;

export const TERMS_EN = `Terms of use

1. Purpose. TachadoPDF is a tool for preparing PDF documents before they are sent to third parties or published, by genuinely removing text and the pixels of the areas marked by the user.

2. Prohibited use. You may not use TachadoPDF to alter documents with evidential value, or documents whose integrity is protected by law, contract or a court order. You are solely responsible for how you use the tool and for confirming that the resulting document meets your own legal obligations.

3. No warranty. TachadoPDF does not establish that the resulting document is free of personal data, and it does not replace human review. You must review the final document visually, page by page, before treating it as finished.

4. Liability. To the fullest extent permitted by law, the operator's liability to you for any loss arising from the use of TachadoPDF is limited to the amount paid for the licence, if any. Nothing in these terms limits liability that cannot be limited by law, and nothing affects the statutory rights of a consumer.

5. Pro licence. The Pro licence is a one-time purchase and is not a subscription: it does not renew and does not generate recurring charges. The sale and the payment are handled by Gumroad as merchant of record, and refunds are handled by Gumroad under its own policy.

6. Changes. These Terms of use may be updated; the version in force is the one published on this site at any given time.

7. Governing law. These terms are governed by Spanish law. If you are a consumer, this does not deprive you of the protection of the mandatory rules of the country where you live.`;

export const PRIVACY_EN = `Privacy policy

Processed entirely on your device. TachadoPDF processes documents entirely inside your browser. Your document is never transmitted to any server or to any third party. There is no upload step, and no server that could receive one.

The only thing that leaves your browser. When you activate a Pro licence, the licence key you type is sent to Gumroad Inc. (United States) to be checked. That is the only outbound request the application makes. No other data, and no part of any document, ever leaves your browser.

Stored on your device. The free-tier counter — how many documents you have processed this month — is kept in your browser's local storage (IndexedDB) on your own computer. It is never sent anywhere, and clearing your browser data erases it. It exists only to make the free allowance work.

No cookies, no analytics. This application sets no tracking cookies and uses no analytics, which is why you are not shown a consent banner.

No international transfer of document data. Because your documents are never sent anywhere, there is no transfer of document data to any country. The only data crossing a border is the licence key described above.

Payments. Gumroad Inc. acts as merchant of record for the Pro licence and processes payment data under its own privacy policy.

Contact. For any question about this policy, write to the contact email in the legal notice.`;

// Landing. Leads with the PROOF, not with the revelation: in English every competitor already
// opens with "black boxes don't work", and half the professional market learned it from the
// Manafort filing and the ICO's 2025 guidance. What nobody else at this price sells is the check
// afterwards — and it is the one thing the code actually does.
export const LANDING_HEADLINE_EN = 'Redact a PDF. Then prove the text is gone.';

export const LANDING_PAIN_EN =
  "A black rectangle over a PDF doesn't remove anything. The words stay in the file and copy straight back out — that is how reporters read Paul Manafort's court filing within minutes of his lawyers submitting it in January 2019. It isn't a rare accident either: in July 2025 the UK's Information Commissioner's Office published dedicated guidance on hidden personal information in documents released to the public, after breaches at the Ministry of Defence and the Police Service of Northern Ireland. The failure is silent. Nothing looks wrong until someone checks.";

export const LANDING_SUBHEAD_EN =
  'TachadoPDF deletes the selected text from the PDF itself and clears the pixels inside the areas you mark. Then it reopens the file it just produced, searches it again, and releases nothing if any of it comes back. You get a verification report with the SHA-256 fingerprint of the file you deliver.';

export const LANDING_BULLETS_EN = [
  'The text is removed from the file. Nothing is painted over it.',
  'Everything runs in your browser. The document is never uploaded — disconnect from the internet and it still works.',
  'Draw a box over anything: a name, a signature, a face, a figure. The tool records what was underneath, deletes it, then checks the finished file to confirm it is no longer there — metadata included.',
  'If anything you redacted survives, the download is blocked. No file, no report.',
  'The report lists what was redacted and where, which metadata was stripped, which pages have no text layer, and the SHA-256 fingerprint of the file you deliver.',
];

// Bloque sin equivalente español, y obligatorio: de los siete detectores, solo el de correo
// electrónico funciona fuera de España (el IBAN exige prefijo ES, el teléfono exige 9 dígitos con
// prefijos españoles, y DNI/NIE/NUSS/catastro llevan dígito de control español). Una página
// inglesa que prometiera «detección de identificadores, cuentas y teléfonos» sería falsa.
export const LANDING_DETECTION_NOTE_EN =
  'What is detected automatically: email addresses in any document, plus Spanish identifiers — DNI, NIE, Spanish IBAN, social security number and cadastral reference. Detection of UK and US identifiers (National Insurance number, NHS number, Social Security number, sort codes, local phone formats) is not built yet. Everything else you redact by drawing over it, and the removal and the verification are exactly the same either way.';

export const LANDING_AUDIENCE_EN =
  'Built for people who redact as part of the job: solicitors and paralegals preparing filings and disclosure, public bodies answering freedom-of-information and subject access requests, HR and payroll teams sharing employee documents, and journalists publishing source material.';

export const LANDING_LOCAL_PROCESSING_EN =
  "Most online redaction tools upload your document to a server first. TachadoPDF doesn't have one. The file is opened, redacted and checked inside your browser, and never leaves your machine.";

export const SCOPE_NOTICE_EN =
  'TachadoPDF removes the selected text and the pixels inside the areas you mark from the file. It does not establish that the document is free of personal data, and it does not replace human review.';
