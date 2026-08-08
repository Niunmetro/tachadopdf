# Bitácora de TachadoPDF

Memoria compartida del proyecto. Cada sesión de trabajo añade su entrada AL PRINCIPIO.
Formato fijo. Sin secretos, sin datos de clientes.

---

## AAAA-MM-DD · [rol: ingeniero|growth|soporte|auditoría] · [título corto]
**Hecho:** ...
**Decisiones y porqués:** ... (alternativas descartadas incluidas)
**Bloqueos / pendiente:** ...
**Enlaces:** issue #, PR #, deploy

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
