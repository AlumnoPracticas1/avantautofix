# ham-autofix-client

Cliente JS que captura errores de tu web y los envía al orquestador **HAM Auto-Fix** para que las IAs (TRIADOR → ANALISTA-A → PARCHEADOR-B → REVISOR-A) generen un parche y lo apliquen con `git commit + git push` desde el dashboard.

Captura:
- `window.onerror` (errores JS sin tratar)
- `unhandledrejection` (promesas rechazadas)
- Errores de carga de recursos (`<img>`, `<script>`, `<link>`)
- Respuestas `fetch` con status 4xx/5xx y fallos de red

## Instalación

```bash
npm install ham-autofix-client
```

## Uso (ESM / bundlers)

```js
import { init } from 'ham-autofix-client';

init({
  endpoint: 'http://127.0.0.1:8000/report',  // tu orquestador HAM
  appName: 'mi-tienda',                       // opcional
  release: '1.4.2',                           // opcional
});
```

Ya está. A partir de ahí cualquier error se envía al orquestador. No necesitas registrar listeners a mano:

```js
// estos ya los gestiona la librería:
window.addEventListener('error', e => console.log(e.message));
window.addEventListener('unhandledrejection', e => console.log(e.reason));
```

## Uso desde `<script>` (sin bundler)

```html
<script src="https://unpkg.com/ham-autofix-client/dist/index.umd.js"></script>
<script>
  HAMAutoFix.init({ endpoint: 'http://127.0.0.1:8000/report' });
</script>
```

## API

### `init(options)`
Arranca la captura. Llamarlo más de una vez no hace nada.

| Opción | Tipo | Default | Descripción |
|---|---|---|---|
| `endpoint` | `string` | `http://127.0.0.1:8000/report` | URL POST del orquestador. |
| `source` | `string` | `"js"` | Etiqueta de origen para el dashboard. |
| `captureFetch` | `boolean` | `true` | Reportar respuestas 4xx/5xx y fallos de red. |
| `captureResources` | `boolean` | `true` | Reportar errores de carga de recursos. |
| `captureUnhandledRejections` | `boolean` | `true` | Reportar promesas rechazadas. |
| `dedupe` | `boolean` | `true` | No reenviar el mismo error en la misma sesión. |
| `appName` | `string \| null` | `null` | Se añade como `extra.app`. |
| `release` | `string \| null` | `null` | Se añade como `extra.release`. |
| `beforeSend` | `function \| null` | `null` | Hook para mutar o descartar (`return false`) antes de enviar. |

### `captureError(err, extra?)`
Reporta manualmente:
```js
import { captureError } from 'ham-autofix-client';

try { riesgoso(); } catch (e) { captureError(e, { ctx: 'checkout' }); }
```

### `shutdown()`
Quita listeners y restaura `fetch`. Útil en SPAs que se desmontan.

## Payload enviado

```json
{
  "source": "js",
  "message": "TypeError: Cannot read properties of undefined…",
  "file": "productos.html",
  "line": 142,
  "stack": "...",
  "extra": { "kind": "manual", "app": "mi-tienda", "release": "1.4.2" }
}
```

El servidor HAM (`POST /report`) responde con `preview_id` y prioridad. La incidencia aparece en el dashboard listo para aprobar.

## Privacidad

El cliente no envía cookies ni cabeceras de sesión, solo el payload mostrado arriba. Usa `navigator.sendBeacon` cuando esté disponible para no bloquear la página.

## Licencia

MIT
