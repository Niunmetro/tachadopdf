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
