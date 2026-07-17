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
