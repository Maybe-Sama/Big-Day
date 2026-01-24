/**
 * Forensic API audit runner (no secrets in output).
 *
 * Usage:
 *   node tools/audit-api.mjs
 *   node tools/audit-api.mjs http://localhost:3210 https://your-prod.example
 *
 * Env:
 *   AUDIT_BASE_URLS="http://localhost:3210,https://example.com"
 *   AUDIT_ALLOW_WRITE=1            # allow creating/updating test data (localhost-only guard)
 *   AUDIT_ADMIN_KEY="..."          # admin key for /api/admin/login (server-side ADMIN_KEY)
 */
import crypto from "node:crypto";
import process from "node:process";
import { URL } from "node:url";
import fs from "node:fs";

function nowIso() {
  return new Date().toISOString();
}

function isLocalhost(baseUrl) {
  try {
    const u = new URL(baseUrl);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function redactTokenLike(s) {
  if (typeof s !== "string") return s;
  // redact common token-ish strings and admin_session cookies
  return s
    // redact JSON fields explicitly (covers short tokens too)
    .replace(/(\"token\"\s*:\s*\")([^\"\n]{1,64})(\")/gi, (_m, a, v, b) => {
      const t = String(v);
      const masked = t.length <= 8 ? "****" : `${t.slice(0, 2)}****${t.slice(-2)}`;
      return `${a}${masked}${b}`;
    })
    .replace(/(\"email\"\s*:\s*\")([^\"\n]{1,128})(\")/gi, (_m, a, v, b) => {
      const e = String(v);
      const at = e.indexOf("@");
      if (at > 1) return `${a}${e[0]}***${e.slice(at)}${b}`;
      return `${a}***@redacted${b}`;
    })
    .replace(/admin_session=([a-f0-9]{8})[a-f0-9]+/gi, "admin_session=$1****")
    .replace(/\b(tok|token|sess|session|key|kv|redis)_[a-z0-9-]{6,}\b/gi, (m) =>
      `${m.slice(0, 4)}****${m.slice(-4)}`
    )
    .replace(/\b[a-f0-9]{32,}\b/gi, (m) => `${m.slice(0, 4)}****${m.slice(-4)}`)
    .replace(
      /\b([a-z0-9._%+-])[a-z0-9._%+-]*@([a-z0-9.-]+\.[a-z]{2,})\b/gi,
      (_m, a, domain) => `${a}***@${domain}`
    );
}

function safeJson(value) {
  try {
    return JSON.stringify(value, (_k, v) => (typeof v === "string" ? redactTokenLike(v) : v), 2);
  } catch {
    return String(value);
  }
}

async function fetchText(baseUrl, path, init) {
  const url = new URL(path, baseUrl).toString();
  const res = await fetch(url, init);
  const text = await res.text();
  return { url, res, text };
}

function pickHeaders(res) {
  const keys = [
    "content-type",
    "access-control-allow-origin",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "access-control-allow-credentials",
    "set-cookie",
    "vary",
    "x-powered-by",
  ];
  const out = {};
  for (const k of keys) {
    const v = res.headers.get(k);
    if (v) out[k] = redactTokenLike(v);
  }
  return out;
}

function parseAdminCookie(setCookieHeader) {
  // We only need admin_session=...; ignore attributes
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/admin_session=([^;]+)/);
  if (!match) return null;
  return `admin_session=${match[1]}`;
}

function mkAuditGrupo({ id, token }) {
  return {
    id,
    invitadoPrincipal: {
      nombre: "Audit",
      apellidos: "Runner",
      email: "audit@example.com",
      asistencia: "pendiente",
      alergias: undefined,
    },
    acompanantes: [],
    token,
    asistencia: "pendiente",
    fechaCreacion: nowIso(),
    fechaActualizacion: nowIso(),
    notas: "audit-runner",
    confirmacion_bus: false,
    ubicacion_bus: undefined,
    mesa: undefined,
  };
}

function loadDotenvFile() {
  // Minimal .env parser (no expansion). Never returns values to stdout; caller should only use booleans or pass through redact.
  try {
    const raw = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
    return out;
  } catch {
    return null;
  }
}

async function runForBase(baseUrl, opts) {
  const allowWrite = !!opts.allowWrite && isLocalhost(baseUrl);
  const adminKey = opts.adminKey || null;
  const dotenv = opts.dotenv || null;

  const results = {
    baseUrl,
    allowWrite,
    env: {
      node: process.version,
      auditAllowWrite: !!opts.allowWrite,
      auditAdminKeyProvided: !!adminKey,
    },
    tests: [],
  };

  async function record(name, fn) {
    const startedAt = Date.now();
    try {
      const r = await fn();
      const assertedPass =
        typeof r?.assert?.pass === "boolean" ? r.assert.pass : true;
      results.tests.push({
        name,
        ok: assertedPass,
        ms: Date.now() - startedAt,
        ...r,
      });
    } catch (e) {
      results.tests.push({
        name,
        ok: false,
        ms: Date.now() - startedAt,
        error: redactTokenLike(e?.stack || e?.message || String(e)),
      });
    }
  }

  function mkAssert({ pass, expected, actual }) {
    return { pass, expected: redactTokenLike(expected), actual: redactTokenLike(actual) };
  }

  function assertStatusIn(name, status, allowedStatuses) {
    const allowed = new Set(allowedStatuses);
    const pass = allowed.has(status);
    return mkAssert({
      pass,
      expected: `${name}: status in [${allowedStatuses.join(", ")}]`,
      actual: `${status}`,
    });
  }

  // Test 1: /api/debug public access should NOT be 200 in secure config
  await record("T1 public GET /api/debug", async () => {
    const { url, res, text } = await fetchText(baseUrl, "/api/debug", {
      method: "GET",
    });
    return {
      request: { url, method: "GET" },
      response: {
        status: res.status,
        headers: pickHeaders(res),
        bodyPreview: redactTokenLike(text.slice(0, 500)),
      },
      assert: assertStatusIn("T1", res.status, [401, 404]),
    };
  });

  // Test 2: POST without auth to config write endpoints should be 401/403 in secure config
  for (const endpoint of ["/api/config/mesas", "/api/config/buses"]) {
    await record(`T2 public POST ${endpoint}`, async () => {
      const { url, res, text } = await fetchText(baseUrl, endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      return {
        request: { url, method: "POST" },
        response: {
          status: res.status,
          headers: pickHeaders(res),
          bodyPreview: redactTokenLike(text.slice(0, 500)),
        },
        assert: assertStatusIn("T2", res.status, [401, 403, 404]),
      };
    });
  }

  // Prep: try admin login (needed for any /api/invitados writes)
  let adminCookie = null;
  await record("Prep admin login (optional)", async () => {
    if (!adminKey) {
      return { skipped: true, reason: "AUDIT_ADMIN_KEY not provided" };
    }
    const { url, res, text } = await fetchText(baseUrl, "/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: adminKey }),
    });
    const setCookie = res.headers.get("set-cookie");
    adminCookie = parseAdminCookie(setCookie);
    return {
      request: { url, method: "POST" },
      response: {
        status: res.status,
        headers: pickHeaders(res),
        bodyPreview: redactTokenLike(text.slice(0, 500)),
      },
      extracted: { hasAdminCookie: !!adminCookie },
    };
  });

  // Test 3: RSVP persistence attempt
  // - If /api/invitados exists, demonstrate that writing without admin_session fails (expected 401).
  // - If allowWrite + adminCookie, create a test group so we can attempt token reads/writes.
  const testId = `audit-${Date.now()}`;
  const testToken = `tok_${crypto.randomBytes(10).toString("hex")}`;

  let createdGrupo = null;
  await record("Prep create test grupo (optional; localhost only by default)", async () => {
    if (!allowWrite) return { skipped: true, reason: "Writes disabled (set AUDIT_ALLOW_WRITE=1)" };
    if (!adminCookie) return { skipped: true, reason: "No admin_session cookie (need AUDIT_ADMIN_KEY)" };

    const grupo = mkAuditGrupo({ id: testId, token: testToken });
    const { url, res, text } = await fetchText(baseUrl, "/api/invitados", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify(grupo),
    });
    if (res.ok) {
      createdGrupo = grupo;
    }
    return {
      request: { url, method: "POST" },
      response: {
        status: res.status,
        headers: pickHeaders(res),
        bodyPreview: redactTokenLike(text.slice(0, 500)),
      },
      created: { id: testId, token: redactTokenLike(testToken) },
    };
  });

  await record("T3a public GET /api/invitados?token=... (RSVP read)", async () => {
    const { url, res, text } = await fetchText(
      baseUrl,
      `/api/invitados?token=${encodeURIComponent(createdGrupo?.token || testToken)}`,
      { method: "GET" }
    );
    return {
      request: { url, method: "GET" },
      response: {
        status: res.status,
        headers: pickHeaders(res),
        bodyPreview: redactTokenLike(text.slice(0, 700)),
      },
      assert: assertStatusIn("T3a", res.status, [200, 404]),
    };
  });

  await record("T3b public POST /api/invitados (RSVP write attempt; should fail)", async () => {
    const grupo = createdGrupo || mkAuditGrupo({ id: testId, token: testToken });
    grupo.notas = "audit-rsvp-write-attempt";
    grupo.fechaActualizacion = nowIso();

    const { url, res, text } = await fetchText(baseUrl, "/api/invitados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grupo),
    });
    return {
      request: { url, method: "POST" },
      response: {
        status: res.status,
        headers: pickHeaders(res),
        bodyPreview: redactTokenLike(text.slice(0, 500)),
      },
      assert: assertStatusIn("T3b", res.status, [401, 403, 404]),
    };
  });

  // RSVP PATCH endpoint must reject missing token (read-only safety: should not write)
  await record("T3c PATCH /api/rsvp without token (should 400)", async () => {
    const { url, res, text } = await fetchText(baseUrl, "/api/rsvp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return {
      request: { url, method: "PATCH" },
      response: {
        status: res.status,
        headers: pickHeaders(res),
        bodyPreview: redactTokenLike(text.slice(0, 300)),
      },
      assert: assertStatusIn("T3c", res.status, [400, 404]),
    };
  });

  // Optional write test for localhost only:
  // - If AUDIT_RSVP_TOKEN provided, attempt PATCH with minimal payload and expect 200.
  // - Otherwise, skipped (we don't auto-create data in this phase unless explicitly enabled).
  const rsvpToken = process.env.AUDIT_RSVP_TOKEN || "";
  await record("T3d PATCH /api/rsvp with token (optional)", async () => {
    if (!allowWrite) return { skipped: true, reason: "Writes disabled (localhost only)" };
    if (!rsvpToken) return { skipped: true, reason: "AUDIT_RSVP_TOKEN not provided" };
    const { url, res, text } = await fetchText(
      baseUrl,
      `/api/rsvp?token=${encodeURIComponent(rsvpToken)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitadoPrincipal: { asistencia: "pendiente" },
          confirmacion_bus: false,
        }),
      }
    );
    return {
      request: { url, method: "PATCH" },
      response: {
        status: res.status,
        headers: pickHeaders(res),
        bodyPreview: redactTokenLike(text.slice(0, 500)),
      },
      assert: assertStatusIn("T3d", res.status, [200, 404]),
    };
  });

  // Optional: two sequential PATCH to reduce lost-update risk (localhost only).
  await record("T3e PATCH /api/rsvp twice (optional)", async () => {
    if (!allowWrite) return { skipped: true, reason: "Writes disabled (localhost only)" };
    if (!rsvpToken) return { skipped: true, reason: "AUDIT_RSVP_TOKEN not provided" };

    const u = (path) => new URL(path, baseUrl).toString();

    const p1 = await fetchText(
      baseUrl,
      `/api/rsvp?token=${encodeURIComponent(rsvpToken)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitadoPrincipal: { asistencia: "confirmado" },
          confirmacion_bus: true,
        }),
      }
    );
    const p2 = await fetchText(
      baseUrl,
      `/api/rsvp?token=${encodeURIComponent(rsvpToken)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ubicacion_bus: "Audit Bus",
        }),
      }
    );

    // Validate both were accepted
    if (!p1.res.ok || !p2.res.ok) {
      return {
        request: { url: u(`/api/rsvp?token=${encodeURIComponent(rsvpToken)}`), method: "PATCH" },
        response: {
          status: `${p1.res.status}/${p2.res.status}`,
          headers: {},
          bodyPreview: redactTokenLike(`${p1.text}\n---\n${p2.text}`.slice(0, 800)),
        },
        assert: {
          pass: false,
          expected: "T3e: both PATCH should be 200",
          actual: `${p1.res.status}/${p2.res.status}`,
        },
      };
    }

    // Read back using public token read (may or may not be masked by backend)
    const readBack = await fetchText(
      baseUrl,
      `/api/invitados?token=${encodeURIComponent(rsvpToken)}`,
      { method: "GET" }
    );
    let observed = null;
    try {
      observed = JSON.parse(readBack.text);
    } catch {
      observed = null;
    }

    const ok =
      readBack.res.ok &&
      observed &&
      observed.confirmacion_bus === true &&
      observed.ubicacion_bus === "Audit Bus" &&
      (observed.invitadoPrincipal?.asistencia === "confirmado" || observed.asistencia === "confirmado");

    return {
      request: { url: u(`/api/rsvp?token=${encodeURIComponent(rsvpToken)}`), method: "PATCH" },
      response: {
        status: readBack.res.status,
        headers: pickHeaders(readBack.res),
        bodyPreview: redactTokenLike(readBack.text.slice(0, 600)),
      },
      finalObserved: observed
        ? {
            asistencia: observed.asistencia,
            invitadoPrincipal_asistencia: observed?.invitadoPrincipal?.asistencia,
            confirmacion_bus: observed.confirmacion_bus,
            ubicacion_bus: observed.ubicacion_bus,
          }
        : null,
      assert: {
        pass: !!ok,
        expected: "T3e: confirmacion_bus=true AND ubicacion_bus='Audit Bus' AND asistencia='confirmado'",
        actual: observed ? safeJson({
          asistencia: observed.asistencia,
          invitadoPrincipal_asistencia: observed?.invitadoPrincipal?.asistencia,
          confirmacion_bus: observed.confirmacion_bus,
          ubicacion_bus: observed.ubicacion_bus,
        }) : "non-JSON response",
      },
    };
  });

  // Test 4: Concurrency / lost update simulation (only when we can write)
  await record("T4 lost-update simulation (optional)", async () => {
    if (!allowWrite) return { skipped: true, reason: "Writes disabled" };
    if (!adminCookie) return { skipped: true, reason: "No admin_session cookie" };
    if (!createdGrupo) return { skipped: true, reason: "Test grupo not created (missing /api/invitados or write failed)" };

    // Fetch two copies (admin list -> find by id via client patterns). Backend endpoint doesn't provide /by-id,
    // so we POST whole group object. We'll use token read (public) twice to get the same base state.
    const t = createdGrupo.token;
    const a1 = await fetchText(baseUrl, `/api/invitados?token=${encodeURIComponent(t)}`, { method: "GET" });
    const a2 = await fetchText(baseUrl, `/api/invitados?token=${encodeURIComponent(t)}`, { method: "GET" });

    if (!a1.res.ok || !a2.res.ok) {
      return {
        skipped: true,
        reason: `Token read not OK (a1=${a1.res.status}, a2=${a2.res.status})`,
      };
    }
    const ct1 = a1.res.headers.get("content-type") || "";
    const ct2 = a2.res.headers.get("content-type") || "";
    if (!ct1.includes("application/json") || !ct2.includes("application/json")) {
      return {
        skipped: true,
        reason: `Token read not JSON (ct1=${ct1 || "none"}, ct2=${ct2 || "none"})`,
      };
    }

    const g1 = JSON.parse(a1.text);
    const g2 = JSON.parse(a2.text);

    g1.notas = "audit-concurrency-A";
    g1.fechaActualizacion = nowIso();

    g2.confirmacion_bus = true;
    g2.ubicacion_bus = "Audit Bus";
    g2.fechaActualizacion = nowIso();

    // Write both based on stale base state
    const w1 = await fetchText(baseUrl, "/api/invitados", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(g1),
    });
    const w2 = await fetchText(baseUrl, "/api/invitados", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(g2),
    });

    const final = await fetchText(baseUrl, `/api/invitados?token=${encodeURIComponent(t)}`, { method: "GET" });
    if (!final.res.ok) {
      return {
        skipped: true,
        reason: `Final token read not OK (${final.res.status})`,
      };
    }
    const gf = JSON.parse(final.text);

    return {
      baseCopies: {
        g1Changed: { notas: g1.notas },
        g2Changed: { confirmacion_bus: g2.confirmacion_bus, ubicacion_bus: g2.ubicacion_bus },
      },
      writes: [
        { status: w1.res.status, headers: pickHeaders(w1.res) },
        { status: w2.res.status, headers: pickHeaders(w2.res) },
      ],
      finalObserved: {
        notas: gf?.notas,
        confirmacion_bus: gf?.confirmacion_bus,
        ubicacion_bus: gf?.ubicacion_bus,
      },
      interpretation:
        gf?.notas === "audit-concurrency-A" && gf?.confirmacion_bus === true
          ? "No lost update observed (both fields present)."
          : "Potential lost update observed (one change overwrote the other).",
    };
  });

  // Test 5: env var presence (local runner only; no values printed)
  await record("T5 env var presence (runner process)", async () => {
    const required = [
      "ADMIN_KEY",
      "KV_REST_API_URL",
      "KV_REST_API_TOKEN",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ];
    const present = {};
    for (const k of required) {
      present[k] =
        typeof process.env[k] === "string" && process.env[k].trim() !== "";
    }
    const dotenvPresent = {};
    if (dotenv) {
      for (const k of required) dotenvPresent[k] = typeof dotenv[k] === "string" && dotenv[k].trim() !== "";
    }
    return { present, dotenvPresent: dotenv ? dotenvPresent : undefined };
  });

  return results;
}

function expectedFor(testName) {
  // Keep these deliberately broad to handle different safe configs (401 or 404).
  if (testName.startsWith("T1")) return "Expected: 401 or 404 (never 200)";
  if (testName.startsWith("T2")) return "Expected: 401/403 (or 404 if endpoint not present)";
  if (testName.startsWith("T3a")) return "Expected: 200 (token exists) OR 404 (token not found)";
  if (testName.startsWith("T3b")) return "Expected: 401/403 (public RSVP write must not be allowed)";
  if (testName.startsWith("T4")) return "Expected: Detect lost update if single-key array; otherwise no loss";
  if (testName.startsWith("T5")) return "Expected: env vars present in .env / runtime as appropriate";
  return "Expected: n/a";
}

function mdEscape(s) {
  return String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br/>");
}

function writeMarkdownReport(report) {
  const lines = [];
  lines.push(`# API Audit Report`);
  lines.push(``);
  lines.push(`- Generated: \`${report.startedAt}\``);
  lines.push(`- Base URLs: ${report.baseUrls.map((u) => `\`${u}\``).join(", ")}`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(`This report is **read-only by default** and **redacts token/email-like strings**.`);
  lines.push(``);

  for (const run of report.runs) {
    lines.push(`## Target: \`${run.baseUrl}\``);
    lines.push(`- allowWrite: \`${String(run.allowWrite)}\``);
    lines.push(``);
    lines.push(`| Test | Status | Pass | Notes | Expected | Evidence |`);
    lines.push(`|---|---:|:---:|---|---|---|`);
    for (const t of run.tests) {
      const status = t?.response?.status ?? "";
      const pass = t.ok ? "✅" : "❌";
      const notes = t.skipped
        ? `skipped: ${t.reason || "n/a"}`
        : t.assert?.pass === false
          ? `assert failed: expected ${t.assert.expected}, got ${t.assert.actual}`
          : (t.error ? `error: ${t.error}` : "");
      const expected = expectedFor(t.name);
      const evidenceUrl = t?.request?.url ? redactTokenLike(t.request.url) : "";
      const evidence = evidenceUrl ? `\`${evidenceUrl}\`` : "";
      lines.push(
        `| ${mdEscape(t.name)} | ${mdEscape(status)} | ${pass} | ${mdEscape(redactTokenLike(notes))} | ${mdEscape(expected)} | ${mdEscape(evidence)} |`
      );
    }
    lines.push(``);
  }

  lines.push(`## Files`);
  lines.push(`- JSON: \`tools/audit-api.report.json\``);
  lines.push(`- MD: \`tools/audit-api.report.md\``);
  lines.push(``);
  return lines.join("\n") + "\n";
}

function parseBaseUrls() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (args.length) return args;
  const env = process.env.AUDIT_BASE_URLS;
  if (env && env.trim()) return env.split(",").map((s) => s.trim()).filter(Boolean);
  return ["http://localhost:3210", "http://localhost:3001"];
}

async function main() {
  const baseUrls = parseBaseUrls();
  const allowWrite =
    process.env.AUDIT_ALLOW_WRITE === "1" || process.env.AUDIT_ALLOW_WRITE === "true";
  const dotenv = loadDotenvFile();
  const envAdminKey = process.env.AUDIT_ADMIN_KEY || null;

  const report = {
    startedAt: nowIso(),
    baseUrls,
    notes: [
      "Output redacts token/email-like strings.",
      "Writes are disabled by default for non-localhost targets.",
      "Provide AUDIT_ADMIN_KEY to test admin-protected flows.",
    ],
    runs: [],
  };

  for (const baseUrl of baseUrls) {
    // eslint-disable-next-line no-console
    console.log(`\n=== Auditing ${baseUrl} ===`);
    // Safety: only auto-load ADMIN_KEY from .env for localhost targets.
    const localAdminKey =
      envAdminKey || (isLocalhost(baseUrl) ? dotenv?.ADMIN_KEY || null : null);
    const r = await runForBase(baseUrl, { allowWrite, adminKey: localAdminKey, dotenv });
    report.runs.push(r);
    // eslint-disable-next-line no-console
    console.log(safeJson({ baseUrl: r.baseUrl, allowWrite: r.allowWrite, tests: r.tests.map(t => ({ name: t.name, ok: t.ok, ms: t.ms, status: t.response?.status, skipped: t.skipped })) }));
  }

  const outPath = new URL("../tools/audit-api.report.json", import.meta.url);
  fs.writeFileSync(outPath, safeJson(report) + "\n", "utf8");
  const mdPath = new URL("../tools/audit-api.report.md", import.meta.url);
  fs.writeFileSync(mdPath, writeMarkdownReport(report), "utf8");
  // eslint-disable-next-line no-console
  console.log(`\nWrote report to ${outPath.pathname}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Audit failed:", redactTokenLike(e?.stack || e?.message || String(e)));
  process.exitCode = 1;
});

