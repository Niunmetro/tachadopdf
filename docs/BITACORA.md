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

## 2026-07-16 · sistema · Siembra del repo (estreno end-to-end de la sede)

**Hecho:** repo sembrado con la plantilla-sello de la sede (CLAUDE.md adaptado, hooks, subagentes, CI), `idea.txt` con la spec v1 cerrada por el comité, motor FORJA duplicado en `forja/` y `forja.yaml` configurado. ESTADO.md con el objetivo vigente.

**Decisiones y porqués:** TachadoPDF ganó la selección multi-agente (20 ideas → filtro anti-Excel con búsqueda web → matriz 9 criterios → verificación adversarial ×3 → comité con doctrina). Elegido sobre PsicoInfinito (71, muerto por Mom Test: el diferenciador ya existía a 29,95 € pago único) y RemesaFácil (68, aparcado: exige una remesa bancaria real imposible de validar desde la fábrica). Núcleo probado por spike empírico ANTES de decidir: mupdf-wasm borra texto del content stream, sobrevive fragmentación de Word, limpia metadatos. Decisiones estructurales del comité: vender el INFORME (no el tachado), nicho primario administradores de fincas/gestorías/RRHH (no abogados: SERP colonizada), licencia AGPL-3.0 asumida (mupdf), vocabulario legal restringido (nada de "anonimización/certifica/RGPD garantizado/IA"), anti-falso-verde como test bloqueante, sin OCR ni NER en v1.

**Bloqueos / pendiente:** lanzar `forja plan` + `forja run`. Auditoría Codex sin cupo hasta ~2026-07-22 (advisory; se anota pendiente).

**Enlaces:** acta de selección en la sede (`tablero/feed.md`, sesión 2026-07-16) · spec: `idea.txt` · pasos de monetización: `MONETIZACION.md`
