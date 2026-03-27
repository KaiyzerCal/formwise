import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { CheckCircle2, AlertCircle, Zap, TrendingUp } from 'lucide-react';

export default function AnalysisInsightsPanel({ analysis }) {
  if (!analysis) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.correct;
    if (score >= 60) return COLORS.warning;
    return '#EF4444';
  };

  const scoreColor = getScoreColor(analysis.formScore);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border overflow-auto" style={{ borderColor: COLORS.border, background: `${COLORS.surface}80` }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: COLORS.border }}>
        <Zap size={13} style={{ color: COLORS.gold, flexShrink: 0 }} />
        <h3 className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: COLORS.gold }}>
          AI Form Analysis
        </h3>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 p-2 rounded" style={{ background: COLORS.goldDim }}>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: scoreColor }}>
            {analysis.formScore}
          </div>
          <div className="text-[7px]" style={{ color: COLORS.textTertiary }}>Score</div>
        </div>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
          <div className="h-full" style={{ width: `${analysis.formScore}%`, background: scoreColor }} />
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths?.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={11} style={{ color: COLORS.correct, flexShrink: 0 }} />
            <span className="text-[8px] uppercase font-bold" style={{ color: COLORS.correct }}>Strengths</span>
          </div>
          <div className="ml-4 space-y-0.5">
            {analysis.strengths.slice(0, 2).map((str, i) => (
              <div key={i} className="text-[7.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                ✓ {str}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Errors */}
      {analysis.criticalErrors?.length > 0 && (
        <div className="space-y-1.5 p-2 rounded border" style={{ borderColor: '#EF4444', background: 'rgba(239, 68, 68, 0.1)' }}>
          <div className="flex items-center gap-1.5">
            <AlertCircle size={11} style={{ color: '#EF4444', flexShrink: 0 }} />
            <span className="text-[8px] uppercase font-bold" style={{ color: '#EF4444' }}>Errors</span>
          </div>
          <div className="ml-4 space-y-0.5">
            {analysis.criticalErrors.slice(0, 2).map((err, i) => (
              <div key={i} className="text-[7.5px]" style={{ color: '#EF4444', fontFamily: FONT.mono }}>
                ✗ {err}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body Position */}
      {analysis.bodyPositionAnalysis && (
        <div className="space-y-1 p-2 rounded" style={{ background: COLORS.goldDim }}>
          <span className="text-[8px] uppercase font-bold block" style={{ color: COLORS.gold }}>Position</span>
          <p className="text-[7.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono, lineHeight: 1.3 }}>
            {analysis.bodyPositionAnalysis.slice(0, 150)}...
          </p>
        </div>
      )}

      {/* Recommendation */}
      {analysis.progressionRecommendation && (
        <div className="space-y-1 p-2 rounded border" style={{ borderColor: COLORS.correct, background: `${COLORS.correct}15` }}>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={11} style={{ color: COLORS.correct, flexShrink: 0 }} />
            <span className="text-[8px] uppercase font-bold" style={{ color: COLORS.correct }}>Next Step</span>
          </div>
          <p className="text-[7.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono, lineHeight: 1.3 }}>
            {analysis.progressionRecommendation.slice(0, 120)}...
          </p>
        </div>
      )}
    </div>
  );
}