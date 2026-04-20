/**
 * AxisIntelligenceSurface — top-level analytics summary with 3 data points + weekly insight
 */
import React, { useMemo, useState, useEffect } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { getAllSessions } from '../data/unifiedSessionStore';
import { base44 } from '@/api/base44Client';

function getWeekNumber() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
}

export default function AxisIntelligenceSurface() {
  const [weeklyInsight, setWeeklyInsight] = useState(null);

  const sessions = useMemo(() => getAllSessions(), []);

  // Most trained movement this month
  const topMovement = useMemo(() => {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const recent = sessions.filter(s => s.started_at && new Date(s.started_at) >= monthAgo);
    const counts = {};
    recent.forEach(s => { const m = s.movement_name || s.exercise_id; if (m) counts[m] = (counts[m] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], count: top[1] } : null;
  }, [sessions]);

  // Score trajectory
  const trajectory = useMemo(() => {
    if (sessions.length < 4) return 'HOLDING';
    const mid = Math.floor(sessions.length / 2);
    const first = sessions.slice(mid).reduce((s, r) => s + (r.average_form_score || 0), 0) / (sessions.length - mid);
    const second = sessions.slice(0, mid).reduce((s, r) => s + (r.average_form_score || 0), 0) / mid;
    const diff = second - first;
    return diff > 3 ? 'IMPROVING' : diff < -3 ? 'DECLINING' : 'HOLDING';
  }, [sessions]);

  // Top recurring fault this month
  const topFault = useMemo(() => {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const recent = sessions.filter(s => s.started_at && new Date(s.started_at) >= monthAgo);
    const counts = {};
    recent.forEach(s => (s.top_faults || []).forEach(f => { counts[f] = (counts[f] || 0) + 1; }));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0].replace(/_/g, ' '), count: top[1] } : null;
  }, [sessions]);

  // Weekly AI insight
  useEffect(() => {
    const weekNum = getWeekNumber();
    const key = `axis_weekly_intel_${weekNum}`;
    const cached = localStorage.getItem(key);
    if (cached) { setWeeklyInsight(cached); return; }

    if (!topMovement || !topFault) return;

    const prompt = `Based on ${topMovement.name} (${topMovement.count} sessions), ${topFault.name} (${topFault.count} occurrences), and ${trajectory.toLowerCase()} score trend, write one sentence telling this athlete what their training data actually means right now. Be specific. Sound like someone who has been watching them for weeks.`;

    base44.integrations.Core.InvokeLLM({ prompt })
      .then(result => {
        const text = typeof result === 'string' ? result : result?.text || '';
        const cleaned = text.replace(/^["']|["']$/g, '').trim();
        if (cleaned) { localStorage.setItem(key, cleaned); setWeeklyInsight(cleaned); }
      })
      .catch(() => {});
  }, [topMovement, topFault, trajectory]);

  if (!sessions.length) return null;

  const trajectoryColor = trajectory === 'IMPROVING' ? COLORS.correct : trajectory === 'DECLINING' ? COLORS.fault : COLORS.warning;

  return (
    <div className="space-y-3">
      <h2 className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold }}>AXIS INTELLIGENCE</h2>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3 text-center" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <p className="text-xs font-bold capitalize" style={{ color: COLORS.textPrimary }}>{topMovement?.name?.replace(/_/g, ' ') || '—'}</p>
          <p className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>{topMovement?.count || 0} sessions</p>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <p className="text-xs font-bold" style={{ color: trajectoryColor }}>{trajectory}</p>
          <p className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>score trend</p>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <p className="text-xs font-bold capitalize" style={{ color: COLORS.textPrimary }}>{topFault?.name || '—'}</p>
          <p className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>{topFault?.count || 0} times</p>
        </div>
      </div>

      {weeklyInsight && (
        <p className="text-[10px] leading-relaxed italic px-1" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
          "{weeklyInsight}"
        </p>
      )}
    </div>
  );
}