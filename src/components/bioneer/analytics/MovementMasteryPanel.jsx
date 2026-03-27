import React, { useMemo } from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { getAllSessions } from '../data/unifiedSessionStore';

const MASTERY_LEVELS = [
  { key: 'NOVICE',     color: COLORS.textTertiary,  minSessions: 0,  minScore: 0  },
  { key: 'DEVELOPING', color: COLORS.warning,        minSessions: 5,  minScore: 65 },
  { key: 'COMPETENT',  color: COLORS.correct,        minSessions: 10, minScore: 80 },
  { key: 'PROFICIENT', color: COLORS.gold,           minSessions: 20, minScore: 90 },
];

function getMastery(sessionCount, avgScore) {
  let level = MASTERY_LEVELS[0];
  for (const l of MASTERY_LEVELS) {
    if (sessionCount >= l.minSessions && avgScore >= l.minScore) level = l;
  }
  return level;
}

export default function MovementMasteryPanel() {
  const movements = useMemo(() => {
    const sessions = getAllSessions();
    if (!sessions.length) return [];

    const map = {};
    sessions.forEach(s => {
      const m = s.movement_id || s.exercise_id;
      if (!m) return;
      if (!map[m]) map[m] = { scores: [], lastScore: 0, lastDate: null };
      const score = s.average_form_score || s.form_score_overall || 0;
      map[m].scores.push(score);
      const d = s.started_at ? new Date(s.started_at) : null;
      if (!map[m].lastDate || (d && d > map[m].lastDate)) {
        map[m].lastDate = d;
        map[m].lastScore = score;
      }
    });

    return Object.entries(map).map(([id, { scores, lastScore }]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const mastery = getMastery(scores.length, avg);
      return { id, label: id.replace(/_/g, ' ').toUpperCase(), sessionCount: scores.length, avg, lastScore, mastery };
    }).sort((a, b) => b.sessionCount - a.sessionCount);
  }, []);

  if (!movements.length) return null;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3 font-bold"
        style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Movement Mastery
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {movements.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded border"
            style={{ background: '#0a0a0a', borderColor: COLORS.border }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
                {m.label}
              </p>
              <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                {m.sessionCount} session{m.sessionCount !== 1 ? 's' : ''} · avg {m.avg}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[7px] font-bold tracking-[0.12em] px-1.5 py-0.5 rounded"
                style={{ color: m.mastery.color, background: m.mastery.color + '18', border: `1px solid ${m.mastery.color}30`, fontFamily: FONT.mono }}>
                {m.mastery.key}
              </span>
              <span className="text-[9px] font-bold" style={{ color: scoreColor(m.lastScore), fontFamily: FONT.mono }}>
                {m.lastScore || '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}