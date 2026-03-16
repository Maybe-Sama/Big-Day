/**
 * Genera el HTML de la lista de invitados para imprimir/guardar como PDF.
 * Misma estructura y estilos que wedding-guests-list/lista-invitados.html.
 */

import type { GrupoInvitados } from "@/types/invitados";
import { getTipoAcompananteLabel } from "@/types/invitados";

export interface GuestGroupForPdf {
  main: string;
  members: { name: string; rel: string; status?: string }[];
  status: "Confirmado" | "Pendiente" | "Rechazado";
}

/**
 * Convierte grupos de la app al formato esperado por la plantilla PDF.
 */
export function gruposToGuestGroupsForPdf(grupos: GrupoInvitados[]): GuestGroupForPdf[] {
  return grupos.map((g) => {
    const main = [g.invitadoPrincipal.nombre, g.invitadoPrincipal.apellidos].filter(Boolean).join(" ").trim() || "Sin nombre";
    const statusMap = {
      confirmado: "Confirmado" as const,
      pendiente: "Pendiente" as const,
      rechazado: "Rechazado" as const,
    };
    const status = statusMap[g.asistencia] ?? "Pendiente";
    const members = (g.acompanantes ?? []).map((a) => {
      const name = [a.nombre, a.apellidos].filter(Boolean).join(" ").trim() || "—";
      const rel = getTipoAcompananteLabel(a.tipo);
      const memberStatus = a.asistencia === "rechazado" ? "Rechazado" : undefined;
      return { name, rel, ...(memberStatus && { status: memberStatus }) };
    });
    return { main, members, status };
  });
}

/**
 * Devuelve el HTML completo de la lista de invitados (estilos + datos).
 * Se puede abrir en una ventana nueva y usar Ctrl+P → Guardar como PDF.
 */
export function getListaInvitadosHtml(grupos: GrupoInvitados[]): string {
  const guestGroups = gruposToGuestGroupsForPdf(grupos);
  const jsonPayload = JSON.stringify(guestGroups).replace(/<\/script>/gi, "<\\/script>");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lista de Invitados — Boda</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #1a1a1a;
      --ink-soft: #4a4a4a;
      --accent: #8b7355;
      --accent-light: #c4a77d;
      --paper: #faf9f7;
      --confirmed: #2d5a3d;
      --pending: #8b6914;
      --rejected: #8b3a3a;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @media print {
      body { background: white !important; }
      .page-break { page-break-before: always; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Source Sans 3', sans-serif;
      background: var(--paper);
      color: var(--ink);
      line-height: 1.5;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .print-hint {
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: var(--accent);
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    .print-hint kbd {
      background: rgba(255,255,255,0.2);
      padding: 0.2em 0.5em;
      border-radius: 4px;
      font-family: inherit;
    }
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(139, 115, 85, 0.3);
    }
    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.25rem;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .subtitle { font-size: 0.95rem; color: var(--ink-soft); margin-top: 0.5rem; font-weight: 300; }
    .stats { display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem; font-size: 0.85rem; color: var(--ink-soft); }
    .stats span { font-weight: 500; }
    .section-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.35rem;
      font-weight: 600;
      color: var(--accent);
      margin: 2.5rem 0 1rem;
      letter-spacing: 0.05em;
    }
    .group {
      background: white;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border-left: 4px solid var(--accent-light);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .group.confirmed { border-left-color: var(--confirmed); }
    .group.pending { border-left-color: var(--pending); }
    .group.rejected { border-left-color: var(--rejected); }
    .page-break { page-break-before: always; }
    .group-num { color: var(--accent); font-weight: 700; margin-right: 0.35rem; }
    .group-main { font-weight: 600; font-size: 1rem; color: var(--ink); }
    .group-members { font-size: 0.9rem; color: var(--ink-soft); margin-top: 0.35rem; }
    .group-members span { display: inline-block; margin-right: 0.5rem; }
    .group-members span::after { content: " · "; color: #bbb; }
    .group-members span:last-child::after { content: ""; }
    .group-status {
      flex-shrink: 0;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25em 0.6em;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .group-status.confirmed { background: rgba(45, 90, 61, 0.12); color: var(--confirmed); }
    .group-status.pending { background: rgba(139, 105, 20, 0.12); color: var(--pending); }
    .group-status.rejected { background: rgba(139, 58, 58, 0.12); color: var(--rejected); }
    .member-rejected { text-decoration: line-through; opacity: 0.7; }
    .totales-section {
      margin-top: 2.5rem;
      padding: 1.5rem 1.75rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid rgba(139, 115, 85, 0.2);
    }
    .totales-section h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 1.25rem;
      letter-spacing: 0.04em;
    }
    .totales-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem 2rem; }
    .totales-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .totales-item .label { font-size: 0.8rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; }
    .totales-item .value { font-size: 1.25rem; font-weight: 600; color: var(--ink); }
    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(139, 115, 85, 0.2);
      text-align: center;
      font-size: 0.8rem;
      color: var(--ink-soft);
    }
  </style>
</head>
<body>
  <div class="print-hint no-print">💡 <kbd>Ctrl</kbd>+<kbd>P</kbd> para guardar como PDF</div>
  <header>
    <h1>Lista de Invitados</h1>
    <p class="subtitle">Invitados agrupados con sus acompañantes</p>
    <div class="stats">
      <span id="total-groups">—</span> grupos ·
      <span id="total-confirmed">—</span> confirmados ·
      <span id="total-pending">—</span> pendientes
    </div>
  </header>
  <section id="novia">
    <h2 class="section-title">Familia Novia</h2>
    <div id="novia-groups"></div>
  </section>
  <section id="novio" class="page-break">
    <h2 class="section-title">Familia Novio</h2>
    <div id="novio-groups"></div>
  </section>
  <section id="totales" class="totales-section page-break">
    <h2>Totales</h2>
    <div id="totales-content" class="totales-grid"></div>
  </section>
  <footer>Generado para la boda · Lista completa de invitados y acompañantes</footer>
  <script>
    const guestGroups = ${jsonPayload};
    const novioStartIdx = guestGroups.findIndex(function(g) { return g.main && g.main.toLowerCase().indexOf('novio') >= 0; });
    const novia = novioStartIdx >= 0 ? guestGroups.slice(0, novioStartIdx) : guestGroups;
    const novio = novioStartIdx >= 0 ? guestGroups.slice(novioStartIdx) : [];
    function countPersonsInGroup(g) {
      var rejectedMembers = (g.members || []).filter(function(m) { return m.status === 'Rechazado'; }).length;
      var totalInGroup = 1 + (g.members || []).length;
      var acceptedInGroup = totalInGroup - rejectedMembers;
      return { total: totalInGroup, accepted: acceptedInGroup, rejected: rejectedMembers };
    }
    function renderGroup(g, num) {
      var statusClass = (g.status || 'Pendiente').toLowerCase().replace(/ /g, '-');
      var membersHtml = '';
      if (g.members && g.members.length) {
        membersHtml = '<div class="group-members">' + g.members.map(function(m) {
          var cls = m.status === 'Rechazado' ? 'member-rejected' : '';
          return '<span class="' + cls + '">' + (m.name || '—') + ' <em>(' + (m.rel || '—') + ')</em></span>';
        }).join('') + '</div>';
      }
      return '<div class="group ' + statusClass + '"><div><div class="group-main"><span class="group-num">' + num + '.</span>' + (g.main || '—') + '</div>' + membersHtml + '</div><span class="group-status ' + statusClass + '">' + (g.status || 'Pendiente') + '</span></div>';
    }
    document.getElementById('novia-groups').innerHTML = novia.map(function(g, i) { return renderGroup(g, i + 1); }).join('');
    document.getElementById('novio-groups').innerHTML = novio.map(function(g, i) { return renderGroup(g, novia.length + i + 1); }).join('');
    var confirmed = guestGroups.filter(function(g) { return g.status === 'Confirmado'; }).length;
    var pending = guestGroups.filter(function(g) { return g.status === 'Pendiente'; }).length;
    document.getElementById('total-groups').textContent = guestGroups.length;
    document.getElementById('total-confirmed').textContent = confirmed;
    document.getElementById('total-pending').textContent = pending;
    var noviaPersons = novia.reduce(function(acc, g) { return acc + countPersonsInGroup(g).accepted; }, 0);
    var novioPersons = novio.reduce(function(acc, g) { return acc + countPersonsInGroup(g).accepted; }, 0);
    var totalRejectedMembers = guestGroups.reduce(function(acc, g) { return acc + (g.members || []).filter(function(m) { return m.status === 'Rechazado'; }).length; }, 0);
    var totalPersons = noviaPersons + novioPersons + totalRejectedMembers;
    var totalesHtml = '<div class="totales-item"><span class="label">Total grupos (invitados principales)</span><span class="value">' + guestGroups.length + '</span></div>' +
      '<div class="totales-item"><span class="label">Total invitados (personas)</span><span class="value">' + totalPersons + (totalRejectedMembers ? ' <small style="color:var(--ink-soft);font-weight:400">(incl. ' + totalRejectedMembers + ' rechazados)</small>' : '') + '</span></div>' +
      '<div class="totales-item"><span class="label">Familia Novia — grupos</span><span class="value">' + novia.length + '</span></div>' +
      '<div class="totales-item"><span class="label">Familia Novia — personas</span><span class="value">' + noviaPersons + '</span></div>' +
      '<div class="totales-item"><span class="label">Familia Novio — grupos</span><span class="value">' + novio.length + '</span></div>' +
      '<div class="totales-item"><span class="label">Familia Novio — personas</span><span class="value">' + novioPersons + '</span></div>' +
      '<div class="totales-item"><span class="label">Confirmados (grupos)</span><span class="value" style="color:var(--confirmed)">' + confirmed + '</span></div>' +
      '<div class="totales-item"><span class="label">Pendientes (grupos)</span><span class="value" style="color:var(--pending)">' + pending + '</span></div>' +
      (totalRejectedMembers ? '<div class="totales-item"><span class="label">Rechazados (personas)</span><span class="value" style="color:var(--rejected)">' + totalRejectedMembers + '</span></div>' : '');
    document.getElementById('totales-content').innerHTML = totalesHtml;
  </script>
</body>
</html>`;
}
