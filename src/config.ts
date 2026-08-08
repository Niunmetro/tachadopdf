// Identificadores del producto en Gumroad. PÚBLICOS por diseño: identifican el producto,
// no autentican nada (el token de la cuenta NUNCA vive aquí ni en el navegador).
// La API de Gumroad exige product_id para productos creados desde 2023-01-09; el permalink
// se conserva para construir el enlace de compra.
export const GUMROAD_PRODUCT_PERMALINK: string = 'tachadopdf';
export const GUMROAD_PRODUCT_ID: string = 'R7cXtVb-N9uZ49dQ6RQ6jw==';

// Version de la herramienta, impresa en el informe. Un registro de diligencia que no dice con
// que version se hizo no se puede reproducir en una disputa. `config.test.ts` la ata a
// package.json para que no puedan divergir en silencio.
export const VERSION_APP: string = '0.1.0';

// Enlace de compra que se muestra en la app.
export const PRO_URL: string = 'https://shafted6.gumroad.com/l/tachadopdf';
export const PRECIO_PRO: string = '59 €';
