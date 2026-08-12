# Bitácora de TachadoPDF

Memoria compartida del proyecto. Cada sesión de trabajo añade su entrada AL PRINCIPIO.
Formato fijo. Sin secretos, sin datos de clientes.

---
## 2026-08-12 · growth · Pieza de AUTORIDAD / AEO: «¿Se puede recuperar un texto tachado de un PDF?» (acto de DISTRIBUCION)

**Hecho:** una pieza de autoridad, no otra landing de tarea. Rama
`seo/autoridad-recuperar-tachado`, merge `--no-ff` `d958099`, push a `origin/master` (verificado
sincronizado) y DESPLEGADA. VIVA en https://www.tachadopdf.com/guia/recuperar-texto-tachado-pdf/
(200). Suite **1344 -> 1381** en 75 ficheros, verde. No es ingenieria: es el segundo acto de
distribucion con juez escrito, de TIPO distinto al de las cinco landings del 10-ago.

### El tipo, y por que es un hueco distinto (regla 55, AEO)
Las cinco landings de cola larga persiguen la TAREA por sector («ocultar datos de un CV / de un
juicio / de una copia del DNI»). Esta persigue la CURIOSIDAD y el MIEDO: gente que YA sospecha que
un tachado puede fallar y teclea «¿se puede recuperar un texto tachado?», «el negro se quita»,
«copiar el texto de debajo». El comprobante de la keyword (WebSearch, 2026-08-12): la SERP de esa
intencion la ocupan blogs de los gigantes (Smallpdf, Adobe, pdfFiller, PDFgear) con una respuesta
BINARIA y tranquilizadora —«las herramientas profesionales borran de verdad, las anotaciones se
quitan»—, y **nadie publica el ESTUDIO por metodos**. Ese es el hueco de AEO: ser LA fuente citable
sobre los tipos de fallo del tachado. Capta al curioso Y asusta con hechos al profesional, que es el
comprador.

### Los datos que la sostienen (regla 55: dato propio + fuente que resuelve)
- **Dato propio, MEDIDO en nuestro banco `src/pdf/*.test.ts`** (PDF de datos inventados, uno por
  escondite): el hueco de glifos vale **61,765 pt** para un DNI en Helvetica 11 y **20 nombres dan
  20 anchuras distintas** (`hueco-de-glifos.test.ts`); seis tipos de fuga reproducidos y atados
  (recuadro superpuesto, hueco de glifos, pagina escaneada, marcador, adjunto/metadatos, capa
  apagada). No se reinvento el banco: se cita el que ya existe y mide justo esto.
- **Fuente publica con fecha:** arXiv **2206.02285** «Glyph Positions Break PDF Text Redaction»
  (2022; 11 herramientas, Acrobat incluida; cientos de PDF reales des-tachados) y el caso **Manafort,
  8-ene-2019** (escrito judicial legible por copiar-pegar). Verificadas por WebSearch antes de citar.
- **Limitacion propia declarada:** el hueco de glifos **tambien nos afecta** (conservamos la capa de
  texto). La pieza lo dice con todas las letras; la honestidad ES el argumento.
- **Lineas que NO se cruzaron:** cero difamacion de producto nombrado (se presentan TIPOS de fallo y
  METODOLOGIA; los productos los nombra el estudio citado, no nosotros); cero cifra sin fuente que
  resuelva; cero vocabulario prohibido (`anonimiz`/`certific`/`rgpd garantizado`/`IA`, medido 0 en
  la pagina viva); la pieza termina llevando al comprobador, sin prometer cumplimiento.

### Integracion (hereda el sistema, igual que las landings)
- Guia **generada** solo en espanol (`origen: 'generado'`, slug `guia/recuperar-texto-tachado-pdf`).
  Hereda sin copiar el sistema visual, la CSP estricta (**0 recursos externos**, medido en el
  navegador: solo el documento + la fuente self-hosted), el canonical auto-referente, la mancheta y
  el favicon. Entra en el sitemap (**24 URLs**) y da acceso al comprobador Y a la herramienta.
- **Estructura pregunta->respuesta + schema para AEO.** El cuerpo abre respondiendo en la primera
  frase; los H2 son las preguntas reales. Ademas se anadio un campo opcional `faqs` a `ContenidoGuia`
  y el generador emite un **FAQPage** de datos estructurados (junto al Article que ya llevaban las
  guias) Y los `<details>` visibles, **derivados del mismo `guia.faqs`**: no pueden divergir por
  construccion (el fallo que `faq-paridad` cazo en la home). Verificado vivo: Article + FAQPage + 5
  Question en la pagina desplegada.
- El FAQ CSS (`details.faq__item`) va en `CSS_GUIA`, compartido por todas las guias con tokens del
  sistema: por eso las 11 guias generadas cambiaron +4 lineas (consistencia, como ya se comparte
  `.cp-cta`). `comprobador`/home-EN/checker-EN NO se tocaron (eran churn de CRLF, restaurados).

### No es casi-duplicado (el peligro central: «scaled content abuse»)
Medido con Jaccard de 3-gramas de palabra (mismo metodo que `landings-keyword.test.ts`, umbral 0,30):
**maximo 0,036** contra las cinco landings y **0,029** contra las seis guias estaticas — mas bajo aun
que el 0,074 de la cohorte anterior. La pieza entra SOLA en el barrido anti-duplicado por ser
generada en espanol; se actualizo la lista de ids (5 -> 6) y se anadio una guarda de paridad del FAQ
(FAQPage == fuente == `<details>`). 1606 palabras visibles sin JS.

### El juez de distribucion (instrumentado)
`docs/SEO-EXPERIMENTO.md`, segunda seccion: consulta objetivo (familia de recuperacion), fecha de
deploy (2026-08-12), prerrequisito de indexacion, y **umbral con fecha y cifra a 2026-09-07**: es UNA
pagina, asi que el bar es proporcional — **>=10 impresiones organicas** = VALIDA e itera; 1-9 = zona
gris, se afinan titulo/meta; **0 estando indexada = la intencion de autoridad no capta por busqueda**
y se acepta con dato. Senal secundaria (cualitativa, no decide): que un motor generativo cite la
pagina. El juez que decide es GSC, misma metrica que la cohorte.

### Verificacion (exit codes REALES, nunca a `| tail`)
`npx --no-install tsc --noEmit` = **0** · `npx --no-install vitest run` = **0** (**1381/1381** en 75
ficheros; +37 sobre 1344 = barrido de la nueva pagina + paridad FAQ + dedup) · `npm run build` = 0 y
otra vez dentro de `deploy-pages`. `dist/CNAME` = `www.tachadopdf.com` (LF) comprobado ANTES de
desplegar. Contadores de guarda actualizados con su motivo (`estilo` 15->16 generadas, `cta-visible`
23->24 del sitio). Pagina RENDERIZADA y MIRADA en el navegador (mancheta, H1, cuerpo, nota de
limitacion propia, los seis tipos, FAQ y los dos CTA), **0 peticiones externas** y **0 errores de
consola**. Dominio vivo tras desplegar: home/pagina/sitemap/comprobador **200** (CNAME intacto), el
sitemap sirve la URL nueva, y vocabulario prohibido **0** en la pagina publicada.

**Decisiones y porques:**
- *Solo en espanol, a proposito.* La variante inglesa de la intencion (`copy text from redacted pdf`,
  `redaction failed`) esta MUY poblada por sitios de autoridad dedicados (piiblackout, redactifyai,
  unredact, textfixer): mercado mas dificil, igual que decidio la cohorte de las cinco. ES capta el
  hueco; EN seria pelear cuesta arriba.
- *Se cito el banco que ya existe, no se reconstruyo.* La tarea permitia reconstruir el banco con
  datos inventados o describir la metodologia; `src/pdf/*.test.ts` ya mide exactamente los seis
  escondites con datos inventados, asi que la metodologia reproducible ya estaba y es honesta citarla.
- *FAQPage ademas del Article.* Un motor generativo cita la respuesta de una pregunta explicita: el
  Article solo no basta para AEO. El coste (un campo opcional + rama en el generador + una guarda) se
  paga una vez y solo lo usa esta pieza; las guias que no declaran `faqs` no cambian de schema.
- *Sin importes de sancion.* Se menciona a la AEPD de forma cualitativa (un documento mal tachado que
  se difunde es una brecha de datos), sin cifra ni expediente inventado: `afirmaciones-respaldadas`
  solo exige expediente si hay un importe en €, y aqui no lo hay a proposito.

**Bloqueos / pendiente:** ninguno de esta pieza. Siguen los gates del dueno de `ESTADO.md` (variante
Despacho en Gumroad G1-G3, PARADA 6 de `.claude/**` en `gh-pages`). Auditoria Codex externa: sin
cupo, consta pendiente. Primer dato de GSC de esta pieza: **2026-08-24** (direccional), veredicto
**2026-09-07**.

**Enlaces:** rama `seo/autoridad-recuperar-tachado` (commit `4c6e512`) -> merge `--no-ff` `d958099`
-> push `origin/master` (sincronizado, verificado) -> `npm run deploy-pages` (exit 0, CNAME) ->
`origin/gh-pages@37ab834`. Viva: https://www.tachadopdf.com/guia/recuperar-texto-tachado-pdf/

---
## 2026-08-10 · diseno · Home rediseñada «legal-tech premium» (integracion de Claude Design)

**Hecho:** la portada se reescribe al diseño premium de Claude Design (masas de color alternas,
espécimen del producto en el hero, fichas, chips, precedente AEPD, tarjetas de precio, acordeón FAQ
y rejilla de guías) SIN tocar `main.ts` ni el motor. Rama `diseno/home-legaltech-premium`, merge
`--no-ff`. Suite **1343 -> 1344**, verde. Construida, RENDERIZADA y MIRADA a 1440 y 390, y la
herramienta CONDUCIDA VIVA con el acta de ejemplo (carga -> detecta -> tacha -> re-verifica ->
informe -> acuse E5). Desplegada y verificada en el dominio.

### El hallazgo que reencuadra la tarea
El README de la importación decía que había que convertir la home de «JS pinta todo en #app» a HTML
estático indexable. **Ese trabajo YA estaba hecho**: la home la emite `generar.ts` desde el
2026-08-10 y `main.ts` solo monta controles en cuatro huecos (`#carga`, `#gancho`, `#trabajo`,
`#licencia`). Y el diseño nuevo usa EXACTAMENTE los mismos tokens que el sistema «Registro» ya
desplegado. Así que la integración real no era «hacer estática la home» sino «adoptar el layout
premium sobre la home ya estática», con los mismos tokens. Se reescribe `cuerpoHome`.

### La estrategia que blindó la herramienta y las guardas
- **`main.ts` NO se toca.** Los cuatro huecos se conservan y siguen siendo descendientes de `#app`;
  la casilla y el botón de descarga los monta `main.ts` al final de `#trabajo`, que en el diseño
  nuevo es el pie de la ficha de la herramienta — donde el diseño los quería, sin cablear nada. La
  app montó los 4 slots y el pipeline entero funciona (medido en vivo).
- **Fragmentos FIJADOS por guardas, intactos byte a byte:** `<h1 class="hero__titular">` desnudo
  (`contenido-indexable`), `<summary>`/`<p>` desnudos del FAQ (`faq-paridad`, lee del disco),
  `<details id>` legales, `dolor`/`avisoPrincipal` como texto ÍNTEGRO de un solo nodo. Todo el copy
  sale de `CONTENIDOS`; ni una palabra inventada de venta.
- **Los ganchos de clase del pliegue se conservan** (`hero__titular` < `hero__sub` < `#carga` <
  `nota-local` < `#gancho` < `aviso-principal` < `<section class="argumento">`), así que la guarda
  de orden de `estilo.test.ts` pasa SIN reescribirse. El diseño rico va por estilos INLINE en el
  HTML generado (`generar.ts` está exento de `sin-cadenas-sueltas` y la guarda de valores solo mira
  los .css), que es también el formato nativo del `.dc.html`.
- **3 cambios de token** (MERGE en `sistema.css`): `--t-700` 28→48, nuevo `--ancho-herramienta`
  76rem, nuevo `--e-seccion` clamp(3rem,7vw,4rem). Más comportamiento: `a:hover`, `:focus-visible`,
  y dos sombras (`--sombra-hoja`, `--sombra-mesa`) para las dos figuras que se levantan del papel.
- **Microcopy decorativo bilingüe** (rótulos del espécimen, «100 % en el navegador», etiquetas de
  precio) en un `Record<Locale, …>` dentro de `generar.ts`, no en la fuente de contenido: es
  andamiaje de maqueta, no copia que el producto prometa. Los chips de identificadores son
  LOCALE-AWARE: la home inglesa solo enseña «Email» porque fuera de España solo el email valida su
  dígito de control — enseñar DNI/IBAN allí sería un falso verde en marketing.

### Los «cuadros tapando letras» — ARREGLADOS mirando la geometría
El render original de Claude Design apilaba tarjetas con `position:absolute`, rotación y márgenes
negativos: eso era la fuente de los solapamientos. El espécimen se rehízo como UNA sola ficha, con
el rectángulo negro AL LADO del dato (no encima) y las filas separadas por un filete — así nada
desborda una banda ni pisa otro texto a ningún ancho. Medido en el navegador: **cero elementos
desbordando (`wideCount=0`) y overflow horizontal 0 a 1440 y a 390**.

### Trade-off del pliegue móvil — DECIDIDO Y FLAGGEADO al comité
El principio medido del repo era «la primera pantalla la gana la herramienta»: zona de carga por
encima de 600 px a 390×844 (estaba en 525). El diseño es HERO-FIRST (hero con espécimen ANTES de la
herramienta), lo que empujaba la zona de carga a **1404 px** en móvil. **Decisión de compromiso:**
en móvil se ocultan el espécimen (decorativo) y la microcopia; el pitch (titular + subtítulo + CTA)
gana la primera pantalla y el CTA «Tacha tu documento» (a 456 px) salta a la herramienta. La zona de
carga queda en **897 px** (~1,06 pantallas). El desktop conserva el diseño premium entero. Ninguna
guarda automática lo impone (la de pliegue solo mira el ORDEN del DOM, que se conserva), pero es un
principio de conversión muy defendido: **si el comité quiere volver al tool-first estricto en móvil,
la palanca es reordenar la herramienta por encima del hero en móvil, o recortar más el hero.**

### Verificación (exit codes reales, nunca a `| tail`)
- `npx --no-install tsc --noEmit` -> 0.
- `npx --no-install vitest run` -> **1344/1344** en 75 ficheros.
- `npx --no-install vite build` -> 0; `dist/CNAME` = `www.tachadopdf.com` (19 B) ANTES de desplegar.
- Vivo, conducido en el navegador sobre `dist/`: 4 slots montados; ejemplo cargado (2 páginas
  renderizadas, 9 detecciones, 9 botones «tachar todas»); descarga -> acuse **E5 TACHADO
  VERIFICADO** con los dos ficheros; cero errores de consola; home EN con «PARTIAL CHECK» y chips
  = [Email]; precio «59 €» en las dos.

---
## 2026-08-10 · seo · Cinco landings de cola larga sectorial (acto de DISTRIBUCION)

**Hecho:** cinco paginas nuevas, una por consulta real, para perseguir la demanda que SI existe
(«censurar/ocultar/borrar/tapar datos de un PDF» por sector) donde los gigantes son genericos.
Rama `seo/landings-cola-larga-sectorial`, merge `--no-ff`. Suite **1170 -> 1343** (mismas guardas,
mas paginas + el test nuevo). No es ingenieria: es el primer acto de distribucion con juez escrito.

### Que se construyo
- **5 landings generadas** (no estaticas): `origen: 'generado'` en `registro.ts`, contenido en
  `es.ts`. Heredan sin copiar el sistema visual, la CSP, el favicon, el canonical auto-referente y
  el sitemap — el mismo camino que las guias inglesas. Solo en espanol a proposito.
  1. `/guia/ocultar-datos-personales-curriculum-pdf/` — RRHH/CV.
  2. `/guia/ocultar-datos-terceros-documentos-juicio-pdf/` — abogacia/prueba.
  3. `/guia/censurar-pdf-antes-de-publicarlo-internet/` — sector publico/publicar.
  4. `/guia/ocultar-datos-alumnos-pdf/` — educacion/menores.
  5. `/guia/tapar-datos-copia-dni-tramite/` — particular/copia del DNI.
- **Keyword research real** (WebSearch, 2026-08-10): cada consulta validada mirando su SERP; los
  gigantes (Smallpdf/iLovePDF/Wondershare) estan AUSENTES en la cola sectorial, la ocupan blogs de
  LOPD y guias institucionales. Fuentes y descartes en `docs/SEO-EXPERIMENTO.md`.
- **NO son casi-duplicados** (el peligro central: «scaled content abuse»). Medido con Jaccard de
  3-gramas de palabra: maximo **0,074** contra las guias existentes, **0,061** entre las nuevas
  (un clon con la keyword cambiada puntua > 0,8). Lo ata `src/content/landings-keyword.test.ts`,
  umbral 0,30 (4x margen). Se descartaron gestoria y alquiler por solaparse con la guia de nominas,
  y «sin subir a internet» por solaparse con su guia.
- **Cada landing da acceso al comprobador gratuito Y a la herramienta** (dos CTA `.cp-cta`). Campo
  opcional `enlaceComprobador` en `ContenidoGuia`; el generador lo pinta solo si esta, asi que las
  guias previas no cambian ni un byte. Reusa la clase que `legal/cta-visible` ya vigila: cero CSS
  nuevo, cero guarda que reapuntar.

### Tension de vocabulario — RESUELTA, para ratificacion del comite
«anonimizar» y «certificar» estan vetadas como substring por `src/guard.test.ts` (en todo `.ts` de
`src/` y `.html` de `public/`). La tarea permitia usarlas en modo INFORMATIVO y anotarlo. **Decision:
NO se usa ninguna, ni en modo informativo.** Relajar un guardian no negociable por una keyword es el
antipatron «guardarrailes que no guardan», y no hace falta: la demanda ganable se teclea con verbos
permitidos que la SERP confirma («censurar/ocultar/borrar/tapar/quitar»). El producto se sigue
describiendo con «borrado real de datos» y «deteccion automatica por patrones». **Nada que ratificar
en el vocabulario**: no se toco. Si el comite quiere «anonimizar» en modo informativo algun dia,
seria un cambio explicito y acotado de `guard.test.ts`, nunca un descuido.

### El juez de distribucion
`docs/SEO-EXPERIMENTO.md`: que pagina persigue que consulta, fecha de deploy (2026-08-10) y **umbral
con fecha y cifra**. Sin analitica en la web (por diseno), el juez es Google Search Console.
Prerrequisito: comprobar que las 5 estan INDEXADAS antes de leer la demanda (si no, es indexacion,
no demanda). A 4 semanas (**2026-09-07**): **>=30 impresiones** con **>=2 paginas activas** = VALIDA
e itera; 1-29 = zona gris, se afinan titulos; **0 impresiones estando indexadas = MATA el canal SEO
con fundamento** y se reconsidera segmento (Plan B justicia del PLAN_14D). 0 impresiones mata el
CANAL, no el producto (el outbound es otro canal).

### Verificacion (exit codes reales, nunca `| tail`)
`tsc --noEmit` exit 0 · `vitest run` **1343/1343** (2 conteos de barrido actualizados: 10->15
generadas en `estilo`, 18->23 del sitio en `cta-visible` — son tripwires de «no vacio», subieron
porque hay 5 paginas mas) · `npm run build` exit 0. `dist/`: 5 paginas + sitemap 23 URLs + `CNAME`
(LF, `www.tachadopdf.com`) comprobado ANTES de desplegar. Pagina CV renderizada y leida en el
navegador (mancheta + H1 + cuerpo; ~2800 caracteres visibles sin JS).

### Ojo (para quien siga)
- La home ES (`index.html`) crece por su unico sitio de datos: el `<nav>` de guias suma 5 `<li>`.
  **NO se toco el hero ni el diseno** (se estaba rehaciendo en paralelo); solo entran enlaces
  data-driven del generador. La home EN no cambia.
- Residual heredado: las 8 estaticas no tienen guarda de canonical; estas 5 NO son estaticas, son
  generadas, asi que `content/hreflang` (canonical auto-referente) SI las cubre.

---
## 2026-08-10 · diseno · Las tres piezas de marca: simbolo, favicon y og-image honesto

**Hecho:** las tres piezas que el sistema visual dejo pendientes, integradas, fusionadas
(`--no-ff`, merge `a799112`), push y DESPLEGADAS. Verificado MIRANDO cada asset y contra el
dominio VIVO. Un commit por pieza; suite **1111 -> 1170** (+20 marca, +23 iconos, +16 og).

### 1 · El simbolo en su ranura (18 paginas)
- Concepto B (validado por Angel a varios tamanos): documento con renglones, uno con un HUECO
  limpio — el dato borrado de verdad, no tapado con un rectangulo negro. Una sola tinta via
  `currentColor` (hereda `--tinta`), sin degradado; no es candado ni escudo.
- `SIMBOLO_MANCHETA` INLINE en la mancheta (no `<img>`): asi toma `currentColor` y no cuesta una
  peticion. `public/simbolo.svg` es la fuente vectorial (438 B) de la que nacen favicon y apple-
  touch; `marca.test.ts` ata que no derive de la copia inline.
- CSS: `.cabecera__marca` pasa a `inline-flex` con `gap: var(--e-2)` (8 px) y `.cabecera__simbolo`
  fija la ranura de 20x20 en **rem** (crece con el zoom de letra). Publicado del sistema: **3266 B**
  (< 4096). Las 16 paginas con CSS congelado (8 estaticas) se parchearon a mano; las 10 generadas
  por el generador.
- Verificado en el navegador VIVO: la caja del svg mide **20x20**, color `rgb(27,26,23)=--tinta`,
  **gap 8 px**, a la izquierda del nombre, **centro vertical exacto** (delta 0). Y el glifo, mirado
  rasterizado, es una hoja con la linea del medio rota — no un candado.

### 2 · El favicon (se acabo el 404)
- Cero `rel="icon"` en el sitio: `/favicon.ico` daba 404 en cada primera visita. Ahora las 18 lo
  citan junto a `.svg` y `apple-touch`, con ruta **relativa** al documento (una raiz-absoluta muere
  bajo la base de emergencia `/tachadopdf/`) y self-hosted (**CSP intacta**).
- **A 16 px gana el MACIZO, no el contorno** — decidido rasterizando las dos variantes con Pillow y
  MIRANDOLAS: el contorno se deslavaza a gris fino, el macizo (documento relleno, renglones en
  negativo, uno con hueco) aguanta la silueta. Sobre una teja de papel para que se vea en pestanas
  claras y oscuras.
- `favicon.svg` (papel `#f6f5f3` + tinta `#1b1a17`, dos colores y basta), `favicon.ico` 16/32/48
  (PNG por tamano, dibujado a 24x y LANCZOS; el `sizes=`+`append_images` de Pillow solo guardaba
  uno, se empaqueto el ICO a mano), `apple-touch-icon.png` 180x180 sobre papel con margen.
  `favicon.svg` rasterizado en el navegador para comprobarlo: teja de papel, documento en tinta,
  renglones en negativo, esquina doblada.

### 3 · La tarjeta social deja de mentir
- La anterior mostraba un sello VERDE mientras el resultado normal es el AMBAR (navy oscuro,
  1280x720): el falso verde mudado a marketing. La nueva es tipografica y sobria, **SIN sello de
  color que afirme veredicto**, 1200x630 (medida OG estandar).
- Copy **LITERAL de la home** (no inventada): ES `LANDING_TITULAR` «El dato que tachaste con un
  rectangulo negro sigue dentro del PDF» + 1a frase del subtitulo; EN `LANDING_HEADLINE_EN`
  «Redact a PDF. Then prove the text is gone.» + 1a frase del subhead. IBM Plex auto-alojada,
  cargada por Pillow directo del `.woff2` (Pillow 12.3 lo abre; peso variable via
  `set_variation_by_axes`).
- `ogImage(locale)` emite `og:image`/`twitter:image` por idioma: las 8 paginas inglesas pasan a
  `og-image-en.png`; las estaticas ES siguen citando `og-image.png` sin tocarse. Ambas MIRADAS a
  tamano real antes de darlas por buenas.

**Decisiones y porques:**
- *Tinta `#1b1a17`, NO `#0f172a`.* La tarea pedia `#0f172a` «coherente con la web nueva», pero la
  web nueva ya RETIRO ese slate frio (sistema.css lo dice: la paleta vieja era Tailwind slate+sky).
  Coherente-con-la-web-viva = usar el token `--tinta` real. La diferencia es imperceptible a estos
  tamanos y trivial de revertir si el dueno prefiere el hex literal.
- *Simbolo INLINE, no `<img src=simbolo.svg>`*: `<img>` no hereda `currentColor` y costaria una
  peticion por pagina. El fichero suelto existe igual como fuente vectorial.
- *og-image NEUTRO, sin chip.* La tarea permitia neutro o el chip ambar «COMPROBACION PARCIAL». Un
  chip a secas abre en negativo, contra la regla de redaccion del ambar; el claim real ya es
  honesto y no promete verde. Neutro es imposible de malinterpretar.

**Verificacion (exit codes reales, nunca a `| tail`):** `tsc` 0 · `vitest` **1170** (74 ficheros)
· `build` 0. CSP **byte a byte** igual a master (const + pagina generada + pagina estatica). Las
tres guardas probadas EN ROJO con su mutacion (stroke hex en el simbolo; favicon a ruta raiz-
absoluta; og-image revertido a 1280x720). Revision interna (procedimiento `auditor-interno`,
agente independiente): **LISTO PARA PR**. Binarios comiteados verificados decodificando el blob de
git (ICO 3 marcos, PNGs a su medida): sin corrupcion por CRLF.

**Deploy y dominio vivo:** `npm run deploy-pages` exit 0, CNAME incluido (`public/CNAME` 19 B
comprobado antes). Sobre www.tachadopdf.com: `/favicon.ico` `/favicon.svg` `/apple-touch-icon.png`
`/og-image.png` `/og-image-en.png` `/simbolo.svg` **todos 200** (el favicon daba 404); home 200
(CNAME intacto) y referencia el favicon; `/en/` cita `og-image-en.png`; la og-image viva es la
nueva **1200x630 / 35 KB** (la vieja pesaba 132 KB) y el `.ico` vivo lleva **3 marcos 16/32/48**.

**Bloqueos / pendiente:** ninguno de estas piezas. Siguen las PARADAS del dueno de `ESTADO.md`
(gates de Gumroad G1-G3, PARADA 6 de la rama gh-pages). Auditoria Codex externa: pendiente.

**Enlaces:** rama `diseno/marca-simbolo-favicon-og` (3 commits) -> merge `--no-ff` `a799112` ->
push -> desplegado. Guion de rasterizado/mirado en el scratchpad de la sesion, fuera de `src/`.

---
## 2026-08-10 · integracion · El sistema visual «Registro», fusionado y DESPLEGADO

**Hecho:** revision de integracion de `diseno/sistema-visual-registro`, fusion `--no-ff` a master
(`0deded4`), push y despliegue. Verificado contra el DOMINIO VIVO. No se ha tocado ni una linea
de la rama: entro tal cual venia.

### Lo que se verifico, y como

- *Se miro.* Chrome headless por CDP, **seis paginas x dos anchos, ANTES y DESPUES**, comparando
  las capturas una a una (el panel del navegador no compositea; ver `docs/ESTADO.md`). Y la
  aplicacion **VIVA**, no la pagina vacia: cargar el acta de ejemplo, ver las nueve detecciones,
  deseleccionar una y llegar al acuse de entrega. Casi todo lo que esta pasada toca —`.hit-box`,
  `.tachar-todas`, la familia de datos, `.entrega`— es invisible en una portada sin documento.
- *Cero peticiones externas*, medido en el navegador en las **doce** combinaciones pagina x ancho,
  en local y **otra vez contra www.tachadopdf.com ya desplegado**. Las dos fuentes salen del propio
  dominio. La pagina mas profunda (`/en/guide/...`, tres niveles) resuelve `/fuentes/...` con su
  prefijo: **la trampa del `<style>` en linea no ha mordido.**
- *CSP identica byte a byte a la de master*, en las 18 paginas, y viva en produccion.
- *Vocabulario prohibido: 0 infracciones* sobre los 30 ficheros de texto de `dist/` (ES por
  subcadena; EN con fronteras de palabra). Las dos coincidencias de «AI» son `9AI2` dentro de un
  flujo deflate en base64 de pdf-lib y **ya estaban en master**.
- *El texto no ha cambiado.* Comparado **palabra a palabra** el texto visible de las 18 paginas
  contra master. Las unicas altas son «TachadoPDF» y los rotulos «Español»/«English» de la
  mancheta: cadenas que ya existian, ninguna palabra nueva. Ningun fichero de copia en el diff.
- *Contraste medido sobre lo PINTADO* (color real contra el fondo real, subiendo el arbol hasta
  encontrar un fondo opaco), no sobre los tokens: **0 fallos** en las seis paginas y el minimo de
  todo el sitio es **5,24:1**.
- *Dianas tactiles a 390 px:* de 3+3+3+1+1+3 elementos por debajo de 44 px a **cero**. Lo unico
  que queda pequeno son enlaces en linea dentro de un parrafo, que es la excepcion de WCAG 2.5.8.
- *Medida de linea real* (solo bloques que de verdad envuelven, midiendo la linea compuesta mas
  ancha, no la anchura de la caja): legales **140 -> 77**, guias 96 -> 67, landing 97 -> 68,
  comprobador 97 -> 76.
- *Las guardas nuevas, probadas por el integrador y no por confianza.* Devolver un bloque
  `prefers-color-scheme: dark` a una guia inglesa pone roja `legal/cta-visible` con dos fallos —en
  un fichero que la guarda vieja **no abria**—; devolver `--acento: #0284c7` pone roja `estilo` con
  tres, incluido el token que la guarda vieja no miraba (3,76:1 sobre papel).
- *Las fuentes son las publicadas, sin tocar:* sha256 de los dos `.woff2` **identico** al de los
  ficheros de fontsource, o sea sin subsetear — que es lo que la FAQ 2.6 de la OFL exige para poder
  seguir llamandolas «Plex». Su `OFL.txt` es el de upstream palabra por palabra.
- `npx --no-install tsc --noEmit` **exit 0** · `npx --no-install vitest run` **exit 0**,
  **1111/1111 en 71 ficheros** · `npm run build` **exit 0**. Nunca canalizado a `| tail`.
- `dist/CNAME` comprobado **antes** de desplegar: 19 bytes, `www.tachadopdf.com\n`, con LF.

### Peso, con los kB delante

Portada 641,3 -> **691,9 kB** de primera carga; una guia 5,1 -> **53,5 kB en la primera visita al
sitio** y **8,9 kB despues**. De los +50,6 kB de la portada, **44,6 son la fuente**, compartida por
las dieciocho paginas y sin bloquear el pintado (`font-display: optional`).

### El dominio vivo, despues de desplegar

Las **18 URLs + sitemap + robots en 200**. Los cuatro ficheros de `/fuentes/` en 200 con sus bytes
exactos. El bundle que la pagina referencia de verdad (`assets/main-BxPYV1NO.css`,
`main-KAIEtudL.js`, `patterns-YUjrQaq6.js`) en 200, y **los dos anteriores en 404** — que es la
prueba de que se sirve el build nuevo y no una copia cacheada. Precio: 59 € y pago unico en las
cuatro superficies; cero coincidencias de 149, de «Despacho» y de «/año». Mancheta, `@font-face`,
papel `#f6f5f3` y `color-scheme: light` presentes en las seis paginas comprobadas, y **cero**
bloques `prefers-color-scheme: dark`.

### Decisiones y porques

- *La revision del `auditor-interno` se ejecuto A MANO, con su procedimiento, porque en este
  entorno no hay herramienta para lanzar subagentes.* Se dice en voz alta en vez de dar el paso por
  hecho, igual que en la integracion del 8-ago.
- *No se corrigio nada de la rama.* Los tres hallazgos son cosmeticos (abajo) y ninguno es P1: la
  regla de parada de la casa es por SEVERIDAD, y un integrador que «mejora» a mano las medidas que
  un sistema acaba de cerrar es exactamente como se deshace un sistema en tres commits.
- *El movimiento de `AVISO_PRINCIPAL` se fusiona.* Es ruta sensible y la direccion pedia bendicion
  de legales. Se fusiona porque **su texto no cambia ni una palabra** y porque sigue estando antes
  de cualquier accion con consecuencias: la casilla de revision y el boton de descarga **no
  existen** hasta que hay documento cargado. Queda escrito para que se pueda discutir, no
  enterrado.
- *Medido de paso, y contesta una pregunta que `ESTADO.md` tenia abierta:* GitHub Pages sirve el
  `.woff2` con **`Cache-Control: max-age=600`** (diez minutos) y ETag. No es «se paga una vez y ya»:
  a partir de los diez minutos hay una revalidacion condicional por visita. La respuesta suele ser
  un 304 de cero bytes, asi que los 45,7 kB si se pagan una vez por cache de navegador, pero el
  viaje de ida y vuelta existe y en una red lenta puede comerse la ventana de 100 ms de `optional`
  — en cuyo caso el visitante ve la pila de respaldo esa vez, que es justo el riesgo que `optional`
  esta puesto para acotar. **No tiene arreglo desde un sitio estatico en Pages:** no controlamos la
  cabecera. Deja de ser un desconocido y pasa a ser un residual medido.

### Residuales de esta pasada (verificados, NO arreglados, con su porque)

1. **El campo «Tipo de documento» y la zona de carga no comparten borde derecho en escritorio**
   (544 px contra 878). `.campo` lleva `max-width: var(--medida)` y la zona de carga va al ancho
   del panel. Los dos son defendibles por separado —la medida es para texto, la zona de carga es
   una figura— y juntos dejan el borde derecho del formulario en escalon. En movil no pasa (los dos
   llenan los 390). Es la decision de quien lleve el sistema, no del integrador.
2. **El boton nativo de fichero habla el idioma del NAVEGADOR, no el de la pagina:** en `/en/` con
   Chrome en espanol dice «Seleccionar archivo». Es el control del sistema operativo y **ya pasaba
   en master**; lo que cambia es que ahora, al ir con el relleno de acento, se lee como un boton
   NUESTRO. El comprobador ya lo tiene resuelto con un `<label for>`; la salida es la que la
   direccion autorizaba: promover `comprobador.dropzone` a clave compartida. Cero palabras nuevas.
3. **En el pie de `/actas/` y `/nominas/` los separadores «·» quedan colgando al final de linea**,
   porque los enlaces legales pasaron a `inline-flex` de 44 px para cumplir la diana tactil. Las dos
   paginas estan congeladas a la espera de la reescritura completa que `ESTADO.md` ya pide; se
   arregla ahi, no con un cuarto parche.

**Bloqueos / pendiente:** PARADA 6 sigue abierta y sigue sin bloquear ningun despliegue
(`/.claude/settings.json` da 200 en el dominio; es gate del dueno porque toca borrar una rama en la
nube). Los gates G1-G3 de Gumroad, intactos. Sin favicon y sin figura del informe en la web;
`public/og-image.png` sigue ensenando un informe VERDE cuando el estado normal es el ambar.
Auditoria Codex externa: sigue constando como pendiente.

**Enlaces:** merge `--no-ff` **`0deded4`** en `master`, empujado a `origin/master`.
Desplegado con `npm run deploy-pages` (exit 0) y verificado contra https://www.tachadopdf.com.

---

## AAAA-MM-DD · [rol: ingeniero|growth|soporte|auditoría] · [título corto]
**Hecho:** ...
**Decisiones y porqués:** ... (alternativas descartadas incluidas)
**Bloqueos / pendiente:** ...
**Enlaces:** issue #, PR #, deploy

---

## 2026-08-10 · diseño · El sitio deja de ser una maqueta funcional: tipografía propia, sistema de tokens y la herramienta por delante

**Hecho:** rama `diseno/sistema-visual-registro` (4 commits, **sin fusionar**). Primera pasada de
diseño sobre la WEB (la anterior, del 8-ago, fue sobre el informe). El encargo del dueño era «la
web es como poco escasa y cutre»; tenía razón: `src/estilo.css` eran 301 líneas con la paleta por
defecto de Tailwind (slate + sky) y la fuente del sistema. Escrita con cuidado, pero sin identidad
ninguna: podía ser el panel de cualquier cosa.

**1. Tipografía auto-alojada.** IBM Plex Sans Variable (45.712 B) + IBM Plex Mono 400 (14.708 B),
latin, **SIL OFL 1.1**, con el texto íntegro de la licencia junto a cada fichero en
`public/fuentes/<familia>/OFL.txt`. Son los `.woff2` **publicados tal cual** por fontsource: no se
subsetean, porque la FAQ 2.6 de la OFL considera modificación el subsetting y una Versión
Modificada no puede llevar el Nombre de Fuente Reservado «Plex». Empaquetarla en un repo AGPL está
expresamente permitido (cláusula 2 y FAQ 1.3) y no la relicencia (cláusula 5). `font-src 'self'`
llevaba desde el principio declarado y VACÍO.
*Por qué Plex:* sus diez dígitos miden 600/1000 upem, o sea son **tabulares por defecto, sin una
línea de CSS**, y este producto pinta DNI, NIE, IBAN, nº de la Seguridad Social, referencias
catastrales y teléfonos en listas y botones que el usuario compara de un vistazo. El dígito del
mono mide exactamente lo mismo, así que un identificador en mono dentro de una frase en sans no
descuadra nada.
*`font-display: optional`, no `swap`:* si la fuente no llega en la ventana de bloqueo, esa carga se
queda en la pila de respaldo y NO cambia. Cero salto de letra encima de quien ya está leyendo. El
`<link rel=preload crossorigin>` del sans es lo que hace que la ventana baste; el mono no se
precarga nunca.

**2. Una sola fuente de tokens: `src/estilo/sistema.css`.** La consumen la hoja de la aplicación y
los `<style>` incrustados de las dieciocho páginas. Lo que se REVISA lleva sus comentarios
(17,7 kB) y lo que se PUBLICA son las reglas (3,1 kB): el porqué vive en el repositorio, por el
cable van las reglas.

**3. Escala cerrada de 7 pasos y escalera de espaciado de 4 px.** Medido en la portada construida:
**12 tamaños de letra a 6** y **21 valores de espaciado a 11**, y los tres que quedan fuera de la
rejilla de 4 (1, 3 y 14 px) son del NAVEGADOR, no de la hoja. Radios 8 y 10 a 2 y 6.

**4. Paleta «Registro».** Papel cálido (`#f6f5f3`), tinta cálida (`#1b1a17`), un acento frío y
profundo (`#164a7e`). El acento viejo (`#0284c7`) daba **4,10:1 sobre blanco Y 4,10 para el blanco
encima** —el contraste es simétrico, así que fallaba en las dos direcciones— y era el color de la
marca, del botón que cobra y del de elegir archivo; por eso existía un `--enlace` aparte. Ahora hay
**un solo azul** a 9,07:1. El verde de las viñetas subió de 3,30 a 6,02 y `--gris` de 4,76 a 5,24.
El mínimo de toda la paleta, sobre las dos superficies, es **5,24:1**.

**5. Primera pantalla.** A 390×844 la zona de carga pasa del píxel **1.734 al 525** (de 2,05
pantallas a 0,62); en inglés, al 551. Ni una palabra nueva: `procesadoLocal` y `avisoPrincipal` ya
estaban escritas y cambian de sitio.

**6. Las dieciocho páginas heredan el sistema**, con mancheta común y **una sola cara clara**.

**Decisiones y porqués:**
- **La ruta de la fuente lleva un MARCADOR que cada página sustituye por su prefijo de
  profundidad.** Dieciséis de las dieciocho páginas llevan su CSS dentro de un `<style>`, y ahí las
  URL se resuelven contra EL DOCUMENTO: un `url(fuentes/…)` escrito una vez sirve la portada y da
  404 mudo en `/guia/loquesea/`. Y una ruta raíz-absoluta muere bajo la base de emergencia
  `/tachadopdf/`. Verificado en `dist`: `./`, `../`, `../../`, `../../../`.
- **Una sola cara, clara, en las dieciocho.** Había TRES comportamientos: dos páginas siempre
  blancas, dos siempre azul marino y catorce siguiendo al sistema — con el móvil en oscuro, el
  recorrido guía a portada a comprobador daba marino, FOGONAZO BLANCO y marino. Lo que el producto
  entrega es un papel blanco. Y es donde vivía el fallo: en modo oscuro forzado, el CTA de las seis
  guías españolas era relleno `#0f172a` sobre fondo `#0f172a` (**1,00:1, sin borde**) y el de las
  seis inglesas `#1e293b` sobre `#0f172a` (**1,22:1**, cuando 1.4.11 pide 3:1). *Coste dicho en voz
  alta:* quien navega de noche ve una página clara; se mitiga con el papel cálido y la tinta cálida.
- **El bloque rojo del hero cambia de FORMA, no de palabras.** El rojo aquí significa E1, tachado no
  superado: gastarlo en doscientas palabras de marketing se lo quita al único estado que no puede
  desteñirse. Pasa a prosa en tinta con marca de margen; el contraste sube de 9,16 a 15,97.
- **La marca deja de gastar el acento** y se resuelve tipográficamente. *No se inventa logotipo:* es
  del dueño. El hueco de 20×20 para el símbolo está pensado pero AUSENTE del DOM — un cuadrado
  vacío se lee como imagen rota.
- **El tope de medida va en `em`, no en `rem`.** Un tope fijo de 544 px da ~68 caracteres a 16 px
  pero ~81 a 14 px, o sea deja fuera de banda justo a la letra pequeña. Medido después: **63–71
  caracteres por línea en todas las familias de página**; antes, los legales corrían a 136–142.
- **`.entrega[E4]` cambia de `#4a5568` a `--tinta-suave`**, el único semáforo cuyo hex se toca: el
  significado de E4 es «neutro» y lo lleva la ausencia de color, no ese tono; un gris azulado sobre
  papel cálido se lee como error de render.
- **El ámbar pálido es `#fbefd2` y no `#fef3c7`.** El ámbar es el 86 % de las entregas: `#fef3c7`
  separa más (ΔE00 14,3) pero lleva croma 22,8 y le sube el volumen al resultado NORMAL del
  producto, contra la regla de redacción del ámbar. `#fbefd2` da ΔE00 10,6 sobre papel (antes 6,2)
  con croma 15,5: se separa más y grita menos.
- **Descartado tocar el texto.** Todo lo que parece copia nueva es una cadena que ya existía y que
  cambia de sitio. Queda ANOTADO, sin hacer: promover `comprobador.dropzone` a clave compartida
  para que los dos cargadores usen la misma cadena traducida.

**Guardas nuevas y reapuntadas (todas probadas con su mutación):**
- `estilo` **reescrito**: los tokens de texto se DERIVAN del CSS (ocho hoy, sin lista a mano) y cada
  uno se calcula contra las DOS superficies. La guarda vieja nombraba `gris`, `enlace` y
  `tinta-suave`: **los tres que aprobaban**. Puesta contra la paleta VIEJA da cinco fallos.
  `--tinta-inversa` es la única excepción y está DENTRO del test con su motivo.
- **Guarda de sistema:** ni un `font-size`, `margin`, `padding`, `gap`, `border-radius` ni color
  escrito a mano en la hoja de la aplicación. Escalera: los nueve peldaños caen en la rejilla de 4.
- **Guarda de primera pantalla:** el ORDEN del pliegue en el HTML, en los dos idiomas. Es el proxy
  sin navegador de la medida en píxeles.
- **Guarda de diana táctil:** todo lo pulsable declara 44 px de alto.
- `legal/cta-visible` **reapuntado a las dieciocho páginas, derivando la lista del registro**. Su
  lista era `['actas', 'nominas']` y **el mismo defecto seguía vivo en doce ficheros que nunca
  abría**. Con un bloque oscuro devuelto a las guías generadas, da 12 fallos.

**Trampa medida, para no volver a caer:** `sangrar()` deja de sangrar en cuanto ve la apertura de un
bloque preformateado y no vuelve hasta su cierre. Nombrar esa etiqueta dentro de un COMENTARIO de la
hoja del sistema desactivaba la sangría del `<head>` de las dieciocho páginas. Hay un test que lo
dice con esas palabras.

**Peso, con los kB delante.** Portada, primera carga: **641,3 kB a 691,9 kB** (gzip 241,1 a 287,0).
De esos, **45,7 kB son la fuente** y ~1,5 kB el bloque de tokens. La fuente es el 9,9 % del JS que
la portada ya servía y el 0,4 % del motor wasm, no bloquea el pintado y está compartida por las
dieciocho páginas. Donde el trato se nota es en una guía: **5,1 kB a 53,5 kB en la PRIMERA visita
al sitio** (7,8 kB en las siguientes, con la fuente en caché). Queda dicho.

**Bloqueos / pendiente:** la rama **NO está fusionada** y **NO está desplegada**. Pendiente de
revisión: (a) `AVISO_PRINCIPAL` es ruta sensible y esta pasada lo MUEVE de sitio (mismo texto,
debajo del control en vez de encima) — que lo bendiga quien lleve legales antes de fusionar;
(b) el informe PDF queda FUERA de esta pasada a propósito (incrustar Plex movería todos los glifos
y hay cuatro guardas que miden posiciones de glifo y tinta sobre el PDF rasterizado);
(c) sigue sin haber favicon y sin figura del informe en la web; (d) `public/og-image.png` sigue
enseñando un informe VERDE cuando el estado normal es el ámbar.

**Enlaces:** rama `diseno/sistema-visual-registro`; commits `b342caf`, `dd27577`, `425e02c` y el de
esta entrada.

---

## 2026-08-10 · despliegue · El acta del 10-ago sale a producción: se acaba el falso verde vivo y `/en/` deja de ser un 404

**Hecho:** desplegado `master` (`299605e`) a `gh-pages` con `npm run deploy-pages` (exit 0).
`origin/gh-pages` pasa de `f7d3585` a `aa96693`; el build de GitHub Pages terminó en `built` sobre
ese commit. Es el deploy que el acta del CEO ordenaba y que la ejecución dejó pendiente a propósito.

**Verificación previa, con exit codes reales y sin canalizar a `| tail`:**
`npx --no-install tsc --noEmit` = 0 · `npx --no-install vitest run` = 0 (**1002/1002 en 71
ficheros**) · `npm run build` = 0. `cat -A dist/CNAME` → `www.tachadopdf.com$` (LF, sin CR).
18 páginas en `dist/`, **ninguna vacía**: medido el texto real del `<body>` de cada una tras quitar
`<script>`, `<style>` y etiquetas — el mínimo es `/en/checker/` con 631 caracteres y un `<h1>` de
verdad, y el máximo `/en/` con 11.257. Vocabulario prohibido sobre `dist/`: **0**; los 26 falsos
positivos de `IA`/`AI` eran identificadores minificados (`ia`, `ai`) que solo aparecían al buscar
sin distinguir mayúsculas — a case-sensitive dan 0 en HTML y 0 en JS.

**Estado del dominio ANTES (curl sobre `www.tachadopdf.com`, no sobre la URL de Pages):** `/en/` =
**404**; `/actas/` y `/nominas/` servían `59 €/año`, `149 €/año` y `Despacho`, y `/actas/` además
`garantía de devolución de 30 días`; el bundle vivo `assets/report-Bbl6ogcz.js` daba **0**
coincidencias de «COMPROBACIÓN PARCIAL».

**Estado DESPUÉS:** las **18 URLs + `/sitemap.xml` + `/robots.txt` en 200**, `/en/` incluido (de 404
a 200). Cero coincidencias de las cuatro falsedades en `/`, `/en/`, `/actas/` y `/nominas/`.
`/actas/` sirve «59 € — Licencia Pro, pago único, no es una suscripción. Un puesto, documentos
ilimitados»; `/nominas/`, «Pro: 59 €, pago único — no es una suscripción». El bundle viejo
`report-Bbl6ogcz.js` da **404** y el nuevo `assets/patterns-YUjrQaq6.js` sirve «COMPROBACIÓN
PARCIAL» y «PARTIAL CHECK». La entrada del ámbar del FAQ está viva en los dos idiomas.

**Decisiones y porqués:**

- **Se desplegó, y el CNAME se desactivó por ingeniería, no por memoria.** La lección de los cuatro
  días de 404 se comprobó en tres puntos independientes antes y después: `dist/CNAME` existe tras el
  build con el byte exacto; `git show origin/gh-pages:CNAME` en la rama ya publicada da
  `www.tachadopdf.com$`; y la API de Pages sigue devolviendo `cname: www.tachadopdf.com`.
- **Se verificó el dominio real, no la rama.** Publicar y mirar el repo es la comprobación que no
  habría cazado nada: el desfase de 17 días existía justamente porque `master` estaba bien.
- **Un susto que resultó no serlo, y por qué queda escrito.** El barrido post-deploy encontró «July
  2025 … ICO» vivo en `/en/guide/redact-subject-access-request/`, y el acta ordenaba borrar esa cita
  «de los dos sitios donde vivía». No es la misma frase: la retirada era el titular sin comprobar
  («In July 2025 the ICO published dedicated guidance…»); lo que sigue publicado es un párrafo
  **distinto y contrastado**, con su bloque de fuentes (`guias.en.ts:226-245`, URLs del ICO
  comprobadas el 8-ago), que además atribuye correctamente a la **nota de prensa** —no a la guía— el
  hecho de nombrar a PSNI y MoD, y evita la trampa de colgarle al MoD la multa de 350.000 £ de otro
  caso. `afirmaciones-respaldadas:106` vigila el literal retirado, no la fecha suelta. Se deja
  anotado porque el siguiente que grepee «July 2025» va a asustarse igual.

**Bloqueos / pendiente:** ninguno del deploy. Siguen abiertos los gates del dueño (variante
`Despacho` en Gumroad —umbral del 12-ago—, la descripción «anual» de `Pro - 1 puesto`, el nombre de
marca `Angel Fh`, y la PARADA 6 de `.claude/**` en `gh-pages`, que este deploy **no empeora**:
`gh-pages` sabe subir dotfiles pero no borrarlos).

**Enlaces:** rama `deploy/acta-10ago-en-produccion` · deploy `origin/gh-pages@aa96693` ·
https://www.tachadopdf.com/

---

## 2026-08-10 · comité + ejecución · Tres afirmaciones falsas sobre nuestro propio dinero, y un sello verde sobre lo que no se ha mirado (rama `higiene/precio-real-y-ambar-anunciado`)

**Hecho:** ejecutada entera el acta del CEO del 2026-08-10. Seis commits, uno por decisión, para
poder revertir una sin deshacer el resto. Suite **842 → 1002** en 71 ficheros.
`npx --no-install tsc --noEmit` = 0 · `npx --no-install vitest run` = 0 (1002/1002) ·
`npm run build` = 0, con exit codes reales y sin canalizar a `| tail`. `dist/CNAME` verificado
byte a byte tras el build (`cat -A` → `www.tachadopdf.com$`, LF).

**Lo que el CEO comprobó antes de decidir, y que corrigió al comité** (todo con `curl`, sin
contraseñas):

- **El tramo de 149 € EXISTE y se puede comprar hoy.** El JSON incrustado de la ficha de Gumroad
  lista la variante `Despacho - 3 puestos` con `price_difference_cents: 9000` sobre los 59 €.
  `src/license/gumroad.ts` no mira la variante: **un desconocido puede pagar 149 € y recibir el
  producto de 59 €.** Deja de ser una discusión de copy.
- **Lo vivo firma en verde lo que no ha mirado.** El bundle publicado (`assets/report-Bbl6ogcz.js`)
  contiene `o(b?"VERIFICADO":"NO APTO",…)` y **cero** coincidencias de «COMPROBACIÓN PARCIAL»: los
  cinco estados del sello no están desplegados. 111 de 129 documentos reales reciben hoy un papel
  que dice lo que no puede sostener.
- **Las tres cifras retiradas el 8-ago seguían vivas en el dominio.** Diecisiete días.
- **El medidor NO es el único portador de su cifra:** `es.ts:114` ya la dice en palabras, pegada al
  disco. Eso cambió la decisión 3(b) respecto a lo que proponían las tres voces.

**Decisiones y porqués:**

- **PRECIO: 59 € de pago único.** No es una preferencia: es lo único que el checkout sabe cobrar
  (`is_recurring_billing:false`, `recurrences:null`). «59 €/año» exigiría un SKU *Membership* nuevo
  y caducidad en el verificador, sobre un producto congelado con 0 ventas.
- **El tramo Despacho se RETIRA, no se construye.** Sus dos funciones (ancla de precio, cebo de
  prescriptores) eran instrumentos de una campaña que el dueño cerró el 4-ago. **Sacarlo de
  nuestras páginas NO cierra el agujero**: la variante vive en Gumroad y la ficha es alcanzable
  desde `PRO_URL` y desde Google → owner-gate con fecha (12-ago) en `docs/ESTADO.md`.
  *Descartado* preseleccionar la variante con `?option=` en `PRO_URL`: el comprador puede cambiarla
  igual, y un tapón que no tapa es peor que ninguno porque parece un arreglo.
- **La garantía de 30 días sale de las landings y NO entra en los Términos.** `refund_policy` es
  `null` en Gumroad, y el art. 61.2 TRLGDCU integra la publicidad en el contrato: la frase ya nos
  obliga y no la podemos honrar, porque el merchant of record es Gumroad. Meterla en los Términos
  convertiría una imprecisión de marketing en un pasivo firmado.
  *Descartado también* sustituirla por «la política de devolución es la de Gumroad, con enlace»:
  con `refund_policy: null` esa frase apunta a nada y sería una segunda afirmación falsa donde
  acabamos de quitar la primera. Lo que sí se dice, porque es verdad y lo controlamos: el modo
  gratuito permite probar el producto entero antes de pagar.
- **Pie legal en las dos landings** (art. 10 LSSI: publicaban un precio sin dar acceso a la
  identificación del titular). URL absolutas a propósito: esas dos páginas llevan enlaces
  raíz-absolutos que la base de emergencia `/tachadopdf/` rompería.
- **El guardián de precios se desarma de su propia excepción.** `precios-coherentes.test.ts`
  excluía `public/actas/` y `public/nominas/` con una nota de PARADA: estaba desarmado exactamente
  en las dos páginas donde entró el fallo entero. **Una excepción a un guardián sobrevive a la
  razón que la creó.** Fuera la exclusión, y tres guardas nuevas (tramo inexistente, garantía de
  devolución, pie legal). Fail-to-pass: 9 rojos contra la copia anterior.
- **FAQ: sí se avisa del ámbar, en ES y EN.** El miedo que compra este producto es «que me diga que
  está bien y no lo esté», así que anunciar por adelantado que el resultado normal es PARCIAL vende
  exactamente la mercancía que el cliente vino a buscar. Y con 59 € de pago único y la bandeja sin
  vigilar, **el aviso cuesta una vez y el soporte cuesta cada vez**.
- **Dos correcciones más en el mismo FAQ, del mismo delito.** (i) «el informe gratuito lleva marca
  DEMO **y no sirve como evidencia archivable**» afirmaba POR CONTRASTE que el de pago sí: la misma
  construcción que se quitó de la marca de agua el 8-ago, sobreviviendo donde más se lee (esa
  respuesta se publica como resultado enriquecido en Google). `en.ts:72` arrastraba
  `is not meant to be filed`. (ii) «Can I use the report as legal proof?» existía **solo en
  inglés**: el idioma que más promete era el que menos acotaba. Se porta al español.
- **SELLO (a): la frase duplicada se arregla.** No es decisión de texto, es defecto: con
  `reservas === 0` la única forma de estar en E3 es tener un objeto sin examinar, así que la
  repetición era el caso ENTERO, no uno raro.
- **SELLO (b): la cifra va a la tabla «Cobertura»; el rótulo al pie del medidor se CORTA.** El
  numerador que dibuja el disco no se imprimía en ningún sitio, en un producto cuya sección estrella
  se titula «Cómo comprobar este informe». Fila nueva pegada al total, cifra desnuda y en redonda.
  **Descartado el rótulo bajo el medidor**, que pedían las tres voces: `es.ts:114` ya dice en
  palabras, a 9,3 pt y pegado al disco, que se releyeron todas las páginas. Sería un tercer sitio
  para el mismo número, fuera de la caja del disco, en la banda más alta, en cinco estados y dos
  idiomas, contra tres guardas de píxel. Coste alto, información cero.
  **Descartado también** «Revisar a ojo: páginas 1, 2, 3, 4» dentro del sello: es afirmación nueva
  (una instrucción) y la tabla ya destaca esas filas.
- **La cita del ICO se borra entera, en los dos sitios donde vivía.** `/en/` da 404 hoy: nunca se
  desplegó, así que este deploy habría sido el acto que la PUBLICA. `ESTADO.md` la tenía anotada
  como no contrastada contra fuente y el comprador inglés es un despacho. Manafort y PSNI se quedan:
  están verificadas por contenido.
- **PUBLICAR: sí.** No es un acto de crecimiento, es retirada de responsabilidad. Lo vivo entrega
  un PDF con datos dentro y un papel que dice que no los tiene, sobre el 86 % de los documentos
  reales, y encima cita al regulador diciendo lo que no dijo. **No publicar también sangra.**

**Guardas nuevas (las tres probadas con su mutación, fail-to-pass real):**

- `afirmaciones-respaldadas` — sobre el HTML del repo, que es lo que sale por la puerta: todo
  importe presentado como sanción cita su expediente (ventana de 700 caracteres, que es la mayor
  distancia legítima MEDIDA: 570); «más de N comunidades» solo puede aparecer para desmentirlo; los
  literales del plural sin recuento y la cita del ICO, prohibidos. **Su límite está escrito en la
  cabecera, medido**: una cifra inventada a dos párrafos de un expediente legítimo pasa la
  proximidad — por eso hay además barrido literal.
- `legal/faq-ambar` — ata dos sitios independientes: los rótulos que IMPRIME el informe y los que
  el FAQ le promete al comprador. Si alguien renombra un estado y no toca el FAQ, la web explica un
  rótulo que el papel ya no imprime. Codifica además la regla de redacción del ámbar.
- `report/sello` y `report/cobertura-destacada` — la frase nuclear aparece **una** vez en la rama
  «solo objetos» y la coletilla **sí** se sigue añadiendo cuando hay además reserva de página; y la
  cifra impresa se ata a `coberturaComprobada`, la misma función que dibuja el aro.

**Lección propia, anotada porque costó un rojo:** un comentario HTML **se publica**. Citar la frase
prohibida dentro de la página para explicar por qué se retiraba la reintrodujo; lo cazó el test
recién escrito. Los literales prohibidos viven en el test, no en la página.

**Verificado MIRANDO, no solo midiendo** (lo exige `docs/ESTADO.md` al tocar el sello): rasterizados
E3 (caso corriente), E5 y el E3 «solo objetos», y comparados. El par «Páginas del documento 4 /
Páginas comprobadas del todo 0» explica por fin el disco vacío del caso corriente.

**Vocabulario prohibido sobre `dist/` construido: 0 hallazgos** en 26 ficheros, con las listas ES y
EN completas (`anonimiz`, `certific`, `rgpd garantizado`, `inteligencia artificial`, ` ia `,
`anonymi`, `certif`, `gdpr compliant`, `\bA.?I.?\b`, `machine learning`, `guarantee` sin negación,
teatro de confianza, reclamos de admisibilidad, promesas de ingresos). El barrido se comprobó con
una sonda (`/tachado/i` → 359 coincidencias): no da cero por estar vacío.

**Bloqueos / pendiente (del dueño; nada de esto bloquea el despliegue):**

1. 🔴 **Retirar la variante «Despacho - 3 puestos» de Gumroad.** Es lo único de la cartera que puede
   cobrar 149 € por algo que no existe. **Umbral: 2026-08-12.** Si a las 48 h sigue publicada, se
   despublica el producto entero hasta poder retirarla.
2. 🟠 Corregir la descripción de «Pro - 1 puesto», que dice «Licencia individual **anual**».
3. 🟠 El nombre de la marca: la ficha publica `"brand":{"name":"Angel Fh"}` — nombre real en
   superficie externa, contra la regla de la casa. Es su identidad: la decide él.
4. ⚪ `git push origin --delete gh-pages` + `npm run deploy-pages`, para quitar `.claude/**` de la
   rama publicada. Higiene, sin credenciales dentro (PARADA 6, medida).

**Enlaces:** rama `higiene/precio-real-y-ambar-anunciado`, 6 commits: `e18c57f` (precio) ·
`3b208a6` (citas ES) · `7523fe0` (cita ICO) · `1e424da` (notas del tramo retirado) · `ebea689`
(FAQ) · `09464f7` (sello). Merge `--no-ff` a `master`; deploy con `npm run deploy-pages`.

---

## 2026-08-08 · diseño · El medidor de cobertura tenía forma de medidor y no medía nada (rama `diseno/medidor-de-cobertura-que-mide`, fusionada)

**Hecho:** el icono del sello ámbar —un disco que se llena, llamado «medidor de cobertura» desde la
pasada anterior— salía **medio lleno siempre**, porque el relleno era un dibujo fijo por estado.
Ahora se llena en la proporción real de páginas comprobadas del todo. Suite **835 → 842**.
`npx --no-install tsc --noEmit`, `npx --no-install vitest run` y `npm run build` en verde con exit
code real. Fusionada a `master` con `--no-ff`; **no desplegada** (publicar es del dueño).

**Lo que estaba mal, medido y no supuesto:** rasterizados y comparados píxel a píxel, los dos
informes parciales de ejemplo —uno que comprueba del todo **3 de sus 6** páginas y otro que no
puede comprobar del todo **ninguna de sus 4**, porque todas llevan imágenes— dibujaban exactamente
la misma media luna. El segundo es el que importa: **cobertura real cero, dibujo de media
cobertura**. Es la familia de defecto que este producto lleva dos pasadas cerrando, la presentación
insinuando lo que el motor no ha hecho, y va en la dirección que nos favorece, que es siempre la
peor. Efecto colateral: las dos variantes del ámbar —el estado que se lee el 86 % de las veces—
solo se distinguían leyendo el párrafo.

**Decisiones y porqués:**

- *La proporción es «páginas sin ninguna reserva» sobre «páginas del documento»*
  (`coberturaComprobada`, en `report/estado.ts`). Son los MISMOS números que ya imprime el sello
  («En N página(s) la comprobación automática no llega a todo el contenido», «lo que queda fuera es
  el contenido de N página(s) con imágenes») y que ya destaca en ámbar la tabla «Cobertura»: el
  dibujo y el texto no pueden decir cosas distintas.
- **Descartado «páginas releídas / total»**, que es la otra cifra que el sello imprime, por dos
  razones y las dos son la misma: una página releída con la foto de un DNI pegada dentro SÍ se
  releyó, pero la comprobación no alcanza lo que hay en la imagen, así que contarla como cubierta
  es el falso verde que `paginasConReserva` existe para evitar. Y en el caso corriente —el 86 % de
  los documentos: un logo en el membrete— todas las páginas se releen, o sea que esa medida
  marcaría **el máximo** justo en el estado que por definición no está completo, y los dos informes
  de ejemplo seguirían siendo el mismo dibujo. `sinReserva <= releidas` siempre: de las dos
  medidas, la elegida es la conservadora.
- *Los extremos, que es donde un medidor miente.* **Cero** se dibuja con el disco vacío y la PISTA
  blanca pintada debajo: se ve un recipiente vacío, no un hueco donde falta un icono, y no hay
  suelo de relleno que finja una pizca de cobertura donde no la hay (cero es cero). **Cien** no
  llena el disco: la línea de lleno total está al 80 % del diámetro y el casquete de arriba se
  queda siempre sin pintar. No es adorno: el 100 % se da cuando lo único pendiente es un objeto del
  archivo, así que en E3 SIEMPRE queda algo, y un disco lleno del todo junto a «COMPROBACIÓN
  PARCIAL» insinuaría el verde que el motor no ha dado y sería además el mismo disco macizo del
  estado verificado. Un círculo relleno hasta el borde con su orla, encima, es la forma que empieza
  a leerse como un sello de conformidad, y eso está prohibido también cuando lo dice el DIBUJO: es
  el mismo motivo por el que la pasada anterior descartó las siluetas geométricas con marco. La
  escala sigue siendo lineal y monótona, así que el medidor **nunca dibuja más cobertura de la que
  hay**; como mucho, un poco menos.
- *En escala de grises se lee igual*, que es la prueba que este informe no puede perder: el
  contraste no está entre dos ámbares parecidos sino entre la tinta del relleno y el blanco de la
  pista, con el aro cerrando la silueta. Medido sobre el informe convertido a gris: el nivel de
  llenado sale el mismo que en color en los cuatro casos, y pista y relleno se separan por más de
  100 niveles de 255.
- *El segmento circular se dibuja con `drawSvgPath`* (un arco partido en dos mitades de menos de
  180°). Sigue sin haber nada remoto: es una primitiva de `pdf-lib`, no un icono descargado.
- **El texto del informe no cambia ni una coma.** Lo que sería texto nuevo queda anotado en
  `ESTADO.md` para el dueño (la cifra «0 de 4» junto al icono, y una frase repetida que se
  encontró de paso).

**Guarda nueva, probada con su mutación:** `report/medidor` (G18) mide el NIVEL DE LLENADO sobre el
informe **rasterizado** —localiza el disco por su aro, busca la línea de llenado y la compara con
la proporción real, en color y en gris—. Mutación: devolver el relleno a `const f = 0.5`. Salida
real, 5 de los 7 tests en rojo:

```
× el relleno del disco sigue a la proporción real, y no a un dibujo fijo
  → expected 0.49776785714285715 to be close to +0
× los dos informes parciales de ejemplo dejan de ser el mismo dibujo
  → expected 0.49776785714285715 to be less than 0.49776785714285715
× cobertura cero se dibuja como un recipiente VACÍO, no como un icono ausente
  → expected 0.5 to be greater than 0.9
× en ESCALA DE GRISES el medidor se lee igual: el informe se imprime y se fotocopia
  → expected 0.49777777777777776 to be close to +0
× el tope escala la medida, no la recorta: 5 de 6 y 4 de 4 no dibujan lo mismo
  → expected 0 to be greater than 0.08
```

**Y se miró.** Los siete informes regenerados, rasterizados y abiertos uno a uno, más un montaje de
los cinco iconos en color y en gris, antes y después. Antes: cuatro medias lunas idénticas para
0/4, 3/6, 5/6 y 4/4. Después: disco vacío, 40 %, 67 % y 80 % del diámetro, y los cinco estados
siguen distinguiéndose sin color (E1 banda maciza, E2 aro con aspa, E3 medidor, E4 disco con guion,
E5 disco con marca).

**Bloqueos / pendiente:** dos entradas nuevas en la bandeja del dueño de `docs/ESTADO.md`
(PARADA 0.b y PARADA 0.c).

**Enlaces:** rama `diseno/medidor-de-cobertura-que-mide`, merge `--no-ff`. Sin deploy.

---

## 2026-08-08 · diseño · El informe contesta en un vistazo si el archivo se puede mandar (rama `diseno/informe-veredicto-de-un-vistazo`, fusionada)

**Hecho:** primera pasada de DISEÑO del producto — hasta hoy no se había tocado ni un píxel; todo
el trabajo había sido corrección. Cinco commits, uno por familia. Suite **794 → 835**.
`npx --no-install tsc --noEmit`, `npm test` y `npm run build` en verde con exit code real.
Fusionada a `master` con `--no-ff`; **no desplegada** (publicar es del dueño).

El método fue el que exige la casa y no otro: **generar, rasterizar y MIRAR**. Los siete informes
se abrieron uno a uno, en color y en escala de grises, antes y después. La app y la web se
midieron en un navegador real sobre el `dist/` construido — computed styles y geometría, porque
esta sesión no tenía captura de pantalla disponible. Nada de esto se ve leyendo el código.

**Lo que estaba mal, medido y no supuesto:**

1. *El veredicto era el tercer elemento de la página y solo existía en la primera hoja.* Altura de
   mayúscula a 180 dpi: marca «TachadoPDF» 38 px, título genérico 27 px, veredicto 25 px — los dos
   elementos mayores del papel eran justamente los dos IDÉNTICOS en los cinco estados. Y la página
   2 del informe que dice TACHADO NO SUPERADO y la del que dice TACHADO VERIFICADO eran el mismo
   texto palabra por palabra: quien imprime y grapa, archiva o reenvía una hoja suelta no tenía
   delante ningún resultado.
2. *En escala de grises los cinco sellos eran la misma caja.* Los cinco rellenos caben en SEIS
   niveles de 255. El informe se imprime, se fotocopia y se archiva: en cuanto sale de la pantalla,
   el bit que importa desaparecía.
3. *El estado que se lee el 86 % de las veces era el más difícil de leer del documento.* Contraste
   del rótulo sobre su propio relleno: ámbar 3,68:1, gris 4,06, verde 4,16, rojo 5,07. El único que
   pasaba era el estado que casi nadie ve.
4. *El falso verde sobrevivía en los píxeles.* En un documento entero escaneado —sello ROJO, cero
   páginas releídas— se dibujaban SIETE puntos verdes bajo «0 ocurrencias en el texto extraíble».
   La frase es cierta; el punto verde decía otra cosa.
5. *La app enseñaba las detecciones como tachados ya hechos.* `.hit-box` y `.hit-box--selected` no
   tenían NI UNA regla de estilo: heredaban el estilo global de `button` (navy macizo), o sea que
   una detección propuesta, una elegida y un tachado consumado eran el mismo objeto visual.
6. *Los dos CTA de `/actas/` y `/nominas/` desaparecían en modo oscuro.* Relleno y fondo, los dos
   `rgb(15,23,42)`: contraste 1:1, cero borde. En claro se ven perfectamente.

**Decisiones y porqués:**

- *El ámbar deja de llevar un glifo de alerta y pasa a llevar un MEDIDOR DE COBERTURA* (círculo
  medio lleno, dibujado con primitivas de `pdf-lib`). El disco con «!» es el glifo de error de
  cualquier cuadro de diálogo del sistema, y desde que cualquier imagen degrada el sello el ámbar
  es el resultado NORMAL: un cartel de error como respuesta habitual o se ignora o espanta, y las
  dos cosas son peores que decir la verdad. El medidor no tranquiliza ni alarma: cuantifica, y
  encaja con la familia entera leída como cobertura (lleno, medio, vacío, ninguna, fallida).
- *E1 pasa a banda roja maciza con texto en blanco, y E2 se queda en el rojo pálido.* Los dos
  compartían el MISMO rojo, el mismo relleno y el mismo círculo, y solo se distinguían en si el
  aspa era maciza o hueca — siendo mensajes casi opuestos («el dato sigue dentro» frente a «es un
  escaneo, míralo tú»). **Descartado sacar E2 del rojo**, que es lo que pedía una de las lentes:
  `CLAUDE.md` línea 10 dice que las páginas sin capa de texto SIEMPRE se advierten en rojo, eso
  tiene base legal y no lo deroga un diseñador. La diferencia se hace DENTRO del rojo. Efecto
  colateral que resuelve el punto 2: en gris, E1 queda en ~75 frente a ~240 de los demás.
- **Descartado partir el sello ámbar en «HECHO ✓» arriba y «PENDIENTE» debajo.** Era la propuesta
  más peligrosa del lote: un titular con tick, sobre fondo neutro, en la posición de entrada del
  ojo, es una afirmación verde-adyacente encabezando el estado que por definición NO está
  verificado del todo. Es exactamente el defecto que se acaba de pasar dos días cerrando. Hoy el
  ámbar abre por el hecho de cobertura, que es el orden honesto.
- **Descartado dar a cada estado una silueta distinta** (octógono / triángulo / cuadrado) con marco
  macizo y trama diagonal. La medida que lo motivaba es correcta, pero la trama y el marco
  discontinuo leen como «anulado», que es justo lo que el ámbar no puede parecer; el octógono es la
  forma internacional de STOP puesta sobre «tu documento es un escaneo»; y un marco grueso con
  silueta geométrica empieza a parecerse a un sello de conformidad — y «certificado» está prohibido
  también cuando lo dice el DIBUJO, no la palabra. El sello sigue sin orla, sin escudo y sin cinta.
- **Descartado colapsar los siete patrones a una línea.** Quitaría evidencia de un documento cuyo
  trabajo es ser evidencia: «qué siete formatos se buscaron» es exactamente lo que un tercero
  quiere itemizado. La molestia real no era que estuvieran, era que gritaban en verde, y eso lo
  resuelve el punto de tres estados sin borrar nada.
- *La fila con reserva se destaca; la de inventario, no.* El recurso no es nuevo: es el mismo
  «NO EXAMINADO» en versalita ámbar que el inventario de objetos ya usaba bien, extendido a la
  tabla que sostiene el veredicto. **No se subieron las páginas pendientes AL sello**: el ámbar ya
  es la banda más alta del producto y alargarla más es empeorar lo que se venía a arreglar.
- *El acuse de entrega reutiliza LITERALMENTE las cadenas del informe.* `processDocument` devuelve
  ahora su `reportData` para que la pantalla no tenga que recalcular ni redactar nada: dos
  redacciones del mismo hecho es deriva garantizada, y devolver el dato la hace imposible.
- *El texto del informe no cambia ni una coma.* Todo lo de arriba es jerarquía, color, forma,
  orden y espacio. Lo que sí es cambio de AFIRMACIÓN queda anotado en `ESTADO.md` para el dueño.

**⚠ Dos guardas estaban al revés y fijaban el defecto que venían a evitar:**
`estilo.test.ts` exigía `text-overflow: ellipsis` en el botón de «tachar todas las apariciones»,
que es literalmente lo que lo recortaba a un carácter en el móvil. Se reescribió a la regla
contraria. Y el resto de guardas nuevas se probaron TODAS con su mutación, pegada en cada commit.

**Bloqueos / pendiente:** ver las tres entradas nuevas en `docs/ESTADO.md` (§ Bandeja del dueño:
el rótulo de las páginas pendientes, el PDF de ejemplo y el reparto de la última hoja).

**Enlaces:** rama `diseno/informe-veredicto-de-un-vistazo`, 5 commits + merge `--no-ff`. Sin deploy.

---

## 2026-08-08 · integración · El ataque encontró 17 falsos verdes: nueve arreglos y un bug de destrucción de datos (rama `fix/imagenes-escondites-y-glifos`, fusionada)

**Hecho:** un atacante interno ejecutó `fix/sello-por-estados` contra 14 baterías y consiguió **17
falsos verdes reproducibles**, uno de ellos de punta a punta en el producto construido y servido en
local. Esta ronda los cierra: nueve commits, cada uno con su demostración fail-to-pass (revirtiendo
el fichero con `git stash push -- <ruta>` y pegando la salida roja). Suite **732 → 794**.
Rama fusionada a `master` con `--no-ff`; **no desplegada** (publicar es del dueño).

Lo arreglado, por orden de daño:

1. **`24eabe8` — el escaneo del cliente volvía EN BLANCO. Destrucción de datos, y la introdujo la
   rama anterior.** Una nómina escaneada (JPEG a página completa) con una caja manual encima salía
   del tachado como una página blanca con una barra negra. La causa NO era `REDACT_IMAGE_PIXELS`
   —comprobado aparte: borra los píxeles de la caja y respeta el resto de la imagen— sino la
   combinación de dos cosas nuestras dentro de `stripMetadata`: el barrido por número de objeto
   (que resuelve TODOS los objetos, commit `e14d037`) y guardar en esa misma pasada con
   `garbage >= 2`. Matriz completa, en tinta (píxeles oscuros de la página):
   `garbage:1`+objetos resueltos → 16.238 bytes / 2.402 de tinta (bien) · `garbage:2/3/4`+objetos
   resueltos → 3.711 bytes / 1.776 (solo la barra) · `garbage:4` sin resolver → 2.402 (bien).
   Arreglo: guardado en DOS pasadas (`garbage: 1`, y luego reabrir y compactar con `garbage: 4`
   sin tocar ningún objeto). Se conservan las dos propiedades: el barrido y la recolección de
   huérfanos.
2. **`2ff03fa` — una imagen en la página deja de salir verde.** Un acta con texto normal y una foto
   del DNI al 25 % del área salía «TACHADO VERIFICADO» con el DNI a tamaño de titular dentro.
   `paginasConImagen` entra en `paginasConReserva`.
3. **`fd91ca3` — capa opcional apagada.** El dato dibujado dentro de una capa `/OFF` no lo devuelve
   `extractText`: ni se detectaba, ni se tachaba, ni se reencontraba. Ahora el motor **enciende las
   capas al abrir**, así que se detecta, se tacha y se relee — y el archivo entregado conserva su
   `/OFF`, de modo que se sigue viendo como su autor lo dejó.
4. **`231c955` — lista negra donde hacía falta, y releer TODAS las cadenas.** Nueve escondites de
   estructura (`/PageLabels`, nombre de capa, `/Names /Dests`, `/Names /JavaScript`,
   `/OpenAction`, `/Threads`, clave propia de la página, `/T` del árbol de estructura,
   `/Collection`) salían en verde con el dato dentro.
5. **`9bc706d` — el `/ToUnicode` que miente.** Texto que se DIBUJA y no se puede releer: degrada el
   sello y consta en el informe con su número de caracteres.
6. **`79c583d` — el detector, con separador en cualquier posición** y con las rayas tipográficas.
   Once formas de escribir el mismo DNI se le escapaban.
7. **`4e7468c` — el comentario de `FREE_MAX_PAGES`**, que afirmaba un muro que no existe.
8. **`ddc7de0` — el hueco de glifos se declaraba corto** (ver abajo).
9. **`13a2508` — auditoría interna**: la coletilla de E3 nombraba solo los marcadores.

**Decisiones y porqués:**

- *La imagen degrada el sello aunque eso deje el verde casi inalcanzable.* Medido sobre 129 PDF
  reales del disco: **111 (el 86 %) llevan alguna imagen**, casi siempre el logo del membrete. Así
  que el estado normal del producto pasa a ser el ámbar. Se acepta a sabiendas, porque la
  alternativa es afirmar «no queda ningún dato de los patrones buscados» sobre un acta con la foto
  de un DNI dentro, y eso es una frase citable en una reclamación. **El coste real de esa decisión
  no es el ámbar: es que un ámbar que siempre dice lo mismo se deja de leer.** Por eso, cuando la
  ÚNICA reserva son imágenes, el sello lo dice con todas las letras («esta herramienta no lee lo
  que hay dentro de una imagen, así que un dato fotografiado o escaneado no se detecta») en vez de
  mandar al lector a la tabla. Descartado bajar el umbral (cualquier cifra es igual de arbitraria)
  y descartado dejarlo en una fila de cobertura (una fila más en una tabla no cambia lo que el
  sello AFIRMA).
- *Contra un escondite no hay lista blanca que valga: siempre queda el sitio número diez.* Por eso
  el arreglo de los nueve escondites tiene dos mitades y la importante es la segunda: **borrar** lo
  que se sabe borrar sin romper el documento (para que el usuario tenga salida) y **releer TODAS
  las cadenas de todos los objetos** (para que lo que no se sepa borrar bloquee en vez de firmar).
  La única lista blanca que se acepta es la de claves estándar del diccionario de página, porque la
  fija ISO 32000-1 y no la imaginación de quien esconde el dato.
- *La relectura destapó un defecto que nadie sospechaba: **el adjunto no se iba**.*
  `deleteEmbeddedFile` quita la entrada del árbol `/Names` y `getEmbeddedFiles()` devuelve lista
  vacía —lo único que miraba el inventario—, pero el `/AF` del catálogo seguía apuntando al
  Filespec, el recolector no podía tirarlo, y **el contenido del fichero adjunto se entregaba
  dentro del PDF** mientras el informe decía «Ficheros adjuntos: eliminado del archivo». Es el
  argumento entero a favor de las guardas amplias: no lo encontró una sospecha, lo encontró una
  comprobación que no elegía dónde mirar.
- *La capa apagada se enciende para leer, no se declara.* Comprobado que `setLayerVisible` es
  estado de LECTURA de mupdf: el `/OFF` sigue en los bytes guardados. Se puede leer el contenido
  oculto sin cambiar el aspecto del entregable. Coste asumido y dicho: la vista previa del editor
  ahora enseña ese contenido — que es justo lo que hay que poder tachar.
- *El umbral de «texto que no se puede releer» son cuatro glifos seguidos, y no es una cifra al
  gusto:* el dato más corto que esta herramienta busca son seis caracteres (`a@b.co`), así que en
  una racha más corta no cabe ninguno de los formatos declarados, y una viñeta de una fuente rara
  no tiene por qué degradar el sello de nadie. Medido sobre 665 páginas reales: contando glifos
  sueltos se marcarían 27 páginas; contando rachas de cuatro, 9.
- *Ampliar el detector se aceptó por MEDIDA, no por intuición, y la primera medida era falsa.* El
  primer banco dijo «132 hallazgos nuevos en 277 ficheros» y habría bastado para descartar el
  cambio. Estaba roto: el detector antiguo reconstruido en el banco no veía ni un DNI canónico
  (`\\d` dentro de una plantilla se había quedado en `d`). Con el banco arreglado —y con una
  comprobación de sí mismo que aborta si el detector antiguo no ve dos DNI de control— el
  resultado real es **2 hallazgos nuevos en 277 ficheros, los dos IBAN con los puntos en sitios
  raros; es decir, aciertos**. Lo que impide que «separador en cualquier posición» sea un coladero
  no es la forma, es el DÍGITO DE CONTROL, y por eso la referencia catastral se queda fuera.
- *Un límite declarado a la baja es una promesa encubierta.* El informe decía del hueco de glifos
  que «con ella se puede acotar qué cabía en él», y la guarda del propio repo ya medía que veinte
  nombres de pila dan veinte anchuras DISTINTAS: dentro de una lista corta de candidatos, la
  anchura identifica. Se dice así.
- *El comentario de `FREE_MAX_PAGES` se corrige, el código no.* Decía que el tope de páginas «SÍ es
  un muro robusto». No lo es: cuelga de `license.pro`, que enciende la verificación que corre en el
  navegador del usuario. En un producto sin servidor no tiene arreglo técnico y no se pretende —el
  compromiso de que ningún documento sale del navegador vale más que el candado—, pero un
  comentario falso que sostiene una decisión de negocio sí hace daño.
- *Lo que el atacante encontró y NO era cierto:* que `REDACT_IMAGE_PIXELS` destruyera la imagen.
  Reproducido con un PDF bien formado: borra solo los píxeles de la caja. Su fixture escrito a mano
  producía «format error: object is not a stream». El síntoma era real y grave; la causa, nuestra.
  Se documenta porque el hallazgo correcto con la causa equivocada habría llevado a tocar el motor
  de tachado en vez de la función que lo rompía.

**Verificación (exit codes reales, nunca `| tail`):** `npx --no-install tsc --noEmit` exit 0 ·
`npx --no-install vitest run` exit 0 (**794/794 en 63 ficheros**) · `npm run build` exit 0, en cada
commit. Vocabulario prohibido sobre `dist/` (31 ficheros): sin coincidencias de
`anonimiz|certific|rgpd garantizad|inteligencia artificial` ni de
`anonymis|anonymiz|certified|certifies|gdpr compliant|artificial intelligence` (exit 1), y sin `IA`
ni `AI` como palabra suelta excluyendo binarios (exit 1). Las dos únicas coincidencias de `AI` en
todo `dist/` son secuencias de bytes dentro de `mupdf-wasm.wasm` y de `og-image.png`. La búsqueda
se validó con un control positivo (`tachado` sí aparece) para que un cero no pueda venir de una
búsqueda que no busca.

**Medidas sobre documentos reales, hechas antes de aceptar cada cambio** (solo recuentos; no se
imprimió ni contenido ni nombres de fichero):
- Imágenes: 111 de 129 documentos llevan alguna. Es el coste del ámbar.
- Relectura de todas las cadenas: **0 de 145 documentos bloquearían** por un residuo inventado.
- Detector ampliado: **2 hallazgos nuevos en 277 documentos**, los dos plausibles aciertos.
- Integridad tras el barrido nuevo: **105 documentos, 0 que no se abran, 0 que cambien de número de
  páginas, 1 que pierde tinta** — y ese pierde exactamente lo que el producto promete quitar (tenía
  anotaciones y campos de formulario, y el informe lo declara fila a fila).
- Texto ilegible: 9 de 665 páginas con racha de cuatro, 4 documentos de 129.

**Bloqueos / pendiente:**
- **NO desplegado**, a propósito. Publicar es decisión del dueño.
- **El informe bloqueado (E1) sigue sin llegar a nadie:** `canDownloadReport` exige `verify.clean`.
  Sigue siendo una decisión de producto pendiente, no un olvido.
- **El coste de rendimiento no se ha medido.** `processDocument` hace ahora una pasada más por
  página (el dispositivo que cuenta glifos) sobre las que ya hacía. En documentos largos puede
  notarse; nadie lo ha cronometrado.
- **Residual conocido y no arreglado:** el patrón de teléfono ya admitía separador en cualquier
  posición ANTES de esta ronda (`6 1 2 3 4 5 6 7 8` se detecta), y no lleva dígito de control con
  el que descartar un falso positivo. No es efecto de este cambio y se deja constancia con un test.
- **Residual conocido:** un dato partido por un salto de línea sigue bloqueando en vez de tacharse
  solo (`searchText` no lo encuentra). Tiene salida: una caja manual.
- Auditoría Codex externa: pendiente. El `auditor-interno` se ejecutó a mano, con su procedimiento,
  porque en este entorno no hay herramienta para lanzar subagentes; encontró tres cosas, y las tres
  están arregladas en `13a2508`.

**Enlaces:** rama `fix/imagenes-escondites-y-glifos` (9 commits, de `24eabe8` a `13a2508`), fusionada
a `master` con `--no-ff`. Incluye los 8 commits previos de `fix/sello-por-estados`.

---

## 2026-08-08 · ingeniería · El sello del informe deja de mentir: cinco estados y alcance explícito (rama `fix/sello-por-estados`)

**Hecho:** ocho arreglos, un commit cada uno, todos con un test que FALLA antes del cambio y pasa
después (demostrado revirtiendo el fichero con `git stash push -- <ruta>` y pegando la salida roja).
Rama desde `master` en `8f65c36`. **Sin fusionar**: la decisión de publicar es del dueño.

El sello se emitía con la condición única `verify.clean === true`, que también es cierta **cuando no
había nada que leer**. Un documento escaneado entero, del que la herramienta no tocó ni un píxel,
salía con el mismo «VERIFICADO» que uno tachado y verificado. Y «VERIFICADO» es un participio sin
objeto: el lector completa la frase él solo, y la completa mal.

1. **`414eeb4` — el sello pasa a cinco estados.** `estadoDelSello()` en `src/report/estado.ts` es
   función pura y única fuente. TACHADO NO SUPERADO · SIN COMPROBACIÓN AUTOMÁTICA · COMPROBACIÓN
   PARCIAL · SIN TACHADOS · TACHADO VERIFICADO. Con ellos entran una sección de COBERTURA (seis
   filas con su cifra **siempre**, también el cero, y su denominador), un inventario FIJO de
   OBJETOS DEL ARCHIVO con estado por fila, un alcance de cuatro párrafos que enumera qué se buscó
   y qué **no** —lista cerrada y contable—, y un bloque para que un tercero contraste la huella.
   Se retiran «DEMO — no válido como evidencia» (afirmaba por contraste que el Pro **sí** lo es,
   contra el propio FAQ) y «no apto como prueba de tachado».
2. **`da86744` — los marcadores.** Un DNI en el título de un marcador sobrevivía entero y se
   firmaba en verde. Se borran, **y** sus títulos entran en lo que la guarda relee.
3. **`e14d037` — cuatro escondites más:** XMP colgado de un XObject, `/Thumb` (un retrato de la
   página SIN tachar), `/PieceInfo`, y `/Alt` y `/ActualText` del árbol de estructura.
4. **`90a33c5` — el informe publicaba el dato que acababa de tachar.** Imprimía `fileName` tal
   cual: con `nomina-12345678Z-julio.pdf`, el DNI quedaba dentro del entregable.
5. **`dc3ae78` — un dato partido por un salto de línea.** La guarda mira también el texto con los
   saltos quitados y **bloquea**.
6. **`f793bb7` — la imagen que no llega al umbral.** Al 59 % del área no había ningún aviso.
7. **`f02b275` — el hueco de glifos**, atado a su medida (prueba de caracterización, sin cambio de
   comportamiento).
8. **`18b3776` — la maquetación.** Encontrado RASTERIZANDO el informe: una etiqueta se dibujaba
   encima de su propio valor (5,3 pt de solape) y la huella SHA-256 se salía del papel.

**Decisiones y porqués:**
- *El estado es función de (cobertura ∧ resultado), no de resultado.* Y tres principios que
  generan la escalera: el sello nombra su objeto; un objeto **presente y no examinado** degrada el
  sello solo (así, añadir una categoría a «no examinado» degrada los documentos que la llevan en
  vez de ampliar el agujero en silencio, y el día que el motor la trate el sello deja de
  degradarse sin tocar el texto — eso es exactamente lo que pasó con los marcadores entre el
  commit 1 y el 2).
- *Cinco estados y no tres.* «Escaneado entero» no es «parcial»: no falta una parte, es que **no
  hay comprobación**. Y «Zonas tachadas: Ninguna» bajo un verde era el contrasentido de partida.
- *Ningún rótulo puede ser subcadena de otro*, y se testea. Si el ámbar se llamara «VERIFICADO CON
  RESERVAS», el test «una página escaneada no puede salir verde» sería imposible de escribir y
  alguien lo debilitaría.
- *Cada arreglo tiene sus DOS mitades: borrar y releer.* Una acción sin su comprobación es
  justamente como se fabrica un falso verde. Por eso los marcadores y los textos alternativos se
  borran **y** entran en `extractMetadataStrings`.
- *Los tests afirman sobre LITERALES CONGELADOS, nunca sobre `COPIA.loQueSea`.* El
  `toContain(COPIA.alcance)` que había era un test comparándose consigo mismo: si `alcance` pasaba
  a valer `'.'`, seguía verde. Es el mismo fallo que documentó la bitácora del 22-jul con
  `hreflang`. Efecto colateral útil: como el literal para negar el verde es `'VERIFICADO'` a secas,
  la misma aserción caza el sello anterior, y por eso el fichero de guardas se puede ejecutar tal
  cual contra el código de master para demostrar el fallo.
- *Límite elegido a propósito y medido, en el barrido de saltos de línea:* juntar dos líneas puede
  **fabricar** una coincidencia (`7500` y `43210` en filas consecutivas dan nueve dígitos seguidos,
  la forma exacta de un teléfono español). Así que solo cuenta para los patrones con dígito de
  control más el correo. Un teléfono o una referencia catastral partidos NO se reencuentran: un
  bloqueo por un residuo inventado no tendría salida —el usuario no puede quitar un dato que no
  existe— y un informe que no se puede emitir nunca es peor que uno que declara su alcance. Hay un
  test con una tabla de importes que fija esa frontera.
- *Bloquear solo es aceptable porque hay salida.* El DNI partido no se puede tachar solo
  (`searchText` no lo encuentra), pero una caja manual sobre las dos líneas sí lo elimina. Está
  cubierto por un test, porque un bloqueo sin salida sería peor que el defecto.
- *El hueco de glifos no se arregla, se declara.* Comprobado, no supuesto: mupdf solo ofrece
  `REDACT_TEXT_REMOVE` y `REDACT_TEXT_NONE`; recomponer la línea sería reescribir los operadores de
  posicionamiento de cada página (rehacer la maquetación); rellenar con glifos falsos no quita la
  fuga porque la fuga **es** la anchura; y rasterizar destruye la capa de texto, que es sobre lo
  que se sostiene toda la comprobación de este producto. Medido: tras tachar `12345678Z` en
  Helvetica 11, el texto posterior no se mueve ni 0,01 pt y el hueco vale 61,765 pt.
- *La imagen por debajo del umbral no se arregla bajando el umbral*, porque cualquier cifra es
  igual de arbitraria: el informe enumera las páginas con imágenes, sin umbral.
- *Leer el PDF renderizado encontró lo que ningún test de texto ve.* Dos defectos de maquetación
  reales aparecieron al rasterizar. La guarda nueva mide la POSICIÓN de cada glifo.

**Bloqueos / pendiente:**
- **NO fusionada y NO desplegada**, a propósito.
- **Decisión de producto no tomada:** hoy el informe bloqueado (E1) no llega a nadie, porque
  `canDownloadReport` (`src/app.ts:24`) exige `verify.clean` para descargar. El informe que dice
  «me negué, y por esto» también es diligencia y hoy se tira. Entregarlo **solo a él** (sin el
  documento con residuos) toca el flujo de descarga y la UI, no el motor, y no estaba en el
  encargo: queda apuntado, no hecho.
- **Coste asumido y dicho en voz alta:** se pierde el texto alternativo de accesibilidad de las
  imágenes. Es un texto que ningún lector enseña y que la guarda no releía —un escondite, no una
  funcionalidad—, pero por eso pasa a ser una categoría propia del inventario en vez de
  desaparecer en silencio.
- **Residuales conocidos, declarados:** el hueco de glifos; teléfono y referencia catastral
  partidos por un salto de línea; y el punto ciego del detector (nombres, direcciones, firmas,
  documentos extranjeros), que ahora el informe enumera uno a uno en vez de taparlo con un
  descargo genérico.
- Auditoría Codex externa: pendiente. El `auditor-interno` se ejecutó a mano, con su procedimiento,
  porque en este entorno no hay herramienta para lanzar subagentes.

**Enlaces:** rama `fix/sello-por-estados` (8 commits, de `414eeb4` a `18b3776`). Verificación en
cada commit: `npx --no-install tsc --noEmit` exit 0 · `npm test` exit 0 (615 → **732**) ·
`npm run build` exit 0.

---

## 2026-08-08 · auditoría · Comprobación de hechos de toda la web antes de publicar (rama `fix/afirmaciones-verificables`)

**Hecho:** inventariadas y comprobadas contra FUENTE PRIMARIA las 13 afirmaciones de hecho
verificables de la web en los dos idiomas (`src/legal/textos.ts`, `src/legal/textos.en.ts`,
`src/content/guias.en.ts`, `public/**`). Resultado: **9 confirmadas, 2 parciales, 2 sin respaldo**.

Las dos SIN RESPALDO eran españolas y estaban en la portada:
- «la AEPD ha sancionado a **más de 200 comunidades de propietarios** entre 2020 y 2024»
- «**6.000 €** por un listado de morosos»

Ninguna de las dos procede de la AEPD. Ambas se rastrean hasta un mismo blog comercial de software
para administradores de fincas que no cita ninguna fuente, y cuyo caso de 6.000 € es un **ejemplo
ilustrativo** sin número de expediente. La nota de prensa de la memoria 2024 de la AEPD (281
sanciones en TODOS los sectores, 35,6 M€) **no menciona a las comunidades de propietarios**. La
cifra circula ya por buscadores y blogs citándose entre sí: es exactamente el patrón de una
estadística lavada.

Sustituidas por dos expedientes leídos ÍNTEGROS en aepd.es:
- **PS/00378/2019** — multa de **15.000 €** por infracción del art. 5.1.f) RGPD: acta de junta
  expuesta en los ascensores del edificio identificando con nombre, apellidos, piso y puerta a
  asistentes y representados. Procedimiento acordado el 18-12-2019.
- **PS/00143/2020** — **apercibimiento** por art. 5.1.f) RGPD: convocatoria de junta en el tablón
  con el nombre de un propietario junto a su deuda de 286,81 €.

También corregido el titular de `/actas/`, que atribuía a PS/00378/2019 unos hechos que no constan
en la resolución («un acta con DNIs sin tachar de verdad»): el caso fue un acta expuesta entera, no
un PDF mal tachado.

En inglés, cinco de siete afirmaciones resistieron intactas (FRCP 5.2 en sus cuatro incisos y la
copia bajo secreto de 5.2(f); la guía del ICO de 31-07-2025; los «más de 18.000» del MoD, que son
literalmente la cifra del ICO; el plazo de un mes del DSAR; y la multa de 66.000 £ a Police
Scotland de marzo de 2026 — que yo di por inventada de antemano y **es real**, con reprimenda
incluida en el propio titular del ICO). Las dos que no:
- «reporters copied the text out **within minutes**» (Manafort): sin respaldo, ninguna fuente
  cronometra el intervalo. Sustituido por dos hechos del expediente: escrito defectuoso en el
  docket público como ECF 471 el 8-1-2019 y versión CORREGIDA como ECF 472 ese mismo día.
- «a Police Service of Northern Ireland disclosure»: cierto pero desperdiciado como nota al pie.
  Ahora dice lo que pasó: **750.000 £** de multa del ICO (3-10-2024) porque una hoja oculta dentro
  de un Excel publicado por transparencia expuso a los **9.483** agentes y personal del PSNI.

**Decisiones y porqués:** vendemos diligencia en protección de datos, así que una cifra inventada
sobre el regulador no es una errata de copy: es lo primero que comprobaría un competidor o un
periodista, y arrastra consigo la credibilidad del informe, que es el producto. Además, el comité
prohíbe prometer cumplimiento garantizado, y afirmar mal una sanción va en la misma dirección.
Regla adoptada: **un caso concreto con su expediente convence más que un número redondo sin
fuente**, y de hecho la copia quedó más fuerte al sustituirlo. Cada afirmación queda con su fuente
en un comentario JUNTO AL TEXTO (en el `.ts` y en el HTML estático), con la fecha de consulta, para
que la próxima comprobación no repita esta investigación; las dos cifras retiradas quedan anotadas
con un ⚠ y el motivo, para que nadie las devuelva «porque suenan bien». Anotada también una trampa:
los 350.000 £ del MoD son OTRO incidente (un email con «To» en vez de «BCC», 265 direcciones) y no
deben pegarse jamás a la hoja oculta de las 18.000 personas. Descartado meter en la copia el caso
del ICO contra la Met de 5-8-2026 (documentos sin tachar que dieron a un acosador la nueva
dirección de su víctima): encaja perfecto, pero añadir contenido nuevo no era el encargo — queda
apuntado como munición disponible.

**Bloqueos / pendiente:** `docs/PLAN_14D.md:21` cita «multas AEPD 15.000€ (actas, 2021) y 1.500€
(tablón, 2023)» sin expediente. Es un documento interno y un acta histórica del comité, así que NO
se ha reescrito: la cifra de 15.000 € queda confirmada (PS/00378/2019) y la de 1.500 € queda **sin
comprobar**. Sigue en pie la PARADA 2 de `docs/ESTADO.md` (las landings `/actas/` y `/nominas/`
venden «59 €/año», un tramo «Despacho» de 149 €/año que no existe en el código y una garantía de
devolución que los Términos no recogen): es decisión de precio del owner y no se ha tocado, pero
conviene resolverla antes de publicar porque es la misma clase de problema. Auditoría Codex externa:
pendiente. **NO desplegado**: publicar es decisión del dueño.

**Enlaces:** rama `fix/afirmaciones-verificables`, fusionada a `master` con `--no-ff`. Fuentes:
`https://www.aepd.es/documento/ps-00378-2019.pdf` · `https://www.aepd.es/documento/ps-00143-2020.pdf` ·
`https://ico.org.uk/action-weve-taken/enforcement/2024/10/police-service-of-northern-ireland-mpn/` ·
`https://www.law.cornell.edu/rules/frcp/rule_5.2`

---

## 2026-08-08 · ingenieria · El CNAME que se PUBLICA llevaba CRLF (rama `fix/cname-eol-lf`)

**Hecho:** el guardian del CNAME que traia la rama del ingles se puso ROJO en master nada mas
fusionar, y tenia razon. No fallo antes porque en la rama se ejecutaba sobre los ficheros que
escribio la sesion que los creo; en cuanto `git checkout` rematerializo el arbol, aparecio.

Medido, en bytes:
- objeto de git .................... `www.tachadopdf.com\n` (19 bytes)
- arbol de trabajo tras checkout ... `www.tachadopdf.com\r\n` (20 bytes)
- `dist/CNAME` tras `npm run build`  `www.tachadopdf.com\r\n` (20 bytes)

`core.autocrlf` esta a true en el repo y NO habia `.gitattributes`. Vite copia `public/` a `dist/`
tal cual y `gh-pages` sube `dist/` tal cual: **lo que se publica son los bytes del ARBOL DE
TRABAJO, no los del objeto**. Es decir, en cualquier clon limpio en Windows —incluido el de un CI—
el CNAME salia con CRLF.

**Decisiones y porques:**
- *Se arregla el fichero, no se relaja el test.* El test byte a byte estaba BIEN: es justo lo que
  encontro el defecto. Relajarlo para que aceptara CRLF habria sido convertir en verde permanente
  la unica señal que existia. Se le añade una asercion hermana que comprueba el pin y NOMBRA la
  causa, para que el siguiente no pierda la tarde. Probada con su mutacion: borrado el pin, roja.
- *`.gitattributes` quirurgico, no `* text=auto`.* Renormalizar el repo entero en una integracion
  mezcla ruido de finales de linea con el cambio real. Solo se fija `public/CNAME`.
- *Detalle que vindica una decision de la rama anterior:* hasta hoy el CNAME publicado salia con
  LF por casualidad, porque el `writeFileSync('dist/CNAME', ...)` de `scripts/deploy-pages.mjs`
  lo reescribe DESPUES del build. Esa linea se penso como redundante y se decidio conservarla
  «porque quitarla añade riesgo sin añadir nada»: resulta que era lo unico que corregia el CRLF.
  Pero la promesa de la rama era que CUALQUIER via de publicacion fuese segura, y por cualquier
  otra via se publicaba CRLF. Ahora el fichero es correcto en origen y ya no depende del script.
- *No se toca el script de deploy.* Sigue siendo el fichero cuya rotura costo 4 dias, el cambio no
  se puede probar sin desplegar de verdad, y ya no hace falta.

**Bloqueos / pendiente:** ninguno. Suite 615/615.

**Enlaces:** rama `fix/cname-eol-lf`, fusionada `--no-ff` en master. Sin desplegar.

## 2026-08-08 · auditoria · Integracion de `feat/i18n-contenido-indexable` en master

**Hecho:** revision de integracion de la rama del ingles y fusion `--no-ff` a master. Se verifico
el ARTEFACTO CONSTRUIDO, no la fuente: `npm run build` y despues barrido fichero a fichero de las
18 paginas de `dist/`.

- *Contenido indexable, medido en `dist/`.* Ninguna pagina se publica vacia. Texto visible sin
  ejecutar JavaScript: home ES 7.725 caracteres, home EN 10.227, guias entre 1.857 y 3.323.
  Las dos mas cortas son las paginas-herramienta (`/comprobador/` 746, `/en/checker/` 631): son
  cortas por diseño, pero llevan su H1, su intro y su aviso de alcance DENTRO del HTML.
- *Vocabulario prohibido: 0 infracciones sobre los 26 ficheros de `dist/`* — las 18 paginas mas
  los bundles JS, el CSS, el sitemap y el robots. Se barrio con el criterio ES (subcadena:
  anonimiz, certific, «rgpd garantizado», «inteligencia artificial», « ia ») Y el EN con fronteras
  de palabra (anonymi, certif, GDPR/HIPAA/CCPA compliant, «AI» suelto sensible a mayusculas,
  AI-powered, machine learning, guarantee sin negacion, teatro de confianza, reclamos de
  admisibilidad, promesas de ingresos). Se barrieron TAMBIEN los bundles, que el guardian del
  repo no mira porque solo recorre `.html` y los `.ts` de la copia inglesa.
- *hreflang: 18/18 correcto, fichero a fichero, no por muestreo.* Las dos parejas (home ES/EN y
  comprobador/checker) se apuntan en los dos sentidos, ambas declaran `x-default` al español y
  las 18 tienen canonical auto-referente. Las 14 paginas sin hermana no declaran alternos, que es
  lo correcto: emparejar una guia de sanciones de la AEPD con una de la Rule 5.2 seria mentir.
- *CNAME: presente en `dist/` tras un `npm run build` a secas.* Es el punto que costo 4 dias.
- *CSP: 18/18 por meta, y cero recursos externos en las paginas construidas.* Los unicos hosts
  absolutos de los bundles son `api.gumroad.com` (egress permitido), el enlace de compra de
  Gumroad y el propio dominio.

**Decisiones y porques:**
- *El `auditor-interno` se ejecuto a mano, con su procedimiento, porque en este entorno no habia
  herramienta para lanzar subagentes.* Se dice en voz alta en vez de dejar el paso por hecho.
- *No se toco NADA de comportamiento.* Los tres hallazgos de la revision son un fallo de
  documentacion, un guardian que falta y una cita sin contrastar: ninguno justifica cambiar
  codigo en la integracion. `config.ts` no se ha tocado, asi que la fusion no cruza ninguna ruta
  sensible de precios.
- *Se corrigieron tres cifras falsas de `docs/ESTADO.md`*: decia «20 URLs (10 ES + 10 EN)» cuando
  son **18 (10 ES + 8 EN)** — el ingles no tiene las dos landings de sector, que estan congeladas
  por la PARADA 2 —, «CSP en las 20 paginas» y «616/616» cuando la suite da **614/614**. Un estado
  con cifras inventadas es peor que no tener estado: la proxima sesion lo lee como verdad.

**Hallazgo nuevo, y corrige lo que decia el estado anterior:**
`origin/gh-pages` sirve `.claude/agents/*`, `.claude/hooks/guardia.sh`, `.claude/settings.json`,
`.claude/launch.json`, `.github/pull_request_template.md`, `.gitignore` y un `public/.nojekyll`
suelto. Eso ya constaba. Lo que NO constaba, y cambia la instruccion al owner:
1. **No son credenciales.** Se busco forma de secreto en los tres ficheros: las unicas
   coincidencias son la palabra «secret» dentro de la propia lista negra del hook, y cero cadenas
   largas tipo clave. Es higiene, no incidente — decirlo importa tanto como la alarma.
2. **No se limpia solo.** `gh-pages` pasa `dot: options.dotfiles` al glob de ORIGEN (linea 111 de
   `lib/index.js`) pero NO al glob de BORRADO (linea 183). Reproducido con el propio globby
   instalado: con patron `'.'` devuelve `index.html`; con `dot:true` devuelve ademas `.gitignore`
   y `.claude/**`. **El paquete sabe subir dotfiles y no sabe borrarlos: sobreviven a todos los
   despliegues.** El estado anterior decia «limpiar la rama y volver a publicar», que se lee como
   si publicar bastara. No basta. Arreglo de una vez: `git push origin --delete gh-pages` y luego
   `npm run deploy-pages`.
   No se endurece el script de deploy: es el fichero cuya rotura costo 4 dias, el cambio no se
   puede probar sin desplegar de verdad, y el unico camino que mete esos ficheros es publicar algo
   que no sea `dist/`.

**Bloqueos / pendiente:** las seis PARADAS del owner siguen intactas en `docs/ESTADO.md` (precio y
moneda en ingles; las dos landings que venden 149 €/año y una garantia que los Terminos no
recogen; el bloque completo del aviso legal ingles; alcance de la deteccion inglesa; `CLAUDE.md`
linea 5; y la limpieza de `gh-pages`). Se añaden tres residuales verificados y NO arreglados, con
su porque, en la seccion nueva de `docs/ESTADO.md`. Auditoria Codex externa: sigue pendiente.

**Enlaces:** merge `--no-ff` de `feat/i18n-contenido-indexable` en `master`. **Sin desplegar**:
publicar es decision del owner.

---

## 2026-08-08 · ingeniero · La web en ingles, y la portada deja de publicarse vacia

**Hecho:** rama `feat/i18n-contenido-indexable`, cuatro commits.

1. *Contenido indexable.* `dist/index.html` se publicaba con el cuerpo entero vacio
   (`<body><div id="app"></div></body>`): toda la pagina la pintaba `src/main.ts`. Google ejecuta
   JavaScript, pero Bing y los rastreadores de los modelos de lenguaje veian un div vacio — y
   traducir una pagina vacia da dos paginas vacias, asi que esto BLOQUEABA el ingles. Ahora hay
   una fuente unica de contenido (`src/content/`) de la que sale el HTML estatico, y la aplicacion
   solo monta los controles interactivos en `#herramienta` y `#licencia`. Medido: el `<body>`
   construido pasa de 78 a ~10.000 caracteres de texto visible sin ejecutar JS.
2. *Maquinaria de idiomas.* Registro de paginas e idiomas (`src/content/registro.ts`) del que se
   derivan rutas, sitemap, hreflang, selector y las entradas de Vite. Los ~120 literales de cara
   al usuario pasan a un diccionario; la copia viaja por PARAMETRO (`initApp`, `buildReport`,
   `processDocument`, `construirResumen`, `renderResumen`), sin valor por defecto: un idioma sin
   cablear rompe la compilacion en vez de imprimir en español sin avisar.
3. *Ingles.* `/en/`, `/en/checker/` y seis guias `/en/guide/*`. Anadirlo fue anadir DATOS: ni una
   linea del generador sabe que existe el ingles.
4. *Guardas.* Once, cada una probada con la mutacion que la pone roja.

**Decisiones y porques:**
- *El español se queda en la RAIZ y el ingles va a `/en/`.* GitHub Pages no puede emitir un 301:
  mover las URLs españolas seria romper 10 URLs indexadas, dos verificaciones de Search Console y
  21 enlaces absolutos escritos a mano dentro de las guias, sin poder redirigir ninguna. Nunca
  rompas una URL que no puedes redirigir. La ambiguedad de `/` la resuelve `x-default`.
- *El idioma sale de la RUTA, nunca de `navigator.language`.* En un sitio sin servidor la unica
  redireccion posible es JavaScript, y ese JavaScript tambien lo ejecuta Googlebot, que rastrea
  con Accept-Language ingles: rebotaria al rastreador fuera de la unica pagina con posicionamiento
  real. Ademas contradiria la promesa del producto ("desconecta internet y compruebalo").
- *Se generan FICHEROS COMMITEADOS, no un plugin de `buildStart`.* Lo generado son textos legales,
  precios y metadatos: justo lo que hay que poder revisar en un pull request. Si la generacion
  fuese invisible dentro de `vite build`, nadie revisaria nunca el legal de un idioma nuevo.
- *Descartado prerenderizar.* `initApp` arranca como efecto de importacion y su grafo llega a
  mupdf (wasm, top-level await). Y lo que pinta en t=0 incluye ESTADO, no marketing: se congelaria
  "Modo gratuito: 0/5 documentos este mes" como contenido indexable.
- *Las guias inglesas NO son traducciones.* Una guia sobre sanciones de la AEPD a comunidades de
  propietarios no tiene audiencia inglesa y "administrador de fincas" no tiene equivalente. Se
  escriben para intencion de busqueda inglesa: Rule 5.2 (FRCP), respuestas a subject access
  requests con el historial de sanciones del ICO, y como comprobar un tachado.
- *La copia inglesa NO promete una deteccion que no existe.* De los siete detectores, SOLO el de
  correo funciona fuera de España: `iban` exige prefijo ES, `telefono` exige nueve digitos en
  rangos españoles, y dni/nie/nuss/catastro llevan digito de control español. La landing lleva un
  bloque visible con el alcance real y las etiquetas dicen "Spanish IBAN", no "IBAN". Insinuar
  cobertura britanica seria un falso verde en forma de marketing. El bloque se anade tambien en
  español (los telefonos tambien son españoles y eso no estaba dicho en ningun sitio).
- *El aviso legal ingles enlaza al español para el NIF y el domicilio* en vez de republicarlos:
  publicar esos datos en una superficie nueva es puerta del owner. El operador no cambia.
- *Vocabulario prohibido en ingles con FRONTERAS DE PALABRA.* La tecnica española (subcadenas) no
  vale: prohibir "ai" casaria con email, available, detail, again, main, fail y said. El token
  suelto "AI" se prohibe con sensibilidad a mayusculas, y "guarantee" solo cuando NO va precedido
  de una negacion — los descargos honestos necesitan poder decir "does not guarantee".

**Defectos que ya existian y se han arreglado de paso:**
- El JSON-LD de la portada decia "Gratuito (3 documentos/mes)" mientras la misma pagina decia 5
  (`FREE_MONTHLY_LIMIT = 5`): la web se contradecia ante Google. Ahora el numero sale del codigo.
- **Falso verde en el informe**: `unverifiableManualPages` se calculaba en el pipeline y se TIRABA
  (no llegaba a `ReportData`). Una caja manual sobre una pagina sin texto borra pixeles pero no
  deja nada que releer: el informe podia estampar VERIFICADO sobre un tachado que jamas fue
  verificable. Ahora tiene su seccion propia y matiza la linea del sello.
- **Falso verde en el comprobador**: un PDF entero escaneado daba `totalDatos = 0` y el titular
  decia "Este PDF contiene 0 datos personales detectables". El veredicto pasa de UNA plantilla a
  CUATRO; la rama "cero datos + paginas ilegibles" ya no dice que este limpio.
- `ALL_PATTERNS` omitia `catastro`: el informe declaraba menos patrones de los que de verdad busca.
- El documento tachado y su informe se descargaban con el MISMO nombre (`acta.pdf` y
  `acta (1).pdf`, sin saber cual era cual, y el informe ES el producto); ahora lleva sufijo.
- Erratas de superficie: "DEMO — no valido" (sin tilde) en la marca de agua a pagina completa,
  "Tachalos" en el comprobador estatico, "marches" por "marques" en el FAQ.
- La CSP estaba SOLO en 2 de las 10 paginas: las dos landings de sector y las seis guias españolas
  se publicaban sin ninguna. Ahora la llevan las 20.
- `comprobador/index.html` vive en la raiz del repo, fuera de `public/` y fuera de `index.html`:
  NINGUN guardian lo miraba, ni por vocabulario ni por CSP. El barrido nuevo recorre todo el repo.
- Enlaces raiz-absolutos (`/?utm_source=comprobador`) que con la base de emergencia
  `/tachadopdf/` apuntan fuera del sitio — justo en el modo pensado para cuando el dominio cae.
  Lo generado emite enlaces relativos al documento.
- **CNAME**: `vite build` vacia `dist/`, asi que el CNAME solo existia en la ventana entre la
  linea del script que lo escribia y la que publicaba. Cualquier otra ruta de publicacion
  (`npx gh-pages -d dist` a mano, un workflow, otro arbol) tumbaba el dominio — el mecanismo
  exacto del 404 de cuatro dias. Ahora vive en `public/CNAME`, igual que `public/.nojekyll`, y
  Vite lo copia en cada build. ⚠ SE HA TOCADO EL FLUJO DE DESPLIEGUE: el `writeFileSync` del
  script se mantiene como segunda linea (es idempotente) y `DOMINIO=0` sigue siendo el unico
  camino que lo quita.

**Metodo, para la proxima vez:** cada guarda nueva se probo con la mutacion que deberia ponerla
roja. Una dio VERDE: `hreflang.test.ts` comprobaba la salida del generador contra si misma, asi
que borrar a mano la etiqueta `hreflang="en"` de `index.html` no la rompia. Se reescribio para
leer el FICHERO DE DISCO. Sin esa comprobacion habria quedado una guarda que no guarda.
(Aviso de proceso: no usar `git checkout --` para revertir mutaciones si hay cambios sin
commitear; se lleva por delante trabajo del dia.)

**Bloqueos / pendiente:** las PARADAS del owner estan listadas en `docs/ESTADO.md` (precio y
moneda en ingles; las dos landings que venden un tramo de 149 €/año que no existe en el codigo y
una garantia de devolucion que los Terminos no recogen; alcance de la deteccion inglesa; el bloque
completo del aviso legal ingles; `CLAUDE.md` sigue diciendo "3 docs/mes + 59 €/año" y no lo he
tocado por ser el contrato del repositorio). Sin fusionar: la rama se deja para revision.
Auditoria Codex externa: pendiente. ⚠ P0 heredado y ajeno a este trabajo: `origin/gh-pages` sirve
`/.claude/settings.json` y `/.claude/hooks/guardia.sh` con 200 en el dominio comercial — limpiar
la rama y republicar ANTES de mandar trafico ingles.

**Enlaces:** rama `feat/i18n-contenido-indexable`; sin desplegar.

## 2026-07-17 · ingeniero · Tachado manual VISIBLE + hallazgo de la cuota

**Hecho:** Ángel reportó "no deja tachar en la web". Verificado en producción (www.tachadopdf.com):
DOS causas. (1) El tachado manual SÍ funcionaba (arrastrar el ratón crea la caja y se aplica al
descargar) pero NO se pintaba NADA -> el usuario dibujaba sin feedback y creía que no iba. Fix:
cajas manuales visibles (recuadro negro con «×» para deshacer, `renderManualBoxes`), cursor de
cruz, preview del recuadro al arrastrar, e instrucción visible. Verificado EN VIVO: dibujé una
caja sobre un nombre y aparece. (2) Al probar se agota la CUOTA FREEMIUM de 3 docs/mes ->
"cuota agotada, consigue Pro", que bloquea el procesado. Probable causa de la queja de Ángel
(agotó los 3 probando). DECISIÓN DE NEGOCIO PENDIENTE: ¿3/mes es demasiado poco para enganchar?
**Decisiones y porqués:** un producto de "tachar" debe DAR FEEDBACK del tachado o parece roto
(doctrina 50: verificar el artefacto vivo, no los tests). removeManualBox/manualRectsForPage con
tests. 199 tests verdes. Verificado en el dominio propio.
**Bloqueos / pendiente:** decidir el límite freemium. Pregunta estratégica del owner: diferenciación
vs Acrobat Pro (que ya redacta + limpia metadatos) — el foso es precio único + detección española
automática + sin instalar + informe; el cliente objetivo es quien NO paga Acrobat.
**Enlaces:** commit "fix(ux): tachado manual visible"; verificado https://www.tachadopdf.com/

## 2026-07-17 · ingeniero · El visor se autodestruía — arreglado el tachado en navegador
**Hecho:** el usuario reportó "la web no funciona, no se puede tachar". Reproducido en el navegador (los tests de Node no lo veían). Codex (review, otra familia de modelos) localizó la causa: `renderHitOverlay` (src/ui/viewer.ts) hacía `container.innerHTML=''`, borrando la <img> y el <canvas> del visor → el canvas de tachado quedaba fuera del DOM. Arreglado (borrar solo `.hit-box`). Codex cazó 3 más: escaneos omitidos del visor (quitado el `continue`), errores async tragados (try/catch visible), y un bug que YO introduje al arreglar los escaneos (rótulo desalineaba el canvas → sacado fuera del pageContainer). + reset de fileInput.value.
**Decisiones y porqués:** verificación obligatoria en NAVEGADOR real con flujo completo, no solo vitest en Node (doctrina 50 de la casa: el artefacto vivo). Test de regresión en happy-dom (viewer.test.ts) que falla con el bug y pasa con el fix.
**Bloqueos / pendiente:** ninguno técnico. Para cobrar: Payouts de Gumroad (owner) + DNS del dominio (owner).
**Enlaces:** commits del 17-jul; verificado en https://niunmetro.github.io/tachadopdf/

## 2026-07-16 · sistema · Siembra del repo (estreno end-to-end de la sede)

**Hecho:** repo sembrado con la plantilla-sello de la sede (CLAUDE.md adaptado, hooks, subagentes, CI), `idea.txt` con la spec v1 cerrada por el comité, motor FORJA duplicado en `forja/` y `forja.yaml` configurado. ESTADO.md con el objetivo vigente.

**Decisiones y porqués:** TachadoPDF ganó la selección multi-agente (20 ideas → filtro anti-Excel con búsqueda web → matriz 9 criterios → verificación adversarial ×3 → comité con doctrina). Elegido sobre PsicoInfinito (71, muerto por Mom Test: el diferenciador ya existía a 29,95 € pago único) y RemesaFácil (68, aparcado: exige una remesa bancaria real imposible de validar desde la fábrica). Núcleo probado por spike empírico ANTES de decidir: mupdf-wasm borra texto del content stream, sobrevive fragmentación de Word, limpia metadatos. Decisiones estructurales del comité: vender el INFORME (no el tachado), nicho primario administradores de fincas/gestorías/RRHH (no abogados: SERP colonizada), licencia AGPL-3.0 asumida (mupdf), vocabulario legal restringido (nada de "anonimización/certifica/RGPD garantizado/IA"), anti-falso-verde como test bloqueante, sin OCR ni NER en v1.

**Bloqueos / pendiente:** lanzar `forja plan` + `forja run`. Auditoría Codex sin cupo hasta ~2026-07-22 (advisory; se anota pendiente).

**Enlaces:** acta de selección en la sede (`tablero/feed.md`, sesión 2026-07-16) · spec: `idea.txt` · pasos de monetización: `MONETIZACION.md`
