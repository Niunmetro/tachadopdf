import { en } from './en';
import { es, type Contenido } from './es';
import { LOCALE_POR_DEFECTO, type Locale } from './registro';

/**
 * Contenido por idioma. `Record<Locale, Contenido>` es el gate de compilación: en cuanto un
 * idioma entra en LOCALES, este mapa deja de compilar hasta que su fichero de contenido existe
 * y está completo (`Contenido` es `typeof es`, así que una clave sin traducir tampoco compila).
 */
export const CONTENIDOS: Record<Locale, Contenido> = { es, en };

export function contenidoDe(locale: Locale): Contenido {
  return CONTENIDOS[locale];
}

export function esLocale(valor: string): valor is Locale {
  return Object.prototype.hasOwnProperty.call(CONTENIDOS, valor);
}

/**
 * Idioma en tiempo de ejecución: sale de la RUTA, nunca de `navigator.language`. El HTML
 * generado ya fija `<html lang>` según la ruta, así que leerlo de ahí es leer la ruta.
 * Redirigir por cabecera de idioma en un sitio sin servidor solo se puede hacer con JavaScript,
 * y ese JavaScript también lo ejecuta el rastreador de Google (que rastrea con Accept-Language
 * inglés): rebotaría al rastreador fuera de la única página con posicionamiento real.
 */
export function localeDelDocumento(doc: Document): Locale {
  const declarado = doc.documentElement.getAttribute('lang') ?? '';
  const base = declarado.split('-')[0]?.toLowerCase() ?? '';
  return esLocale(base) ? base : LOCALE_POR_DEFECTO;
}

export type { Contenido };
