# ESTADO.md — Fotografía actual de TachadoPDF

> Regla: este archivo dice la VERDAD ACTUAL en 2 minutos de lectura. Lo mantiene el subagente `documentador`. La historia va en BITACORA.md; aquí solo el presente.

## Objetivo vigente
Primera licencia Pro (59 €/año) vendida a un desconocido vía Gumroad. Fase: construcción v1 con el motor FORJA (repo recién sembrado, run inicial pendiente de lanzar).

## Qué funciona hoy
- Nada aún: repo sembrado 2026-07-16 con la plantilla-sello de la sede + `idea.txt` cerrado por el comité (spec v1 completa con criterios de aceptación verificables).
- El núcleo técnico está probado por spike previo (fuera del repo): mupdf-wasm borra texto del content stream, sobrevive fragmentación de Word y limpia metadatos con pdf-lib.

## Qué NO funciona / falta para cobrar
- Toda la v1 (ver alcance exacto en `idea.txt`): carga, detección por patrones españoles con checksum, visor con tachado, borrado real, verificación anti-falso-verde, informe de comprobación, freemium + licencia Gumroad, landing y textos legales.
- Pasos de Ángel tras la construcción: producto Gumroad, aviso legal LSSI, screening OEPM del nombre, dominio + Cloudflare Pages (ver `MONETIZACION.md`).

## Arquitectura en una línea
Vite + TypeScript estricto + Vitest · motor PDF mupdf (wasm, 100% local) + pdf-lib para metadatos · sin servidor · licencia repo AGPL-3.0 · Pro por API de Gumroad (único egress permitido).

## Variables de entorno necesarias
- Ninguna. El product_id/permalink de Gumroad va en `src/config.ts` (público por diseño).

## Ciclos activos
- Ciclo diario: NO activado aún · Soporte: NO · Growth semanal: NO (primero: construir v1)

## Puertas y límites vigentes
Etiqueta APROBADO-ANGEL en precios/legales · vocabulario prohibido (anonimización/certifica/RGPD garantizado/IA) · falso verde = fallo bloqueante · ver CLAUDE.md.
