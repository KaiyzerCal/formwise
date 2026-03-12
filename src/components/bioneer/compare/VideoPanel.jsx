import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Video } from 'lucide-react';

export default function VideoPanel({ videoRef, src, label, labelColor, muted = false, onTimeUpdate, onLoaded }) {
  return (
    <div className="relative w-full h-full flex flex-col" style={{ background: COLORS.bg }}>
      {/* Label */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: labelColor }} />
        <span className="text-[9px] tracking-[0.2em] uppercase font-bold" style={{ color: labelColor, fontFamily: FONT.mono }}>
          {label}
        </span>
      </div>

      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          muted={muted}
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={onTimeUpdate}
          style={{ background: '#000' }}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3"
          style={{ background: COLORS.surface }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center border"
            style={{ borderColor: COLORS.border, background: COLORS.bg }}>
            <Video size={20} strokeWidth={1.5} style={{ color: COLORS.textTertiary }} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              {label}
            </p>
            <p className="text-[9px]" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
              No clip loaded
            </p>
          </div>
        </div>
      )}
    </div>
  );
}