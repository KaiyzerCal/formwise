/**
 * trajectoryRenderer — draws per-joint angle history as a phase-colored line.
 * Plug into any canvas ctx after each frame.
 *
 * Usage:
 *   import { TrajectoryRenderer } from './trajectoryRenderer';
 *   const traj = new TrajectoryRenderer();
 *   // each frame:
 *   traj.push(phaseId, jointAngles);
 *   traj.draw(ctx, 'left_elbow', x, y, width, height);
 */

const PHASE_COLORS = {
  START:      '#60A5FA', // blue
  ECCENTRIC:  '#F97316', // orange
  BOTTOM:     '#A78BFA', // purple
  CONCENTRIC: '#EAB308', // yellow
  LOCKOUT:    '#22C55E', // green
};

const MAX_FRAMES = 180; // ~6s at 30fps

export class TrajectoryRenderer {
  constructor() {
    this._frames = []; // { phase, angles }
  }

  /** Call once per processed frame */
  push(phase, jointAngles) {
    this._frames.push({ phase: phase ?? 'START', angles: { ...jointAngles } });
    if (this._frames.length > MAX_FRAMES) this._frames.shift();
  }

  /** Draw angle trajectory for one joint into a bounding box on ctx */
  draw(ctx, jointName, x, y, w, h) {
    const frames = this._frames;
    if (frames.length < 2) return;

    // Determine angle range for this joint
    let minA = Infinity, maxA = -Infinity;
    for (const f of frames) {
      const a = f.angles[jointName];
      if (a == null) continue;
      if (a < minA) minA = a;
      if (a > maxA) maxA = a;
    }
    const range = maxA - minA || 1;
    const pad = 4;

    const toX = (i) => x + pad + (i / (MAX_FRAMES - 1)) * (w - pad * 2);
    const toY = (a) => y + h - pad - ((a - minA) / range) * (h - pad * 2);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < frames.length; i++) {
      const prev = frames[i - 1];
      const curr = frames[i];
      const pa = prev.angles[jointName];
      const ca = curr.angles[jointName];
      if (pa == null || ca == null) continue;

      ctx.strokeStyle = PHASE_COLORS[curr.phase] ?? '#ffffff';
      ctx.beginPath();
      ctx.moveTo(toX(i - 1), toY(pa));
      ctx.lineTo(toX(i), toY(ca));
      ctx.stroke();
    }

    ctx.restore();
  }

  reset() {
    this._frames = [];
  }

  get length() { return this._frames.length; }
}