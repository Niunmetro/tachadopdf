# ESTADO.md — Fotografía actual de TachadoPDF

> Regla: este archivo dice la VERDAD ACTUAL en 2 minutos de lectura. Lo mantiene el subagente `documentador`. La historia va en BITACORA.md; aquí solo el presente.

## Objetivo vigente
Primera licencia Pro (59 €/año) vendida a un desconocido vía Gumroad. Fase: **VIVO en producción** — https://niunmetro.github.io/tachadopdf/ (repo público `Niunmetro/tachadopdf`, AGPL-3.0). Verificado desde internet sin errores. Falta activar el cobro (Gumroad) y los datos fiscales del Aviso Legal: pasos de Ángel en MONETIZACION.md.

## Qué funciona hoy (verificado)
- v1 construida por el motor (run 1, 13 tareas + reparación automática del consolidado) y v2 con los 15 hallazgos de la revisión adversarial corregidos (run 2, 10 tareas). **193 tests, typecheck y build en verde.**
- **Verificado en navegador real** (build servido, no solo tests): la app carga sin errores de consola, mupdf-wasm instancia, y se muestran el aviso principal, el contador freemium (3/mes), el checkbox de revisión visual y los tres textos legales completos (Aviso Legal LSSI art. 10 con placeholders, Términos, Privacidad).
- Núcleo anti-falso-verde reforzado: informe acoplado a la verificación real (fin del "0 ocurrencias" hardcodeado), lote sin last-write-wins, visor cableado + tachado manual verificado, purga real de metadatos (bytes, no solo desvincular XMP), página escaneada mixta advertida, teléfonos/IBAN/NUSS con separadores, licencia Gumroad fail-closed, y `verify` opcional con semántica fail-safe (ausencia = nunca verde).

## Qué NO funciona / falta para cobrar (todo son pasos de Ángel, ver MONETIZACION.md)
- Gumroad: crear "TachadoPDF Pro" 59 €/año, generar claves de licencia, pegar product_id/permalink en `src/config.ts` (hoy con placeholders).
- Rellenar datos fiscales del Aviso Legal (placeholders [NOMBRE]/[NIF]/[DOMICILIO]/[EMAIL]).
- Screening OEPM del nombre; dominio + Cloudflare Pages (producción recomendada).

## Arquitectura en una línea
Vite + TypeScript estricto + Vitest · motor PDF mupdf (wasm, 100% local) + pdf-lib · sin servidor · licencia repo AGPL-3.0 · Pro por API de Gumroad (único egress; CSP con `wasm-unsafe-eval` para mupdf, `connect-src` limitado a Gumroad).

## Variables de entorno necesarias
- Ninguna en runtime. `VITE_BASE=/tachadopdf/` solo la usa el script de deploy a Pages. Gumroad product_id/permalink van en `src/config.ts` (público por diseño).

## Ciclos activos
- Ciclo diario: NO · Soporte: NO · Growth semanal: NO. Estado LANZADO: revisión semanal del comité; el siguiente hito es el primer cobro (Gumroad, paso de Ángel).

## Puertas y límites vigentes
Datos fiscales y textos legales = APROBADO-ANGEL · vocabulario prohibido (anonimización/certifica/RGPD garantizado/IA) verificado ausente · falso verde = fallo bloqueante · repo PÚBLICO obligatorio (AGPL mupdf).
