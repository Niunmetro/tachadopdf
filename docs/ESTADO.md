# ESTADO — TachadoPDF (actualizado 2026-08-08)

## Producto
- VIVO en https://www.tachadopdf.com (GitHub Pages + CNAME; verificar dominio real tras cada deploy).
- **Sitio BILINGÜE**: español en la raíz, inglés en `/en/`. 20 URLs (10 ES + 10 EN), un solo
  sitemap con alternos `hreflang` recíprocos y `x-default` al español.
- **La portada ya se publica CON su texto dentro.** Antes `dist/index.html` era
  `<body><div id="app"></div></body>`: todo lo pintaba JavaScript. Ahora el HTML lo emite
  `src/content/generar.ts` (`npm run gen:pages`, ficheros commiteados) y la aplicación solo monta
  los controles en los huecos `#herramienta` y `#licencia`.
- Añadir un idioma = añadir datos a `src/content/registro.ts` + un fichero de contenido.
  `Contenido = typeof es` hace que `tsc --noEmit` sea el linter de i18n: una clave sin traducir
  NO compila.
- Suite: 616/616 en 48 ficheros. Verificación: `npm ci` · `npx --no-install tsc --noEmit` ·
  `npm test` · `npm run build`, exit codes reales, nunca `| tail`.

## Guardas vivas (todas probadas con su mutación)
- `content/pages-generadas` — el HTML del disco == lo que produce el generador (prohíbe editarlo a mano).
- `content/contenido-indexable` — >1.500 caracteres de texto visible sin JS, en fuente y en `dist/`.
- `content/hreflang` — reciprocidad, `x-default`, canonical auto-referente. **Lee el fichero de disco.**
- `content/faq-paridad` — fuente == `<details>` == FAQPage, por idioma.
- `content/traduccion-completa` — nada vacío, nada sin traducir, misma forma.
- `content/sin-cadenas-sueltas` — cero literales de cara al usuario en `src/`.
- `content/alta-de-idioma` — la salida se deriva del registro; el generador no nombra idiomas.
- `guard-en` — vocabulario prohibido en inglés, con fronteras de palabra, sobre TODO `.html` del repo.
- `csp` — CSP por meta en las 20 páginas (antes solo en 2).
- `precios-coherentes` — una sola fuente para cuota, tope de páginas y precio.
- `despliegue` — `public/CNAME` existe (antes solo lo escribía el script de deploy tras el build).

## Embudo / marketing
- Outreach y Ads: sin cambios desde el 22-07 (ver bitácora).
- SEO: 20 URLs en sitemap. Las guías inglesas apuntan a intención de búsqueda inglesa
  (Rule 5.2, DSAR/ICO, comprobar un tachado), NO son traducciones de las españolas.

## Bloqueos / PARADAS del owner (requieren APROBADO-ANGEL)
1. **Precio y moneda en inglés.** `config.ts` tiene un único `PRECIO_PRO = '59 €'`. La web inglesa
   muestra 59 € y pago único. ¿Se queda así o pasa a $/£?
2. **`public/actas/` y `public/nominas/` venden lo que no existe**: «59 €/año» y «149 €/año Tier
   Despacho, 3 puestos y logo en el informe» (sin SKU, sin multi-puesto, sin logo en `report.ts`),
   y una «garantía de devolución de 30 días» que los Términos no recogen. Excluidas del guardián
   de precios (`precios-coherentes.test.ts`) con esa nota. NO se han traducido al inglés.
3. **Aviso legal inglés.** Identifica al operador y enlaza al Aviso Legal español para el NIF y el
   domicilio, en vez de republicarlos. Si se quiere el bloque completo en inglés, es puerta suya.
4. **Detección para el comprador inglés.** Solo el detector de email funciona fuera de España. La
   copia inglesa lo dice explícitamente. Añadir NI/NHS/SSN es tarea de producto aparte.
5. **`CLAUDE.md` línea 5 sigue diciendo «gratis 3 docs/mes + Pro 59 €/año»**, que contradice al
   código (`FREE_MONTHLY_LIMIT = 5`) y a los Términos (pago único). No lo he tocado: es el
   contrato del repositorio.
6. **P0 heredado, urgente y fuera de este trabajo**: `origin/gh-pages` sirve `/.claude/settings.json`
   y `/.claude/hooks/guardia.sh` con 200 en el dominio comercial. `dist/` nunca ha contenido eso,
   así que ese deploy no salió de `dist/`. Limpiar la rama y volver a publicar ANTES de mandar
   tráfico inglés.

## Notas operativas
- El CNAME vive ahora en `public/CNAME`, igual que `public/.nojekyll`: Vite lo copia en cada build.
  El script de deploy lo sigue escribiendo como segunda línea, y el modo `DOMINIO=0` sigue siendo
  el único camino que lo quita.
- Webmail OX: NUNCA teclear antes de que el composer renderice; foco+Enter para drill-down en Ads.
