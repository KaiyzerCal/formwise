import React, { useState, useEffect } from 'react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { base44 } from '@/api/base44Client';
import { getMovementReviewHistory } from '@/lib/retentionEngine';

export default function AxisStrip({ sessionId, exerciseId, exerciseName, formScore, topFault }) {
  const [sentence, setSentence] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `axis_replay_${sessionId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setSentence(cached); setLoading(false); return; }

    const faultReadable = (topFault || 'none').replace(/_/g, ' ');
    const prompt = `The athlete just reviewed a ${exerciseName || exerciseId} session. Their form score was ${formScore || 0}. Their top fault was ${faultReadable}. Write one sentence — under 18 words — that an elite coach would say specifically about what this recording shows. Reference the fault by its plain English name. No generic statements. Sound like someone who watched the video.`;

    base44.integrations.Core.InvokeLLM({ prompt })
      .then(result => {
        const text = typeof result === 'string' ? result : result?.text || result?.toString() || '';
        const clean = text.replace(/^["']|["']$/g, '').trim();
        setSentence(clean);
        localStorage.setItem(cacheKey, clean);
      })
      .catch(() => setSentence(null))
      .finally(() => setLoading(false));
  }, [sessionId, exerciseId, exerciseName, formScore, topFault]);

  const history = getMovementReviewHistory(exerciseId);
  const showContinuity = history.reviewCount >= 3 && history.improvement !== 0;

  return (
    <div style={{
      background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`,
      padding: '12px 16px', minHeight: 72, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: COLORS.gold, fontFamily: FONT.mono, flexShrink: 0, marginTop: 2 }}>
          AXIS
        </span>
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ height: 14, borderRadius: 4, background: COLORS.borderLight, animation: 'pulse 1.5s infinite' }} />
          ) : sentence ? (
            <p style={{ fontSize: 11, color: COLORS.gold, fontFamily: FONT.mono, lineHeight: 1.6, margin: 0 }}>
              {sentence}
            </p>
          ) : null}
          {showContinuity && (
            <p style={{ fontSize: 9, color: COLORS.textSecondary, fontFamily: FONT.mono, margin: '6px 0 0', lineHeight: 1.4 }}>
              Session {history.reviewCount} on this movement. Form score {history.improvement > 0 ? 'up' : 'down'} {Math.abs(history.improvement)} points since your first.
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}