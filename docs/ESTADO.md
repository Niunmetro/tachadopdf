# ESTADO — TachadoPDF (actualizado 2026-08-10)

## Producto
- VIVO en https://www.tachadopdf.com (GitHub Pages + CNAME; verificar dominio real tras cada deploy).
- **Sitio BILINGÜE**: español en la raíz, inglés en `/en/`. **18 URLs (10 ES + 8 EN)**, un solo
  sitemap con alternos `hreflang` recíprocos y `x-default` al español. Las dos landings de sector
  (`/actas/`, `/nominas/`) solo existen en español: ver PARADA 2.
- **La portada ya se publica CON su texto dentro.** Antes `dist/index.html` era
  `<body><div id="app"></div></body>`: todo lo pintaba JavaScript. Ahora el HTML lo emite
  `src/content/generar.ts` (`npm run gen:pages`, ficheros commiteados) y la aplicación solo monta
  los controles en los huecos `#carga`, `#gancho`, `#trabajo` y `#licencia`. **Son cuatro y no dos
  a propósito:** el orden de la primera pantalla lo fija el HTML —zona de carga, «el archivo nunca
  sale de tu equipo», documento de ejemplo, aviso de alcance— y esas dos frases son texto
  INDEXABLE. Con un solo hueco al final, los controles caían detrás de los párrafos y el orden se
  invertía.
- Añadir un idioma = añadir datos a `src/content/registro.ts` + un fichero de contenido.
  `Contenido = typeof es` hace que `tsc --noEmit` sea el linter de i18n: una clave sin traducir
  NO compila.
- Suite: **1170/1170 en 74 ficheros** en `master` (1111 era el suelo tras el sistema visual; +59
  al añadir las tres guardas de marca — `content/marca`, `content/iconos`, `content/og-social`).
  Verificación: `npm install` (⚠ `npm ci` falla con EPERM en la máquina del dueño) ·
  `npx --no-install tsc --noEmit` · `npm test` · `npm run build`, exit codes reales, nunca `| tail`.
- ✅ **`diseno/informe-veredicto-de-un-vistazo` FUSIONADA en master** (5 commits, 2026-08-08).
  Primera pasada de DISEÑO: hasta esa fecha no se había tocado un solo píxel del producto. Ver
  §«Diseño del informe» y §«Diseño de la aplicación y de la web».
- ✅ **`diseno/medidor-de-cobertura-que-mide` FUSIONADA en master** (2026-08-08). El medidor del
  sello ámbar tenía forma de medidor y salía medio lleno siempre: los dos informes parciales de
  ejemplo (3 de 6 páginas comprobadas del todo, y 0 de 4) dibujaban la misma media luna. Ahora el
  relleno es la proporción real. Ver §«Diseño del informe».
- ✅ **`fix/sello-por-estados` y `fix/imagenes-escondites-y-glifos` FUSIONADAS en master** (8 + 9
  commits). La primera rehízo el sello; la segunda cerró los 17 falsos verdes que un ataque interno
  consiguió contra ella, **incluido un bug de destrucción de datos que la primera introdujo** (el
  escaneo del cliente volvía en blanco). Ver la bitácora del 2026-08-08.
- ✅ **`higiene/precio-real-y-ambar-anunciado` FUSIONADA en master** (6 commits, 2026-08-10).
  Ejecuta entera el acta del CEO: precio real (59 € de pago único, tramo Despacho retirado, sin
  garantía de devolución), FAQ que anticipa el ámbar en ES y EN, y las dos correcciones del sello.
  Cierra las PARADAS 0, 0.b (parcial), 0.c, 1, 2 y 5. Ver la bitácora del 2026-08-10.
- ✅ **DESPLEGADO el 2026-08-10** (`npm run deploy-pages`, exit 0; `origin/gh-pages` en `aa96693`;
  build de Pages `built` sobre ese commit). Cerrado el desfase: lo publicado estuvo **17 días** por
  detrás de lo retractado. Antes del deploy, medido con `curl` sobre el dominio real: el bundle vivo
  (`assets/report-Bbl6ogcz.js`) era todavía `clean ? "VERIFICADO" : "NO APTO"` —cero coincidencias de
  «COMPROBACIÓN PARCIAL»—, `/actas/` y `/nominas/` servían `59 €/año` + `149 €/año` + `Despacho`
  (y `/actas/` además la garantía de 30 días), y `/en/` daba **404**. Después: las 18 URLs + sitemap
  + robots en **200**, `/en/` incluido; cero coincidencias de las cuatro falsedades; el bundle viejo
  `report-Bbl6ogcz.js` da **404** y el nuevo `assets/patterns-YUjrQaq6.js` sirve «COMPROBACIÓN
  PARCIAL» y «PARTIAL CHECK». **Regla nueva de la casa:** una afirmación retirada de la fuente NO
  está retirada hasta que está retirada de producción; el registro de la retirada y el despliegue de
  la retirada son la misma tarea, no dos. Lo vigila `afirmaciones-respaldadas`.
- ✅ **DESPLEGADO OTRA VEZ el 2026-08-10 con el sistema visual** (merge `--no-ff` `0deded4`).
  Verificado contra el dominio: **18 URLs + sitemap + robots en 200**; los cuatro ficheros de
  `/fuentes/` en 200 con sus bytes exactos; el bundle que la página referencia de verdad en 200 y
  **los dos anteriores (`main-BDvxK17w.css`, `main-CellcmQp.js`) en 404**, que es la prueba de que
  se sirve el build nuevo y no una copia cacheada; precio 59 € de pago único en las cuatro
  superficies y cero coincidencias de 149, «Despacho» y «/año»; mancheta, `@font-face`, papel
  `#f6f5f3` y `color-scheme: light` en las seis páginas comprobadas, con **cero** bloques
  `prefers-color-scheme: dark`; y **cero peticiones a ningún dominio externo**, medido en el
  navegador sobre el sitio vivo. `dist/CNAME` se comprobó ANTES de desplegar (19 bytes, LF).

## Marca: símbolo, favicon y og-image (FUSIONADO Y DESPLEGADO, 2026-08-10)

> ✅ **`diseno/marca-simbolo-favicon-og` FUSIONADA en master** (merge `--no-ff` `a799112`, 3
> commits) **y DESPLEGADA**, verificada contra el dominio vivo. Ver la bitácora del 2026-08-10.

- **El símbolo** (concepto B, validado por el dueño): documento con renglones, uno con un HUECO
  limpio — el dato borrado de verdad, no tapado con un rectángulo negro. Una sola tinta vía
  `currentColor` (hereda `--tinta`); NO es candado ni escudo. Va INLINE en la mancheta de las 18
  (`SIMBOLO_MANCHETA` en `generar.ts`), en la ranura de 20×20 con `gap: 8px`. `public/simbolo.svg`
  es la fuente vectorial; `content/marca.test.ts` ata que la copia inline y el fichero no deriven,
  que sea una sola tinta y que sea un documento (no candado/escudo), en las 18.
- **El favicon** (fin del 404): `favicon.svg` + `favicon.ico` (16/32/48) + `apple-touch-icon.png`
  (180×180), self-hosted, referenciados con ruta RELATIVA en las 18 (`enlacesFavicon`). A 16 px
  gana la variante MACIZA (medido rasterizando y mirando). `content/iconos.test.ts` ata las
  referencias, la multi-medida del `.ico`, el 180×180 del PNG y que el `.svg` sea una sola tinta;
  y, si hay `dist/`, que los ficheros estén dentro y el HTML los cite.
- **La og-image** honesta y por idioma: tipográfica, sobria, 1200×630, papel `--papel` + tinta
  `--tinta`, IBM Plex, con el claim LITERAL de la home y **sin sello de color**. `ogImage(locale)`
  emite `og-image.png` (ES) y `og-image-en.png` (EN). `content/og-social.test.ts` ata la coherencia
  por idioma y las dimensiones (revertir a la vieja 1280×720 la pone roja).
- **⚠ Las 8 páginas estáticas llevan copia CONGELADA del sistema**: el símbolo (SVG + CSS) y los
  `<link>` de icono se les añadieron a mano; el generador solo toca las 10 generadas. Al tocar la
  mancheta o el favicon, recordar las dos superficies.
- **Decisión de tinta:** se usó `--tinta #1b1a17` (el token vivo), NO `#0f172a` que pedía la tarea:
  la web nueva ya retiró ese slate frío. Trivial de revertir si el dueño prefiere el hex literal.

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

## Diseño del informe (primera pasada, 2026-08-08)
- **El veredicto es ahora el texto MAYOR de la página** (19 pt) y va por delante de la marca (12) y
  del antetítulo (9,5). Antes la escala estaba invertida: los dos elementos mayores del papel eran
  la marca y el título genérico, o sea los dos IDÉNTICOS en los cinco estados.
- **El rótulo del estado consta en el pie de TODAS las páginas**, con el filete teñido. Antes la
  página 2 de un informe bloqueado y la de uno verificado eran el mismo texto palabra por palabra.
  El rótulo va **ENTERO**: la regla G8 (ningún rótulo es subcadena de otro) es lo que permite
  escribir los tests, y un «PARCIAL» a secas la rompe. Lo vigila `report/sello` (G11).
- **E1 es la única banda maciza** (roja con texto en blanco). En escala de grises queda en ~75
  frente a ~240 de las otras cuatro: la única alarma del producto se distingue SIN color. E2 sigue
  en la familia roja porque `CLAUDE.md` línea 10 lo exige; lo que cambia es que una está invertida.
- **El ámbar lleva un medidor de cobertura, no un signo de admiración. Y el medidor MIDE.** Los
  cinco iconos se dibujan con primitivas de `pdf-lib`: nada remoto, nada descargado. El disco del
  ámbar se llena en la proporción `coberturaComprobada` = **páginas sin ninguna reserva / páginas
  del documento**, que son los mismos números que ya imprime el sello y que ya destaca la tabla
  «Cobertura»: el dibujo y el texto no pueden decir cosas distintas. **NO es «releídas / total»**:
  una página releída con una foto del DNI dentro sí se releyó, pero la comprobación no alcanza la
  imagen, y en el caso corriente (un logo en el membrete) esa medida marcaría el máximo justo en
  el estado que por definición no está completo. De las dos, la elegida es la conservadora
  (`sinReserva <= releidas` siempre).
- **Los dos extremos del medidor están resueltos a propósito, no por descuido.** Cobertura CERO:
  disco vacío sobre una PISTA blanca, o sea un recipiente vacío y no un icono ausente; y cero es
  cero, sin suelo de relleno que finja una pizca de cobertura. Cobertura CIEN: la línea de lleno
  total está al **80 % del diámetro** y el casquete de arriba nunca se pinta — en E3 siempre queda
  algo pendiente (el 100 % se da cuando lo único pendiente es un objeto del archivo), un disco
  lleno junto a «COMPROBACIÓN PARCIAL» insinuaría el verde que no se ha dado, y un círculo relleno
  hasta el borde con orla empieza a leerse como un sello de conformidad, que está prohibido también
  cuando lo dice el DIBUJO. La escala es lineal y monótona: **el medidor nunca dibuja más cobertura
  de la que hay.** Lo mide `report/medidor` (G18), en color y en gris.
- **Y desde el 2026-08-10 el numerador que dibuja el disco está ESCRITO, no solo dibujado.** Fila
  «Páginas comprobadas del todo (sin nada fuera de alcance)», inmediatamente debajo de «Páginas del
  documento» para que el par se lea como fracción por adyacencia. Antes, la tabla daba el total,
  las releídas, las sin capa de texto, las que llevan imágenes… y **ninguna era la cifra que el
  dibujo afirma**: en un producto cuya sección estrella se titula «Cómo comprobar este informe», el
  único dato que un tercero no podía contrastar era el que solo existía como dibujo. Dos reglas al
  tocarla: **cifra desnuda** (no «0 de 4» — `report/cobertura-destacada` parsea los dígitos de la
  línea, y el denominador ya está encima) y **NO se destaca** (destacar es la marca de una reserva,
  y esta fila es el resultado de haberlas contado). Se ata a `coberturaComprobada`, que es la misma
  función que dibuja el aro: el dibujo y el texto ya no pueden derivar.
- **Descartado un rótulo al pie del medidor**, que es lo que pedían las tres voces del comité. El
  argumento era el «falso rojo» (disco vacío = «no comprobó nada»), y es falso: `es.ts:114` imprime
  a 9,3 pt **al lado del disco** «Se han releído las N páginas del archivo entregado y sus
  metadatos…». El medidor no está solo. Un rótulo extra sería un tercer sitio para el mismo número,
  fuera de la caja del disco (o `report/medidor` deja de localizar el aro), en la banda más alta,
  en cinco estados y dos idiomas, contra `report/maquetacion`, que mide posiciones de glifo. Coste
  alto, información cero. **Vuelve solo con señal externa** (un cliente de pago o un correo que
  mencione el disco); sin eso, no se relitiga.
- **REGLA DE REDACCIÓN DEL ÁMBAR (2026-08-10):** toda redacción del ámbar empieza afirmando lo que
  SÍ se comprobó y termina acotando lo que no. **Si la primera oración de una línea de sello es una
  limitación, se rechaza la redacción.** El ámbar es el 86 % de las entregas: una línea que abre en
  negativo convierte el resultado corriente del producto en una disculpa. Lo vigila `legal/faq-ambar`.
- **El sello ya no dice la misma frase dos veces.** Cuando el ámbar se debía ÚNICAMENTE a un objeto
  no examinado, `lineaParcialSoloObjetos` (que ya nombra los objetos) recibía encima
  `clausulaObjetosSinExaminar`. Con `reservas === 0` la única forma de estar en E3 es tener un
  objeto sin examinar, así que la duplicación era el caso ENTERO, no uno raro. La coletilla **sí**
  se sigue añadiendo cuando hay además una reserva de página: ahí la base no nombra los objetos y
  sin ella el sello se callaría su propia reserva. Las dos ramas van atadas en `report/sello`.
- **Cuatro canales por estado, no uno:** relleno de banda, tinta dentro, acento sobre blanco y
  forma del icono. Los rótulos y las formas son lo que sobrevive a la fotocopia y al daltonismo.
- **Los puntos de patrón tienen TRES estados**: macizo verde = comprobado y no había · anillo hueco
  = no se pudo comprobar · macizo rojo = encontrado. La regla es `páginas releídas == 0 o no hubo
  comprobación`, **NO** «el estado es rojo o ámbar»: en un ámbar por imágenes la cobertura de texto
  es completa y el verde ahí es correcto. Lo mide `report/vinetas` contando TINTA sobre el PDF
  rasterizado.
- **En «Cobertura», las cinco filas que bajan el sello se destacan** (fondo ámbar, barra y cifra en
  negrita) y las de inventario no. Lo mide `report/cobertura-destacada` sobre la FUENTE de cada
  cifra en el PDF renderizado.
- **Viudas y huérfanas:** ningún encabezado cierra una hoja sin su sección, y las tablas planifican
  el corte para no dejar menos de dos filas a ningún lado. Lo vigila `report/paginacion` (G14).
- **La marca de agua DEMO ya no cruza el sello ni la huella SHA-256**: vive en la mitad inferior.
  Lo vigila `report/paginacion` (G15), localizando la banda por su color de relleno.
- **Al tocar el sello hay que rasterizar y mirar el E5 y el E3 uno al lado del otro.** El ámbar
  bonito y el verde grande son el mismo fallo con dos caras, y ninguna guarda mide «cuánta
  tranquilidad transmite un titular». El guion de vistas vive fuera de `src/` (`_vistas/`).

## Diseño de la web — SISTEMA VISUAL «Registro» (FUSIONADO Y DESPLEGADO, 2026-08-10)

> ✅ **`diseno/sistema-visual-registro` FUSIONADA en master** (merge `--no-ff` `0deded4`, 4 commits)
> **y DESPLEGADA**, verificada contra el dominio vivo. Ver la bitácora del 2026-08-10 (entrada de
> integración) para lo que se midió y cómo.
>
> El MOVIMIENTO de `AVISO_PRINCIPAL` (mismo texto, debajo del control en vez de encima) es ruta
> sensible y entró **sin** bendición previa de legales, con este razonamiento escrito para que se
> pueda discutir en vez de quedar enterrado: su texto no cambia ni una palabra, y sigue estando
> antes de cualquier acción con consecuencias, porque la casilla de revisión y el botón de descarga
> **no existen** hasta que hay documento cargado. Si legales lo quiere arriba, se sube: es un
> cambio de orden en el generador.

- **Una sola fuente de tokens: `src/estilo/sistema.css`.** Tipografía, escala, escalera de
  espaciado, radios y paleta. La consumen `src/estilo.css` y los `<style>` incrustados de las
  DIECIOCHO páginas, vía `src/estilo/sistema.ts`. Ninguna pantalla escribe ya un hex, un tamaño ni
  un espaciado a mano. **Lo que se revisa lleva sus comentarios (17,7 kB); lo que se publica son
  las reglas (3,1 kB).**
- **⚠ LA RUTA DE LA FUENTE LLEVA UN MARCADOR, NO UNA RUTA.** Dieciséis páginas llevan su CSS dentro
  de un `<style>`, y ahí las URL se resuelven **contra el documento**: un `url(fuentes/…)` escrito
  una sola vez sirve la portada y da **404 mudo** en `/guia/loquesea/`, con la portada en Plex y las
  guías en la letra del sistema. Y una ruta raíz-absoluta muere bajo la base de emergencia
  `/tachadopdf/`. Cada página sustituye el marcador por su prefijo de profundidad
  (`navHref(ruta, '')`), igual que el PDF de ejemplo. Lo ata `estilo`.
- **Tipografía: IBM Plex Sans Variable + Plex Mono, SIL OFL 1.1, auto-alojadas** en
  `public/fuentes/<familia>/` con su `OFL.txt`. Los `.woff2` son los **publicados tal cual**: NO se
  subsetean (la FAQ 2.6 de la OFL considera modificación el subsetting, y una Versión Modificada no
  puede llevar el Nombre de Fuente Reservado «Plex»). `font-display: optional`, nunca `swap`.
  El **mono** va donde hay un IDENTIFICADOR que se compara carácter a carácter (clave de licencia,
  nombres de fichero entregados, el valor dentro de «tachar todas las apariciones»), y en ningún
  otro sitio: el sans de Plex ya es tabular por defecto.
- **Paleta «Registro»**: papel `#f6f5f3`, tinta `#1b1a17`, un solo acento `#164a7e` (9,07:1, hace
  también de color de enlace — `--enlace` y `--acento-oscuro` desaparecen). **El mínimo de toda la
  paleta, sobre las dos superficies, es 5,24:1.** La página es el PAPEL y el panel es la SUPERFICIE
  blanca: antes estaba al revés.
- **UNA SOLA CARA, CLARA, en las 18 páginas.** Fuera todos los bloques `prefers-color-scheme: dark`.
  Motivo medido: el CTA de las seis guías ES era relleno `#0f172a` sobre fondo `#0f172a` (1,00:1) y
  el de las seis EN, 1,22:1. **No se hizo borrando la guarda: `legal/cta-visible` se reapuntó a las
  dieciocho derivando la lista del registro** — antes su lista era `['actas','nominas']` y el fallo
  vivía en doce ficheros que nunca abría.
- **La primera pantalla la gana la herramienta.** A 390×844 la zona de carga pasa del píxel 1.734
  al 525 (de 2,05 pantallas a 0,62). **Criterio que hay que mantener: por encima de 600 px.** Lo
  vigila, sin navegador, la guarda de ORDEN del pliegue.
- **Mancheta común a las 18**: marca en versalitas a la izquierda, idiomas a la derecha, filete a
  sangre. **YA lleva su símbolo** en la ranura de 20×20 (documento con un renglón roto, una sola
  tinta vía `currentColor`), y **ya hay favicon**: ver §«Marca: símbolo, favicon y og-image».
- **Medida de línea en `em`, no en `rem`**: un tope fijo da ~68 caracteres a 16 px pero ~81 a 14.
  Medido después: 63–71 caracteres en todas las familias de página.
- **El informe PDF queda FUERA de esta pasada, a propósito.** Incrustar Plex movería TODOS los
  glifos, y `report/maquetacion` mide posiciones de glifo mientras `report/vinetas`,
  `report/medidor` y `report/cobertura-destacada` miden tinta sobre el PDF rasterizado. Es tarea
  aparte con re-medición de cuatro guardas, no un efecto colateral.
- **Verificado en la integración, mirando y midiendo** (Chrome headless por CDP, seis páginas × dos
  anchos, ANTES y DESPUÉS, y la aplicación conducida VIVA con el acta de ejemplo): **cero**
  peticiones externas en las doce combinaciones —también contra el dominio ya desplegado—; la
  página más profunda (`/en/guide/…`) resuelve `/fuentes/…` con su prefijo; CSP **byte a byte**
  igual a la de master en las 18; **0 fallos de contraste** medidos sobre lo PINTADO y mínimo
  5,24:1; dianas táctiles bajo 44 px a 390: **14 → 0**; medida de línea real 140 → 77 en legales;
  y el TEXTO comparado **palabra a palabra** contra master (las únicas altas son «TachadoPDF» y
  «Español»/«English» de la mancheta, cadenas que ya existían).
- **Las dos guardas nuevas se probaron poniéndolas rojas EN LA INTEGRACIÓN, no solo al escribirlas:**
  devolver un bloque oscuro a una guía inglesa da 2 fallos de `legal/cta-visible` en un fichero que
  la guarda vieja no abría; devolver `--acento: #0284c7` da 3 fallos de `estilo`, incluido el token
  que la vieja no miraba.
- **Los `.woff2` son byte a byte los publicados por fontsource** (sha256 idéntico): sin subsetear,
  que es lo que la FAQ 2.6 de la OFL exige para conservar el nombre reservado «Plex». Su `OFL.txt`
  es el de upstream palabra por palabra.

## Diseño de la aplicación y de la web (misma pasada)
- **Lo hueco sigue ahí, lo macizo se va.** Una detección sin elegir es un contorno discontinuo con
  el dato legible debajo; elegida, macizo con su marca. Antes `.hit-box` no tenía NI UNA regla y
  heredaba el estilo de `button`: propuesta, elegida y tachado consumado eran el mismo dibujo.
- **La entrega se acusa y enseña el veredicto** (`src/ui/entrega.ts`), reutilizando LITERALMENTE
  `sellos[estado]` y `lineaDelSello`. Para eso `processDocument` devuelve su `reportData`: la
  pantalla no redacta nada por su cuenta. Guarda `ui/entrega` (G16).
- **La casilla de revisión y el botón de descarga no existen hasta que hay documento cargado.**
- **Regla de la casa: ningún elemento pulsable puede compartir color de relleno con su fondo.** Los
  CTA de `/actas/` y `/nominas/` estaban a 1:1 en modo oscuro. Guarda `legal/cta-visible` (G17).
- **`--gris` era un gris de tema oscuro sobre blanco** (2,56:1) y le tocaba a la frase que nombra al
  comprador y al pie que sostiene la promesa de privacidad. Token `--enlace` propio (5,7:1) para
  todo enlace: donde no había regla, el navegador ponía su #0000EE. Lo miden los tests de
  `estilo.css`, calculando el contraste de verdad.

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
- `precios-coherentes` — una sola fuente para cuota, tope de páginas y precio, **sin ninguna
  excepción**: cubre también las dos landings de sector, que es donde entró el fallo entero. Añade
  el tramo multi-puesto inexistente, la garantía de devolución y el pie legal (art. 10 LSSI).
  **Una excepción a un guardián sobrevive a la razón que la creó**: si hace falta congelar una
  página, se congela con un test propio que afirme lo que dice, no quitándola del barrido.
- `afirmaciones-respaldadas` — sobre el HTML del repo: todo importe presentado como sanción cita su
  expediente (ventana de 700 caracteres = la mayor distancia legítima MEDIDA, 570); «más de N
  comunidades» solo aparece para desmentirlo; y los literales retirados (plural sin recuento, cita
  del ICO, multa de 6.000 €) no pueden volver. ⚠ Su límite está escrito en la cabecera y está
  medido: una cifra inventada a dos párrafos de un expediente legítimo pasa la proximidad, y por
  eso hay además barrido literal. Las dos capas hacen falta.
- `legal/faq-ambar` — ata dos sitios independientes: los rótulos que IMPRIME el informe
  (`informe.sellos`) y los que el FAQ le promete al comprador. Renombrar un estado sin tocar el FAQ
  deja a la web explicando un rótulo que el papel ya no imprime. Prohíbe además el valor probatorio
  por contraste, exige la pregunta del valor probatorio en los dos idiomas, y codifica la regla de
  redacción del ámbar.
- `report/estado` (rama) — rejilla exhaustiva de 144 combinaciones del sello, invariante maestra de
  E5, orden de la escalera, rótulos disjuntos, y patrones declarados == los que `detect()` emite.
- `report/sello` (rama) — sobre el PDF **renderizado**: página escaneada, documento sin tachados,
  escaneado entero y objeto no examinado **no pueden** imprimir «VERIFICADO»; lista negra de
  sobre-afirmación; el alcance no puede encogerse.
- `report/maquetacion` (rama) — mide la POSICIÓN de cada glifo: nada se sale de los márgenes y dos
  textos de la misma línea no se pisan. Es la clase de guarda que faltaba: extraer el texto da
  verde aunque una etiqueta se dibuje encima de su valor.
- `report/vinetas` (rama) — mide TINTA sobre el informe rasterizado: **cero píxeles del verde de
  viñeta** cuando no hubo nada que releer. Un test de texto no ve esto y por eso duró tanto.
- `report/medidor` (rama) — mide el NIVEL DE LLENADO del disco sobre el informe rasterizado:
  localiza el disco por su aro, busca la línea de llenado y la ata a la proporción real, en color
  **y en escala de grises**. Cubre los dos extremos (cero se dibuja como recipiente vacío; cien no
  llena el disco) y se pone rojo si alguien vuelve a fijar el relleno a la mitad.
- `report/cobertura-destacada` (rama) — mide la FUENTE de cada cifra sobre el PDF renderizado: la
  de una fila con reserva va en negrita y la de inventario no. A cero no se destaca.
- `report/paginacion` (rama) — ninguna hoja termina en un encabezado ni empieza por una fila
  huérfana, en los cinco estados; y los píxeles que distinguen la versión gratuita de la de pago
  (la marca de agua) caen todos por debajo de la banda del sello, que se localiza por su color.
- `ui/entrega` — el acuse de entrega enseña el MISMO veredicto que el informe, con literales
  congelados, y un documento escaneado entero no se anuncia como verde en pantalla.
- `legal/cta-visible` — **reapuntado a las DIECIOCHO páginas, derivando la
  lista del registro del sitio.** Antes era `const PAGINAS = ['actas','nominas']` y el mismo defecto
  —un pulsable con el mismo relleno que su fondo— seguía vivo, medido, en doce ficheros que la
  guarda nunca abría. Ahora comprueba, en las dieciocho: que ninguna declara bloque de tema oscuro,
  que todas declaran `color-scheme: light`, y que el relleno de cada CTA está a ≥ 3:1 de su fondo
  y su texto a ≥ 4,5:1 de su relleno, **resolviendo los tokens y calculando**.
- `estilo` — **reescrito con el sistema visual.** Los tokens usados como color de texto se DERIVAN
  del CSS (ocho hoy, sin lista escrita a mano) y cada uno se calcula contra las DOS superficies
  (`--papel` y `--superficie`). La versión anterior nombraba `gris`, `enlace` y `tinta-suave`: **los
  tres que aprobaban** — `--acento` (4,10:1 en tres sitios) y `--verde` (3,30:1 haciendo de ✓) no
  entraban en el barrido. Puesta contra la paleta VIEJA, la nueva da cinco fallos. `--tinta-inversa`
  es la única excepción y está DENTRO del test con su motivo, nunca sacando un fichero del barrido.
  Cubre además: los `.woff2` existen, pesan ≤ 64 kB entre los dos y viajan con su OFL · las dos
  caras van en `optional` y con el marcador de ruta sin resolver · las diez páginas generadas
  incrustan los mismos bytes del sistema con SU prefijo · la escala es cerrada (siete pasos, en
  rem) y nadie escribe un tamaño a mano · la escalera de espaciado cae en la rejilla de 4 · ni un
  margin/padding/gap/radio/color escrito a mano · el ORDEN del pliegue de la portada en los dos
  idiomas · todo lo pulsable declara 44 px · y el botón de «tachar todas las apariciones» no
  recorta el valor (esa guarda **estaba al revés y exigía el `text-overflow: ellipsis` que lo
  dejaba en un carácter en el móvil**).
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

## Bloqueos / PARADAS del owner

> **Regla vigente desde el 2026-08-10** (corrección del dueño, recogida en el acta del CEO): los
> precios y los textos legales los decide el comité, no él. Los únicos gates que quedan son meter
> una contraseña o hacer un pago, publicar su DNI o su domicilio, y borrar datos en la nube. Las
> PARADAS que abajo constan como CERRADAS se cerraron con esa regla.

### Cerradas el 2026-08-10 (rama `higiene/precio-real-y-ambar-anunciado`)

0. ✅ **El ámbar pasa a ser lo normal, y la web no preparaba al comprador.** FAQ nuevo en ES y EN
   («¿Por qué mi informe dice COMPROBACIÓN PARCIAL…?» / «Why does my report say "PARTIAL CHECK"…?»)
   que dice que el ámbar es el resultado normal y no una avería, y por qué (el logo del membrete).
   Se aprovechó para dos correcciones del mismo delito: «no sirve como evidencia archivable»
   afirmaba por contraste que el informe de pago sí (fuera, en los dos idiomas), y la pregunta del
   valor probatorio existía solo en inglés (portada al español). Lo ata `legal/faq-ambar`.
   **Umbral de revisión:** al PRIMER correo de soporte que pregunte por «COMPROBACIÓN PARCIAL» se
   reabre la redacción. Cero correos en 30 días = el aviso funciona y no se toca.
0.b ✅ **Parcialmente cerrada.** *La cifra del medidor:* SÍ, pero en la tabla «Cobertura», no al pie
   del disco (ver §«Diseño del informe» para el descarte y su medida). *El rótulo «Revisar a ojo:
   páginas 1, 2, 3, 4»:* descartado — afirmación nueva y la tabla ya destaca esas filas.
   ⚠ **SIGUEN ABIERTAS las otras dos**, que no son del mismo asunto y no se han tocado:
   - *El acta de ejemplo enseña una detección aparentemente aleatoria y la firma en verde.* En tres
     líneas consecutivas del anexo, el IBAN `ES6600491500051234567892` y el DNI `11223344H` quedan
     a la vista mientras el nº de la Seguridad Social de al lado sí se tacha. El motor obra bien
     (mod-97 da 7 y la letra correcta sería B), pero es el ÚNICO documento que ve todo el que llega
     de un anuncio. **NO se ha cambiado el PDF de ejemplo**: una demo donde todo valida enseñaría
     una herramienta que lo caza todo, que es el falso verde reubicado en marketing. Las dos
     salidas honestas —rotular esas líneas como «no detectado automáticamente» o rehacer el acta—
     son trabajo aparte y ninguna es urgente.
   - *Rótulos para los dos ficheros del acuse de entrega.* El panel los nombra pero no explica cuál
     es cuál («el PDF que entregas» / «el informe que archivas» sería texto nuevo en dos idiomas).
0.c ✅ **La frase duplicada del sello: arreglada.** No era decisión de texto, era defecto, y con
   `reservas === 0` era el caso entero. Ver §«Diseño del informe». La coletilla sigue añadiéndose
   en la otra rama, y las dos van atadas en `report/sello`.
1. ✅ **Precio y moneda en inglés: se queda en 59 €.** Una sola fuente (`PRECIO_PRO`), sin
   conversión a $/£. Un segundo símbolo de moneda es una segunda cifra que puede derivar.
2. ✅ **`public/actas/` y `public/nominas/` ya no venden lo que no existe.** 59 € de pago único; el
   tramo «Despacho» retirado; la garantía de devolución fuera (y NO entra en los Términos:
   `refund_policy` es `null` en Gumroad y el art. 61.2 TRLGDCU integra la publicidad en el
   contrato, así que escribirla ahí fabricaría un pasivo firmado que no podemos honrar). Pie legal
   añadido (art. 10 LSSI). **Ya NO están excluidas de `precios-coherentes`.** Siguen sin traducirse
   al inglés: se corrigen, no se relanzan.
5. ✅ **`CLAUDE.md` línea 5 corregida:** «gratis 5 docs/mes de hasta 3 páginas + Pro 59 € de pago
   único, no suscripción». Era la fuente que reinfectaba la copia.

### Abiertas

3. **Aviso legal inglés.** Identifica al operador y enlaza al Aviso Legal español para el NIF y el
   domicilio, en vez de republicarlos. Si se quiere el bloque completo en inglés, es puerta suya
   (publicar DNI/domicilio sigue siendo gate del dueño).
4. **Detección para el comprador inglés.** Solo el detector de email funciona fuera de España. La
   copia inglesa lo dice explícitamente. Añadir NI/NHS/SSN es tarea de producto aparte.

### GATES REALES DEL DUEÑO (contraseña o pago: nadie más puede hacerlos)

G1. 🔴 **Retirar la variante «Despacho - 3 puestos» del producto en Gumroad.** Comprobado el
   2026-08-10 sobre la ficha pública (`curl`, sin claves): existe, está publicada
   (`is_published: true`) y cuesta `price_difference_cents: 9000` sobre los 59 €, o sea 149 €. Y
   `src/license/gumroad.ts` **no mira la variante**: un desconocido puede pagar 149 € y recibir el
   producto de 59 €. Retirarla de nuestras páginas NO cierra el agujero — la ficha es alcanzable
   desde `PRO_URL` y desde Google.
   Ruta: `gumroad.com` → Products → TachadoPDF Pro → *Versions/Variants* → borrar
   «Despacho - 3 puestos» → Save.
   **Umbral: 2026-08-12.** Si a las 48 h sigue publicada, se **despublica el producto entero** hasta
   poder retirarla. Cero ventas no se pierden; un cobro indebido se paga.
   *Descartado* preseleccionar la variante con `?option=` en `PRO_URL`: el comprador puede cambiarla
   igual, y un tapón que no tapa es peor que ninguno porque parece un arreglo.
G2. 🟠 **Corregir la descripción de «Pro - 1 puesto»** en la misma pantalla: dice «Licencia
   individual **anual**» y contradice a la propia ficha, que ya dice «Pago único, sin suscripción».
   Texto: `Licencia individual de pago único. Informes de verificación sin marca, documentos
   ilimitados.`
G3. 🟠 **El nombre de la marca en Gumroad.** La ficha publica `"brand":{"name":"Angel Fh"}` y
   `creator_profile.name: "Angel Fh"` — el nombre real del dueño en superficie externa, contra la
   regla de la casa (firmar como equipo salvo donde la ley obliga). Settings → Profile → Name. Es
   su identidad: la decide él.
G4. ⚪ **PARADA 6** (abajo): `git push origin --delete gh-pages` + `npm run deploy-pages`. Borrar
   datos en la nube = gate del dueño. **No bloquea ningún despliegue.**

### Umbrales de revisión con fecha y cifra (no «ya veremos»)

- **El deploy: 10 minutos.** Si tras `npm run deploy-pages` `/` no da 200 o falta el CNAME, se
  repite en el acto. La última vez fueron **cuatro días de 404**.
- **El pie del medidor (cortado hoy):** vuelve solo con señal externa — un cliente de pago o un
  correo que mencione el disco. Sin eso, no se relitiga.
- **El precio: sin revisión de calendario.** 59 € de pago único no se reabre por opinión. Se reabre
  con una venta a un desconocido, o con un desconocido que pida multi-puesto por escrito.

### PARADA 6 — sigue abierta, y NO bloquea el despliegue (detalle completo)

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
- **La última hoja de dos informes sigue muy vacía.** Medido el hueco final de cada página: el
  documento escaneado entero (E2) entrega una tercera hoja con 705 pt en blanco y el parcial con
  todas las reservas, 539. La causa **no es el corte** —el control de viudas y huérfanas ya está
  puesto— sino el volumen: lo que sobra no cabe en la hoja anterior. Arreglarlo de verdad pide
  equilibrar el reparto en una **segunda pasada de composición** (componer, ver cuánto cae en la
  última hoja y recomponer con el suelo subido), que es trabajo aparte. Lo que sí mejoró: el
  informe bloqueado volvió a caber en dos páginas y la versión GRATUITA del caso corriente bajó de
  tres hojas a dos (antes entregaba una tercera con 347 pt de blanco).
- **El acuse de entrega hereda una frase pensada para el papel.** Reutiliza `lineaDelSello` tal
  cual, y en E5 esa línea termina en «Alcance y límites, abajo» — en la pantalla no hay ningún
  «abajo». Es el precio de NO escribir una segunda redacción, que es lo que garantiza que las dos
  superficies no deriven. Arreglarlo bien pide tocar el texto del informe: puerta del dueño.
- ✅ **La app YA se ha visto en captura** (2026-08-10, y otra vez en la integración). El panel del Browser no
  compositaba, así que las capturas se hacen con **Chrome headless por CDP** (portada ES y EN,
  comprobador, guía ES, guía EN y landing, a 390×844 y 1440×900) y se MIRAN. La misma conexión CDP
  mide geometría, familias resueltas, dianas táctiles y caracteres por línea sobre el `dist/`
  construido. Guion en el borrador de la sesión, fuera de `src/`.
- **La caché del `.woff2` en producción: MEDIDA, y es corta.** GitHub Pages lo sirve con
  `Cache-Control: max-age=600` (diez minutos) y ETag. O sea: **no es «se paga una vez y ya»** — a
  partir de los diez minutos hay una revalidación condicional por visita. La respuesta normal es un
  304 de cero bytes, así que los 45,7 kB sí se pagan una vez por caché de navegador, pero el viaje
  de ida y vuelta existe, y en una red lenta puede comerse la ventana de ~100 ms de `optional`: ese
  visitante ve la pila de respaldo esa vez. Es justo el riesgo que `optional` está puesto para
  acotar, y **no tiene arreglo desde un sitio estático en Pages** (no controlamos la cabecera). Lo
  que sigue sin medirse es la portada cronometrada en 3G real.
- **El campo «Tipo de documento» y la zona de carga no comparten borde derecho en escritorio**
  (544 px contra 878): `.campo` lleva `max-width: var(--medida)` y la zona de carga va al ancho del
  panel. Cada regla es defendible por separado —la medida es para texto, la zona de carga es una
  figura— y juntas dejan el borde derecho del formulario en escalón. En móvil no ocurre. Decisión
  de quien lleve el sistema; el integrador no la tomó por su cuenta.
- **El botón nativo de fichero habla el idioma del NAVEGADOR, no el de la página:** en `/en/` con el
  navegador en español dice «Seleccionar archivo». Es el control del sistema operativo y ya pasaba
  en master; lo que cambia es que ahora, con el relleno de acento, se lee como un botón NUESTRO. La
  salida es la que la dirección autorizaba y que sigue sin hacerse: promover `comprobador.dropzone`
  a clave compartida y usar un `<label for>` como ya hace el comprobador. Cero palabras nuevas.
- **En el pie de `/actas/` y `/nominas/` los separadores «·» quedan colgando al final de línea**,
  porque los enlaces legales pasaron a `inline-flex` de 44 px para cumplir la diana táctil. Se
  arregla en la reescritura completa que estas dos páginas ya tienen pendiente, no con un cuarto
  parche.
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
  en el modo pensado para cuando el dominio cae. **Sigue sin arreglarse**: la PARADA 2 se cerró en
  lo comercial (precio real, tramo fuera, pie legal), no en lo estructural; hay que reescribir las
  dos páginas enteras, no parchearlas una tercera vez. Por eso el pie legal que se añadió el
  2026-08-10 usa URL **absolutas al dominio**, que sí sobreviven a la base de emergencia; lo ata
  `precios-coherentes`. El sistema visual **no las reescribe**: solo les pone la mancheta, el
  sistema visual y la cara clara — su estructura y su copia siguen congeladas.
- ✅ **El símbolo y el favicon: HECHOS y desplegados** (2026-08-10, ver §«Marca»). Sigue sin
  **figura del informe en la web**: el producto ES el informe y no se ve por ninguna parte. Lo
  honesto sería una figura y solo una: la primera página del informe de ejemplo **rasterizada por
  el generador que ya existe**, en su estado ÁMBAR (el 86 % de las entregas), nunca dibujada a
  mano. Es tarea aparte (no es marca: es una captura del propio producto).
- ✅ **`og-image.png` ya NO enseña un sello verde** (2026-08-10, ver §«Marca»). Rehecha tipográfica
  y sobria, 1200×630, sin sello de color que afirme un veredicto, por idioma
  (`og-image.png` ES + `og-image-en.png` EN). Sustituido el falso verde mudado a marketing.
- ✅ **La cita del ICO se retiró el 2026-08-10** («in July 2025 the ICO published dedicated
  guidance…»), de los dos sitios donde vivía, antes de que el primer deploy de `/en/` la publicara.
  Las otras dos citas inglesas —Manafort (8-ene-2019) y PSNI (750.000 £, oct-2024)— **sí** están
  verificadas por contenido y se quedan. Lo vigila `afirmaciones-respaldadas`.

## Notas operativas
- ⚠ **Al verificar un deploy, NO grepear un nombre de bundle escrito a mano.** El acta del 10-ago
  mandaba comprobar que `assets/report-*.js` hubiera cambiado; ese chunk **ya no existe** (el
  troceado cambió y quien lleva los rótulos del sello es `assets/patterns-*.js`). Un nombre fijo en
  una comprobación post-deploy no encuentra el fichero y **se lee como que el deploy falló**. La
  comprobación correcta parte de lo que la página referencia de verdad:
  `curl -s https://www.tachadopdf.com/ | grep -oE 'assets/[A-Za-z0-9_-]+\.(js|css)'`, y sobre el
  bundle que salga: debe contener «COMPROBACIÓN PARCIAL». Comprobar además que el bundle ANTERIOR
  da 404 — es la prueba de que se sirve el build nuevo y no una copia cacheada.
- El CNAME vive ahora en `public/CNAME`, igual que `public/.nojekyll`: Vite lo copia en cada build.
  El script de deploy lo sigue escribiendo como segunda línea, y el modo `DOMINIO=0` sigue siendo
  el único camino que lo quita. **Verificado en la integración: `dist/CNAME` existe tras un
  `npm run build` a secas, sin script de deploy de por medio, y con el byte exacto (LF).**
- **El CNAME está fijado a LF en `.gitattributes`.** `core.autocrlf` está a true: sin ese pin,
  cualquier checkout en Windows lo materializa con CRLF y eso es lo que Vite copia a `dist/` y
  `gh-pages` publica. Lo que sale por la puerta son los bytes del árbol de trabajo, no los del
  objeto de git. No quitar esa línea.
- Webmail OX: NUNCA teclear antes de que el composer renderice; foco+Enter para drill-down en Ads.
