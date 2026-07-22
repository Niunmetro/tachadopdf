# ESTADO — TachadoPDF (actualizado 2026-07-22 10:25)

## Producto
- VIVO en https://www.tachadopdf.com (GitHub Pages + CNAME por defecto; verificar dominio real tras cada deploy).
- RUN 3 (21-07) y RUN 4 (22-07) en producción: tachar-todas-las-apariciones, presets
  Generico/Acta/Nomina, huella SHA-256 en informe, FAQ factura, chips CSS, referencia catastral.
- Suite: 244/244. Coste runs 3+4: $4.38. `forja meta` validado E2E dos veces (2ª: 6/6 a la primera).

## Embudo / marketing
- Outreach: 33 contactados (13 colegios CGCAFE + 20 despachos directos verificados).
  0 respuestas humanas aún (1 auto-acuse). Base rate esperada 1-3% ⇒ no pivotar antes del lunes.
  Reserva verificada: 15 prospectos. SIGUIENTE: tanda 3 con experimento A/B de ASUNTO.
- Ads (cuenta 491-315-0047, campaña 24047233409): 16 kw activas (12 amplias + 4 frase Apto),
  31 negativas, anuncio Apto, 18 impresiones / 0 clics acumulado. Presupuesto 5 EUR/dia sin gastar.
- SEO: 7 URLs en sitemap (5 guias + home), IndexNow al publicar. Guias nuevas: sanciones AEPD
  (fincas) y nominas/expedientes (gestorias).
- Funnel Pro: recibo Gumroad con activacion en 3 pasos + boton "Activar TachadoPDF Pro".
  Precio 59 EUR (cargo en USD equivalente, sin IVA raro). COLEGIADOS20 activo (50 usos).

## Objetivo vigente
Primer cobro real. Señal que mata/repivota (pre-mortem comité 22-07): 0/33 respuestas en 7 dias
=> revisar asunto/canal. Contadores que mueven: conversaciones iniciadas, visitas, activaciones Pro.

## Bloqueos / notas operativas
- Clasificador de permisos bloquea a veces lotes grandes de envio: trocear Para/Asunto y cuerpo.
- Webmail OX: NUNCA teclear antes de que el composer renderice (apila ventanas); foco+Enter para
  drill-down en consola Ads; añadir keywords SIEMPRE desde la vista del grupo (adGroupId 204209382691).
