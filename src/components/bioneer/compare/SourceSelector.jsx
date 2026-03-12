import React, { useRef } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Upload, Film } from 'lucide-react';

const REFERENCE_CLIPS = [
  { id: 'squat',    label: 'Back Squat',      url: null },
  { id: 'deadlift', label: 'Deadlift',        url: null },
  { id: 'pushup',   label: 'Push-Up',         url: null },
  { id: 'lunge',    label: 'Lunge',           url: null },
  { id: 'ohp',      label: 'Shoulder Press',  url: null },
];

export default function SourceSelector({ userSrc, userFilename, refClipId, onUserUpload, onRefSelect }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUserUpload(url, file.name);
  };

  return (
    <div className="flex flex-col gap-4 p-4" style={{ fontFamily: FONT.mono }}>
      {/* Row */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* User upload */}
        <div className="flex-1 space-y-2">
          <label className="text-[9px] tracking-[0.2em] uppercase block" style={{ color: COLORS.textTertiary }}>
            Your Clip
          </label>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-colors"
            style={{
              borderColor: userSrc ? COLORS.correct + '60' : COLORS.goldBorder,
              background: userSrc ? `${COLORS.correct}10` : COLORS.goldDim,
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
                background: COLORS.surface,
                borderColor: COLORS.borderLight,
                color: COLORS.textPrimary,
                fontFamily: FONT.mono,
              }}>
              <option value="">— Select movement —</option>
              {REFERENCE_CLIPS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          {refClipId && (
            <p className="text-[9px] px-1" style={{ color: COLORS.textTertiary }}>
              Reference clips coming in next pass
            </p>
          )}
        </div>
      </div>
    </div>
  );
}