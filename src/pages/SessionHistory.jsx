import React, { useState, useMemo } from "react";
import { COLORS, FONT, scoreColor } from "../components/bioneer/ui/DesignTokens";
import { getAllSessions } from "../components/bioneer/data/sessionStore";
import { Clock, Repeat, Download, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { createPageUrl } from "@/utils";

const FILTERS = ['This Week', 'This Month', 'All Time'];

// Adapt canonical session → legacy shape expected by this UI
function adaptSession(s) {
  return {
    id:         s.session_id,
    exercise:   s.movement_name ?? s.movement_id ?? 'Unknown',
    category:   'strength',
    date:       s.started_at ? new Date(s.started_at).toLocaleDateString() : '—',
    time:       s.started_at ? new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    duration:   s.duration_seconds ?? 0,
    reps:       s.rep_count ?? 0,
    score:      s.average_form_score ?? 0,
    topFault:   s.top_faults?.[0]?.replace(/_/g, ' ') ?? '—',
    repScores:  s.rep_summaries?.map(r => r.form_score ?? 0) ?? [],
    insights:   [
      s.session_status === 'partial'        ? 'Partial session — limited tracking' : null,
      s.session_status === 'low_confidence' ? 'Low tracking confidence this session' : null,
      s.top_faults?.[0] ? `Top fault: ${s.top_faults[0].replace(/_/g, ' ')}` : null,
    ].filter(Boolean),
    _real: true,
  };
}

export default function SessionHistory() {
  const [filter, setFilter] = useState('All Time');
  const [expandedId, setExpandedId] = useState(null);

  const rawSessions = useMemo(() => getAllSessions(), []);
  const sessions = useMemo(() => rawSessions.map(adaptSession), [rawSessions]);
  const totalReps = sessions.reduce((a, s) => a + s.reps, 0);
  const totalTime = sessions.reduce((a, s) => a + s.duration, 0);
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
    : 0;

  const mm = Math.floor(totalTime / 60);

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3" style={{ borderColor: COLORS.border }}>
        <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>Session History</h1>
        <div className="flex items-center gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded text-[9px] tracking-[0.1em] uppercase border"
              style={{
                background: filter === f ? COLORS.goldDim : 'transparent',
                borderColor: filter === f ? COLORS.goldBorder : COLORS.border,
                color: filter === f ? COLORS.gold : COLORS.textTertiary,
              }}>
              {f}
            </button>
          ))}
          <button className="px-3 py-1 rounded text-[9px] tracking-[0.1em] uppercase border" style={{ borderColor: COLORS.goldBorder, color: COLORS.gold }}>
            <Download size={12} className="inline mr-1" />Export
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 px-5 py-3 border-b" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        {[
          { label: 'Sessions', value: sessions.length },
          { label: 'Total Reps', value: totalReps },
          { label: 'Total Time', value: `${mm}m` },
          { label: 'Avg Score', value: avgScore, color: scoreColor(avgScore) },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-sm font-bold" style={{ color: s.color || COLORS.textPrimary, fontFamily: FONT.heading }}>{s.value}</div>
            <span className="text-[8px] tracking-[0.12em] uppercase" style={{ color: COLORS.textTertiary }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-2">
        {sessions.slice().reverse().map(session => {
          const expanded = expandedId === session.id;
          return (
            <div key={session.id} className="rounded-lg border overflow-hidden" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <button onClick={() => setExpandedId(expanded ? null : session.id)} className="w-full text-left px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium" style={{ color: COLORS.textPrimary }}>{session.exercise}</span>
                    <span className="text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full border" style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}>{session.category}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                    {session.date} · {session.time}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Repeat size={10} style={{ color: COLORS.textMuted }} />
                    <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>{session.reps}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} style={{ color: COLORS.textMuted }} />
                    <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                      {Math.floor(session.duration / 60)}:{String(session.duration % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-sm font-bold w-8 text-right" style={{ color: scoreColor(session.score) }}>{session.score}</span>
                  {expanded ? <ChevronUp size={14} style={{ color: COLORS.textTertiary }} /> : <ChevronDown size={14} style={{ color: COLORS.textTertiary }} />}
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>Top Fault:</span>
                    <span className="text-[10px]" style={{ color: COLORS.fault }}>{session.topFault}</span>
                  </div>

                  {/* Mini rep chart */}
                  <div>
                    <span className="text-[9px] tracking-[0.1em] uppercase block mb-1" style={{ color: COLORS.textTertiary }}>Rep Quality</span>
                    <ResponsiveContainer width="100%" height={60}>
                      <BarChart data={session.repScores.map((s, i) => ({ rep: i + 1, score: s }))}>
                        <XAxis dataKey="rep" tick={false} axisLine={false} />
                        <YAxis domain={[50, 100]} hide />
                        <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                          {session.repScores.map((s, i) => <Cell key={i} fill={scoreColor(s)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insights */}
                  <div className="space-y-1">
                    {session.insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: i === 0 ? COLORS.correct : COLORS.warning }} />
                        <span className="text-[10px]" style={{ color: COLORS.textSecondary }}>{ins}</span>
                      </div>
                    ))}
                  </div>

                  <a href={createPageUrl('TechniqueCompare')} className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded border" style={{ borderColor: COLORS.goldBorder, color: COLORS.gold }}>
                    <BarChart3 size={10} />View Technique
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}