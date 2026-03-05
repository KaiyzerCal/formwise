import React, { useRef, useEffect, useState, useCallback } from "react";

const STATE_COLORS = {
  OPTIMAL: "#22C55E",
  ACCEPTABLE: "#EAB308",
  WARNING: "#F97316",
  DANGER: "#EF4444",
  null: "#ffffff20",
};

export default function TimelineBar({ frameResults, duration, onScrub }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frameResults?.length) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const segW = W / frameResults.length;
    frameResults.forEach((frame, i) => {
      ctx.fillStyle = STATE_COLORS[frame.worstState] || STATE_COLORS[null];
      ctx.fillRect(i * segW, 0, Math.ceil(segW), H);
    });

    // Phase labels
    const phaseChanges = [];
    let lastPhase = null;
    frameResults.forEach((frame, i) => {
      if (frame.phase && frame.phase !== lastPhase) {
        phaseChanges.push({ phase: frame.phase, idx: i });
        lastPhase = frame.phase;
      }
    });
    phaseChanges.forEach(({ phase, idx }) => {
      const x = (idx / frameResults.length) * W;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(x, 0, 1, H);
    });
  }, [frameResults]);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !frameResults?.length) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const idx = Math.min(Math.floor(pct * frameResults.length), frameResults.length - 1);
    const frame = frameResults[idx];
    if (frame) {
      setTooltip({ x: e.clientX - rect.left, t: frame.t, angles: frame.jointAngles, state: frame.worstState });
      if (onScrub) onScrub(frame.t, frame);
    }
  }, [frameResults, onScrub]);

  const phases = [];
  let lastPhase = null;
  frameResults?.forEach((frame, i) => {
    if (frame.phase && frame.phase !== lastPhase) {
      phases.push({ phase: frame.phase, pct: i / frameResults.length });
      lastPhase = frame.phase;
    }
  });

  return (
    <div className="w-full space-y-1">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={8}
          className="w-full rounded-full cursor-pointer"
          style={{ height: "8px" }}
          onClick={handleClick}
        />
        {tooltip && (
          <div
            className="absolute -top-10 pointer-events-none z-10"
            style={{ left: Math.max(0, Math.min(tooltip.x - 40, 280)) }}
          >
            <div className="px-2 py-1 rounded-md bg-black/90 border border-white/10 whitespace-nowrap">
              <p className="text-[9px] text-white/50" style={{ fontFamily: "'DM Mono', monospace" }}>
                {tooltip.t.toFixed(1)}s
              </p>
              {tooltip.angles && Object.entries(tooltip.angles).slice(0, 2).map(([label, angle]) => (
                <p key={label} className="text-[9px] text-white/70" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {label}: {angle}°
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Phase labels */}
      {phases.length > 0 && (
        <div className="relative h-4">
          {phases.map(({ phase, pct }, i) => (
            <span
              key={i}
              className="absolute text-[8px] text-white/25 uppercase tracking-wider transform -translate-x-1/2"
              style={{
                left: `${pct * 100}%`,
                fontFamily: "'DM Mono', monospace",
                maxWidth: "60px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {phase.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}