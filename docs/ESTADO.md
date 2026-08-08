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
- Suite: **615/615 en 48 ficheros** en `master`. Verificación: `npm ci` ·
  `npx --no-install tsc --noEmit` · `npm test` · `npm run build`, exit codes reales, nunca `| tail`.
- ⚠ **Rama `fix/sello-por-estados` SIN FUSIONAR** (8 commits, `414eeb4`..`18b3776`, suite
  **732/732**): rehace el sello del informe y cierra siete falsos verdes. Ver la bitácora del
  2026-08-08. Publicar es decisión del dueño.

## El sello del informe (en la rama `fix/sello-por-estados`, aún no en master)
- El sello **ya no es `clean ? verde : rojo`**. Es función de (cobertura ∧ resultado), en una
  escalera de cinco estados que vive en `src/report/estado.ts` como función pura y **única fuente**:
  `E1 TACHADO NO SUPERADO` · `E2 SIN COMPROBACIÓN AUTOMÁTICA` · `E3 COMPROBACIÓN PARCIAL` ·
  `E4 SIN TACHADOS` · `E5 TACHADO VERIFICADO`.
- **Regla de diseño que no se puede relajar:** ningún rótulo puede ser subcadena de otro. Si el
  ámbar se llamara «VERIFICADO CON RESERVAS», el test «una página escaneada no puede salir verde»
  sería imposible de escribir. Lo vigila `report/estado` (G8).
- **P3, la regla a prueba de futuro:** un objeto **presente y no examinado** en el inventario
  degrada el sello solo. Añadir una categoría a «no examinado» degrada los documentos que la lleven
  en vez de ampliar el agujero en silencio; y el día que el motor la trate, el sello deja de
  degradarse **sin tocar el texto**.
- **Al tocar el informe hay DOS mitades siempre: borrar y releer.** Lo que se elimina del PDF entra
  además en `extractMetadataStrings`, para que un borrado que falle bloquee en vez de firmar.
- Los tests del informe afirman sobre **literales congelados**, nunca sobre `COPIA.loQueSea`:
  comparar el informe con su propio generador es un test que no puede fallar.

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
- `report/estado` (rama) — rejilla exhaustiva de 144 combinaciones del sello, invariante maestra de
  E5, orden de la escalera, rótulos disjuntos, y patrones declarados == los que `detect()` emite.
- `report/sello` (rama) — sobre el PDF **renderizado**: página escaneada, documento sin tachados,
  escaneado entero y objeto no examinado **no pueden** imprimir «VERIFICADO»; lista negra de
  sobre-afirmación; el alcance no puede encogerse.
- `report/maquetacion` (rama) — mide la POSICIÓN de cada glifo: nada se sale de los márgenes y dos
  textos de la misma línea no se pisan. Es la clase de guarda que faltaba: extraer el texto da
  verde aunque una etiqueta se dibuje encima de su valor.
- `pdf/marcadores` · `pdf/escondites` · `pdf/dos-lineas` · `pdf/imagenes` ·
  `pdf/hueco-de-glifos` (rama) — un fichero por escondite cerrado, cada uno con el defecto medido
  en su cabecera.
- `despliegue` — `public/CNAME` existe, con su byte exacto (antes solo lo escribía el script de
  deploy tras el build), y `.gitattributes` lo fija a LF.

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
- **Hueco de glifos.** Al tachar, el texto posterior NO se mueve: queda un hueco cuya anchura es
  exactamente la del texto borrado (medido: 61,765 pt para ` 12345678Z ` en Helvetica 11, y el
  texto de después no se desplaza ni 0,01 pt). No tiene arreglo con este motor —mupdf solo ofrece
  `REDACT_TEXT_REMOVE`/`NONE`, y rasterizar destruiría la capa de texto sobre la que se sostiene
  toda la comprobación—, así que **se declara en el informe** y `pdf/hueco-de-glifos` ata la
  declaración a la medida.
- **Teléfono y referencia catastral partidos por un salto de línea** no se reencuentran. Juntar dos
  líneas puede *fabricar* una coincidencia de esos dos patrones (no llevan dígito de control útil),
  y un bloqueo por un residuo inventado no tendría salida. Frontera fijada por un test.
- **El informe bloqueado (E1) no llega a nadie:** `canDownloadReport` exige `verify.clean`. El
  informe que dice «me negué, y por esto» también es diligencia y hoy se tira. Entregarlo solo a él
  toca el flujo de descarga y la UI: decisión pendiente.
- **Se pierde el texto alternativo de accesibilidad de las imágenes**, porque es donde Word deja
  texto escrito por el usuario y la guarda no lo releía. Consta como categoría propia del inventario
  del informe en vez de desaparecer en silencio.
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
  `npm run build` a secas, sin script de deploy de por medio, y con el byte exacto (LF).**
- **El CNAME está fijado a LF en `.gitattributes`.** `core.autocrlf` está a true: sin ese pin,
  cualquier checkout en Windows lo materializa con CRLF y eso es lo que Vite copia a `dist/` y
  `gh-pages` publica. Lo que sale por la puerta son los bytes del árbol de trabajo, no los del
  objeto de git. No quitar esa línea.
- Webmail OX: NUNCA teclear antes de que el composer renderice; foco+Enter para drill-down en Ads.
