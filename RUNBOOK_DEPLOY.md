# RUNBOOK_DEPLOY.md — Hotfix Seguridad (Vercel)

## Objetivo
Validar y desplegar el hotfix de seguridad que:
- **Desactiva** `/api/debug` en **producción** (404 siempre).
- **Protege** `POST` en `/api/config/buses`, `/api/config/mesas`, `/api/carreras` con `admin_session`.
- Evita UX engañosa en `RSVP` cuando el guardado falla (no “finge” persistencia).

Este runbook está diseñado para ejecutarse **sin exponer secretos**.

---

## Pre-deploy checklist
- [ ] La rama contiene solo cambios del hotfix (sin borrados accidentales).
- [ ] `npm run lint` y `npx tsc --noEmit` pasan localmente.
- [ ] Confirmado que `.env` NO está versionado.

---

## Deploy
### Opción A (recomendada): Vercel con Git (main)
- Merge/commit en `main`.
- Esperar a que Vercel complete el deployment.

### Opción B: Vercel CLI
> Requiere `vercel login` o `--token` (no pegar tokens en logs).

---

## Verificación post-deploy (HTTP neutro)
Base URL de producción:
- `https://big-day-five.vercel.app`

> Nota: usa `-i` para ver status y headers. No se envían cookies aquí.

### Test 1 — `/api/debug` (debe ser 404 en prod)

```bash
curl -i https://big-day-five.vercel.app/api/debug
```

**Esperado**:
- **HTTP 404**
- No debe devolver JSON con emails/tokens.

### Test 2 — POST sin auth a config (debe ser 401/403)

```bash
curl -i -X POST https://big-day-five.vercel.app/api/config/mesas -H "Content-Type: application/json" --data "{}"
curl -i -X POST https://big-day-five.vercel.app/api/config/buses -H "Content-Type: application/json" --data "{}"
curl -i -X POST https://big-day-five.vercel.app/api/carreras -H "Content-Type: application/json" --data "[]"
```

**Esperado**:
- **HTTP 401** (o 403) con body JSON tipo `{"error":"No autorizado"}`
- **No** debe retornar 200.

### Test 3 — GET público a config/carreras (puede ser 200 o null/[])

```bash
curl -i https://big-day-five.vercel.app/api/config/mesas
curl -i https://big-day-five.vercel.app/api/config/buses
curl -i https://big-day-five.vercel.app/api/carreras
```

**Esperado**:
- **HTTP 200**
- Body JSON válido (puede ser `null`/`[]` si no hay datos).

### Test 4 — Auditor automatizado (read-only)

```bash
AUDIT_BASE_URLS="https://big-day-five.vercel.app" node tools/audit-api.mjs
```

**Esperado**:
- Se generan/actualizan `tools/audit-api.report.json` y `tools/audit-api.report.md`
- En el reporte:
  - `T1 /api/debug` pasa solo con **401/404**
  - `T2 POST /api/config/*` pasa solo con **401/403/404**

---

## Verificación post-deploy (con sesión admin) — opcional
Para validar que el admin sigue pudiendo escribir config/carreras, hay que:
1) Loguearse en UI admin (o usar `/api/admin/login`).
2) Reintentar el POST con cookie `admin_session`.

> No incluyas cookies/tokens en tickets ni en logs.

---

## Rollback checklist

### Rollback rápido (Vercel)
- [ ] Ir al dashboard de Vercel → proyecto → Deployments.
- [ ] Promover un deployment previo conocido como bueno (si aplica).
- [ ] Re-ejecutar “Verificación post-deploy (HTTP neutro)”.

### Rollback por Git (reproducible)
- [ ] Identificar el commit del hotfix:

```bash
git log -10 --oneline
```

- [ ] Revertir el commit (NO reescribir historia):

```bash
git revert <SHA_DEL_HOTFIX>
git push
```

- [ ] Confirmar que Vercel redeploya automáticamente.
- [ ] Re-ejecutar los curls de verificación para confirmar el estado.

---

## Observabilidad / señales de fallo
- Si `GET /api/debug` devuelve **200** en prod → **bloqueante** (rollback inmediato).
- Si `POST /api/config/*` devuelve **200** sin auth → **bloqueante** (rollback inmediato).
- Si cualquier endpoint devuelve **5xx** sostenido → revisar variables de entorno KV y logs de Vercel Functions.

