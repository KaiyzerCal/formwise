import React, { useState, useEffect } from 'react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { base44 } from '@/api/base44Client';

export default function AxisComparePanel({ sessionId, refId, exerciseName, formScore, topFault, refType, prevScore, selfCompare }) {
  const [sentences, setSentences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `axis_compare_${sessionId}_${refId || 'ref'}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setSentences(JSON.parse(cached));
      setLoading(false);
      return;
    }

    const faultReadable = (topFault || 'none').replace(/_/g, ' ');
    let ctx = `The reference represents correct form.`;
    if (selfCompare && prevScore != null) {
      ctx = `Their previous best score was ${prevScore}.`;
    }

    const prompt = `An athlete is comparing their ${exerciseName} form against ${refType || 'a reference'}. Their form score is ${formScore}. The primary detected fault is ${faultReadable}. ${ctx} Write exactly three sentences. Sentence one: one specific thing they are doing well. Sentence two: the single most important gap between their form and the reference. Sentence three: one concrete physical adjustment that would close that gap. Each sentence under 20 words. No filler. Sound like a coach who watched both videos.`;

    base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          sentence1: { type: 'string' },
          sentence2: { type: 'string' },
          sentence3: { type: 'string' },
        },
      },
    })
      .then(result => {
        const s = [result.sentence1, result.sentence2, result.sentence3].filter(Boolean);
        setSentences(s);
        localStorage.setItem(cacheKey, JSON.stringify(s));
      })
      .catch(() => setSentences(null))
      .finally(() => setLoading(false));
  }, [sessionId, refId, exerciseName, formScore, topFault, refType, prevScore, selfCompare]);

  return (
    <div style={{
      width: '100%', background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`,
      padding: 16, fontFamily: FONT.mono,
    }}>
      <p style={{ fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: COLORS.gold, marginBottom: 8 }}>
        AXIS COMPARE
      </p>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 12, borderRadius: 4, background: COLORS.borderLight, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : sentences?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sentences.map((s, i) => (
            <p key={i} style={{
              fontSize: 10, lineHeight: 1.6, margin: 0, fontFamily: FONT.mono,
              color: i === 1 ? COLORS.gold : COLORS.textSecondary,
            }}>
              {s}
            </p>
          ))}
        </div>
      ) : null}
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}