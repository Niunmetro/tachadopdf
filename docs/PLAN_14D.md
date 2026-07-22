# Plan 14 días — "Primeros 3 clientes" (decidido 22-jul-2026, comité extraordinario)

## Veredicto del comité (10 agentes: 4 diagnósticos, 3 estrategias, 3 jueces)

**¿"No has hecho un producto que la gente quiera"? — Todavía no hay dato para afirmarlo.**
La web funcional ha recibido 0-3 visitantes humanos (4 días en 404, 19 impresiones,
~20 emails útiles a media ventana). Un funnel perfectamente sano habría producido
estos mismos ceros el ~31% de las veces (binomial). No hay veredicto sobre el producto.

**Lo que SÍ es señal (y obliga a cambiar la estrategia):**
1. La categoría casi no se busca en España: "tachar/anonimizar pdf" = volumen bajo
   estructural. 19 impresiones en 4 días ES el mercado de búsqueda, no un fallo de
   campaña. A este ritmo, el test de Ads tardaría ~55 días en ser concluyente.
2. El término cabeza real es "censurar pdf" y lo posee iLovePDF (empresa española,
   top-250 mundial, 188M visitas/mes) con borrado REAL gratis en español. La batalla
   genérica es inganable; el diferencial "borrado real" ya no es diferencial ahí.
3. El comprador objetivo NO busca herramienta: busca la pregunta legal ("protección
   datos comunidad propietarios") y esas SERPs las tienen consultorías LOPD.
   **La demanda es LATENTE → hay que ir a buscarla (outbound + prescriptores), no
   esperar a que nos encuentre (Ads/SEO).**
4. El dolor es real y citable: multas AEPD 15.000€ (actas sin anonimizar, 2021) y
   1.500€ (tablón, 2023). Y Anonimatum/Nymiz prueban que en España SE PAGA por
   anonimización — pero nadie vende autoservicio a 59€ entre el gratis genérico y
   el enterprise de 200€/mes. El hueco existe; el canal era el equivocado.
5. Suite genérica de PDF tools: **RECHAZADA** con datos (SEO contra iLovePDF desde
   0 backlinks = 0 visitas en 14 días; y traería tráfico que no compra cumplimiento).

## Plan ganador (unánime 3/3 jueces): outbound a dosis real + prescriptores LOPD

Núcleo: la primera señal se sale a buscar. 250-400 emails 1:1 con 2 seguimientos
(no 33), partners LOPD con afiliado 40%, y la web/Ads como material de cierre.

### Mejoras injertadas de las otras propuestas (mandato de los jueces)
- Oferta FUNDADOR 29€ primer año (25 plazas, caduca 15-ago) + garantía 30 días
  DENTRO de los emails desde la ola 1. SIN A/B de precio (no partir la muestra).
- Instrumentación día 1: eventos visita→herramienta→doc procesado→vista precios→
  clic checkout, con UTM por canal. Sin esto no se distingue "no llegan" de
  "llegan y no activan" de "activan y no pagan".
- Gate de pago correcto: informe SHA-256 con marca de agua "DEMO — no válido como
  evidencia" en el free; free pasa de 5 docs TOTALES a 5 docs/MES. Lo que se paga
  es la evidencia de cumplimiento, no un contador.
- Tier DESPACHO 149€/año (3 puestos + logo del despacho en el informe): ancla de
  precio y SKU para partners (40% de 149€ sí incentiva al prescriptor).
- Deliverability ANTES del primer email: SPF/DKIM/DMARC verificados + volumen
  escalonado 15→25→30-40/día. Si cae en spam, los 14 días no miden nada.
- Ads: pausar grupos "tachar/ocultar/anonimizar pdf" (volumen bajo); long-tails
  B2B con búsqueda real: "anonimizar pdf firmado", "anonimizar sentencias",
  "anonimizar acta comunidad", "censurar pdf sin subir". 5€/día, canal pasivo.
- **Día 14 = lectura direccional. Día 21 = veredicto** (ventanas de respuesta
  cerradas). No repetir el error estadístico de decidir con n insuficiente.
- Plan B pre-escrito si todo da cero a día 21: pivote de segmento a
  justicia/sentencias ("anonimizar sentencias" tiene búsqueda real y Anonimatum
  prueba que ese sector paga).

### Calendario
- D1 (22-23 jul): Gumroad (código FUNDADOR 29€ ×25, afiliados 40%, garantía 30d,
  tier Despacho 149€) + cirugía de Ads + lista LSSI 120-150 objetivos (workflow) +
  instrumentación web + verificación SPF/DKIM.
- D2 (23 jul): comité ordinario + FORJA RUN 5: landings /actas y /nominas,
  free 5/mes + marca de agua DEMO en informe free, eventos analytics.
  Tanda 3 (15 reserva, A/B de asunto) CON oferta Fundador.
- D3-7: olas de 15→25→30-40 emails/día 1:1 (fincas primero, luego gestorías);
  emails partner a 60-80 consultorías LOPD con one-pager 40%.
  Re-secuenciar a los 20 despachos del lote quemado por el 404.
- D6-7: seguimiento +4 de ola 1. FORJA RUN 6: "Analizador de riesgo" gratuito
  (/comprobador: detecta DNI/IBAN/etc sin tachar, 100% local, CTA a la herramienta).
- D8-10: ola gestorías + respuestas útiles en Rankia/foros (ratio aporte:promo 10:1).
- D10-11: seguimiento +9 (cierre) de ola 1 con Fundador y caducidad real.
- D12-14: seguimientos restantes + cuadro de mando + Registro de multas AEPD
  (linkbait) si el outbound ya cruza a ritmo pleno.
- D14: checkpoint direccional. D21: veredicto formal.

### Métrica de decisión (día 21, no antes)
- VALIDA: ≥5 respuestas humanas interesadas sobre ~250-400 emails con secuencia
  completa, O ≥1 venta, O ≥1 partner LOPD activado.
- MATA la propuesta actual (no el producto): 0-1 respuestas tras ≥250 emails con
  ventana cerrada Y ≥100 visitas sin uso del free → cambiar mensaje/segmento
  (Plan B justicia), no el motor.
- La señal NO es una venta a 14 días: son respuestas + activaciones del free.

### Reglas permanentes
- Toda respuesta humana se contesta en <4h con demo personalizada del sector.
- curl al dominio real tras CADA deploy (lección del 404).
- Firmar siempre "Equipo de TachadoPDF"; el nombre del dueño no aparece.
- LSSI: solo emails corporativos publicados, con URL fuente y opt-out.
