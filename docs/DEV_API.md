# DEV_API.md — Paridad Local vs Producción (Vercel Functions)

Este repo tiene **dos backends distintos**:

- **Producción**: Vercel Serverless Functions en `api/*` (incluye invitados/config/debug).
- **Local (legacy)**: Express en `server/index.ts` (solo `gofile` + `admin/login/logout` + `health`).

Para **testear persistencia real** (KV + endpoints reales), necesitas ejecutar `api/*` en local con `vercel dev`.

---

## 1) Modo recomendado (paridad con producción): Vercel Functions + Express (gofile)

### Requisitos
- Node/npm instalados
- `vercel` CLI (incluido como devDependency)
- Variables en `.env` (NO subir a git):
  - `KV_REST_API_URL`, `KV_REST_API_TOKEN`
  - `ADMIN_KEY`
  - `VITE_SITE_URL` (recomendado para CORS)
  - (Opcional GoFile) `GOFILE_API_TOKEN`, `GOFILE_FOLDER_ID`

### Arranque
1) Autenticación Vercel (una vez por máquina):

```bash
npx vercel login
```

Alternativa CI/no-interactiva: usar `--token` (no lo pegues en commits/logs).

2) Levantar API real (Vercel Functions) en **3333**:

```bash
npm run dev:api
```

3) Levantar Express (solo gofile/health/admin local legacy) en **3001**:

```bash
npm run dev:express
```

4) Levantar web (Vite) en **3210** (proxy configurado):

Con script cross-platform (recomendado):

```bash
npm run dev:web:vercel
```

O todo junto:

```bash
npm run dev:all
```

### Ruteo resultante
- `/api/*` → `vercel dev` (API real, igual a prod)
- `/api/gofile/*` → Express (legacy)

---

## 2) Modo legacy (solo Express): útil para GoFile, NO sirve para validar invitados/config

Este modo **NO** implementa:
- `/api/invitados`
- `/api/config/*`
- `/api/debug`

Arranque:

```bash
npm run dev:all:express
```

Si usas este modo, es normal ver `404` en los tests de la API real.

---

## 3) Smoke/Audit (reproducible)

### Auditoría local (read-only por defecto)

```bash
npm run audit:local
```

El reporte se guarda en:
- `tools/audit-api.report.json`
- `tools/audit-api.report.md`

### Auditoría prod/preview (neutra, sin secretos)

**PowerShell:**

```powershell
$env:AUDIT_BASE_URLS="https://tu-dominio"
npm run audit:prod
```

> Nota: por seguridad, el auditor NO hace escrituras fuera de localhost.

