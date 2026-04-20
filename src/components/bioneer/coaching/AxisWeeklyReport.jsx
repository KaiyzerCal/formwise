/**
 * AxisWeeklyReport — Monday-only weekly intelligence card on CoachingHub
 */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { base44 } from '@/api/base44Client';
import { getAllSessions } from '../data/unifiedSessionStore';

function getWeekNumber() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
}

export default function AxisWeeklyReport({ streak }) {
  const [report, setReport] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    if (today.getDay() !== 1) { setLoading(false); return; } // Monday only

    const weekNum = getWeekNumber();
    const key = `axis_report_${weekNum}`;
    const dismissKey = `axis_report_dismissed_${weekNum}`;

    if (localStorage.getItem(dismissKey)) { setLoading(false); return; }

    const cached = localStorage.getItem(key);
    if (cached) { setReport(cached); setLoading(false); return; }

    const sessions = getAllSessions();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const lastWeek = sessions.filter(s => s.started_at && new Date(s.started_at) >= weekAgo);

    if (!lastWeek.length) { setLoading(false); return; }

    const avgScore = Math.round(lastWeek.reduce((s, r) => s + (r.average_form_score || 0), 0) / lastWeek.length);
    const faultCounts = {};
    lastWeek.forEach(s => (s.top_faults || []).forEach(f => { faultCounts[f] = (faultCounts[f] || 0) + 1; }));
    const topFault = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, ' ') || 'none';

    const movCounts = {};
    lastWeek.forEach(s => { const m = s.movement_name || s.exercise_id; if (m) movCounts[m] = (movCounts[m] || 0) + 1; });
    const mostImproved = Object.entries(movCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'your training';

    const prompt = `This athlete completed ${lastWeek.length} sessions last week. Their average form score was ${avgScore}. Their most improved movement was ${mostImproved}. Their most persistent fault was ${topFault}. Their streak is ${streak || 0} days. Write one paragraph — under 100 words — in the voice of an elite coach who has been watching this athlete for weeks. Tell them what their week meant. What pattern is emerging. What to focus on this week. Reference their specific numbers. Sound like a person who cares whether they improve.`;

    base44.integrations.Core.InvokeLLM({ prompt })
      .then(result => {
        const text = typeof result === 'string' ? result : result?.text || '';
        const cleaned = text.replace(/^["']|["']$/g, '').trim();
        if (cleaned) { localStorage.setItem(key, cleaned); setReport(cleaned); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [streak]);

  if (loading || !report || dismissed) return null;

  const dismiss = () => {
    const weekNum = getWeekNumber();
    localStorage.setItem(`axis_report_dismissed_${weekNum}`, 'true');
    setDismissed(true);
  };

  return (
    <div className="px-4 py-3 rounded-lg relative" style={{ background: COLORS.surface, border: `1px solid ${COLORS.goldBorder}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>AXIS WEEKLY</p>
        <button onClick={dismiss} className="p-1 rounded hover:opacity-70">
          <X size={12} style={{ color: COLORS.textTertiary }} />
        </button>
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
        {report}
      </p>
    </div>
  );
}