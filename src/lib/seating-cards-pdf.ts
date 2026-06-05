/**
 * Genera el HTML de tarjetas de seating (A5) para imprimir.
 * Diseño elegante: numero + "Mesa" en tipografia script dorada,
 * nombres de pila en mayusculas y negrita debajo.
 */

import type { PersonaPlano, AsignacionSilla } from '@/types/plano';
import type { MesaConfig } from '@/types/mesas';

export interface SeatingCard {
  numero: string;
  nombres: string[];
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

  return mesas
    .map(mesa => {
      const mesaAsignaciones = asignaciones
        .filter(a => a.mesaId === mesa.id)
        .sort((a, b) => a.sillaIndex - b.sillaIndex);

      const nombres = mesaAsignaciones
        .map(a => {
          const p = personaMap.get(a.personaId);
          return p ? p.nombre.trim() : null;
        })
        .filter(Boolean) as string[];

      return {
        numero: extractNumero(mesa.nombre),
        nombres,
      };
    })
    .filter(c => c.nombres.length > 0);
}

export function getSeatingCardsPdfHtml(cards: SeatingCard[]): string {
  const cardsHtml = cards.map(card => {
    const nombresHtml = card.nombres
      .map(n => `<div class="guest-name">${escHtml(n.toUpperCase())}</div>`)
      .join('');

    return `<div class="card">
      <div class="card-numero">${escHtml(card.numero)}</div>
      <div class="card-fixed">
        <div class="mesa-label">Mesa</div>
        <div class="card-divider"></div>
        <div class="card-guests">
          ${nombresHtml}
        </div>
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
      overflow: hidden;
    }

    .card:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .card-numero {
      position: absolute;
      top: 1.2rem;
      right: 2rem;
      font-family: 'Pinyon Script', cursive;
      font-size: 10rem;
      line-height: 1;
      color: #c9a84c;
    }

    .card-fixed {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      width: 100%;
      padding: 0 1.5rem;
    }

    .mesa-label {
      font-family: 'Pinyon Script', cursive;
      font-size: 6.4rem;
      line-height: 1.1;
      color: #c9a84c;
    }

    .card-divider {
      width: 4rem;
      height: 1px;
      background: #c9a84c;
      margin: 1.5rem auto 2rem;
    }

    .card-guests {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .guest-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      color: #4a4a4a;
    }
  </style>
</head>
<body>
  <div class="print-hint no-print">Pulsa <kbd>Ctrl</kbd>+<kbd>P</kbd> para guardar como PDF &mdash; Configura papel <strong>A5</strong> y margenes a <strong>0</strong></div>
  ${cardsHtml}
</body>
</html>`;
}
