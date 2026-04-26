import { useRef, useCallback, useState } from 'react';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DraggableTable } from './DraggableTable';

interface PointerInfo {
  x: number;
  y: number;
}

export function SeatingCanvas() {
  const { mesas, zoom, panX, panY, setZoom, setPan, clearSelection } = useSeatingEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  // Active touch/mouse pointers for multi-touch pinch detection
  const pointersRef = useRef<Map<number, PointerInfo>>(new Map());
  // Last distance between two pointers (for pinch delta calculation)
  const lastPinchDistanceRef = useRef<number | null>(null);
  // Last pan position (single-pointer mode)
  const lastPanRef = useRef({ x: 0, y: 0 });

  // Live state values used inside pointer handlers (avoid stale closures)
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  zoomRef.current = zoom;
  panXRef.current = panX;
  panYRef.current = panY;

  const [isPanning, setIsPanning] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  const isOnInteractive = (target: HTMLElement) => {
    return target.closest('[data-table-id]') ||
           target.closest('button, input, [role="button"], [data-no-pan]');
  };

  const distanceBetween = (a: PointerInfo, b: PointerInfo) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const onInteractive = isOnInteractive(target);

    // Always track touch pointers for pinch detection (even if first finger is on a table,
    // a second finger can still trigger pinch-zoom)
    const isTouch = e.pointerType === 'touch';

    if (isTouch) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Two fingers down — switch to pinch mode and stop pan
      if (pointersRef.current.size === 2) {
        const [p1, p2] = Array.from(pointersRef.current.values());
        lastPinchDistanceRef.current = distanceBetween(p1, p2);
        setIsPinching(true);
        setIsPanning(false);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch { /* ignore */ }
        e.preventDefault();
        return;
      }

      // Single touch — start pan if not on an interactive element
      if (!onInteractive) {
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch { /* ignore */ }
        setIsPanning(true);
        lastPanRef.current = { x: e.clientX, y: e.clientY };
      }
      return;
    }

    // Mouse: middle click always pans
    if (e.button === 1) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Mouse left click pans on empty space
    if (e.button === 0 && !onInteractive) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const isTouch = e.pointerType === 'touch';

    // Multi-touch: handle pinch-zoom
    if (isTouch && pointersRef.current.size >= 2) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const points = Array.from(pointersRef.current.values()).slice(0, 2);
      const newDistance = distanceBetween(points[0], points[1]);

      if (lastPinchDistanceRef.current !== null && lastPinchDistanceRef.current > 0) {
        const ratio = newDistance / lastPinchDistanceRef.current;

        // Anchor zoom on midpoint of the two fingers (canvas-local coords)
        const rect = containerRef.current?.getBoundingClientRect();
        const midX = (points[0].x + points[1].x) / 2 - (rect?.left ?? 0);
        const midY = (points[0].y + points[1].y) / 2 - (rect?.top ?? 0);

        const oldZoom = zoomRef.current;
        const newZoom = Math.max(0.25, Math.min(2, oldZoom * ratio));

        // Adjust pan so the canvas point under the midpoint stays under the midpoint
        // In viewport coords: (canvasPoint + pan) * zoom = midpoint
        // canvasPoint = midpoint / zoom - pan
        // After zoom change, keep canvasPoint same:
        // newPan = midpoint/newZoom - canvasPoint = midpoint/newZoom - midpoint/oldZoom + oldPan
        const oldPanX = panXRef.current;
        const oldPanY = panYRef.current;
        const newPanX = oldPanX + midX * (1 / newZoom - 1 / oldZoom);
        const newPanY = oldPanY + midY * (1 / newZoom - 1 / oldZoom);

        setZoom(newZoom);
        setPan(newPanX, newPanY);
      }

      lastPinchDistanceRef.current = newDistance;
      e.preventDefault();
      return;
    }

    // Single-pointer pan
    if (!isPanning) return;
    if (isTouch) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const dx = (e.clientX - lastPanRef.current.x) / zoomRef.current;
    const dy = (e.clientY - lastPanRef.current.y) / zoomRef.current;
    lastPanRef.current = { x: e.clientX, y: e.clientY };
    setPan(panXRef.current + dx, panYRef.current + dy);
  }, [isPanning, setPan, setZoom]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
    }

    pointersRef.current.delete(e.pointerId);

    // Exit pinch when fewer than 2 fingers remain
    if (pointersRef.current.size < 2) {
      setIsPinching(false);
      lastPinchDistanceRef.current = null;
    }

    // Exit pan when no fingers/buttons remain
    if (pointersRef.current.size === 0) {
      setIsPanning(false);
    } else if (pointersRef.current.size === 1) {
      // Resume single-finger pan from the remaining pointer
      const remaining = Array.from(pointersRef.current.values())[0];
      lastPanRef.current = { x: remaining.x, y: remaining.y };
      setIsPanning(true);
    }
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-table-id]')) {
      clearSelection();
    }
  }, [clearSelection]);

  return (
    <div
      ref={containerRef}
      id="seating-canvas-viewport"
      className="absolute inset-0 overflow-hidden"
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleCanvasClick}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)',
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${panX * zoom}px ${panY * zoom}px`,
        }}
      />

      {/* Viewport with transform */}
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: '0 0',
        }}
      >
        {mesas.map(mesa => (
          <DraggableTable key={mesa.id} mesa={mesa} />
        ))}
      </div>

      {/* Pinch indicator (mobile feedback) */}
      {isPinching && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-card/95 backdrop-blur border shadow-md text-xs font-medium pointer-events-none md:hidden">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
