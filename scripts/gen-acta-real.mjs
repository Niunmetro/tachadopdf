import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
// Página 1: acta con datos en formatos variados (con y sin separadores)
const p1 = doc.addPage([595, 842]);
const L = (pg, x, y, t, f=font, s=11) => pg.drawText(t, { x, y, size: s, font: f, color: rgb(0.1,0.1,0.1) });
L(p1, 50, 800, 'ACTA DE LA JUNTA DE PROPIETARIOS', bold, 15);
L(p1, 50, 775, 'Comunidad de Propietarios Edificio Las Gardenias');
L(p1, 50, 745, 'ASISTENTES Y DATOS:', bold, 12);
L(p1, 50, 720, 'Presidente: Juan Perez Gomez, con DNI 12.345.678-Z');
L(p1, 50, 700, 'Secretario: Maria Lopez Saez, DNI: 87654321X');
L(p1, 50, 680, 'Administrador: telefono de contacto 612 34 56 78');
L(p1, 50, 650, 'CUENTAS DE LA COMUNIDAD:', bold, 12);
L(p1, 50, 625, 'IBAN comunidad: ES91 2100 0418 4502 0005 1332');
L(p1, 50, 605, 'Vecino moroso: Pedro Ruiz (NIE Y1234567X), debe 3 cuotas');
L(p1, 50, 585, 'Contacto del proveedor: limpieza@ejemplo.com, tel 91-234-56-78');
// Página 2: listado
const p2 = doc.addPage([595, 842]);
L(p2, 50, 800, 'ANEXO: LISTADO DE RECIBOS', bold, 13);
L(p2, 50, 770, 'Vecino 1A - IBAN ES6600491500051234567892 - al corriente');
L(p2, 50, 750, 'Vecino 2B - DNI 11223344H - Seg.Social 28/12345678/40');
L(p2, 50, 730, 'Vecino 3C - email vecino3c@correo.es - devuelto');
const bytes = await doc.save();
writeFileSync('/tmp/acta-real.pdf', bytes);
console.log('PDF realista:', bytes.length, 'bytes, 2 páginas');
