import React, { useRef, useEffect, useCallback } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { renderOverlay } from './overlayUtils';
import { Video } from 'lucide-react';

export default function VideoPanel({
  videoRef,
  src,
  label,
  labelColor,
  muted      = false,
  showOverlay= true,
  showGuides = false,
  showAlignment = false,
  isPlaying  = false,
  onTimeUpdate,
  onLoaded,
}) {
  const canvasRef     = useRef(null);
  const containerRef  = useRef(null);
  const rafRef        = useRef(null);

  // Resize canvas to match container
  const syncCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }
  }, []);

  // Draw overlays
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    syncCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderOverlay(ctx, canvas.width, canvas.height, {
      showGuides,
      showAlignment,
      isPlaying: showOverlay && isPlaying,
      accentColor: labelColor,
    });
  }, [showGuides, showAlignment, showOverlay, isPlaying, labelColor, syncCanvas]);

  // RAF loop — only runs while playing, otherwise single paint on deps change
  useEffect(() => {
    const loop = () => {
      draw();
      if (isPlaying) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, isPlaying]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { syncCanvas(); draw(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncCanvas, draw]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden"
      style={{ background: '#000' }}>

      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="absolute inset-0 w-full h-full object-contain"
          muted={muted}
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={onTimeUpdate}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: COLORS.surface }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center border"
            style={{ borderColor: COLORS.border, background: COLORS.bg }}>
            <Video size={20} strokeWidth={1.5} style={{ color: COLORS.textTertiary }} />
          </div>
          <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            No clip loaded
          </p>
        </div>
      )}

      {/* Overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Label */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: labelColor }} />
        <span className="text-[9px] tracking-[0.2em] uppercase font-bold"
          style={{ color: labelColor, fontFamily: FONT.mono }}>
          {label}
        </span>
      </div>
    </div>
  );
}