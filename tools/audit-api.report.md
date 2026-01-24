# API Audit Report

- Generated: `2026-01-24T20:17:47.767Z`
- Base URLs: `http://localhost:3210`, `http://localhost:3001`

## Summary
This report is **read-only by default** and **redacts token/email-like strings**.

## Target: `http://localhost:3210`
- allowWrite: `false`

| Test | Status | Pass | Notes | Expected | Evidence |
|---|---:|:---:|---|---|---|
| T1 public GET /api/debug | 404 | ✅ |  | Expected: 401 or 404 (never 200) | `http://localhost:3210/api/debug` |
| T2 public POST /api/config/mesas | 404 | ✅ |  | Expected: 401/403 (or 404 if endpoint not present) | `http://localhost:3210/api/config/mesas` |
| T2 public POST /api/config/buses | 404 | ✅ |  | Expected: 401/403 (or 404 if endpoint not present) | `http://localhost:3210/api/config/buses` |
| Prep admin login (optional) | 200 | ✅ |  | Expected: n/a | `http://localhost:3210/api/admin/login` |
| Prep create test grupo (optional; localhost only by default) |  | ✅ | skipped: Writes disabled (set AUDIT_ALLOW_WRITE=1) | Expected: n/a |  |
| T3a public GET /api/invitados?token=... (RSVP read) | 500 | ❌ | assert failed: expected T3a: status in [200, 404], got 500 | Expected: 200 (token exists) OR 404 (token not found) | `http://localhost:3210/api/invitados?token=tok_****1149` |
| T3b public POST /api/invitados (RSVP write attempt; should fail) | 500 | ❌ | assert failed: expected T3b: status in [401, 403, 404], got 500 | Expected: 401/403 (public RSVP write must not be allowed) | `http://localhost:3210/api/invitados` |
| T3c PATCH /api/rsvp without token (should 400) |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:338:32<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:337:3)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: n/a |  |
| T3d PATCH /api/rsvp with token (optional) |  | ✅ | skipped: Writes disabled (localhost only) | Expected: n/a |  |
| T4 lost-update simulation (optional) |  | ✅ | skipped: Writes disabled | Expected: Detect lost update if single-key array; otherwise no loss |  |
| T5 env var presence (runner process) |  | ✅ |  | Expected: env vars present in .env / runtime as appropriate |  |

## Target: `http://localhost:3001`
- allowWrite: `false`

| Test | Status | Pass | Notes | Expected | Evidence |
|---|---:|:---:|---|---|---|
| T1 public GET /api/debug |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:206:32<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:205:3)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: 401 or 404 (never 200) |  |
| T2 public POST /api/config/mesas |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:223:34<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:222:5)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: 401/403 (or 404 if endpoint not present) |  |
| T2 public POST /api/config/buses |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:223:34<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:222:5)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: 401/403 (or 404 if endpoint not present) |  |
| Prep admin login (optional) |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:246:32<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:242:3)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: n/a |  |
| Prep create test grupo (optional; localhost only by default) |  | ✅ | skipped: Writes disabled (set AUDIT_ALLOW_WRITE=1) | Expected: n/a |  |
| T3a public GET /api/invitados?token=... (RSVP read) |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:299:32<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:298:3)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: 200 (token exists) OR 404 (token not found) |  |
| T3b public POST /api/invitados (RSVP write attempt; should fail) |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:320:32<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:315:3)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: 401/403 (public RSVP write must not be allowed) |  |
| T3c PATCH /api/rsvp without token (should 400) |  | ❌ | error: TypeError: fetch failed<br/>    at node:internal/deps/undici/undici:13502:13<br/>    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)<br/>    at async fetchText (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:72:15)<br/>    at async file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:338:32<br/>    at async record (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:171:17)<br/>    at async runForBase (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:337:3)<br/>    at async main (file:///E:/CODE_feliz/boda/forever-forms-site/tools/audit-api.mjs:578:15) | Expected: n/a |  |
| T3d PATCH /api/rsvp with token (optional) |  | ✅ | skipped: Writes disabled (localhost only) | Expected: n/a |  |
| T4 lost-update simulation (optional) |  | ✅ | skipped: Writes disabled | Expected: Detect lost update if single-key array; otherwise no loss |  |
| T5 env var presence (runner process) |  | ✅ |  | Expected: env vars present in .env / runtime as appropriate |  |

## Files
- JSON: `tools/audit-api.report.json`
- MD: `tools/audit-api.report.md`

