import React from 'react';
import { COLORS, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { TrendingUp, TrendingDown, Camera } from 'lucide-react';

export default function ScoreRingLarge({ score, change }) {
  if (score === null || score === undefined) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-full border-4 flex items-center justify-center" style={{ borderColor: COLORS.border }}>
          <Camera size={28} style={{ color: COLORS.textTertiary }} />
        </div>
        <p className="text-[10px] text-center max-w-[200px]" style={{ color: COLORS.textTertiary }}>
          Analyze your first movement to see your score
        </p>
      </div>
    );
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const color = scoreColor(clampedScore);
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke={COLORS.border} strokeWidth="6" />
          <circle
            cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${(clampedScore / 100) * circumference} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease-out', filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        <div className="text-center z-10">
          <div className="text-3xl font-bold" style={{ color }}>{clampedScore}</div>
          <div className="text-[8px] tracking-[0.15em] uppercase mt-0.5" style={{ color: COLORS.textTertiary }}>
            Form Score
          </div>
        </div>
      </div>

      {change !== null && change !== undefined && (
        <div className="flex items-center gap-1.5">
          {change >= 0
            ? <TrendingUp size={12} style={{ color: COLORS.correct }} />
            : <TrendingDown size={12} style={{ color: COLORS.fault }} />
          }
          <span className="text-[10px] font-bold" style={{ color: change >= 0 ? COLORS.correct : COLORS.fault }}>
            {change > 0 ? '+' : ''}{change} vs last
          </span>
        </div>
      )}
    </div>
  );
}