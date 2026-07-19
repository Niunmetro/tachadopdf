# TachadoPDF

**Tacha de verdad los datos personales de un PDF, sin que el archivo salga de tu ordenador.**

TachadoPDF elimina físicamente el texto seleccionado del PDF (no le pone un rectángulo negro
encima), borra los píxeles de las zonas marcadas sobre imágenes, limpia los metadatos, y genera
un **informe de comprobación técnica** que documenta qué se buscó y que el dato ya no es extraíble
del archivo final. Todo el procesamiento ocurre **en tu navegador**: ningún documento se sube a
ningún servidor.

Pensado para quien entrega documentación con datos personales a terceros —administradores de
fincas, gestorías y asesorías, y departamentos de RRHH— y necesita dejar constancia de diligencia.

## Qué hace

- **Detección automática por patrones** españoles con validación de dígito de control: DNI, NIE,
  IBAN, número de la Seguridad Social, teléfonos y correos. Cada coincidencia se puede marcar o
  desmarcar; también se pueden dibujar zonas de tachado a mano.
- **Borrado real**: elimina el texto del contenido del PDF y los píxeles de las zonas marcadas
  sobre imágenes, y limpia metadatos, anotaciones y adjuntos.
- **Verificación post-borrado**: vuelve a leer el archivo final y re-busca los patrones y los
  textos tachados a mano. Si algo sobrevive, **bloquea** el informe: nunca da un "limpio" falso.
- **Aviso de páginas escaneadas**: una página sin capa de texto (o mayormente imagen) no se puede
  leer automáticamente; se advierte en rojo y consta en el informe para que la revises a mano.
- **Informe de comprobación técnica** descargable: fecha, hash del archivo final, patrones
  buscados con su recuento, metadatos eliminados y el alcance exacto de la comprobación.

## Qué NO hace (por diseño)

No usa OCR (las páginas escaneadas se advierten, no se leen), no detecta nombres propios, solo
trabaja con PDF, y no envía nada a ningún sitio. El informe declara su propio alcance: comprueba
la no-extraibilidad del **texto** del PDF resultante y los píxeles de las zonas marcadas; **no
sustituye la revisión humana** ni garantiza la ausencia de datos personales en imágenes no
marcadas.

## Gratis y Pro

- **Gratis**: 3 documentos al mes, de hasta 3 páginas por documento (`FREE_MAX_PAGES`), con todas
  las funciones (incluida la detección automática). El informe lleva una línea "Generado con
  TachadoPDF (versión gratuita)". El contador mensual vive en IndexedDB y es reseteable (no es un
  muro); el tope de páginas SÍ es un muro robusto que empuja el trabajo real hacia Pro.
- **Pro** (pago único): documentos y páginas ilimitados, procesado de varios archivos en lote, e
  informe sin esa línea. La licencia se compra y verifica a través de Gumroad.

La marca de la versión gratuita va **solo en el informe**, nunca en el documento tachado.

## Desarrollo

Requiere Node ≥ 18.

```
npm ci
npm run dev        # servidor de desarrollo
npm test           # tests (Vitest)
npm run build      # genera dist/
npm run preview    # sirve el dist/ ya construido
```

Pila: Vite + TypeScript estricto + Vitest. Motor PDF: [mupdf](https://mupdf.readthedocs.io)
compilado a WebAssembly (corre 100% local); limpieza de metadatos con `pdf-lib`. Sin servidor,
sin claves, sin analítica. El único tráfico de red que la aplicación puede emitir es la
verificación de la clave de licencia contra Gumroad (solo viaja la clave), restringido por una
política de seguridad de contenido (CSP) estricta.

## Despliegue

El build es un sitio estático (`dist/`). Se puede servir desde cualquier hosting de estáticos.

- **GitHub Pages** (rápido para preview): `npm run build` y publicar `dist/` en la rama
  `gh-pages` con un `.nojekyll`. Requiere `base: "/tachadopdf/"` en `vite.config.ts` (ya
  configurado).
- **Producción recomendada**: un dominio propio en **Cloudflare Pages** (cuenta gratuita, se
  conecta el repositorio y se apunta el dominio). Los términos de GitHub Pages desaconsejan sitios
  primariamente comerciales; con dominio propio se evita ese riesgo y se gana seriedad ante el
  cliente. La elección del dominio es del propietario.

Para activar la venta Pro, ver [`MONETIZACION.md`](./MONETIZACION.md).

## Licencia

[AGPL-3.0-or-later](./LICENSE). El motor mupdf es AGPL; distribuir esta aplicación obliga a
publicar su código bajo la misma licencia. Esto no impide vender la licencia Pro.
