/**
 * overlayUtils.js
 * Safe, static overlay rendering for the Technique Compare canvas.
 * No skeleton simulation. No fake biomechanics.
 */

import { COLORS } from '../ui/DesignTokens';

/**
 * Draw all enabled overlay layers onto a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 * @param {object} opts
 */
export function renderOverlay(ctx, w, h, {
  showGuides     = false,
  showAlignment  = false,
  isPlaying      = false,
  accentColor    = COLORS.gold,
} = {}) {
  ctx.clearRect(0, 0, w, h);

  if (showGuides)    drawGuides(ctx, w, h, accentColor);
  if (showAlignment) drawAlignment(ctx, w, h, accentColor);
  if (isPlaying)     drawPlayingGlow(ctx, w, h, accentColor);
}

/** Rule-of-thirds grid + center vertical line */
function drawGuides(ctx, w, h, accent) {
  ctx.save();
  ctx.strokeStyle = `${accent}30`;
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 6]);

  // Thirds
  [1/3, 2/3].forEach(f => {
    ctx.beginPath(); ctx.moveTo(w * f, 0); ctx.lineTo(w * f, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h * f); ctx.lineTo(w, h * f); ctx.stroke();
  });

  // Center vertical
  ctx.strokeStyle = `${accent}50`;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.stroke();

  // Foot zone box (lower third)
  ctx.strokeStyle = `${accent}25`;
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 5]);
  const boxX = w * 0.25, boxW = w * 0.5, boxY = h * 0.72, boxH = h * 0.2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Foot zone label
  ctx.restore();
  ctx.save();
  ctx.fillStyle = `${accent}50`;
  ctx.font      = `500 ${Math.max(9, w * 0.02)}px "DM Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('STANCE ZONE', w * 0.5, boxY - 5);
  ctx.restore();
}

/** Shoulder + hip horizontal alignment guides */
function drawAlignment(ctx, w, h, accent) {
  ctx.save();

  const lines = [
    { y: h * 0.28, label: 'SHOULDER LINE', alpha: 0.45 },
    { y: h * 0.55, label: 'HIP LINE',      alpha: 0.35 },
  ];

  lines.forEach(({ y, label, alpha }) => {
    // Dashed line
    ctx.strokeStyle = `${accent}${Math.round(alpha * 255).toString(16).padStart(2,'0')}`;
    ctx.lineWidth   = 1;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(w * 0.05, y); ctx.lineTo(w * 0.95, y); ctx.stroke();

    // End ticks
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    [w * 0.05, w * 0.95].forEach(x => {
      ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke();
    });

    // Label
    ctx.fillStyle = `${accent}80`;
    ctx.font      = `400 ${Math.max(8, w * 0.018)}px "DM Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(label, w * 0.06, y - 5);
  });

  ctx.restore();
}

/** Subtle border glow when playing */
function drawPlayingGlow(ctx, w, h, accent) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0,   `${accent}18`);
  grad.addColorStop(0.5, `${accent}00`);
  grad.addColorStop(1,   `${accent}18`);

  ctx.strokeStyle = `${accent}35`;
  ctx.lineWidth   = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(1, 1, w - 2, h - 2);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}