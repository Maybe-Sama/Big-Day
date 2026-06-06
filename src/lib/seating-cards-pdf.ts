/**
 * Genera el HTML de tarjetas de seating (A5) para imprimir.
 * Diseño elegante: numero + "Mesa" en tipografia script dorada,
 * nombres de pila en mayusculas y negrita debajo.
 */

import type { PersonaPlano, AsignacionSilla } from '@/types/plano';
import type { MesaConfig } from '@/types/mesas';

export interface SeatingCard {
  numero: string;
  label: string;
  nombres: string[];
  esNupcial: boolean;
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Extrae el numero de la mesa del nombre (e.g. "Mesa 3" -> "3", "Mesa Principal" -> "") */
function extractNumero(nombre: string): string {
  const match = nombre.match(/\d+/);
  return match ? match[0] : '';
}

export function buildSeatingCards(
  mesas: MesaConfig[],
  asignaciones: AsignacionSilla[],
  personas: PersonaPlano[]
): SeatingCard[] {
  const personaMap = new Map(personas.map(p => [p.personaId, p]));

  const cards = mesas
    .map(mesa => {
      const mesaAsignaciones = asignaciones
        .filter(a => a.mesaId === mesa.id);

      const nombres = mesaAsignaciones
        .map(a => {
          const p = personaMap.get(a.personaId);
          return p ? p.nombre.trim() : null;
        })
        .filter(Boolean) as string[];

      // Orden alfabético por defecto (independiente de la posición visual en la mesa)
      nombres.sort((a, b) => a.localeCompare(b, 'es'));

      return {
        numero: mesa.esNupcial ? '' : extractNumero(mesa.nombre),
        label: mesa.esNupcial ? 'Nupcial' : 'Mesa',
        nombres,
        esNupcial: mesa.esNupcial || false,
      };
    })
    .filter(c => c.nombres.length > 0);

  // Ordenar mesas: nupcial primero, luego por numero
  cards.sort((a, b) => {
    if (a.esNupcial && !b.esNupcial) return -1;
    if (!a.esNupcial && b.esNupcial) return 1;
    const na = parseInt(a.numero) || 0;
    const nb = parseInt(b.numero) || 0;
    return na - nb;
  });

  return cards;
}

export function getSeatingCardsPdfHtml(cards: SeatingCard[]): string {
  // Primera pagina: indice de mesas
  const indexRows = cards.map(card => {
    const mesaName = card.label === 'Nupcial' ? 'Nupcial' : `Mesa ${card.numero}`;
    return `<div class="index-row">
      <span class="index-mesa">${escHtml(mesaName)}</span>
      <span class="index-dots"></span>
      <span class="index-count">${card.nombres.length} persona${card.nombres.length !== 1 ? 's' : ''}</span>
    </div>`;
  }).join('');

  const totalPersonas = cards.reduce((sum, c) => sum + c.nombres.length, 0);

  const indexPage = `<div class="card index-page">
    <div class="index-inner">
      <h1 class="index-title">Seating</h1>
      <div class="index-divider"></div>
      <div class="index-list">
        ${indexRows}
      </div>
      <div class="index-divider"></div>
      <div class="index-total">Total: ${totalPersonas} personas</div>
    </div>
  </div>`;

  const cardsHtml = cards.map(card => {
    const nombresHtml = card.nombres
      .map(n => `<div class="guest-name">${escHtml(n.toUpperCase())}</div>`)
      .join('');

    const digitClass = card.numero.length >= 2 ? ' two-digit' : '';
    const numeroHtml = card.esNupcial ? '' : `<div class="card-numero${digitClass}">${escHtml(card.numero)}</div>`;
    return `<div class="card">
      ${numeroHtml}
      <div class="card-template">
        <div class="mesa-label">${escHtml(card.label)}</div>
        <div class="card-divider"></div>
      </div>
      <div class="card-guests" data-count="${card.nombres.length}">
        ${nombresHtml}
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seating — Boda</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .card { page-break-inside: avoid; break-inside: avoid; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }

    @page {
      size: A5 portrait;
      margin: 0;
    }

    body {
      background: #f5f0eb;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      gap: 1.5rem;
    }

    .print-hint {
      position: fixed; top: 1rem; right: 1rem;
      background: #8b7355; color: white;
      padding: 0.75rem 1.25rem; border-radius: 8px;
      font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;
      font-family: sans-serif;
    }
    .print-hint kbd {
      background: rgba(255,255,255,0.2); padding: 0.2em 0.5em; border-radius: 4px;
    }

    .card {
      width: 148mm;
      height: 210mm;
      background: #faf8f5;
      page-break-after: always;
      break-after: page;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .card:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    /* Numero arriba derecha */
    .card-numero {
      position: absolute;
      top: 1.2rem;
      right: 20%;
      font-family: 'Pinyon Script', cursive;
      font-size: 8rem;
      line-height: 0.85;
      color: #b0a080;
    }

    .card-numero.two-digit {
      right: 13%;
    }

    /* Bloque fijo: Mesa + rayita */
    .card-template {
      text-align: center;
      padding-top: 6rem;
      flex-shrink: 0;
    }

    .mesa-label {
      font-family: 'Pinyon Script', cursive;
      font-size: 6.3rem;
      line-height: 1;
      color: #b0a080;
      margin-bottom: 0.15rem;
    }

    .card-divider {
      width: 4rem;
      height: 1px;
      background: #b0a080;
      margin: 0 auto;
    }

    /* Nombres: rellenan el espacio restante, se ajustan */
    .card-guests {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      padding: 1rem 2rem 2rem;
      overflow: hidden;
    }

    .guest-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.3rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #5a5a5a;
      white-space: nowrap;
    }

    /* Reducir tamaño si hay muchos nombres */
    .card-guests[data-count="11"] .guest-name,
    .card-guests[data-count="12"] .guest-name { font-size: 1.95rem; }
    .card-guests[data-count="13"] .guest-name,
    .card-guests[data-count="14"] .guest-name { font-size: 1.7rem; }
    .card-guests[data-count="15"] .guest-name,
    .card-guests[data-count="16"] .guest-name { font-size: 1.5rem; }
    .card-guests[data-count="17"] .guest-name,
    .card-guests[data-count="18"] .guest-name,
    .card-guests[data-count="19"] .guest-name,
    .card-guests[data-count="20"] .guest-name { font-size: 1.25rem; }

    /* ── Pagina indice ── */
    .index-page {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .index-inner {
      text-align: center;
      width: 100%;
      padding: 2.5rem 3rem;
    }

    .index-title {
      font-family: 'Pinyon Script', cursive;
      font-size: 5rem;
      color: #b0a080;
      line-height: 1;
      margin-bottom: 1.5rem;
    }

    .index-divider {
      width: 5rem;
      height: 1px;
      background: #b0a080;
      margin: 1.5rem auto;
    }

    .index-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0.5rem 0;
    }

    .index-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.3rem;
      color: #5a5a5a;
    }

    .index-mesa {
      font-weight: 600;
      white-space: nowrap;
    }

    .index-dots {
      flex: 1;
      border-bottom: 1px dotted #c0b090;
      margin-bottom: 0.25rem;
    }

    .index-count {
      white-space: nowrap;
      color: #b0a080;
      font-weight: 500;
    }

    .index-total {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem;
      font-weight: 600;
      color: #b0a080;
    }
  </style>
</head>
<body>
  <div class="print-hint no-print">Pulsa <kbd>Ctrl</kbd>+<kbd>P</kbd> para guardar como PDF &mdash; Configura papel <strong>A5</strong> y margenes a <strong>0</strong></div>
  ${indexPage}
  ${cardsHtml}
</body>
</html>`;
}
