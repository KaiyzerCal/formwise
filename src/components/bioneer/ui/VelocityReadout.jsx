import React from "react";
import { COLORS, FONT } from "./DesignTokens";

/**
 * Bar speed, and the number a coach actually acts on: how far this set has
 * slowed off its best rep.
 *
 * Absolute m/s is labelled an estimate on purpose. Measured against simulated
 * sets it runs about 10% low — the fit window straddles both turnarounds, and
 * trimming the ramp removes most but not all of that. Velocity *loss* is a
 * ratio between reps in one camera setup, so the same offset sits on top and
 * bottom and cancels. That is the figure shown large.
 */

/** Green under 10%, amber approaching the threshold, red past it. */
function lossColor(pct, threshold) {
  if (pct == null) return COLORS.textTertiary;
  if (pct >= threshold) return COLORS.fault;
  if (pct >= threshold * 0.5) return COLORS.warning;
  return COLORS.correct;
}

export default function VelocityReadout({
  velocitySet,
  barVelocity,
  threshold = 20,
  compact = false,
}) {
  const reps = velocitySet?.reps ?? [];
  const last = reps[reps.length - 1] ?? null;
  const loss = velocitySet?.velocityLossPct ?? null;
  const live = barVelocity?.up;

  // Nothing to say before the first complete concentric. Showing zeroes reads
  // as a measurement rather than an absence of one.
  if (reps.length === 0) {
    return (
      <div
        className="rounded-lg border px-3 py-2"
        style={{ background: COLORS.surface, borderColor: COLORS.border, fontFamily: FONT.mono }}
      >
        <div className="text-[9px] tracking-[0.14em] uppercase" style={{ color: COLORS.textTertiary }}>
          Bar speed
        </div>
        <div className="text-[11px] mt-1" style={{ color: COLORS.textSecondary }}>
          {Number.isFinite(live)
            ? `${live > 0 ? '▲' : '▼'} ${Math.abs(live).toFixed(2)} m/s`
            : 'waiting for the first rep'}
        </div>
      </div>
    );
  }

  const stop = loss != null && loss >= threshold;

  return (
    <div
      className="rounded-lg border px-3 py-2"
      style={{
        background: COLORS.surface,
        borderColor: stop ? COLORS.fault : COLORS.border,
        fontFamily: FONT.mono,
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] tracking-[0.14em] uppercase" style={{ color: COLORS.textTertiary }}>
          Velocity loss
        </span>
        <span className="text-[9px]" style={{ color: COLORS.textMuted }}>
          rep {last.index} · {velocitySet.track}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-[26px] leading-none font-semibold" style={{ color: lossColor(loss, threshold) }}>
          {loss.toFixed(0)}%
        </span>
        <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
          off best
        </span>
      </div>

      {stop && (
        <div className="mt-1 text-[10px] tracking-[0.08em] uppercase" style={{ color: COLORS.fault }}>
          past {threshold}% — call the set
        </div>
      )}

      {!compact && (
        <>
          <div className="flex justify-between mt-2 text-[10px]" style={{ color: COLORS.textSecondary }}>
            <span>this rep <span style={{ color: COLORS.gold }}>{last.meanVelocity.toFixed(2)}</span> m/s</span>
            <span>best <span style={{ color: COLORS.gold }}>{velocitySet.bestVelocity.toFixed(2)}</span></span>
          </div>

          {/* Every rep of the set, so the trend is visible rather than inferred
              from one number that just changed. */}
          <div className="flex items-end gap-[3px] mt-2" style={{ height: 26 }}>
            {reps.map((r) => {
              const h = velocitySet.bestVelocity > 0
                ? Math.max(3, (r.meanVelocity / velocitySet.bestVelocity) * 26)
                : 3;
              return (
                <div
                  key={r.index}
                  title={`rep ${r.index}: ${r.meanVelocity.toFixed(2)} m/s, -${r.lossFromBestPct.toFixed(0)}%`}
                  style={{
                    width: 8,
                    height: h,
                    background: lossColor(r.lossFromBestPct, threshold),
                    opacity: 0.85,
                    borderRadius: 1,
                  }}
                />
              );
            })}
          </div>

          <div className="mt-1.5 text-[9px]" style={{ color: COLORS.textMuted }}>
            m/s is an estimate — act on the loss %
          </div>
        </>
      )}
    </div>
  );
}
