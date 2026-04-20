/**
 * AxisDailyMessage — generates and displays one AXIS daily coaching sentence
 */
import React, { useState, useEffect } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { base44 } from '@/api/base44Client';
import { getAllSessions } from '../data/unifiedSessionStore';

export default function AxisDailyMessage({ userName, streak }) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `axis_daily_${today}`;
    const cached = localStorage.getItem(key);

    if (cached) {
      setMessage(cached);
      setLoading(false);
      return;
    }

    const sessions = getAllSessions();
    if (!sessions.length) {
      const fallback = "First session builds the baseline. Everything after that is improvement.";
      setMessage(fallback);
      setLoading(false);
      return;
    }

    const lastSession = sessions[0];
    const score = lastSession?.average_form_score || lastSession?.form_score_overall || 0;
    const exercise = lastSession?.movement_name || lastSession?.exercise_id || 'their last exercise';

    // Get top fault
    const faultCounts = {};
    sessions.slice(0, 5).forEach(s => (s.top_faults || []).forEach(f => { faultCounts[f] = (faultCounts[f] || 0) + 1; }));
    const topFault = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, ' ') || 'none detected';

    const prompt = `The athlete's name is ${userName || 'Athlete'}. Their last session form score was ${Math.round(score)} on ${exercise}. Their current streak is ${streak || 0} days. Their most common fault is ${topFault}. Write one sentence — under 20 words — that an elite coach would say to this specific athlete when they open their training app today. Speak directly to them. Reference something specific. No generic motivation. Sound like a person not a system.`;

    base44.integrations.Core.InvokeLLM({ prompt })
      .then(result => {
        const text = typeof result === 'string' ? result : result?.text || result?.summary || "Your data tells the story. Let's write the next chapter today.";
        const cleaned = text.replace(/^["']|["']$/g, '').trim();
        localStorage.setItem(key, cleaned);
        setMessage(cleaned);
      })
      .catch(() => {
        setMessage("Your data tells the story. Let's write the next chapter today.");
      })
      .finally(() => setLoading(false));
  }, [userName, streak]);

  if (loading || !message) return null;

  return (
    <div className="px-4 py-3 rounded-lg" style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
      <p className="text-[9px] tracking-[0.15em] uppercase mb-1.5 font-bold" style={{ color: COLORS.textTertiary }}>AXIS</p>
      <p className="text-xs leading-relaxed font-medium" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
        "{message}"
      </p>
    </div>
  );
}