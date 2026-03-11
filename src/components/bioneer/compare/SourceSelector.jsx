/**
 * SourceSelector — upload or select video sources for Technique Compare.
 * Shown when either clip is not yet loaded.
 */

import React, { useRef } from 'react';
import { Upload, Play } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

// Bundled reference clips — hosted Unsplash/public demo videos matched to movements
// These are short royalty-free demo clips; replace with real reference footage per movement.
export const REFERENCE_CLIPS = {
  back_squat:      'https://storage.googleapis.com/bioneer-demo/squat_ref.mp4',
  deadlift:        'https://storage.googleapis.com/bioneer-demo/deadlift_ref.mp4',
  push_up:         'https://storage.googleapis.com/bioneer-demo/pushup_ref.mp4',
  lunge:           'https://storage.googleapis.com/bioneer-demo/lunge_ref.mp4',
  overhead_press:  'https://storage.googleapis.com/bioneer-demo/ohp_ref.mp4',
  vertical_jump:   'https://storage.googleapis.com/bioneer-demo/jump_ref.mp4',
};

// Public fallback demo clip (used when no movement-specific clip exists)
export const FALLBACK_DEMO_CLIP = 'https://www.w3schools.com/html/mov_bbb.mp4';

export function getReferenceClip(exerciseId) {
  return REFERENCE_CLIPS[exerciseId] || FALLBACK_DEMO_CLIP;
}

export default function SourceSelector({ onUserClip, onMovementChange, movements, selectedMovement }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUserClip(url);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-6" style={{ fontFamily: FONT.mono }}>
      <div className="text-center space-y-2">
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>
          Load Your Clip
        </h2>
        <p className="text-[11px]" style={{ color: COLORS.textTertiary }}>
          Upload a video of your movement to compare against the reference
        </p>
      </div>

      {/* Movement selector */}
      <div className="space-y-2 w-full max-w-xs">
        <label className="text-[9px] tracking-[0.2em] uppercase block" style={{ color: COLORS.textTertiary }}>
          Movement
        </label>
        <select
          value={selectedMovement}
          onChange={e => onMovementChange(e.target.value)}
          className="w-full px-3 py-2 rounded text-xs border outline-none"
          style={{
            background: COLORS.surface, borderColor: COLORS.borderLight,
            color: COLORS.textPrimary, fontFamily: FONT.mono,
          }}
        >
          {movements.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Upload area */}
      <button
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center gap-3 px-8 py-6 rounded-xl border border-dashed w-full max-w-xs transition-colors"
        style={{ borderColor: COLORS.goldBorder, background: COLORS.goldDim, color: COLORS.gold }}
      >
        <Upload size={24} strokeWidth={1.5} />
        <span className="text-[10px] tracking-[0.15em] uppercase">Upload your video clip</span>
        <span className="text-[9px]" style={{ color: COLORS.textTertiary }}>
          MP4 · MOV · WebM
        </span>
      </button>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />

      {/* Or use demo */}
      <button
        onClick={() => onUserClip(FALLBACK_DEMO_CLIP)}
        className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase"
        style={{ color: COLORS.textSecondary }}
      >
        <Play size={12} strokeWidth={1.5} />
        Use demo clip instead
      </button>
    </div>
  );
}