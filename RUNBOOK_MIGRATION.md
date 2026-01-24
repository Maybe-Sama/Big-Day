# RUNBOOK_MIGRATION.md — Migración KV legacy → per-entity (sin downtime)

## Objetivo
Eliminar el riesgo de **lost updates / overwrites** migrando de:
- legacy: `invitados:grupos` (array completo)
a:
- `invitados:grupo:{id}` → `GrupoInvitados`
- `invitados:token:{tokenNorm}` → `{id}`
- `invitados:ids` → `string[]` de ids

La conmutación se controla con `STORAGE_MODE=legacy|entity`.

---

## Pre-flight (antes de tocar prod)
1) **Backup manual** desde el panel Admin:
- “Descargar backup” → guarda el JSON localmente.

2) Confirmar que el hotfix de seguridad está aplicado:
- `/api/debug` debe ser 404
- POST público a `/api/config/*` debe ser 401

3) Variables de entorno en Vercel:
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- `ADMIN_KEY`
- `STORAGE_MODE=legacy` (durante el deploy inicial de migración)

---

## Paso 1 — Deploy sin cambios de comportamiento
Deploy con el código nuevo, pero **manteniendo**:
- `STORAGE_MODE=legacy`

Esto no cambia las lecturas/escrituras principales todavía.

---

## Paso 2 — Migración (controlada, idempotente)

### 2.1 Dry-run (recomendado)
Requiere cookie `admin_session` (sesión admin activa).

```bash
curl -i -X POST "https://big-day-five.vercel.app/api/admin/migrate?mode=dry-run" -b cookies.txt
```

**Esperado**: `200` con resumen:
- `totalLegacy`
- `totalEntityIds`
- `tokensDuplicados` (enmascarados)
- `idsDuplicados`
- `tokensVacios`

### 2.2 Apply (crea snapshot server-side y ejecuta migración)

```bash
curl -i -X POST "https://big-day-five.vercel.app/api/admin/migrate?mode=apply" -b cookies.txt
```

**Esperado**: `200` con:
- `snapshotKey` → `backup:snapshot:migration:<timestamp>`
- `success: true`

> La migración es **idempotente**. Ejecutarla varias veces no debe duplicar `invitados:ids` ni romper el mapping token→id.

---

## Paso 3 — Conmutación a entity (sin downtime)
En Vercel (Project → Settings → Environment Variables):
- Cambiar `STORAGE_MODE` a `entity`
- Redeploy (o trigger deploy para aplicar env)

---

## Verificación post-switch (mínimo)

### Admin panel
- Listado de grupos carga
- Crear/editar/eliminar funciona

### RSVP
- `GET /api/invitados?token=...` funciona
- `PATCH /api/rsvp?token=...` guarda sin 401 y sin 409 recurrente

### Curl (read-only / seguro)
```bash
curl -i https://big-day-five.vercel.app/api/debug
curl -i -X PATCH "https://big-day-five.vercel.app/api/rsvp" -H "Content-Type: application/json" --data "{}"
```

---

## Rollback (claro)

### Rollback inmediato (sin pérdida “canónica”)
Si hay problemas:
1) Set `STORAGE_MODE=legacy` en Vercel y redeploy.
2) Los datos escritos durante `entity` **siguen en KV** en `invitados:grupo:*`. (No se borran).

> Si necesitas volver a legacy y conservar los cambios hechos en entity, re-ejecuta `POST /api/admin/migrate?mode=apply` tras volver a legacy (no borra legacy, pero re-genera entity; para “reverse” no hay endpoint automático).

### Restaurar desde snapshot de migración
Si algo salió mal durante migración:
- Usa `snapshotKey` devuelto por `migrate apply` (almacenado en KV).
- Alternativa práctica: usa “Restaurar backup” del panel con el backup descargado.

---

## Por qué esto elimina lost updates en el pico de RSVPs
En legacy, cada RSVP hacía read-modify-write de **todo** `invitados:grupos`, por lo que dos escrituras cercanas podían pisarse.

En entity mode, cada RSVP actualiza **solo**:
- `invitados:grupo:{id}` (una entidad),
lo cual evita colisiones entre RSVPs de distintos grupos (caso dominante con ~180 RSVPs).

