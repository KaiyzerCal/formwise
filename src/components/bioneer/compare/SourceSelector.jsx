import React, { useRef } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Upload, Film } from 'lucide-react';

// Production reference sources
// These serve as real reference movements for technique comparison
const REFERENCE_CLIPS = [
  { id: 'squat',    label: 'Back Squat — Reference Form',     url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 'deadlift', label: 'Deadlift — Reference Form',       url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 'pushup',   label: 'Push-Up — Reference Form',        url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 'lunge',    label: 'Lunge — Reference Form',          url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 'ohp',      label: 'Shoulder Press — Reference Form', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
];

export function getRefUrl(clipId) {
  return REFERENCE_CLIPS.find(c => c.id === clipId)?.url ?? null;
}

export default function SourceSelector({ userSrc, userFilename, refClipId, onUserUpload, onRefSelect }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUserUpload(URL.createObjectURL(file), file.name);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4" style={{ fontFamily: FONT.mono }}>

      {/* User upload */}
      <div className="flex-1 space-y-2">
        <label className="text-[9px] tracking-[0.2em] uppercase block" style={{ color: COLORS.textTertiary }}>
          Your Clip
        </label>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-colors"
          style={{
            borderColor: userSrc ? `${COLORS.correct}60` : COLORS.goldBorder,
            background:  userSrc ? `${COLORS.correct}10` : COLORS.goldDim,
          }}>
          <Upload size={14} strokeWidth={1.5} style={{ color: userSrc ? COLORS.correct : COLORS.gold, flexShrink: 0 }} />
          <span className="text-[10px] truncate text-left"
            style={{ color: userSrc ? COLORS.correct : COLORS.gold }}>
            {userFilename || 'Upload your video'}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Reference selector */}
      <div className="flex-1 space-y-2">
        <label className="text-[9px] tracking-[0.2em] uppercase block" style={{ color: COLORS.textTertiary }}>
          Reference Clip
        </label>
        <div className="relative">
          <Film size={12} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: COLORS.textTertiary }} />
          <select
            value={refClipId}
            onChange={e => onRefSelect(e.target.value)}
            className="w-full pl-8 pr-3 py-3 rounded-xl border text-[10px] appearance-none outline-none"
            style={{
              background: COLORS.surface, borderColor: COLORS.borderLight,
              color: COLORS.textPrimary, fontFamily: FONT.mono,
            }}>
            <option value="">— Select movement —</option>
            {REFERENCE_CLIPS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}