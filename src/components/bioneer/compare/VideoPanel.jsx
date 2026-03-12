import React, { useRef, useEffect, useCallback } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { renderOverlay } from './overlayUtils';
import { Video } from 'lucide-react';

// ── MediaPipe skeleton connectivity ──────────────────────────────────────────
const POSE_CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],  // shoulders/arms
  [11,23],[12,24],[23,24],                   // torso
  [23,25],[25,27],[24,26],[26,28],           // legs
  [27,29],[27,31],[28,30],[28,32],           // ankles/feet
];

const KEY_JOINTS = new Set([11,12,13,14,15,16,23,24,25,26,27,28]);

function drawSkeleton(ctx, lm, w, h, accentColor) {
  if (!lm || !lm.length) return;
  ctx.save();

  // Connectors
  POSE_CONNECTIONS.forEach(([a, b]) => {
    const pa = lm[a], pb = lm[b];
    if (!pa || !pb || pa.visibility < 0.3 || pb.visibility < 0.3) return;
    const alpha = Math.min(pa.visibility, pb.visibility);
    ctx.strokeStyle = `rgba(255,255,255,${(alpha * 0.65).toFixed(2)})`;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  });

  // Joints
  lm.forEach((p, i) => {
    if (!p || p.visibility < 0.35) return;
    const x = p.x * w, y = p.y * h;
    const isKey = KEY_JOINTS.has(i);
    const radius = isKey ? 5 : 3;
    const color  = isKey ? accentColor : 'rgba(255,255,255,0.6)';

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = p.visibility;
    ctx.fill();

    if (isKey) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = `${accentColor}60`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 1;
  ctx.restore();
}

export default function VideoPanel({
  videoRef,
  src,
  label,
  labelColor,
  muted          = false,
  showOverlay    = true,
  showGuides     = false,
  showAlignment  = false,
  isPlaying      = false,
  landmarks      = null,   // real MediaPipe landmarks (left panel only)
  onTimeUpdate,
  onLoaded,
}) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const rafRef       = useRef(null);

  const syncCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const el     = containerRef.current;
    if (!canvas || !el) return;
    const { width, height } = el.getBoundingClientRect();
    if (canvas.width !== Math.round(width) || canvas.height !== Math.round(height)) {
      canvas.width  = Math.round(width);
      canvas.height = Math.round(height);
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    syncCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: w, height: h } = canvas;

    ctx.clearRect(0, 0, w, h);

    // Guide/alignment overlays from Pass 2
    if (showOverlay) {
      renderOverlay(ctx, w, h, { showGuides, showAlignment, isPlaying, accentColor: labelColor });
    }

    // Real skeleton
    if (landmarks && showOverlay) {
      drawSkeleton(ctx, landmarks, w, h, labelColor);
    }
  }, [showOverlay, showGuides, showAlignment, isPlaying, landmarks, labelColor, syncCanvas]);

  // RAF loop
  useEffect(() => {
    const loop = () => {
      draw();
      if (isPlaying) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, isPlaying]);

  // Redraw on landmark change even when paused
  useEffect(() => { draw(); }, [landmarks, draw]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { syncCanvas(); draw(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncCanvas, draw]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#000' }}>

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
          <p className="text-[10px] tracking-[0.15em] uppercase"
            style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            No clip loaded
          </p>
        </div>
      )}

      {/* Canvas overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

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