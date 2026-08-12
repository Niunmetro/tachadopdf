# SEO-EXPERIMENTO — Landings de cola larga sectorial

> Documento de DISTRIBUCIÓN, no de ingeniería. Su único trabajo es fijar de antemano cómo se lee
> el resultado, para que a las 2-4 semanas la decisión sea un umbral y no una corazonada.

## Qué se probó y por qué

TachadoPDF tiene 0 ventas y el embudo se rompe **arriba, en adquisición** (109 impresiones de Ads
en 12 días). El diagnóstico cruzado midió el error de fondo: apuntábamos a «tachar», que casi nadie
teclea. La gente SÍ busca el problema, con otras palabras y **por sector**. La cabeza («censurar
pdf», «ocultar información pdf») la poseen los gigantes (Smallpdf, iLovePDF, HiPDF, Wondershare,
Adobe) y es inganable. El hueco ganable es la **cola larga sectorial española**, donde ellos son
genéricos y nosotros específicos.

Se publicaron **cinco landings**, una por consulta, **genuinamente distintas** (medido: parecido
Jaccard de 3-gramas máximo 0,074 contra las guías existentes y 0,061 entre ellas; lo ata
`src/content/landings-keyword.test.ts`). No son plantillas rellenadas con la keyword cambiada — eso
es «scaled content abuse» y Google lo penaliza tumbando el tráfico.

## Las cinco páginas, su consulta y de dónde sale

Todas en `/guia/…`, generadas por `src/content/generar.ts` (heredan sistema visual, CSP, favicon,
canonical, sitemap). Cada validación de keyword se hizo con búsquedas reales el 2026-08-10.

| # | URL | Consulta objetivo | Sector | Por qué es hueco (evidencia de la SERP) |
|---|-----|-------------------|--------|------------------------------------------|
| 1 | `/guia/ocultar-datos-personales-curriculum-pdf/` | «ocultar datos personales de un currículum / CV en PDF antes de enviarlo» | RRHH / selección + quien busca empleo | La SERP la ocupan blogs de LOPD y de plantillas de CV (protecciondatos-lopd.com/Atico34, cvwizard, misscv, pdfFiller); **ningún gigante de redacción de PDF aparece** para la consulta sectorial. |
| 2 | `/guia/ocultar-datos-terceros-documentos-juicio-pdf/` | «ocultar datos de terceros al aportar documentos como prueba en PDF» | Abogacía / procuradores | SERP de guías institucionales de censura de documentos (UGR, UIB, AEPD proactividad) y doctrina jurídica; intención de tarea, competencia = guías, no producto. |
| 3 | `/guia/censurar-pdf-antes-de-publicarlo-internet/` | «cómo censurar un PDF antes de publicarlo en internet (datos de terceros)» | Sector público, universidades, asociaciones, clubes | Confirmado por guías oficiales de publicación (UGR «Guía para la censura de documentos PDF en la Universidad», AEPD); no rankea ninguna herramienta SaaS de redacción. |
| 4 | `/guia/ocultar-datos-alumnos-pdf/` | «ocultar los datos de los alumnos en un PDF (listas, notas, actas)» | Educación / centros de enseñanza (menores) | SERP de protección de datos sanitaria/educativa institucional (AEPD, guías autonómicas); sector con protección reforzada de menores y sin herramienta específica. |
| 5 | `/guia/tapar-datos-copia-dni-tramite/` | «qué tapar en una copia del DNI antes de enviarla para un trámite» | Particular / consumo (alquiler, altas, registros) | SERP de OCU, Vodafone, protegemidni.es, ANOVO («cómo compartir el DNI de forma segura») — intención clara, giro de *minimización* distinto a la guía existente de mecanismo. |

**Fuentes de la validación (búsquedas del 2026-08-10):**
- CV: `pdffiller.com/es/…/cv-delete-data`, `protecciondatos-lopd.com/empresas/curriculums-datos-personales-candidatos/`, `cvwizard.com/es/articulos/curriculum-rgdp`
- Juicio / terceros: `blogs.ugr.es/seguridadinformatica/36-como-ocultar-los-datos-personales…`, `secretariageneral.ugr.es/…/Herramientas censura documentos_DEF.pdf`, `noticias.juridicas.com/…/6219…`
- Publicar: mismas guías UGR/UIB + `aepd.es/documento/premio-proactividad-y-buenas-practicas-2023…`
- Alumnos: `protecciondatos-lopd.com/empresas/sanitarios/`, `ayudaleyprotecciondatos.es/sanitarios/`, `aepd.es/areas-de-actuacion/salud/…` (patrón institucional, sin herramienta)
- Copia DNI: `ocu.org/…/compartir-dni-con-seguridad`, `ayudacliente.vodafone.es/…/consejos-para-enviar-copias-seguras-de-tu-dni/`, `protegemidni.es`

### Consultas descartadas (y por qué)
- **«censurar PDF sin subir a internet» / «alternativa local a Smallpdf»**: cabeza dominada por
  gigantes Y ya la cubre la guía existente `tachar-pdf-sin-subir-internet`. Duplicaría.
- **Gestoría / asesoría enviando documentación, y «nómina/vida laboral para el casero»**: la guía
  existente `enviar-nominas-pdf-datos-personales` ya cubre gestoría/RRHH y dice literalmente «nómina
  para un banco o un alquiler». Habría sido casi-duplicado.
- **Informe médico / datos sanitarios**: la SERP es de DERECHOS del paciente (AEPD, Ministerio),
  no de tarea de redacción; intención floja para el producto y sector sensible.

## La tensión de vocabulario, resuelta

«anonimizar/anonimización» y «certificar/certificado» están prohibidas en el producto (implican una
garantía de cumplimiento que no damos) y, en el código, `src/guard.test.ts` **veta el substring**
`anonimiz`/`certific` en todo `.ts` de `src/` y todo `.html` de `public/`. La regla de la tarea
permitía usarlas en modo informativo (title/H1) y anotarlo para ratificación del comité.

**Decisión tomada: NO se usa ninguna de las dos, ni siquiera en modo informativo.** Motivo: relajar
un guardián no negociable (con base legal) para colar una keyword de marketing es justo el
antipatrón «guardarraíles que no guardan». Y no hace falta: la demanda ganable se teclea con verbos
**permitidos** que las SERPs confirman —«censurar», «ocultar», «borrar», «tapar», «quitar»—, y
«anonimizar» es además terreno de competencia real (Anonimatum, Nymiz). El producto se sigue
describiendo con «borrado real de datos» y «detección automática por patrones». **Nada que
ratificar**: no se tocó el vocabulario prohibido. Si algún día el comité quiere capturar «anonimizar»
en modo informativo, requeriría un cambio explícito y acotado de `guard.test.ts`, no un descuido.

## La métrica — por qué esto es distribución

No hay analítica en la web (por diseño: es parte del pitch verificable). **El juez es Google Search
Console**, métrica **Impresiones orgánicas** de estas 5 URLs.

- **Fecha de despliegue:** 2026-08-10.
- **Prerrequisito antes de leer el veredicto (control de confusión):** en GSC, comprobar en
  «Indexación de páginas» que las 5 URLs están **indexadas**. El sitemap ya las incluye (23 URLs).
  Si a las 2 semanas NO están indexadas, el problema es de indexación (rastreo), **no de demanda**:
  se solicita indexación de las 5 URLs y se reinicia el reloj. No se lee la demanda sobre páginas
  que Google todavía no conoce.

### Umbral de decisión (fecha y cifra, no «ya veremos»)

Ventana: 4 semanas desde el deploy. Lectura **direccional a 2 semanas (2026-08-24)**, **veredicto a
4 semanas (2026-09-07)**.

- **VALIDA el canal de cola larga sectorial** — hay demanda medible que perseguir:
  **≥ 30 impresiones orgánicas acumuladas** en las 5 URLs en 4 semanas, con **al menos 2 de las 5
  páginas** recibiendo impresiones (para no colgar la señal de una sola consulta). Cualquier clic es
  bonus. → Se itera: se doblan las páginas de las consultas que sí imprimieron y se afinan títulos.
- **ZONA GRIS** — demanda latente, no muerta: **1-29 impresiones**. → No se mata: se reescriben
  títulos/meta y se añade cobertura a la consulta viva, y se vuelve a medir a 4 semanas más.
- **MATA el canal (con fundamento, no por corazonada):** **0 impresiones** en las 5 URLs a 4
  semanas **estando indexadas**. Que Google no nos muestre NI UNA VEZ para su propia consulta
  sectorial, teniendo la página indexada, es la señal de que ni la cola larga sectorial tiene
  demanda medible en España. → Entonces el problema no es el envoltorio: es el mercado. Se reconsidera
  el producto/segmento (p. ej. el pivote a justicia/sentencias del Plan B del PLAN_14D), con dato.

### Nota honesta sobre el alcance de la señal
- 0 impresiones **mata el canal SEO**, no necesariamente el producto: el outbound (PLAN_14D) es un
  canal distinto con su propio veredicto.
- Impresiones **no** son ventas. Miden que la demanda existe y que aparecemos; convertir es la
  siguiente capa. Pero sin impresiones no hay nada que convertir, y ese es el fallo que hoy se mide.
- El mercado inglés se analizó y es más difícil: estas 5 son **solo en español** a propósito.

## Registro de lectura (rellenar en cada checkpoint)

| Fecha | Indexadas (de 5) | Impresiones (4 sem, acum.) | Páginas activas | Clics | Lectura |
|-------|------------------|----------------------------|-----------------|-------|---------|
| 2026-08-24 (direccional) | | | | | |
| 2026-09-07 (veredicto)   | | | | | |

---

# Pieza de autoridad / AEO — «¿Se puede recuperar el texto tachado de un PDF?»

> Segundo experimento, de TIPO distinto al de arriba. Las cinco landings persiguen la **tarea por
> sector** («ocultar datos de un CV / de un juicio / de una copia del DNI»). Esta pieza persigue la
> **curiosidad y el miedo**: gente que YA sospecha que un tachado puede fallar y teclea «¿se puede
> recuperar un texto tachado?», «el negro se quita», «copiar el texto de debajo». Capta al curioso y
> asusta con hechos al profesional, que es el comprador. No es un casi-duplicado de las cinco
> (medido: Jaccard de 3-gramas **máximo 0,036** contra ellas y **0,029** contra las seis guías; lo
> ata `landings-keyword.test.ts`, que la barre sola por ser generada en español).

## Qué se probó y por qué es un hueco

La SERP de la intención de recuperación («recuperar texto tachado pdf», «el tachado negro se puede
quitar / copiar el texto de debajo») la ocupan blogs de los gigantes (Smallpdf, Adobe, pdfFiller,
PDFgear) con una respuesta **binaria y tranquilizadora**: «las herramientas profesionales borran de
verdad, las anotaciones se quitan». **Nadie publica el ESTUDIO por métodos**: qué tipos de tachado
fallan, cómo, y qué rastro deja incluso uno hecho bien. Ese es el hueco de **AEO** (regla 55): ser
la **fuente citable** sobre los tipos de fallo del tachado, no una guía genérica más.

- **Búsquedas de validación (2026-08-12):** `recuperar texto tachado pdf` (SERP de blogs how-to, sin
  estudio); `el tachado negro de un pdf se puede quitar / copiar texto debajo` (misma familia); la
  variante inglesa (`copy text from redacted pdf`, `redaction failed`) está **muy poblada** por
  sitios de autoridad dedicados (piiblackout, redactifyai, unredact) → **ES a propósito**, igual que
  las cinco de arriba.

## Los datos propios y las fuentes (regla 55 + juez, cifra con fuente)

- **Dato propio, medido en `src/pdf/*.test.ts`** (banco de PDF de datos inventados): el hueco de
  glifos vale **61,765 pt** para un DNI en Helvetica 11 y **20 nombres → 20 anchuras distintas**
  (`hueco-de-glifos.test.ts`); seis tipos de escondite reproducidos y atados (recuadro superpuesto,
  hueco de glifos, página escaneada, marcador, adjunto/metadatos, capa apagada).
- **Fuente pública citada con fecha:** arXiv **2206.02285** «Glyph Positions Break PDF Text
  Redaction» (2022; 11 herramientas, Acrobat incluida; cientos de PDF reales des-tachados); caso
  **Manafort, 8-ene-2019** (escrito judicial con el tachado legible por copiar-pegar).
- **Límite propio declarado:** el hueco de glifos **también nos afecta** (nuestro motor conserva la
  capa de texto). La pieza lo dice; la honestidad es el argumento.

## La métrica — GSC, misma que la cohorte

Sin analítica en la web (por diseño). **Juez = Google Search Console**, métrica **Impresiones
orgánicas** de la URL `https://www.tachadopdf.com/guia/recuperar-texto-tachado-pdf/`.

- **Fecha de despliegue:** 2026-08-12.
- **Prerrequisito (control de confusión):** en «Indexación de páginas», comprobar que la URL está
  **indexada** antes de leer la demanda. El sitemap ya la incluye (24 URLs). Si a las 2 semanas no
  está indexada, se solicita indexación y se reinicia el reloj: no se lee demanda sobre una página
  que Google todavía no conoce.
- **Señal secundaria de AEO (cualitativa, no decide sola):** preguntar a un motor generativo «¿se
  puede recuperar un texto tachado de un PDF?» y ver si cita la página. Es indicativa, no el juez.

### Umbral de decisión (fecha y cifra)

Es **una** página, no cinco: el bar es proporcional. Lectura **direccional a 2026-08-24**,
**veredicto a 2026-09-07** (≈26 días vivos).

- **VALIDA la intención de recuperación/autoridad:** **≥ 10 impresiones orgánicas acumuladas** a
  2026-09-07 por una consulta de la familia de recuperación, **estando indexada**. Cualquier clic es
  bonus. → Se itera: pieza compañera (p. ej. «cómo tachar de verdad un PDF») y afinar el título.
- **ZONA GRIS:** **1-9 impresiones** → se reescriben título/meta y se vuelve a medir a 4 semanas más.
- **MATA esta intención (con fundamento):** **0 impresiones estando indexada** a 2026-09-07. Que
  Google no nos muestre NI UNA VEZ para su propia consulta de recuperación, con la página indexada,
  dice que ni esta intención tiene demanda medible que persigamos en español. → No se reescribe: se
  acepta que el ángulo de autoridad no capta por búsqueda y se reconsidera.

### Nota honesta sobre el alcance
- Impresiones **no** son ventas ni citas de IA generativa: miden que la demanda existe y aparecemos.
- El bar (10) es más bajo que el de la cohorte (30) porque es **una** URL, no cinco; misma exigencia
  por página, no menos.

### Registro de lectura (rellenar en cada checkpoint)

| Fecha | Indexada (sí/no) | Impresiones (acum.) | Consulta real | Clics | Citada por IA gen. | Lectura |
|-------|------------------|---------------------|---------------|-------|--------------------|---------|
| 2026-08-24 (direccional) | | | | | | |
| 2026-09-07 (veredicto)   | | | | | | |
