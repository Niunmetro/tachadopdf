// Identificadores del producto en Gumroad. PÚBLICOS por diseño: identifican el producto,
// no autentican nada (el token de la cuenta NUNCA vive aquí ni en el navegador).
// La API de Gumroad exige product_id para productos creados desde 2023-01-09; el permalink
// se conserva para construir el enlace de compra.
export const GUMROAD_PRODUCT_PERMALINK: string = 'tachadopdf';
export const GUMROAD_PRODUCT_ID: string = 'R7cXtVb-N9uZ49dQ6RQ6jw==';

// Enlace de compra que se muestra en la app.
export const PRO_URL: string = 'https://shafted6.gumroad.com/l/tachadopdf';
export const PRECIO_PRO: string = '59 €';
