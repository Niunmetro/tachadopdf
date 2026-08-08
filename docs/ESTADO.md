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
- Suite: **794/794 en 63 ficheros** en `master`. Verificación: `npm ci` ·
  `npx --no-install tsc --noEmit` · `npm test` · `npm run build`, exit codes reales, nunca `| tail`.
- ✅ **`fix/sello-por-estados` y `fix/imagenes-escondites-y-glifos` FUSIONADAS en master** (8 + 9
  commits). La primera rehízo el sello; la segunda cerró los 17 falsos verdes que un ataque interno
  consiguió contra ella, **incluido un bug de destrucción de datos que la primera introdujo** (el
  escaneo del cliente volvía en blanco). Ver la bitácora del 2026-08-08.
- ⚠ **NO desplegado.** Publicar es decisión del dueño: `master` va por delante de lo que hay vivo
  en https://www.tachadopdf.com.

## El sello del informe
- El sello **ya no es `clean ? verde : rojo`**. Es función de (cobertura ∧ resultado), en una
  escalera de cinco estados que vive en `src/report/estado.ts` como función pura y **única fuente**:
  `E1 TACHADO NO SUPERADO` · `E2 SIN COMPROBACIÓN AUTOMÁTICA` · `E3 COMPROBACIÓN PARCIAL` ·
  `E4 SIN TACHADOS` · `E5 TACHADO VERIFICADO`.
- **CUALQUIER imagen en una página degrada a E3.** Medido: 111 de 129 PDF reales llevan alguna
  (el logo del membrete), así que **el estado normal del producto es el ámbar** y el verde queda
  para documentos de solo texto. Es deliberado: «no queda ningún dato de los patrones buscados»
  sobre un acta con la foto de un DNI dentro es una frase citable en una reclamación. Para que el
  ámbar no se vuelva ruido, cuando la ÚNICA reserva son imágenes el sello lo DICE con todas las
  letras en vez de mandar al lector a la tabla (`lineaParcialSoloImagenes`). **No subir esto a un
  umbral: por debajo del umbral no degradaba nada, y ese era el falso verde más comercial.**
- **Reservas que bajan el sello a E3** (`paginasConReserva`): páginas sin capa de texto, con imagen
  a página completa, **con cualquier imagen**, con un tachado manual sin confirmar, y **con texto
  dibujado que no se puede releer**.
- **Regla de diseño que no se puede relajar:** ningún rótulo puede ser subcadena de otro. Si el
  ámbar se llamara «VERIFICADO CON RESERVAS», el test «una página escaneada no puede salir verde»
  sería imposible de escribir. Lo vigila `report/estado` (G8).
- **P3, la regla a prueba de futuro:** un objeto **presente y no examinado** en el inventario
  degrada el sello solo. Añadir una categoría a «no examinado» degrada los documentos que la lleven
  en vez de ampliar el agujero en silencio; y el día que el motor la trate, el sello deja de
  degradarse **sin tocar el texto**.
- **Al tocar el informe hay DOS mitades siempre: borrar y releer.** Lo que se elimina del PDF entra
  además en `extractMetadataStrings`, para que un borrado que falle bloquee en vez de firmar.
- **Y la relectura NO elige dónde mirar.** `extractMetadataStrings` recoge TODA cadena de TODO
  objeto del archivo, no una lista de sitios: contra un escondite no hay lista blanca que valga,
  siempre queda el sitio número diez. Esa pasada, nada más ponerse, destapó que **el fichero
  adjunto no se iba** (el `/AF` del catálogo lo mantenía vivo mientras el informe lo declaraba
  eliminado). Medido: 0 de 145 PDF reales bloquean por un residuo inventado.
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
- `pdf/marcadores` · `pdf/escondites` · `pdf/escondites-estructura` · `pdf/dos-lineas` ·
  `pdf/imagenes` · `pdf/capas-ocultas` · `pdf/texto-no-legible` · `pdf/hueco-de-glifos` ·
  `detect/separadores` — un fichero por escondite cerrado, cada uno con el defecto medido en su
  cabecera.
- `pdf/escaneo-conservado` — la nómina escaneada conserva su imagen tras el tachado. **Mide TINTA
  EN EL PAPEL, no bloques de imagen**: `onImageBlock` sigue contando 1 aunque la imagen ya no se
  pueda decodificar, así que contar bloques da verde sobre una página en blanco.
- `despliegue` — `public/CNAME` existe, con su byte exacto (antes solo lo escribía el script de
  deploy tras el build), y `.gitattributes` lo fija a LF.

## Embudo / marketing
- Outreach y Ads: sin cambios desde el 22-07 (ver bitácora).
- SEO: 18 URLs en sitemap. Las guías inglesas apuntan a intención de búsqueda inglesa
  (Rule 5.2, DSAR/ICO, comprobar un tachado), NO son traducciones de las españolas.

## Bloqueos / PARADAS del owner (requieren APROBADO-ANGEL)
0. **El ámbar pasa a ser lo normal, y la web no prepara al comprador para eso.** Desde que
   cualquier imagen degrada el sello, un 86 % de los documentos reales saldrán
   «COMPROBACIÓN PARCIAL» en vez de verde — una nómina con el logo del membrete, por ejemplo.
   La web **no se contradice** con el informe (el FAQ ya dice «la detección automática lee texto,
   no imágenes»), pero tampoco avisa de que el resultado corriente es ámbar, y un comprador que
   espere un verde va a escribir a soporte. El FAQ vive en `src/legal/textos.ts`, que es ruta
   sensible con `APROBADO-ANGEL`: **no se ha tocado**. Decisión del owner: añadir al FAQ una
   respuesta del tipo «¿por qué mi informe dice COMPROBACIÓN PARCIAL?» que explique que el ámbar
   es el estado honesto de casi cualquier documento con un logo, y que el verde está reservado a
   los de solo texto.
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

## Trampas del motor (medidas, no supuestas: no volver a caer)
- **`garbage >= 2` + recorrer los objetos = mupdf pierde la imagen redactada.** Es lo que dejaba la
  nómina escaneada en blanco. `stripMetadata` guarda por eso en DOS pasadas: `garbage: 1` con el
  barrido, y luego reabrir y compactar con `garbage: 4` **sin tocar ni un objeto**. No juntarlas.
- **`REDACT_IMAGE_PIXELS` funciona**: borra los píxeles de la caja y respeta el resto de la imagen.
  Si alguna vez parece que destruye el escaneo, el culpable está en `stripMetadata`, no en el motor.
- **`setLayerVisible` es estado de LECTURA**: enciende las capas para extraer texto y el `/OFF`
  sigue en los bytes guardados. Por eso se pueden leer las capas ocultas sin cambiar el entregable.
- **Un grep sobre el PDF entregado da falso negativo** si no se descomprimen antes los flujos
  (`saveToBuffer({ decompress: true })`).
- **El espacio de página de mupdf tiene la Y hacia ABAJO.** Una caja con la Y del espacio PDF cae
  en el sitio equivocado y el test parece decir que la redacción no toca la imagen.

## Residuales conocidos (verificados, NO arreglados, con su porqué)
- **El coste de rendimiento de la ronda no está medido.** `processDocument` hace ahora una pasada
  más por página (el dispositivo que cuenta glifos ilegibles) sobre las que ya hacía. En documentos
  largos puede notarse; nadie lo ha cronometrado.
- **El patrón de teléfono admite separador en cualquier posición y no lleva dígito de control.**
  `6 1 2 3 4 5 6 7 8` se detecta. Es de antes de esta ronda, no es efecto de la ampliación del
  detector, y queda constancia con un test en `detect/separadores`.
- **El tope de páginas de la versión gratuita NO es un muro.** Cuelga de `license.pro`, que lo
  enciende la verificación que corre en el navegador del usuario. Sin servidor no tiene arreglo
  técnico y no se pretende; lo que se ha corregido es el comentario que afirmaba lo contrario.
- **Hueco de glifos.** Al tachar, el texto posterior NO se mueve: queda un hueco cuya anchura es
  exactamente la del texto borrado (medido: 61,765 pt para ` 12345678Z ` en Helvetica 11, y el
  texto de después no se desplaza ni 0,01 pt). No tiene arreglo con este motor —mupdf solo ofrece
  `REDACT_TEXT_REMOVE`/`NONE`, y rasterizar destruiría la capa de texto sobre la que se sostiene
  toda la comprobación—, así que **se declara en el informe** y `pdf/hueco-de-glifos` ata la
  declaración a la medida. La declaración dice ahora que la anchura **se puede medir con exactitud**
  y que dentro de una lista corta de candidatos **puede bastar para distinguir cuál era**: el propio
  banco mide que veinte nombres de pila dan veinte anchuras distintas, y declarar el límite a la
  baja es una promesa encubierta.
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
