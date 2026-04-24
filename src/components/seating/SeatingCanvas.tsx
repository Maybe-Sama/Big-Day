import { useRef, useCallback, useState } from 'react';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DraggableTable } from './DraggableTable';

export function SeatingCanvas() {
  const { mesas, zoom, panX, panY, setZoom, setPan, selectTable } = useSeatingEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  // Zoom only via buttons — wheel scroll was capturing popover scrolls

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on middle click or if clicking empty space
    if (e.button === 1 || (e.button === 0 && e.target === containerRef.current?.firstElementChild)) {
      e.preventDefault();
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = (e.clientX - lastPanRef.current.x) / zoom;
    const dy = (e.clientY - lastPanRef.current.y) / zoom;
    lastPanRef.current = { x: e.clientX, y: e.clientY };
    setPan(panX + dx, panY + dy);
  }, [isPanning, zoom, panX, panY, setPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Deselect table when clicking empty canvas
    if (e.target === e.currentTarget || e.target === containerRef.current?.firstElementChild) {
      selectTable(null);
    }
  }, [selectTable]);

  return (
    <div
      ref={containerRef}
      id="seating-canvas-viewport"
      className="absolute inset-0 overflow-hidden"
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
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
    </div>
  );
}
