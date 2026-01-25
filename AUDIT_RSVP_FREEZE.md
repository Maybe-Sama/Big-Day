# AUDIT_RSVP_FREEZE — RSVP se queda en último frame (crash render)

## 1) Síntoma (producción)

- Tras acabar el vídeo, la invitación/RSVP **no continúa** y queda el último frame.
- Consola:
  - `TypeError: Cannot read properties of undefined (reading 'find')`
  - `at RSVP (...)`

Interpretación: **RSVP crashea al renderizar** justo cuando se desmonta/oculta el vídeo y se monta el contenido del formulario.

---

## 2) Causa inmediata (línea exacta y variable undefined)

### Evidencia A — `src/pages/RSVP.tsx`

En `RSVP` se calcula `busActual` en cada render (una vez ya no se muestra el vídeo):

```tsx
// src/pages/RSVP.tsx
// Buscar el bus seleccionado (puede estar guardado como ID, nombre o "Bus #X")
const busActual = configBuses?.buses.find(b => {
  if (!grupo.ubicacion_bus) return false;
  return (
    b.id === grupo.ubicacion_bus ||
    b.nombre === grupo.ubicacion_bus ||
    `Bus #${b.numero}` === grupo.ubicacion_bus
  );
});
```

**Qué falla exactamente**

- El `.find(...)` que crashea es: `configBuses?.buses.find(...)`
- La variable que resulta `undefined` es: `configBuses?.buses`

**Por qué puede ser `undefined` aunque exista `configBuses`**

El `?.` solo protege `configBuses`. Si `configBuses` es truthy pero **no tiene** la propiedad `buses` (o `buses` no es un array), entonces `configBuses?.buses` evalúa a `undefined`, y el código intenta ejecutar `undefined.find(...)` → exactamente el error de consola.

---

## 3) Causa raíz upstream (por qué llega un shape inválido)

### Evidencia B — Backend `api/config.ts` no valida shape

```ts
// api/config.ts
if (req.method === 'GET') {
  const value = await redis.get(key as any);
  if (kind === 'carreras') return res.status(200).json(value || []);
  return res.status(200).json(value ?? null);
}
```

Para `kind=buses`, el backend devuelve **tal cual** lo guardado en Redis:
- Si falta: `null`
- Si existe con shape incorrecto (p.ej. `[]`, `{}`, `{ buses: null }`): devuelve eso mismo con `200`.

El frontend (`src/lib/api-service.ts`) tipa el JSON como `ConfiguracionBuses` pero **no valida runtime**, así que puede acabar en estado React como:
- `configBuses = []` (array)  ← caso muy probable si hubo versiones previas/migraciones/backups con shape antiguo
- `configBuses = {}` (objeto sin `buses`)
- `configBuses = { buses: null }`

En todos esos casos, `configBuses?.buses` es `undefined` y el `.find` crashea.

### Evidencia C — Backup/restore puede perpetuar un shape viejo

Export:

```ts
// api/admin.ts (handleBackupExport)
const [mesasRaw, busesRaw, carrerasRaw] = await Promise.all([
  redis.get<unknown>(CONFIG_MESAS_KEY),
  redis.get<unknown>(CONFIG_BUSES_KEY),
  redis.get<unknown[]>(CARRERAS_KEY),
]);
// ...
config: {
  mesas: mesasRaw ?? null,
  buses: busesRaw ?? null,
  carreras: carrerasRaw || [],
},
```

Import:

```ts
// api/admin.ts (handleBackupImport)
await Promise.all([
  redis.set(CONFIG_MESAS_KEY, backup.data.config.mesas),
  redis.set(CONFIG_BUSES_KEY, backup.data.config.buses),
  redis.set(CARRERAS_KEY, backup.data.config.carreras),
]);
```

Si en algún momento `CONFIG_BUSES_KEY` se guardó como `[]` (o con shape diferente), el backup/export lo captura como `unknown` y el import lo restaura igual, manteniendo el dato corrupto.

---

## 4) Fix mínimo recomendado (sin implementarlo aquí)

Objetivo: **evitar crash** aunque la config venga con shape inválido.

- En `src/pages/RSVP.tsx`:
  - Cambiar accesos peligrosos `configBuses?.buses.find(...)` a una forma que valide:
    - `Array.isArray(configBuses?.buses)` antes de usar `.find/.map/.length`
    - O usar `configBuses?.buses?.find(...)` y tratar `undefined` como “sin buses”
  - Igual para el bloque de UI que hace `configBuses.buses.length` y `configBuses.buses.map(...)` (debe tolerar `buses` ausente).

Esto es un hotfix frontend para que RSVP nunca rompa el render por config corrupta.

---

## 5) Fix robusto recomendado (defensa en profundidad)

### Opción A — Normalización/validación en frontend (api-service o dbService)

- En `src/lib/api-service.ts` o `src/lib/database.ts`:
  - Validar el shape devuelto por `/api/config?kind=buses`:
    - Si `null` → `null`
    - Si es `Array` → interpretarlo como `buses` legacy y envolver:
      - `{ id: 'config-buses', buses: value, fechaActualizacion: new Date().toISOString() }`
    - Si es objeto con `buses` array → OK
    - Si es objeto inválido → `null`

Ventaja: un único punto corrige todos los consumidores (RSVP + Admin).

### Opción B — Validación/normalización en backend (`api/config.ts`)

- Para `kind=buses|mesas`:
  - Si Redis devuelve algo que no coincide con el schema esperado, responder `null` (o un objeto por defecto) y/o **sanear** el valor guardado (solo en admin paths).

Ventaja: los clientes siempre reciben un shape consistente.

### Opción C — Reparación del dato en KV (operacional)

- Forzar que `invitados:config:buses` tenga un valor con shape correcto:
  - `{ id: 'config-buses', buses: [], fechaActualizacion: '...' }`
- Vía UI admin “Configurar Buses” o vía `POST /api/config?kind=buses` autenticado.

Ventaja: arregla producción sin deploy frontend (si el admin no está afectado por el mismo crash).

---

## 6) Plan de pruebas manuales (prod + local)

### Local (dev con sourcemaps)

1. `npm install` (si aplica) y `npm run dev`.
2. Abrir RSVP con un token válido:
   - `/rsvp?token=tok_****abcd`
3. Confirmar en Network:
   - `GET /api/invitados?token=...` → 200
   - `GET /api/config?kind=buses` → 200 (ver body)
4. Terminar el vídeo y verificar:
   - **No** aparece el crash.
   - Si config buses es inválida, la UI debe comportarse como “sin buses” (tras el fix).

### Producción (sin tocar PII)

1. Probar RSVP con token real (no pegar el token en tickets/logs).
2. Verificar que al terminar el vídeo, se muestra el contenido.
3. En caso de necesitar instrumentación:
   - Activar logs solo bajo `?debug=1` y enmascarar token.

---

## 7) Mapa de estados (RSVP)

- **pre-video**: `showVideo=true`, se renderiza overlay con `<video>` (primer frame) + `audio`.
- **video playing**: `videoPlaying=true`.
- **video ended**: `onEnded → setShowVideo(false)` → se monta el resto de la página.
- **loading grupo/config**: `loading=true` hasta que `dbService.getGrupoByToken` y `getConfiguracionBuses` terminan.
- **error grupo**: `!token || !grupo` → `ErrorState`.
- **show RSVP**: `!showVideo && !loading && token && grupo` → render principal; aquí ocurre el crash si `configBuses` tiene shape inválido.

