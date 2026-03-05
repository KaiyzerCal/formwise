// Path trail renderer — draws fading joint trails on existing canvas
// Always resets globalAlpha to 1.0. Does NOT touch skeleton/badge drawing.

const MAX_TRAIL_POINTS = 45;

/**
 * Draws a fading trail for a single joint's path.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x,y}>} path - normalized 0-1 coords
 * @param {string} color - base color string e.g. 'rgba(255,255,255,1)'
 * @param {number} w - canvas width in px
 * @param {number} h - canvas height in px
 */
export function drawPathTrail(ctx, path, color, w, h) {
  if (!path || path.length < 2) return;
  const recent = path.slice(-MAX_TRAIL_POINTS);

  ctx.save();
  ctx.shadowBlur = 0; // no shadow on trails
  for (let i = 1; i < recent.length; i++) {
    const alpha = (i / recent.length) * 0.55; // fade oldest→newest, max 55%
    const ax = recent[i - 1].x * w;
    const ay = recent[i - 1].y * h;
    const bx = recent[i].x * w;
    const by = recent[i].y * h;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

/**
 * Draws the static ideal path arc (gold) for a joint.
 * idealPath is an array of {x, y} in normalized 0-1 coords.
 */
export function drawIdealPath(ctx, idealPath, w, h) {
  if (!idealPath || idealPath.length < 2) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.setLineDash([3, 5]);
  for (let i = 1; i < idealPath.length; i++) {
    const alpha = 0.35 + (i / idealPath.length) * 0.25;
    ctx.beginPath();
    ctx.moveTo(idealPath[i - 1].x * w, idealPath[i - 1].y * h);
    ctx.lineTo(idealPath[i].x * w, idealPath[i].y * h);
    ctx.strokeStyle = "rgba(201,168,76,1)";
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  ctx.setLineDash([]);
  ctx.restore();
}