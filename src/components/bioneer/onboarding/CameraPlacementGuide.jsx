/**
 * CameraPlacementGuide.jsx
 * Shown inside SessionReadinessGate while waiting for pose lock.
 * Displays per-exercise camera position diagram + live joint visibility checklist.
 */
import React, { useMemo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

// Derive camera side from exercise metadata
function getCameraInstructions(exercise) {
  const cam = exercise?.camera || exercise?.cameraPosition || 'side';
  if (cam === 'front') {
    return {
      side: 'FRONT',
      text: 'Position camera directly in front of you, chest height',
      distance: '1.5–2 metres',
    };
  }
  return {
    side: 'SIDE',
    text: 'Position camera to your LEFT or RIGHT, at hip height',
    distance: '2–4 metres',
  };
}

// Determine which joints matter for this exercise
function getRequiredJoints(exercise) {
  const id = exercise?.id || '';
  const base = ['full_body', 'feet'];
  if (['benchpress', 'pushup', 'overhead_press', 'shoulder_press'].includes(id)) {
    return [...base, 'arms'];
  }
  if (['pullup', 'row'].includes(id)) {
    return [...base, 'arms'];
  }
  return base;
}

// Map joint keys to MediaPipe landmark indices to check visibility
const JOINT_LANDMARK_MAP = {
  full_body: [0, 11, 12, 23, 24, 25, 26],   // nose + shoulders + hips + knees
  feet:      [27, 28, 29, 30, 31, 32],         // ankles + heels + toes
  arms:      [13, 14, 15, 16],                  // elbows + wrists
};

const JOINT_LABELS = {
  full_body: 'Full body visible',
  feet:      'Feet visible',
  arms:      'Arms visible',
};

function getJointVisibility(landmarks, jointKey) {
  if (!landmarks || landmarks.length === 0) return 0;
  const indices = JOINT_LANDMARK_MAP[jointKey] || [];
  if (indices.length === 0) return 0;
  const visibilities = indices
    .map(i => landmarks[i]?.visibility ?? 0)
    .filter(v => v >= 0);
  return visibilities.length > 0
    ? visibilities.reduce((a, b) => a + b, 0) / visibilities.length
    : 0;
}

export default function CameraPlacementGuide({ exercise, poseLandmarks }) {
  const instructions = getCameraInstructions(exercise);
  const requiredJoints = getRequiredJoints(exercise);
  const isFront = instructions.side === 'FRONT';

  const jointStatus = useMemo(() => {
    return requiredJoints.map(key => ({
      key,
      label: JOINT_LABELS[key],
      visibility: getJointVisibility(poseLandmarks, key),
      ok: getJointVisibility(poseLandmarks, key) > 0.6,
    }));
  }, [poseLandmarks, requiredJoints]);

  return (
    <div className="space-y-4">
      {/* Diagram */}
      <div className="rounded-lg border overflow-hidden"
        style={{ background: COLORS.bg, borderColor: COLORS.border }}>
        <div className="px-3 py-2 border-b"
          style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <span className="text-[9px] font-bold tracking-[0.15em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            {exercise?.name || 'EXERCISE'} — {instructions.side} VIEW
          </span>
        </div>

        <div className="px-4 py-5 flex items-end justify-between">
          {isFront ? (
            /* Front-facing diagram */
            <>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: COLORS.correct }} />
                <div className="flex gap-2">
                  <div className="w-1 h-2 rounded" style={{ background: COLORS.correct, opacity: 0.7 }} />
                  <div className="w-1 h-6 rounded" style={{ background: COLORS.correct }} />
                  <div className="w-1 h-2 rounded" style={{ background: COLORS.correct, opacity: 0.7 }} />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1 h-5 rounded" style={{ background: COLORS.correct }} />
                  <div className="w-1 h-5 rounded" style={{ background: COLORS.correct }} />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xl" style={{ color: COLORS.textTertiary }}>→</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-5 rounded border-2 flex items-center justify-center"
                  style={{ borderColor: COLORS.gold }}>
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.gold}` }} />
                </div>
                <span className="text-[7px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  {instructions.distance}
                </span>
              </div>
            </>
          ) : (
            /* Side diagram */
            <>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-3 h-3 rounded-full border" style={{ borderColor: COLORS.correct }} />
                <div className="w-1 h-7 rounded" style={{ background: COLORS.correct }} />
                <div className="flex gap-0.5">
                  <div className="w-1 h-5 rounded" style={{ background: COLORS.correct }} />
                  <div className="w-1 h-5 rounded" style={{ background: COLORS.correct }} />
                </div>
              </div>
              <div className="flex-1 mx-2 flex items-center">
                <div className="flex-1 border-t border-dashed" style={{ borderColor: COLORS.border }} />
                <span className="text-[8px] mx-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  {instructions.distance}
                </span>
                <div className="flex-1 border-t border-dashed" style={{ borderColor: COLORS.border }} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-4 h-7 rounded border-2 flex items-center justify-center"
                  style={{ borderColor: COLORS.gold }}>
                  <div className="w-2 h-2 rounded-full"
                    style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.gold}` }} />
                </div>
                <span className="text-[7px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  HIP HEIGHT
                </span>
              </div>
            </>
          )}
        </div>

        <div className="px-4 pb-3">
          <p className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            {instructions.text}
          </p>
        </div>
      </div>

      {/* Live joint visibility checklist */}
      <div className="space-y-2">
        <span className="text-[8px] tracking-[0.15em] uppercase font-bold"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>VISIBILITY CHECK</span>
        {jointStatus.map(({ key, label, ok, visibility }) => (
          <div key={key} className="flex items-center gap-3">
            {ok
              ? <CheckCircle2 size={14} style={{ color: COLORS.correct, flexShrink: 0 }} />
              : <Circle size={14} style={{ color: COLORS.textTertiary, flexShrink: 0 }} />}
            <span className="text-xs flex-1" style={{ color: ok ? COLORS.textPrimary : COLORS.textTertiary, fontFamily: FONT.mono }}>
              {label}
            </span>
            {visibility > 0 && (
              <span className="text-[9px]" style={{ color: ok ? COLORS.correct : COLORS.warning, fontFamily: FONT.mono }}>
                {Math.round(visibility * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}