/**
 * Genera el HTML de la lista de alergias para imprimir/guardar como PDF.
 */

export interface MesaAlergias {
  mesaNombre: string;
  invitados: { nombreCompleto: string; alergias: string }[];
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function getListaAlergiasPdfHtml(mesasConAlergias: MesaAlergias[]): string {
  const totalInvitados = mesasConAlergias.reduce((acc, m) => acc + m.invitados.length, 0);

  const mesasHtml = mesasConAlergias.map(mesa => {
    const rows = mesa.invitados.map(inv =>
      `<tr>
        <td class="name">${escHtml(inv.nombreCompleto)}</td>
        <td class="alergias">${escHtml(inv.alergias)}</td>
      </tr>`
    ).join('');

    return `<div class="mesa-section">
      <h2 class="mesa-title">${escHtml(mesa.mesaNombre)}</h2>
      <table>
        <thead><tr><th>Nombre</th><th>Alergias / Intolerancias</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lista de Alergias — Boda</title>
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
      --warning: #b45309;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .mesa-section { page-break-inside: avoid; }
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
      position: fixed; top: 1rem; right: 1rem;
      background: var(--accent); color: white;
      padding: 0.75rem 1.25rem; border-radius: 8px;
      font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;
    }
    .print-hint kbd {
      background: rgba(255,255,255,0.2); padding: 0.2em 0.5em; border-radius: 4px; font-family: inherit;
    }
    header {
      text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(139,115,85,0.3);
    }
    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem; font-weight: 600; color: var(--accent);
      letter-spacing: 0.08em; text-transform: uppercase;
    }
    .subtitle { font-size: 0.9rem; color: var(--ink-soft); margin-top: 0.4rem; font-weight: 300; }
    .stats { font-size: 0.85rem; color: var(--ink-soft); margin-top: 0.75rem; }
    .stats strong { color: var(--warning); }
    .mesa-section { margin-bottom: 2rem; }
    .mesa-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.25rem; font-weight: 600; color: var(--accent);
      margin-bottom: 0.5rem; letter-spacing: 0.04em;
      padding-bottom: 0.3rem; border-bottom: 2px solid var(--accent-light);
    }
    table {
      width: 100%; border-collapse: collapse;
      background: white; border-radius: 8px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    thead th {
      background: rgba(139,115,85,0.08); color: var(--ink-soft);
      padding: 0.5rem 0.75rem; text-align: left;
      font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em;
    }
    tbody td {
      padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; font-size: 0.88rem;
    }
    .name { font-weight: 500; }
    .alergias { color: var(--warning); font-weight: 500; }
    footer {
      margin-top: 2rem; padding-top: 1rem;
      border-top: 1px solid rgba(139,115,85,0.2);
      text-align: center; font-size: 0.75rem; color: var(--ink-soft);
    }
  </style>
</head>
<body>
  <div class="print-hint no-print">💡 <kbd>Ctrl</kbd>+<kbd>P</kbd> para guardar como PDF</div>
  <header>
    <h1>Lista de Alergias</h1>
    <p class="subtitle">Alergias e intolerancias alimentarias por mesa</p>
    <p class="stats"><strong>${totalInvitados}</strong> invitado${totalInvitados !== 1 ? 's' : ''} con alergias en <strong>${mesasConAlergias.length}</strong> mesa${mesasConAlergias.length !== 1 ? 's' : ''}</p>
  </header>
  ${mesasHtml}
  <footer>Generado para la boda · Lista de alergias e intolerancias alimentarias</footer>
</body>
</html>`;
}
