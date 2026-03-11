/**
 * VideoPanel — renders a single video + canvas pose overlay for Technique Compare.
 * Draws landmarks on every animation frame while the video is playing,
 * or on demand when paused/seeked.
 */

import React, { useRef, useEffect } from 'react';
import { COLORS } from '../ui/DesignTokens';
import { drawPoseOverlay, drawAngleLabels } from './poseUtils';

export default function VideoPanel({
  videoRef,         // forwarded ref to <video>
  src,              // video src URL (blob or http)
  label,            // e.g. "YOUR MOVEMENT"
  labelColor,       // e.g. COLORS.correct
  landmarks,        // MediaPipe landmark array or null
  angles,           // extracted angle map for this side (for labels)
  profile,          // compare profile (for angle label positions)
  showAngles,
  color,            // skeleton color
  onLoaded,         // () => void
  onTimeUpdate,     // () => void — optional
  playing,
  muted = false,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Render loop — draws skeleton overlay on every animation frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const w = canvas.width  = canvas.offsetWidth  * window.devicePixelRatio || canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio || canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      if (landmarks) {
        drawPoseOverlay(ctx, landmarks, color, w, h, { dotSize: 5, lineWidth: 2.5 });
        if (showAngles && angles && profile) {
          drawAngleLabels(ctx, landmarks, angles, profile, w, h);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [landmarks, angles, showAngles, profile, color]);

  if (!src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3"
        style={{ background: COLORS.surface }}>
        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary }}>
          {label}
        </span>
        <span className="text-[11px]" style={{ color: COLORS.textMuted }}>No video loaded</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ background: '#000' }}>
      {/* Label */}
      <span className="absolute top-3 left-3 z-20 text-[9px] tracking-[0.2em] uppercase font-bold px-2 py-1 rounded"
        style={{ color: labelColor, background: 'rgba(0,0,0,0.6)' }}>
        {label}
      </span>

      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        muted={muted}
        loop
        onLoadedData={onLoaded}
        onTimeUpdate={onTimeUpdate}
        style={{ background: '#000' }}
      />

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />
    </div>
  );
}