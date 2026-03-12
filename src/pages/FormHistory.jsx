import React, { useMemo } from "react";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Trophy, AlertTriangle, Clock, Repeat, BarChart3 } from "lucide-react";
import { COLORS, FONT, scoreColor } from "../components/bioneer/ui/DesignTokens";
import { getAllSessions } from "../components/bioneer/data/sessionStore";

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FormHistory() {
  const sessions = useMemo(() => getAllSessions().slice(0, 50), []);

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b" style={{ background: `${COLORS.bg}ee`, backdropFilter: 'blur(12px)', borderColor: COLORS.border }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <a href={createPageUrl("LiveSession")}
            className="p-2 rounded-full transition-colors"
            style={{ background: COLORS.surface }}>
            <ArrowLeft className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
          </a>
          <h1 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>
            Session History
          </h1>
          <span className="ml-auto text-[9px] tracking-[0.1em] uppercase"
            style={{ color: COLORS.textTertiary }}>
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">

        {/* Zero state */}
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
              <BarChart3 size={22} style={{ color: COLORS.gold }} />
            </div>
            <div className="text-center space-y-2 max-w-xs">
              <p className="text-xs font-medium tracking-[0.12em] uppercase"
                style={{ color: COLORS.textSecondary }}>
                No sessions logged yet
              </p>
              <p className="text-[10px] leading-relaxed"
                style={{ color: COLORS.textMuted }}>
                Complete a live session to start building your form history.
              </p>
            </div>
            <a href={createPageUrl("LiveSession")}
              className="px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.12em] uppercase border"
              style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold }}>
              Start First Session
            </a>
          </div>
        )}

        {/* Session cards */}
        {sessions.map((session) => {
          const score = session.average_form_score ?? 0;
          const sc    = scoreColor(score);
          const name  = session.movement_name ?? session.movement_id?.replace(/_/g, ' ') ?? 'Unknown';
          const alerts = (session.top_faults ?? []).length;

          return (
            <div key={session.session_id}
              className="rounded-xl border p-4 transition-colors"
              style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold capitalize" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
                    {name}
                  </h3>
                  <p className="text-[10px] mt-0.5" style={{ color: COLORS.textTertiary }}>
                    {fmtDate(session.started_at)}
                  </p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <span className="text-xl font-bold" style={{ fontFamily: FONT.heading, color: sc }}>
                    {score}
                  </span>
                  <span className="text-[10px] ml-0.5" style={{ color: COLORS.textTertiary }}>/100</span>
                  {score >= 80 && <Trophy className="w-3.5 h-3.5 ml-auto mt-0.5" style={{ color: COLORS.gold }} />}
                </div>
              </div>

              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <Repeat size={10} style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                    {session.rep_count ?? 0} reps
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={10} style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                    {Math.floor((session.duration_seconds ?? 0) / 60)}:{String((session.duration_seconds ?? 0) % 60).padStart(2, '0')}
                  </span>
                </div>
                {alerts > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={10} style={{ color: '#EF4444' }} />
                    <span className="text-[10px]" style={{ color: '#EF4444' }}>
                      {alerts} fault{alerts > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {session.session_status && session.session_status !== 'complete' && (
                  <span className="text-[9px] tracking-[0.08em] uppercase ml-auto px-1.5 py-0.5 rounded"
                    style={{ background: COLORS.goldDim, color: COLORS.gold }}>
                    {session.session_status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}