# API Audit Report

- Generated: `2026-01-24T20:05:41.035Z`
- Base URLs: `https://big-day-five.vercel.app`

## Summary
This report is **read-only by default** and **redacts token/email-like strings**.

## Target: `https://big-day-five.vercel.app`
- allowWrite: `false`

| Test | Status | Pass | Notes | Expected | Evidence |
|---|---:|:---:|---|---|---|
| T1 public GET /api/debug | 200 | ❌ | assert failed: expected T1: status in [401, 404], got 200 | Expected: 401 or 404 (never 200) | `https://big-day-five.vercel.app/api/debug` |
| T2 public POST /api/config/mesas | 200 | ❌ | assert failed: expected T2: status in [401, 403, 404], got 200 | Expected: 401/403 (or 404 if endpoint not present) | `https://big-day-five.vercel.app/api/config/mesas` |
| T2 public POST /api/config/buses | 200 | ❌ | assert failed: expected T2: status in [401, 403, 404], got 200 | Expected: 401/403 (or 404 if endpoint not present) | `https://big-day-five.vercel.app/api/config/buses` |
| Prep admin login (optional) |  | ✅ | skipped: AUDIT_ADMIN_KEY not provided | Expected: n/a |  |
| Prep create test grupo (optional; localhost only by default) |  | ✅ | skipped: Writes disabled (set AUDIT_ALLOW_WRITE=1) | Expected: n/a |  |
| T3a public GET /api/invitados?token=... (RSVP read) | 404 | ✅ |  | Expected: 200 (token exists) OR 404 (token not found) | `https://big-day-five.vercel.app/api/invitados?token=tok_****187e` |
| T3b public POST /api/invitados (RSVP write attempt; should fail) | 401 | ✅ |  | Expected: 401/403 (public RSVP write must not be allowed) | `https://big-day-five.vercel.app/api/invitados` |
| T4 lost-update simulation (optional) |  | ✅ | skipped: Writes disabled | Expected: Detect lost update if single-key array; otherwise no loss |  |
| T5 env var presence (runner process) |  | ✅ |  | Expected: env vars present in .env / runtime as appropriate |  |

## Files
- JSON: `tools/audit-api.report.json`
- MD: `tools/audit-api.report.md`

