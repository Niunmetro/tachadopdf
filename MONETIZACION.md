# Pasos de Angel para monetizar TachadoPDF

> **Estado (2026-07-17):** el producto está construido, revisado (2 rondas: run v1 + revisión
> adversarial + run v2), y verificado en navegador — 193 tests, typecheck y build en verde. El
> repo local está listo para publicar. Lo único que impide poner esto en internet ahora mismo es
> que **la sesión de GitHub CLI (`gh`) de este ordenador ha caducado**: el token no es válido, así
> que ni yo ni ningún agente puede crear el repositorio remoto ni hacer push. Ese es tu paso 0.

## Paso 0 — PUBLICAR (owner-gate, ~5 min) — desbloquea todo lo demás

En una terminal, desde `E:\FORJA-SOLO-PROGRAMER\productos\tachadopdf`:

```
gh auth login                       # re-autenticar (el token actual está caducado)
gh repo create Niunmetro/tachadopdf --public --source=. --remote=origin --push
```

Esto crea el repo **público** (obligatorio: la licencia AGPL de mupdf y GitHub Pages gratis lo
exigen) y sube todo. Para publicar la web en **GitHub Pages** (preview rápido):

```
npm run deploy-pages                # build con base=/tachadopdf/ + publica dist/ en la rama gh-pages
```

Luego en GitHub: Settings → Pages → Source = rama `gh-pages`. La web quedará en
`https://niunmetro.github.io/tachadopdf/`. (Para producción seria, ver el paso 5: Cloudflare Pages
con dominio propio — recomendado antes de promocionar.)

## Pasos para cobrar

1) GUMROAD (20 min, imprescindible para cobrar): crear producto "TachadoPDF Pro" como membresía anual a 59 €/año, activar generación de claves de licencia, y pegar el product_id/permalink en el config.ts del repo donde el README lo indica. Marcar en la ficha de Gumroad: "renovación anual automática, cancelable en cualquier momento".
2) AVISO LEGAL LSSI (10 min): rellenar los placeholders de la página de Aviso Legal con nombre, NIF, domicilio (valorar apartado de correos si no quieres exponer tu dirección — el mismo gap existe probablemente en Facturea y Rentómetro) y email de contacto.
3) LICENCIA AGPL (5 min, decisión consciente): el motor mupdf obliga a que el repo sea público bajo AGPL-3.0. Ya publicamos los repos en abierto, así que el coste real es cero, pero debes saber que alguien podría forkear la app y quitar el check de licencia. Se asume: el comprador de este nicho paga por confianza e informe, no busca forks.
4) SCREENING OEPM (15 min, tu protocolo habitual): comprobar "TachadoPDF" en el buscador de marcas de la OEPM antes de invertir en el nombre.
5) DOMINIO + CLOUDFLARE PAGES (30-45 min, recomendado antes de promocionar; único gasto: ~12 €/año el dominio): crear cuenta gratuita en Cloudflare Pages, conectar el repo y apuntar el dominio. Motivo: los términos de GitHub Pages desaconsejan sitios primariamente comerciales y un strike afectaría también a Facturea y Rentómetro; además un dominio propio da la seriedad que este comprador exige.
6) RUTINA MENSUAL (5 min/mes): exportar desde Gumroad los emails de los compradores (plan B si Gumroad suspendiera la cuenta; su moderación automática tiene historial de falsos positivos).
