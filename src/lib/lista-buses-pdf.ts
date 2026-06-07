/**
 * Genera el HTML de la lista de pasajeros por bus para imprimir/guardar como PDF.
 * Contenido A5 centrado en pagina A4 para facilitar la impresion.
 */

export interface BusPasajeros {
  busNombre: string;
  pasajeros: { nombre: string; grupoNombre: string }[];
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function getListaBusesPdfHtml(buses: BusPasajeros[]): string {
  const totalPasajeros = buses.reduce((acc, b) => acc + b.pasajeros.length, 0);

  const busesHtml = buses.map(bus => {
    const rows = bus.pasajeros.map((p, i) =>
      `<tr>
        <td class="num">${i + 1}</td>
        <td class="name">${escHtml(p.nombre)}</td>
        <td class="group">${escHtml(p.grupoNombre)}</td>
      </tr>`
    ).join('');

    return `<div class="bus-section">
      <h2 class="bus-title">${escHtml(bus.busNombre)} <span class="bus-count">(${bus.pasajeros.length})</span></h2>
      ${bus.pasajeros.length === 0
        ? '<p class="empty">Sin pasajeros confirmados</p>'
        : `<table>
        <thead><tr><th style="width:2.5rem">#</th><th>Nombre</th><th>Grupo</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lista de Buses — Boda</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #1a1a1a;
      --ink-soft: #4a4a4a;
      --accent: #8b7355;
      --accent-light: #c4a77d;
      --paper: #faf9f7;
      --a5-width: 148mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .bus-section { page-break-inside: avoid; }
    }

    body {
      font-family: 'Source Sans 3', sans-serif;
      background: #e8e4df;
      color: var(--ink);
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    /* Contenido A5 centrado en A4 */
    .page-content {
      width: var(--a5-width);
      max-width: 100%;
      background: var(--paper);
      padding: 2rem 1.8rem;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    @media print {
      body { padding: 0; background: white !important; }
      .page-content {
        box-shadow: none; border-radius: 0;
        margin: 0 auto;
        padding: 15mm 12mm;
      }
    }

    /* Barra de acciones */
    .actions-bar {
      position: fixed; top: 1rem; right: 1rem;
      display: flex; gap: 0.5rem; z-index: 1000;
    }
    .action-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: var(--accent); color: white; border: none;
      padding: 0.6rem 1.1rem; border-radius: 8px;
      font-size: 0.85rem; font-family: inherit; font-weight: 500;
      cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: background 0.15s;
    }
    .action-btn:hover { background: #7a6349; }
    .action-btn svg {
      width: 16px; height: 16px; fill: none; stroke: currentColor;
      stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
    }

    header {
      text-align: center; margin-bottom: 1.5rem; padding-bottom: 1.2rem;
      border-bottom: 1px solid rgba(139,115,85,0.3);
    }
    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem; font-weight: 600; color: var(--accent);
      letter-spacing: 0.08em; text-transform: uppercase;
    }
    .subtitle { font-size: 0.85rem; color: var(--ink-soft); margin-top: 0.3rem; font-weight: 300; }
    .stats { font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.6rem; }
    .stats strong { color: var(--accent); }
    .bus-section { margin-bottom: 1.5rem; }
    .bus-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.1rem; font-weight: 600; color: var(--accent);
      margin-bottom: 0.4rem; letter-spacing: 0.04em;
      padding-bottom: 0.25rem; border-bottom: 2px solid var(--accent-light);
    }
    .bus-count { font-weight: 400; font-size: 0.9rem; color: var(--ink-soft); }
    .empty {
      font-size: 0.8rem; color: var(--ink-soft); font-style: italic;
      padding: 0.6rem; background: white; border-radius: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    table {
      width: 100%; border-collapse: collapse;
      background: white; border-radius: 6px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    thead th {
      background: rgba(139,115,85,0.08); color: var(--ink-soft);
      padding: 0.4rem 0.6rem; text-align: left;
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em;
    }
    tbody td {
      padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; font-size: 0.8rem;
    }
    .num { color: var(--accent); font-weight: 600; text-align: center; }
    .name { font-weight: 500; }
    .group { color: var(--ink-soft); font-size: 0.75rem; }
    footer {
      margin-top: 1.5rem; padding-top: 0.8rem;
      border-top: 1px solid rgba(139,115,85,0.2);
      text-align: center; font-size: 0.7rem; color: var(--ink-soft);
    }
  </style>
</head>
<body>
  <div class="actions-bar no-print">
    <button class="action-btn" onclick="window.print()">
      <svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Descargar PDF
    </button>
  </div>
  <div class="page-content">
    <header>
      <h1>Lista de Buses</h1>
      <p class="subtitle">Pasajeros confirmados por bus</p>
      <p class="stats"><strong>${totalPasajeros}</strong> pasajero${totalPasajeros !== 1 ? 's' : ''} en <strong>${buses.length}</strong> bus${buses.length !== 1 ? 'es' : ''}</p>
    </header>
    ${busesHtml}
    <footer>Generado para la boda &middot; Listado de pasajeros por bus</footer>
  </div>
</body>
</html>`;
}
