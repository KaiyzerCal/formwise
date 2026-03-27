import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { FONT_LINK } from '@/components/bioneer/ui/DesignTokens';

export default function PublicSession() {
  const { session_id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.entities.FormSession.filter({ id: session_id })
      .then(results => {
        if (results?.length) setSession(results[0]);
        else setError('Session not found.');
      })
      .catch(() => setError('Could not load session.'))
      .finally(() => setLoading(false));
  }, [session_id]);

  const score = session ? Math.round(session.movement_score ?? session.form_score_overall ?? 0) : 0;
  const exerciseName = session ? (session.movement_name || (session.exercise_id || '').replace(/_/g, ' ').toUpperCase()) : '';
  const trendData = session?.form_timeline ?? [];
  const faults = session?.top_faults ?? [];
  const date = session?.started_at
    ? new Date(session.started_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* Gold top bar */}
      <div style={{ height: 3, background: COLORS.gold }} />

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: COLORS.gold }}>BIONEER</span>
          <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>SESSION RESULT</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{error}</p>
          </div>
        )}

        {session && (
          <>
            {/* Score hero */}
            <div className="rounded-lg border p-6 text-center relative overflow-hidden"
              style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: scoreColor(score) }} />
              <p className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.textTertiary }}>{exerciseName}</p>
              <p className="text-8xl font-bold" style={{ color: scoreColor(score) }}>{score}</p>
              <p className="text-[9px] tracking-[0.15em] uppercase mt-2" style={{ color: COLORS.textTertiary }}>Form Score / 100</p>
              {date && <p className="text-[9px] mt-3" style={{ color: COLORS.textMuted }}>{date}</p>}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'REPS', value: session.reps_detected ?? session.rep_count ?? '—' },
                { label: 'PEAK', value: session.form_score_peak ? `${session.form_score_peak}` : '—' },
                { label: 'DURATION', value: session.duration_seconds ? `${Math.round(session.duration_seconds)}s` : '—' },
              ].map(s => (
                <div key={s.label} className="rounded-lg border p-3 text-center" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>{s.value}</p>
                  <p className="text-[8px] tracking-[0.15em] uppercase mt-1" style={{ color: COLORS.textTertiary }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Form trend */}
            {trendData.length > 2 && (
              <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                <p className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary }}>Form Timeline</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} tick={{ fill: COLORS.textTertiary, fontSize: 8 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={80} stroke={COLORS.gold} strokeDasharray="3 3" strokeWidth={1} />
                    <Tooltip
                      contentStyle={{ background: '#0e0e0e', border: `1px solid ${COLORS.border}`, fontFamily: FONT.mono, fontSize: 10 }}
                      labelStyle={{ color: COLORS.textTertiary }}
                    />
                    <Line type="monotone" dataKey="score" stroke={COLORS.gold} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top faults */}
            {faults.length > 0 && (
              <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                <p className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary }}>Focus Areas</p>
                <div className="space-y-2">
                  {faults.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: COLORS.warning }} />
                      <p className="text-[10px] tracking-[0.08em]" style={{ color: COLORS.textSecondary }}>
                        {f.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="rounded-lg border p-5 text-center space-y-3" style={{ background: 'rgba(201,162,39,0.06)', borderColor: COLORS.goldBorder }}>
          <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold }}>
            AI-Powered Form Analysis
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
            Track your movement quality, detect faults in real-time, and improve faster with BIONEER.
          </p>
          <Link to="/"
            className="inline-block px-6 py-2.5 rounded text-[10px] font-bold tracking-[0.15em] uppercase"
            style={{ background: COLORS.gold, color: '#000' }}>
            TRY BIONEER FREE
          </Link>
        </div>

        <p className="text-center text-[8px] tracking-[0.1em]" style={{ color: COLORS.textMuted }}>
          BIONEER · AI MOVEMENT INTELLIGENCE
        </p>
      </div>
    </div>
  );
}