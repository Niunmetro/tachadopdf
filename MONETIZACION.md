# Pasos de Ángel para monetizar TachadoPDF

> **Estado (2026-07-17, 11:00).** El producto está VIVO en https://niunmetro.github.io/tachadopdf/
> con el botón "Comprar Pro" ya apuntando a tu Gumroad. En Gumroad, TachadoPDF Pro está
> configurado del todo: nombre, descripción (pago único), portada, miniatura, URL /l/tachadopdf,
> texto de entrega, **claves de licencia activadas** y el product ID cableado en la app y
> **verificado contra la API real** de Gumroad. Solo faltan cosas que exigen datos tuyos.

---

## 1. COBRAR — conectar método de pago y publicar (owner-gate, ~15 min)

Gumroad NO deja publicar sin un método de cobro, y eso son tus datos bancarios: no los toca
nadie más que tú.

1. En Gumroad → menú lateral **Payouts** → conecta tu cuenta (IBAN / PayPal) y rellena los datos
   fiscales que te pida.
2. Vuelve al producto (**Products → TachadoPDF Pro**) y pulsa **Publish and continue**.
3. Comprueba que la página de venta abre bien: https://shafted6.gumroad.com/l/tachadopdf

Hasta que hagas esto, el botón "Comprar Pro" de la web lleva a un producto **no publicado**:
nadie puede pagar todavía.

## 2. TU DOMINIO — www.tachadopdf.com (owner-gate, ~10 min + espera de DNS)

El dominio está en **IONOS** y ahora mismo apunta a su página de aparcamiento. Para que sirva la
app hay que tocar el DNS en el panel de IONOS (yo no tengo acceso):

- Registro **CNAME**: nombre `www` → valor `niunmetro.github.io`
- (Opcional, para que `tachadopdf.com` sin www también funcione) Registros **A** del dominio raíz
  a las cuatro IPs de GitHub Pages:
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

Cuando `nslookup www.tachadopdf.com` resuelva a GitHub, avísame (o ejecútalo tú):

```
DOMINIO=1 npm run deploy-pages
```

Eso reconstruye con el dominio y publica el CNAME. **No lo ejecutes antes de que el DNS
resuelva**: GitHub redirige la URL de Pages al dominio, y sin DNS la web queda inaccesible
(me pasó hoy; lo revertí en minutos).

Después, en GitHub → Settings → Pages, marca **Enforce HTTPS** cuando te deje (el certificado
tarda unos minutos en emitirse).

## 3. TUS DATOS FISCALES en el Aviso Legal (owner-gate, ~5 min)

La web muestra ahora mismo `[NOMBRE]`, `[NIF]`, `[DOMICILIO]`, `[EMAIL]` a la vista. Es un
requisito de la LSSI (art. 10) y da mala imagen tal cual. Pásame los datos reales y los pongo
(valora un apartado de correos si no quieres publicar tu domicilio).

## 4. SCREENING OEPM del nombre (~15 min, tu protocolo habitual)

Comprobar "TachadoPDF" en el buscador de marcas de la OEPM antes de invertir en el nombre.

## 5. RUTINA MENSUAL (5 min/mes)

Exportar desde Gumroad los emails de los compradores (plan B si Gumroad suspendiera la cuenta;
su moderación automática tiene historial de falsos positivos).

---

## Datos del producto (públicos, por si hacen falta)

- Permalink: `tachadopdf` · URL de venta: https://shafted6.gumroad.com/l/tachadopdf
- Product ID (API): `R7cXtVb-N9uZ49dQ6RQ6jw==` — ya está en `src/config.ts`
- Precio: 59 € **pago único** (Gumroad no permite convertir un producto a suscripción; para
  recurrencia habría que crear un producto nuevo de tipo *Membership*).
- Arte de la ficha: `arte-gumroad/` (cover 1280×720 y thumbnail 600×600, con sus SVG fuente).
