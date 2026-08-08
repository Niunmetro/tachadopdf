# ESTADO — TachadoPDF (actualizado 2026-08-08)

## Producto
- VIVO en https://www.tachadopdf.com (GitHub Pages + CNAME; verificar dominio real tras cada deploy).
- **Sitio BILINGÜE**: español en la raíz, inglés en `/en/`. **18 URLs (10 ES + 8 EN)**, un solo
  sitemap con alternos `hreflang` recíprocos y `x-default` al español. Las dos landings de sector
  (`/actas/`, `/nominas/`) solo existen en español: ver PARADA 2.
- **La portada ya se publica CON su texto dentro.** Antes `dist/index.html` era
  `<body><div id="app"></div></body>`: todo lo pintaba JavaScript. Ahora el HTML lo emite
  `src/content/generar.ts` (`npm run gen:pages`, ficheros commiteados) y la aplicación solo monta
  los controles en los huecos `#herramienta` y `#licencia`.
- Añadir un idioma = añadir datos a `src/content/registro.ts` + un fichero de contenido.
  `Contenido = typeof es` hace que `tsc --noEmit` sea el linter de i18n: una clave sin traducir
  NO compila.
- Suite: **614/614 en 48 ficheros**. Verificación: `npm ci` · `npx --no-install tsc --noEmit` ·
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
- `csp` — CSP por meta en las 18 páginas (antes solo en 2).
- `precios-coherentes` — una sola fuente para cuota, tope de páginas y precio.
- `despliegue` — `public/CNAME` existe (antes solo lo escribía el script de deploy tras el build).

## Embudo / marketing
- Outreach y Ads: sin cambios desde el 22-07 (ver bitácora).
- SEO: 18 URLs en sitemap. Las guías inglesas apuntan a intención de búsqueda inglesa
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
6. **Basura interna publicada en `origin/gh-pages` — NO se limpia sola.** La rama publicada
   contiene, además del sitio: `.claude/agents/*`, `.claude/hooks/guardia.sh`, `.claude/settings.json`,
   `.claude/launch.json`, `.github/pull_request_template.md`, `.gitignore` y un `public/.nojekyll`
   suelto. `dist/` no ha contenido nunca ninguno de esos ficheros, así que ese deploy no salió
   de `dist/`.
   - **Gravedad, medida y no supuesta:** NO hay credenciales. Se buscó forma de secreto en los
     tres ficheros y las únicas coincidencias son la palabra «secret» dentro de la propia lista
     negra del hook; cero cadenas largas tipo clave. Lo que se filtra es tooling interno y los
     nombres de fichero del motor Forja (vía `.gitignore`). Es higiene, no incidente.
   - **Mecanismo (verificado en `node_modules/gh-pages/lib/index.js`):** el paquete pasa
     `dot: options.dotfiles` al glob de ORIGEN (línea 111) pero NO se lo pasa al glob de BORRADO
     (línea 183). Reproducido: `globby.sync('.', {cwd})` devuelve `index.html`; con `dot:true`
     devuelve además `.gitignore` y `.claude/**`. **Consecuencia: `gh-pages` sabe subir dotfiles
     pero no sabe borrarlos. Volver a desplegar NO los quita — sobreviven a todos los deploys.**
   - **Arreglo (una vez, es del owner porque toca el sitio vivo):** desde el repo,
     `git push origin --delete gh-pages` y a continuación `npm run deploy-pages`, que recrea la
     rama solo con `dist/`. Comprobar después que
     `https://www.tachadopdf.com/.claude/settings.json` da 404 y que la home sigue dando 200.
     No hace falta tocar el script de deploy: el único camino que mete esos ficheros es publicar
     algo que no sea `dist/`.

## Residuales conocidos (verificados, NO arreglados, con su porqué)
- **Sin guarda de canonical en las 8 páginas estáticas españolas.** `content/hreflang` solo mira
  las páginas con `origen: 'generado'`. Hoy las ocho tienen su canonical auto-referente correcto
  (comprobado fichero a fichero sobre `dist/` en la integración), pero nada lo vigila: si alguien
  copia una guía nueva de otra, el canonical duplicado pasaría sin ruido.
- **`public/actas/` y `public/nominas/` llevan enlaces raíz-absolutos** (`/comprobador/?utm_source=…`,
  `/?utm_source=landing…`). Con la base de emergencia `/tachadopdf/` apuntan fuera del sitio, justo
  en el modo pensado para cuando el dominio cae. No se tocan: son las dos páginas congeladas por la
  PARADA 2 y hay que reescribirlas enteras, no parchearlas dos veces.
- **Las citas de la landing inglesa no están verificadas contra fuente.** El escrito de Manafort
  (8-ene-2019) y la Rule 5.2 sí lo están por contenido; la frase «in July 2025 the ICO published
  dedicated guidance…» viene de la redacción, no de una comprobación. El comprador inglés es un
  despacho: **contrastarla antes de pagar por tráfico**, o suavizarla a algo que no lleve fecha.

## Notas operativas
- El CNAME vive ahora en `public/CNAME`, igual que `public/.nojekyll`: Vite lo copia en cada build.
  El script de deploy lo sigue escribiendo como segunda línea, y el modo `DOMINIO=0` sigue siendo
  el único camino que lo quita. **Verificado en la integración: `dist/CNAME` existe tras un
  `npm run build` a secas, sin script de deploy de por medio.**
- Webmail OX: NUNCA teclear antes de que el composer renderice; foco+Enter para drill-down en Ads.
