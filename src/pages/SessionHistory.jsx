import React, { useState, useMemo, useEffect } from "react";
import { COLORS, FONT, scoreColor } from "../components/bioneer/ui/DesignTokens";
import { getAllSessions } from "../components/bioneer/data/sessionStore";
import { getAllFreestyleSessions, deleteFreestyleSession, getThumbnailUrl } from "../components/bioneer/history/sessionStorage";
import { getSessionVideoUrl } from "../components/bioneer/data/liveVideoStorage";
import { Clock, Repeat, Download, ChevronDown, ChevronUp, BarChart3, Play, Trash2, Send } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import FreestyleReplay from "../components/bioneer/history/FreestyleReplay";
import LiveSessionReplay from "../components/bioneer/history/LiveSessionReplay";
import { createTechniqueDraftFromFreestyleSession, createTechniqueDraftFromLiveSession } from "../components/bioneer/technique/techniqueConverter";
import SessionMovementBadge from "../components/bioneer/movementProfiles/SessionMovementBadge";

const FILTERS = ['This Week', 'This Month', 'All Time'];

// Adapt canonical session → legacy shape expected by this UI
function adaptSession(s) {
  return {
    id:         s.session_id,
    exercise:   s.movement_name ?? s.movement_id ?? 'Unknown',
    category:   s.category || 'strength',
    date:       s.started_at ? new Date(s.started_at).toLocaleDateString() : '—',
    time:       s.started_at ? new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    duration:   s.duration_seconds ?? 0,
    reps:       s.rep_count ?? 0,
    score:      s.average_form_score ?? 0,
    topFault:   s.top_faults?.[0]?.replace(/_/g, ' ') ?? '—',
    repScores:  s.rep_summaries?.map(r => r.form_score ?? 0) ?? [],
    movementProfileId: s.movement_profile_id ?? null,
    hasVideo:   !!(s.video_storage_key || s.video_src),
    insights:   [
      s.session_status === 'partial'        ? 'Partial session — limited tracking' : null,
      s.session_status === 'low_confidence' ? 'Low tracking confidence this session' : null,
      s.top_faults?.[0] ? `Top fault: ${s.top_faults[0].replace(/_/g, ' ')}` : null,
    ].filter(Boolean),
    _real: true,
    _rawSession: s, // preserve for technique transfer
  };
}

export default function SessionHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All Time');
  const [expandedId, setExpandedId] = useState(null);
  const [freestyleSessions, setFreestyleSessions] = useState([]);
  const [selectedReplay, setSelectedReplay] = useState(null);
  const [selectedLiveReplay, setSelectedLiveReplay] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [sending, setSending] = useState(null);
  const [sendError, setSendError] = useState(null);
  // hydrated live sessions: session_id → videoSrc
  const [liveVideoUrls, setLiveVideoUrls] = useState({});

  // Load freestyle sessions
  useEffect(() => {
    getAllFreestyleSessions()
      .then(sessions => setFreestyleSessions(sessions || []))
      .catch(err => console.error('Failed to load freestyle sessions:', err));
  }, []);

  // Hydrate videoSrc for live sessions from IndexedDB
  useEffect(() => {
    const raw = getAllSessions();
    raw.forEach(async (s) => {
      if (!s.video_storage_key && !s.session_id) return;
      const key = s.video_storage_key || s.session_id;
      try {
        const url = await getSessionVideoUrl(key);
        if (url) {
          setLiveVideoUrls(prev => ({ ...prev, [s.session_id]: url }));
        }
      } catch {
        // no video stored — silently skip
      }
    });
  }, []);

  const rawSessions = useMemo(() => getAllSessions(), []);
  const sessions = useMemo(() => rawSessions.map(adaptSession), [rawSessions]);
  
  // Combine exercise and freestyle sessions
  const allSessions = [
    ...sessions,
    ...freestyleSessions.map(fs => ({
      id: fs.sessionId,
      exercise: 'Freestyle Capture',
      category: fs.category || 'freestyle',
      date: fs.createdAt ? new Date(fs.createdAt).toLocaleDateString() : '—',
      time: fs.createdAt ? new Date(fs.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      duration: fs.duration || 0,
      reps: 0,
      score: 0,
      topFault: '—',
      repScores: [],
      insights: [],
      _freestyle: true,
      _freestyleData: fs,
    })),
  ];

  const totalReps = sessions.reduce((a, s) => a + s.reps, 0);
  const totalTime = allSessions.reduce((a, s) => a + s.duration, 0);
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
    : 0;

  const mm = Math.floor(totalTime / 60);

  const handleDeleteFreestyle = async (sessionId) => {
    setDeleting(sessionId);
    try {
      await deleteFreestyleSession(sessionId);
      setFreestyleSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (error) {
      console.error('Failed to delete freestyle session:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleSendToTechnique = async (session) => {
    setSending(session.sessionId);
    setSendError(null);
    try {
      const draft = await createTechniqueDraftFromFreestyleSession(session);
      if (!draft || !draft.techniqueId) throw new Error('Draft creation returned invalid result');
      navigate(`/TechniqueStudio?draft=${draft.techniqueId}`);
    } catch (error) {
      console.error('[SessionHistory] Failed to send to technique:', error);
      setSendError(error.message || 'Failed to send session to Technique');
    } finally {
      setSending(null);
    }
  };

  const handleSendLiveToTechnique = async (session) => {
    setSending(session.id);
    setSendError(null);
    try {
      // Attach hydrated videoSrc so techniqueConverter can use it if needed
      const enriched = { ...session._rawSession, videoSrc: liveVideoUrls[session.id] || null };
      const draft = await createTechniqueDraftFromLiveSession(enriched);
      if (!draft || !draft.techniqueId) throw new Error('Draft creation returned invalid result');
      navigate(`/TechniqueStudio?draft=${draft.techniqueId}`);
    } catch (error) {
      console.error('[SessionHistory] Failed to send live session to technique:', error);
      setSendError(error.message || 'Failed to send session to Technique');
    } finally {
      setSending(null);
    }
  };

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
        {allSessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
              <BarChart3 size={20} style={{ color: COLORS.gold }} />
            </div>
            <div className="text-center space-y-1.5 max-w-xs">
              <p className="text-xs font-medium tracking-[0.1em] uppercase"
                style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                No sessions logged yet
              </p>
              <p className="text-[10px] leading-relaxed"
                style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
                Complete your first live session to start building your training history.
              </p>
            </div>
          </div>
        )}
        {allSessions.slice().reverse().map(session => {
          const expanded = expandedId === session.id;
          return (
            <div key={session.id} className="rounded-lg border overflow-hidden" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              {/* Session header — different layout for freestyle */}
              {session._freestyle ? (
                <div className="px-4 py-3 flex items-center gap-4">
                  {/* Thumbnail */}
                  {session._freestyleData?.thumbnail && (
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-black/50 overflow-hidden">
                      <img
                        src={getThumbnailUrl(session._freestyleData.thumbnail)}
                        alt="Session thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium" style={{ color: COLORS.textPrimary }}>{session.exercise}</span>
                      <span className="text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full border" style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}>FREESTYLE</span>
                    </div>
                    <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                      {session.date} · {session.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} style={{ color: COLORS.textMuted }} />
                      <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                        {Math.floor(session.duration / 60)}:{String(session.duration % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedReplay(session._freestyleData)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: 'rgba(201,168,76,0.1)', color: COLORS.gold }}>
                      <Play size={14} fill={COLORS.gold} />
                    </button>
                  </div>
                </div>
              ) : (
               <button onClick={() => setExpandedId(expanded ? null : session.id)} className="w-full text-left px-4 py-3 flex items-center gap-4">
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-0.5">
                     <span className="text-xs font-medium" style={{ color: COLORS.textPrimary }}>{session.exercise}</span>
                     <span className="text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full border" style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}>{session.category}</span>
                     {session.movementProfileId && <SessionMovementBadge movementProfileId={session.movementProfileId} />}
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
              )}

              {/* Expanded content — only for exercise sessions */}
              {expanded && !session._freestyle && (
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

                  {/* Video replay & technique buttons for live sessions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(session.hasVideo || liveVideoUrls[session.id]) && (
                      <button
                        onClick={() => setSelectedLiveReplay(session._rawSession)}
                        className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded border"
                        style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: COLORS.goldDim }}
                      >
                        <Play size={10} fill={COLORS.gold} />Replay
                      </button>
                    )}
                    {(session.hasVideo || liveVideoUrls[session.id]) && (
                      <button
                        onClick={() => handleSendLiveToTechnique(session)}
                        disabled={sending === session.id}
                        className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded border"
                        style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: COLORS.goldDim, opacity: sending === session.id ? 0.6 : 1 }}
                      >
                        <Send size={10} />{sending === session.id ? 'SENDING…' : 'Technique'}
                      </button>
                    )}
                    <a href={createPageUrl('TechniqueCompare')} className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded border" style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}>
                      <BarChart3 size={10} />Compare
                    </a>
                  </div>
                  {sendError && sending === session.id && (
                    <div className="text-[9px] px-2 py-1.5 rounded bg-red-500/10 border border-red-500/30" style={{ color: '#EF4444' }}>{sendError}</div>
                  )}
                </div>
              )}

              {/* Freestyle session controls */}
              {session._freestyle && (
                <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: COLORS.border }}>
                  {sendError && (
                    <div className="text-[9px] px-2 py-1.5 rounded bg-red-500/10 border border-red-500/30" style={{ color: '#EF4444' }}>
                      {sendError}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReplay(session._freestyleData)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-[9px] tracking-[0.1em] uppercase font-bold"
                      style={{ background: 'rgba(201,168,76,0.1)', color: COLORS.gold }}>
                      <Play size={10} fill={COLORS.gold} />
                      REPLAY
                    </button>
                    <button
                      onClick={() => handleSendToTechnique(session._freestyleData)}
                      disabled={sending === session.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-[9px] tracking-[0.1em] uppercase font-bold"
                      style={{ background: 'rgba(201,168,76,0.1)', color: COLORS.gold, opacity: sending === session.id ? 0.6 : 1 }}>
                      <Send size={10} />
                      {sending === session.id ? 'SENDING...' : 'TECHNIQUE'}
                    </button>
                    <button
                      onClick={() => handleDeleteFreestyle(session.id)}
                      disabled={deleting === session.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-[9px] tracking-[0.1em] uppercase font-bold"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', opacity: deleting === session.id ? 0.5 : 1 }}>
                      <Trash2 size={10} />
                      {deleting === session.id ? 'DELETING...' : 'DELETE'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Freestyle replay modal */}
      {selectedReplay && (
        <FreestyleReplay
          session={selectedReplay}
          onClose={() => setSelectedReplay(null)}
        />
      )}

      {/* Live session replay modal */}
      {selectedLiveReplay && (
        <LiveSessionReplay
          session={{ ...selectedLiveReplay, videoSrc: liveVideoUrls[selectedLiveReplay.session_id] || selectedLiveReplay.video_src || null }}
          onClose={() => setSelectedLiveReplay(null)}
        />
      )}
    </div>
  );
}