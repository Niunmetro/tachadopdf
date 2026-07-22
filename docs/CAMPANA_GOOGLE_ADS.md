# Campaña de prueba Google Ads — TachadoPDF

> Estado: **diseñada y lista**. Cuenta creada; construcción de la campaña BLOQUEADA por límite
> técnico de la extensión con el asistente de alta (web-components Shadow DOM). Se ejecuta en la
> consola normal en cuanto la cuenta esté activa (requiere método de pago del owner).

## Cuenta
- **Google Ads ID:** 491-315-0047
- **Login:** ccsshaft@gmail.com
- **Empresa/holding:** Elanso Capital (engloba Inmomargen, Solo Sé, TachadoPDF, etc.)
- **Moneda a fijar en el alta:** EUR · **Zona horaria:** Europe/Madrid (¡no se pueden cambiar después!)

## Decisión del comité (marketing)
Test pequeño y con caducidad. **60 € tope total**, para validar "¿alguien paga?", no para abrir canal.
A 59 € pago único los ads no son rentables a escala; el canal durable es el SEO. Ver ESTADO/GROWTH.

## Configuración de la campaña
- **Tipo:** Búsqueda (Search). NO Display, NO socios de búsqueda, NO Máximo rendimiento.
- **Objetivo:** "Crear campaña sin objetivo" (control manual). Modo experto.
- **Presupuesto:** 5 €/día (≈150 €/mes). Con tope duro mental de 60 € / 12 días.
- **Puja:** Maximizar clics con límite de CPC 0,40 €, o CPC manual 0,35 €.
- **Ubicación:** España. **Idioma:** español.
- **Red:** solo Búsqueda de Google (desmarcar «incluir socios de búsqueda» y «red de Display»).
- **URL final:** https://www.tachadopdf.com/

## Palabras clave (concordancia de frase)
```
"tachar dni pdf"
"ocultar datos personales pdf"
"quitar dni de un pdf"
"censurar pdf"
"tachar datos acta comunidad"
"redactar pdf español"
"borrar texto pdf definitivamente"
"eliminar datos personales pdf"
```
Negativas iniciales: `-gratis online subir`, `-curso`, `-empleo`, `-ilustrator`, `-firmar`.

## Anuncio adaptable de búsqueda (RSA)
**Titulares (≤30 car.):**
1. Tacha datos de un PDF
2. El texto se borra de verdad
3. No es un recuadro negro
4. Tacha DNI e IBAN de un PDF
5. 100% en tu navegador
6. Sin subir el documento
7. Con informe de comprobación
8. Gratis, sin instalar nada
9. Pago único, sin suscripción
10. Para gestorías y fincas

**Descripciones (≤90 car.):**
1. Elimina DNI, IBAN y datos personales del archivo, no un recuadro por encima. Compruébalo.
2. Todo ocurre en tu navegador: el documento no se sube a ningún servidor. Gratis.
3. Detecta solo DNI, NIE, IBAN y teléfonos. Descarga un informe de comprobación.
4. Pago único de 59 €, sin cuota mensual. Pruébalo gratis ahora.

## Medición (sin traicionar la privacidad)
NO instalar píxel (rompería el «sin cookies ni analítica»). Leer el test por: clics/CTR del lado de
Google + ventas de Gumroad en la ventana de campaña. Atribución borrosa, asumible para 60 €.

## Éxito / matar / escalar
- Éxito mínimo: ≥1 venta, o CTR >4% + uso real → el mensaje engancha.
- Matar: 60 € gastados, 0 uso/venta → todo al SEO.
- Escalar: 2+ ventas → 10 €/día y ampliar keywords.

## Bloqueo actual y cómo se desbloquea
El asistente de alta de cuenta nueva usa botones Shadow DOM que la extensión de Chrome no puede
pulsar de forma fiable. **En cuanto el owner añada el método de pago** (su parte), la cuenta sale del
asistente y la campaña se construye en la consola normal (campos estándar, sí manejables). El owner
NO diseña nada: solo mete la tarjeta; el montaje es del equipo.

## Plan B de volumen (preparado mar 21-07, ejecutar mié 22-07 si sigue en ~0 impresiones)
Contexto: 19-21 jul solo 6 impresiones totales. Causa probable ya corregida el 21-07 a las ~07:45:
la URL final (www.tachadopdf.com) llevaba en 404 total desde el 17-07 (dominio sin activar en Pages);
el revisor de Google no podía verificar el destino. Si tras 24h con la web viva el anuncio sigue sin
servir, aplicar este plan (~5 min):

1) Añadir en concordancia de FRASE (no amplia) keywords con volumen real:
   "tachar pdf online", "ocultar datos pdf", "borrar texto pdf", "editar pdf quitar datos",
   "anonimizar pdf online", "eliminar dni de un pdf", "censurar documento pdf gratis"
2) Mantener las 12 amplias actuales (nicho, CPC bajo cuando entren).
3) Reforzar negativas para el tráfico genérico que traerán las de frase:
   "unir", "comprimir", "convertir", "word", "excel", "firmar", "rellenar", "escanear",
   "gratis para estudiantes", "apk", "descargar programa"
4) NO tocar puja (Maximizar clics sigue en aprendizaje); no subir presupuesto (5 €/día).
5) A las 24h de la ampliación: revisar informe de términos de búsqueda y podar.

### Añadir junto al Plan B (pendiente de UI, mar 21-07):
- Negativas nuevas por el informe de búsquedas real (3/4 impresiones fueron "quitar/eliminar marca de agua pdf"):
  "marca de agua", "marcas de agua", "watermark"

### Plan B EJECUTADO (mié 22-07, ~06:30)
- 8 negativas nuevas guardadas (31 total): marca de agua, marcas de agua, watermark,
  rellenar, escanear, apk, descargar programa, gratis para estudiantes.
- 7 keywords de FRASE añadidas al Grupo de anuncios 1 (adGroupId 204209382691):
  4 en revisión ("tachar pdf online", "ocultar datos pdf", "borrar texto pdf",
  "anonimizar pdf online") + 3 en "volumen de búsquedas bajo" (long-tail, quedan latentes).
- Contexto: 18 impresiones acumuladas (10 el martes tras revivir el dominio, +2 madrugada).
- Truco de UI que funcionó: los enlaces de drill-down de la consola ignoran el click
  sintético; foco con click + tecla Enter SÍ navega. El selector de grupo del botón "+"
  a nivel cuenta se cierra solo: añadir keywords SIEMPRE desde la vista del grupo.
