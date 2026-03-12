/**
 * useTechniqueComparison.js
 * Accepts user + reference pose landmarks.
 * Normalizes, computes angles, diffs, and generates coaching cues.
 */

import { useMemo } from 'react';

// MediaPipe landmark indices
const LM = {
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW:    13, R_ELBOW:    14,
  L_HIP:      23, R_HIP:      24,
  L_KNEE:     25, R_KNEE:     26,
  L_ANKLE:    27, R_ANKLE:    28,
  L_WRIST:    15, R_WRIST:    16,
};

const MIN_VIS = 0.4;

// ── Geometry helpers ──────────────────────────────────────────────────────────
function angle3(a, b, c) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

function safeAngle(lm, a, b, c) {
  const pa = lm[a], pb = lm[b], pc = lm[c];
  if (!pa || !pb || !pc) return null;
  if (pa.visibility < MIN_VIS || pb.visibility < MIN_VIS || pc.visibility < MIN_VIS) return null;
  return angle3(pa, pb, pc);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function torsoLean(lm) {
  const ls = lm[LM.L_SHOULDER], rs = lm[LM.R_SHOULDER];
  const lh = lm[LM.L_HIP],      rh = lm[LM.R_HIP];
  if (!ls || !rs || !lh || !rh) return null;
  if ([ls, rs, lh, rh].some(p => p.visibility < MIN_VIS)) return null;
  const ms = midpoint(ls, rs);
  const mh = midpoint(lh, rh);
  return Math.round(Math.atan2(ms.x - mh.x, mh.y - ms.y) * 180 / Math.PI);
}

function confidence(lm) {
  if (!lm) return 0;
  return Math.round(lm.reduce((s, p) => s + p.visibility, 0) / lm.length * 100);
}

// ── Extract a full angle set from one landmark array ─────────────────────────
function extractAngles(lm) {
  if (!lm) return null;
  return {
    leftKnee:   safeAngle(lm, LM.L_HIP,      LM.L_KNEE,   LM.L_ANKLE),
    rightKnee:  safeAngle(lm, LM.R_HIP,      LM.R_KNEE,   LM.R_ANKLE),
    leftHip:    safeAngle(lm, LM.L_SHOULDER, LM.L_HIP,    LM.L_KNEE),
    rightHip:   safeAngle(lm, LM.R_SHOULDER, LM.R_HIP,    LM.R_KNEE),
    leftElbow:  safeAngle(lm, LM.L_SHOULDER, LM.L_ELBOW,  LM.L_WRIST),
    rightElbow: safeAngle(lm, LM.R_SHOULDER, LM.R_ELBOW,  LM.R_WRIST),
    torsoLean:  torsoLean(lm),
  };
}

// ── Diff two angle values ─────────────────────────────────────────────────────
function diff(a, b) {
  if (a === null || b === null) return null;
  return a - b;
}

function severity(d) {
  if (d === null) return 'none';
  const abs = Math.abs(d);
  if (abs <= 8)  return 'good';
  if (abs <= 20) return 'warning';
  return 'fault';
}

const ANGLE_LABELS = {
  leftKnee:   'Left Knee',
  rightKnee:  'Right Knee',
  leftHip:    'Left Hip',
  rightHip:   'Right Hip',
  leftElbow:  'Left Elbow',
  rightElbow: 'Right Elbow',
  torsoLean:  'Torso Lean',
};

// ── Coaching cues from deviations ─────────────────────────────────────────────
function buildCues(deviations) {
  const cues = [];

  const kd = deviations.find(d => d.id === 'leftKnee' || d.id === 'rightKnee');
  if (kd && kd.severity === 'fault') {
    const dir = kd.diff > 0 ? 'deeper' : 'shallower';
    cues.push({ text: `Knee angle ${Math.abs(kd.diff)}° off — try bending ${dir}`, severity: 'fault' });
  } else if (kd && kd.severity === 'warning') {
    cues.push({ text: `Knee depth close — fine-tune ${Math.abs(kd.diff)}°`, severity: 'warning' });
  }

  const tl = deviations.find(d => d.id === 'torsoLean');
  if (tl && tl.severity !== 'none' && tl.severity !== 'good') {
    const dir = tl.diff > 0 ? 'forward' : 'backward';
    cues.push({ text: `Torso leans more ${dir} than reference (${Math.abs(tl.diff)}°)`, severity: tl.severity });
  }

  const hip = deviations.find(d => d.id === 'leftHip' || d.id === 'rightHip');
  if (hip && hip.severity === 'fault') {
    cues.push({ text: `Hip angle ${Math.abs(hip.diff)}° off reference`, severity: 'fault' });
  }

  if (!cues.length) {
    const anyFault = deviations.some(d => d.severity === 'fault' || d.severity === 'warning');
    if (!anyFault) cues.push({ text: 'Form closely matches reference', severity: 'good' });
  }

  return cues;
}

// ── Overall match score 0–100 ─────────────────────────────────────────────────
function computeScore(deviations) {
  const measured = deviations.filter(d => d.diff !== null);
  if (!measured.length) return null;
  const penalty = measured.reduce((s, d) => s + Math.min(Math.abs(d.diff), 40), 0);
  const maxPenalty = measured.length * 40;
  return Math.round(100 - (penalty / maxPenalty) * 100);
}

// ── Public hook ───────────────────────────────────────────────────────────────
export function useTechniqueComparison({ userLandmarks, refLandmarks }) {
  return useMemo(() => {
    const userAngles = extractAngles(userLandmarks);
    const refAngles  = extractAngles(refLandmarks);
    const userConf   = confidence(userLandmarks);
    const refConf    = confidence(refLandmarks);

    if (!userAngles && !refAngles) {
      return { userAngles: null, refAngles: null, deviations: [], cues: [], score: null, userConf, refConf };
    }

    const deviations = Object.keys(ANGLE_LABELS).map(id => {
      const u  = userAngles?.[id] ?? null;
      const r  = refAngles?.[id]  ?? null;
      const d  = diff(u, r);
      return { id, label: ANGLE_LABELS[id], user: u, ref: r, diff: d, severity: severity(d) };
    });

    const cues  = buildCues(deviations);
    const score = computeScore(deviations);

    return { userAngles, refAngles, deviations, cues, score, userConf, refConf };
  }, [userLandmarks, refLandmarks]);
}