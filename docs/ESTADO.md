# ESTADO.md — Fotografía actual de TachadoPDF

> Regla: este archivo dice la VERDAD ACTUAL en 2 minutos de lectura. Lo mantiene el subagente `documentador`. La historia va en BITACORA.md; aquí solo el presente.

## Objetivo vigente
Primera licencia Pro (59 € pago único) vendida a un desconocido. Fase: **A LA VENTA** — la web funciona (https://niunmetro.github.io/tachadopdf/) y **el cobro está abierto**: producto Gumroad PUBLICADO con Payouts conectado (botón "Buy this" activo, verificado 2026-07-17). El circuito técnico está cerrado de punta a punta. El cuello de botella ahora es **tráfico**, no producto.

## Qué funciona hoy (verificado EN EL NAVEGADOR de producción, 2026-07-17)
- **FLUJO COMPLETO end-to-end en la web viva**: subir PDF → visor con imagen + detecciones (DNI/IBAN/teléfono marcados) → checkbox → descargar → el documento tachado y el informe NO contienen ninguno de los datos (comprobado sobre los bytes de los blobs descargados). Cero errores de consola.
- **BUG CRÍTICO resuelto (lo que hacía "la web no funciona")**: el visor se autodestruía (`renderHitOverlay` hacía `container.innerHTML=''` y borraba imagen+canvas → el usuario no podía tachar). Cazado por Codex, no por los tests de Node. Ver BITACORA.
- v1 construida por el motor (run 1, 13 tareas + reparación automática del consolidado) y v2 con los 15 hallazgos de la revisión adversarial corregidos (run 2, 10 tareas). **193 tests, typecheck y build en verde.**
- **Verificado en navegador real** (build servido, no solo tests): la app carga sin errores de consola, mupdf-wasm instancia, y se muestran el aviso principal, el contador freemium (3/mes), el checkbox de revisión visual y los tres textos legales completos (Aviso Legal LSSI art. 10 con placeholders, Términos, Privacidad).
- Núcleo anti-falso-verde reforzado: informe acoplado a la verificación real (fin del "0 ocurrencias" hardcodeado), lote sin last-write-wins, visor cableado + tachado manual verificado, purga real de metadatos (bytes, no solo desvincular XMP), página escaneada mixta advertida, teléfonos/IBAN/NUSS con separadores, licencia Gumroad fail-closed, y `verify` opcional con semántica fail-safe (ausencia = nunca verde).

## Monetización — HECHO
- Gumroad "TachadoPDF Pro" 59 € pago único: publicado, claves de licencia activas, product_id
  cableado en `src/config.ts` y **verificado empíricamente contra la API real**. Botón de compra
  en la app (`#comprar-pro`). Payouts conectado por Ángel. **Se puede pagar hoy.**
- Aviso Legal: titular y NIF reales puestos. Datos fiscales verificados.

## Growth — motor de tráfico montado (2026-07-17)
- **SEO on-page**: title, meta description, Open Graph, JSON-LD, robots, sitemap. Apuntan a la URL
  viva (se migrarán al dominio cuando resuelva el DNS).
- **Google Search Console**: propiedad `niunmetro.github.io/tachadopdf/` VERIFICADA (meta tag);
  sitemap referenciado en robots.txt. Datos de rendimiento: "procesando, vuelve mañana".
- **3 guías SEO long-tail** vivas en `/guia/*` (tachar un DNI, el rectángulo negro no borra, datos
  en actas de comunidad), enlazadas desde la app y en el sitemap. Es el canal orgánico gratuito.

## Qué falta (honesto)
- **Tráfico.** El SEO tarda semanas/meses; el primer cobro rápido vendría de un empujón directo en
  un canal del nicho (grupo de administradores de fincas/gestorías). Ver `docs/GROWTH.md`.
- **Dominio www.tachadopdf.com**: comprado (IONOS), DNS sin configurar (CNAME www → niunmetro.github.io).
  Requiere login de Ángel en IONOS (barrera de contraseña). No bloquea el cobro.
- **Google Search Console**: dar de alta también la propiedad del dominio cuando el DNS resuelva.
- Screening OEPM del nombre (pendiente de Ángel, no bloquea).

## Arquitectura en una línea
Vite + TypeScript estricto + Vitest · motor PDF mupdf (wasm, 100% local) + pdf-lib · sin servidor · licencia repo AGPL-3.0 · Pro por API de Gumroad (único egress; CSP con `wasm-unsafe-eval` para mupdf, `connect-src` limitado a Gumroad).

## Variables de entorno necesarias
- Ninguna en runtime. `VITE_BASE=/tachadopdf/` solo la usa el script de deploy a Pages. Gumroad product_id/permalink van en `src/config.ts` (público por diseño).

## Ciclos activos
- Ciclo diario: NO · Soporte: NO · Growth semanal: NO. Estado LANZADO: revisión semanal del comité; el siguiente hito es el primer cobro (Gumroad, paso de Ángel).

## Puertas y límites vigentes
Datos fiscales y textos legales = APROBADO-ANGEL · vocabulario prohibido (anonimización/certifica/RGPD garantizado/IA) verificado ausente · falso verde = fallo bloqueante · repo PÚBLICO obligatorio (AGPL mupdf).
