/**
 * useComparisonReport
 * Accumulates per-frame deviation data during a compare session
 * and generates a structured report card on demand.
 */

import { useRef, useCallback } from 'react';

const JOINT_LABELS = {
  leftKnee:   'Left Knee',
  rightKnee:  'Right Knee',
  leftHip:    'Left Hip',
  rightHip:   'Right Hip',
  leftElbow:  'Left Elbow',
  rightElbow: 'Right Elbow',
  torsoLean:  'Torso Lean',
};

const COACHING_CUES = {
  leftKnee:   (d) => d > 0  ? `Left knee too shallow — bend deeper (${Math.abs(d)}°)` : `Left knee overflexed (${Math.abs(d)}°)`,
  rightKnee:  (d) => d > 0  ? `Right knee too shallow — bend deeper (${Math.abs(d)}°)` : `Right knee overflexed (${Math.abs(d)}°)`,
  leftHip:    (d) => d > 0  ? `Left hip not hinging enough (${Math.abs(d)}°)` : `Left hip hinge too deep (${Math.abs(d)}°)`,
  rightHip:   (d) => d > 0  ? `Right hip not hinging enough (${Math.abs(d)}°)` : `Right hip hinge too deep (${Math.abs(d)}°)`,
  leftElbow:  (d) => d > 0  ? `Left elbow flaring (${Math.abs(d)}°)` : `Left elbow tucking too far (${Math.abs(d)}°)`,
  rightElbow: (d) => d > 0  ? `Right elbow flaring (${Math.abs(d)}°)` : `Right elbow tucking too far (${Math.abs(d)}°)`,
  torsoLean:  (d) => d > 0  ? `Torso leaning forward more than ideal (${Math.abs(d)}°)` : `Torso too upright (${Math.abs(d)}°)`,
};

export function useComparisonReport() {
  // Buffer: array of { phase, deviations: [{id, diff}] }
  const framesRef = useRef([]);

  /**
   * Record one snapshot of deviations (call this whenever deviations update).
   */
  const recordFrame = useCallback((deviations, phase = '') => {
    if (!deviations?.length) return;
    const measured = deviations.filter(d => d.diff !== null);
    if (!measured.length) return;
    framesRef.current.push({ phase, deviations: measured.map(d => ({ id: d.id, diff: d.diff })) });
  }, []);

  /**
   * Build the final report card from accumulated frames.
   * Returns a report object ready to save to session history.
   */
  const buildReport = useCallback((exerciseName, exerciseId) => {
    const frames = framesRef.current;
    if (!frames.length) return null;

    // Per-joint accumulator: sum of |diffs| and count
    const jointAccum = {};
    const phaseAccum = {};

    for (const frame of frames) {
      const phaseKey = frame.phase || 'unknown';
      if (!phaseAccum[phaseKey]) phaseAccum[phaseKey] = { sumDiff: 0, count: 0 };

      for (const { id, diff } of frame.deviations) {
        if (!jointAccum[id]) jointAccum[id] = { sumAbsDiff: 0, sumDiff: 0, count: 0 };
        jointAccum[id].sumAbsDiff += Math.abs(diff);
        jointAccum[id].sumDiff    += diff;
        jointAccum[id].count      += 1;
        phaseAccum[phaseKey].sumDiff += Math.abs(diff);
        phaseAccum[phaseKey].count   += 1;
      }
    }

    // Per-joint breakdown
    const jointBreakdown = Object.entries(jointAccum).map(([id, acc]) => {
      const avgAbsDiff = acc.count > 0 ? Math.round(acc.sumAbsDiff / acc.count) : 0;
      const avgDiff    = acc.count > 0 ? Math.round(acc.sumDiff / acc.count) : 0;
      const matchPct   = Math.max(0, Math.round(100 - Math.min(avgAbsDiff, 40) / 40 * 100));
      return {
        id,
        label: JOINT_LABELS[id] || id,
        avgDiff,
        avgAbsDiff,
        matchPct,
      };
    }).sort((a, b) => a.matchPct - b.matchPct); // worst first

    // Overall match score
    const totalAbsDiff = Object.values(jointAccum).reduce((s, a) => s + a.sumAbsDiff, 0);
    const totalCount   = Object.values(jointAccum).reduce((s, a) => s + a.count, 0);
    const avgGlobal    = totalCount > 0 ? totalAbsDiff / totalCount : 0;
    const overallScore = Math.max(0, Math.round(100 - Math.min(avgGlobal, 40) / 40 * 100));

    // Worst phase
    const worstPhase = Object.entries(phaseAccum)
      .map(([phase, acc]) => ({ phase, avg: acc.count > 0 ? acc.sumDiff / acc.count : 0 }))
      .sort((a, b) => b.avg - a.avg)[0]?.phase ?? 'unknown';

    // Top 3 coaching cues (worst joints)
    const topCues = jointBreakdown
      .slice(0, 3)
      .filter(j => j.avgAbsDiff > 8)
      .map(j => {
        const cueFn = COACHING_CUES[j.id];
        return cueFn ? cueFn(jointAccum[j.id].sumDiff / jointAccum[j.id].count) : `${j.label}: ${j.avgAbsDiff}° avg deviation`;
      });

    // Best joint
    const bestJoint = [...jointBreakdown].sort((a, b) => b.matchPct - a.matchPct)[0];
    // Worst joint
    const worstJoint = jointBreakdown[0];

    return {
      type: 'comparison_report',
      exerciseId,
      exerciseName,
      generatedAt: new Date().toISOString(),
      overallScore,
      worstPhase,
      bestJoint:  bestJoint  ? { id: bestJoint.id,  label: bestJoint.label,  matchPct: bestJoint.matchPct  } : null,
      worstJoint: worstJoint ? { id: worstJoint.id, label: worstJoint.label, matchPct: worstJoint.matchPct } : null,
      jointBreakdown,
      topCues,
      framesAnalyzed: frames.length,
    };
  }, []);

  const resetReport = useCallback(() => {
    framesRef.current = [];
  }, []);

  return { recordFrame, buildReport, resetReport };
}