# ESTADO.md — Fotografía actual de TachadoPDF

> Regla: este archivo dice la VERDAD ACTUAL en 2 minutos de lectura. Lo mantiene el subagente `documentador`. La historia va en BITACORA.md; aquí solo el presente.

## Objetivo vigente
Primera licencia Pro (59 € pago único) vendida a un desconocido. Fase: **A LA VENTA** — la web funciona en el DOMINIO PROPIO **https://www.tachadopdf.com** (HTTPS, verificado 200 + app cargando sin errores; niunmetro.github.io/tachadopdf/ redirige a él) y **el cobro está abierto**: producto Gumroad PUBLICADO con Payouts conectado (botón "Buy this" activo, verificado 2026-07-17). El circuito técnico está cerrado de punta a punta. El cuello de botella ahora es **tráfico**, no producto.

## Qué funciona hoy (verificado EN EL NAVEGADOR de producción, 2026-07-17)
- **FLUJO COMPLETO end-to-end en la web viva**: subir PDF → visor con imagen + detecciones (DNI/IBAN/teléfono marcados) → checkbox → descargar → el documento tachado y el informe NO contienen ninguno de los datos (comprobado sobre los bytes de los blobs descargados). Cero errores de consola.
- **BUG CRÍTICO resuelto (lo que hacía "la web no funciona")**: el visor se autodestruía (`renderHitOverlay` hacía `container.innerHTML=''` y borraba imagen+canvas → el usuario no podía tachar). Cazado por Codex, no por los tests de Node. Ver BITACORA.
- v1 construida por el motor (run 1, 13 tareas + reparación automática del consolidado) y v2 con los 15 hallazgos de la revisión adversarial corregidos (run 2, 10 tareas). **193 tests, typecheck y build en verde.**
- **Verificado en navegador real** (build servido, no solo tests): la app carga sin errores de consola, mupdf-wasm instancia, y se muestran el aviso principal, el contador freemium (3/mes), el checkbox de revisión visual y los tres textos legales completos (Aviso Legal LSSI art. 10 con placeholders, Términos, Privacidad).
- Núcleo anti-falso-verde reforzado: informe acoplado a la verificación real (fin del "0 ocurrencias" hardcodeado), lote sin last-write-wins, visor cableado + tachado manual verificado, purga real de metadatos (bytes, no solo desvincular XMP), página escaneada mixta advertida, teléfonos/IBAN/NUSS con separadores, licencia Gumroad fail-closed, y `verify` opcional con semántica fail-safe (ausencia = nunca verde).

## Monetización — HECHO
- Gumroad "TachadoPDF Pro" 59 € pago único: publicado, claves de licencia activas, product_id
  cableado y **verificado contra la API real**. Botón de compra en la app. Payouts conectado.
  **Se puede pagar hoy.** VERIFICADO nuestro lado: una clave válida activa Pro (ilimitado, sin
  marca, oculta el botón de compra). PENDIENTE (limitación técnica: la SPA de Gumroad bloquea la
  extensión): confirmar con una compra REAL que la clave llega por email — paso de 2 min de Ángel.
- **Robustez probada con PDF real** (test permanente `src/pdf/real-pdf.test.ts`): acta de comunidad
  de 2 páginas con DNI/IBAN/teléfono/NIE/NUSS/email en formatos variados → detecta todo, tacha, y
  el PDF final no contiene ninguno de los valores (verify.clean).
- Aviso Legal: titular y NIF reales puestos. Datos fiscales verificados.

## Growth — motor de tráfico montado (2026-07-17/18)
- **Dominio propio VIVO**: www.tachadopdf.com (HTTPS) y el apex tachadopdf.com redirige a él.
- **SEO on-page** completo apuntando al dominio. **Google Search Console** verificado + sitemap.
- **4 guías SEO long-tail** vivas en `/guia/*` (tachar un DNI, el rectángulo negro no borra, datos
  en actas de comunidad, tachar sin subir a internet), enlazadas desde la app y en el sitemap.
- **Límite gratis subido a 5 docs/mes** (menos fricción para probar).

## Qué falta (honesto)
- **Tráfico.** El SEO tarda semanas/meses; el primer cobro rápido vendría de un empujón directo en
  un canal del nicho (grupo de administradores de fincas/gestorías). Ver `docs/GROWTH.md`.
- **Dominio www.tachadopdf.com: CONFIGURADO Y VIVO** (2026-07-17). CNAME www → niunmetro.github.io
  + A del apex → 185.199.108.153 (GitHub Pages) hechos en IONOS; custom domain + CNAME file en
  GitHub Pages; SEO migrado al dominio. `tachadopdf.com` sin www propagando (TTL 1h).
- **Google Search Console**: propiedad de niunmetro.github.io verificada; falta añadir la del
  dominio www.tachadopdf.com (el meta de verificación ya está en su home).
- Screening OEPM del nombre (pendiente de Ángel, no bloquea).

## Arquitectura en una línea
Vite + TypeScript estricto + Vitest · motor PDF mupdf (wasm, 100% local) + pdf-lib · sin servidor · licencia repo AGPL-3.0 · Pro por API de Gumroad (único egress; CSP con `wasm-unsafe-eval` para mupdf, `connect-src` limitado a Gumroad).

## Variables de entorno necesarias
- Ninguna en runtime. `VITE_BASE=/tachadopdf/` solo la usa el script de deploy a Pages. Gumroad product_id/permalink van en `src/config.ts` (público por diseño).

## Ciclos activos
- Ciclo diario: NO · Soporte: NO · Growth semanal: NO. Estado LANZADO: revisión semanal del comité; el siguiente hito es el primer cobro (Gumroad, paso de Ángel).

## Puertas y límites vigentes
Datos fiscales y textos legales = APROBADO-ANGEL · vocabulario prohibido (anonimización/certifica/RGPD garantizado/IA) verificado ausente · falso verde = fallo bloqueante · repo PÚBLICO obligatorio (AGPL mupdf).
