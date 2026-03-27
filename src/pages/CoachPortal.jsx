import React, { useState, useEffect, useMemo } from 'react';
import { COLORS, FONT, scoreColor, FONT_LINK } from '@/components/bioneer/ui/DesignTokens';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ChevronRight, MessageSquare, Flag, ArrowLeft, Users } from 'lucide-react';

// ── Hooks ──────────────────────────────────────────────────────────────────
function useCurrentUser() {
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  return user;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function InviteForm({ onInvited }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setStatus('sending');
    try {
      await base44.users.inviteUser(email.trim(), 'user');
      setStatus('sent');
      setEmail('');
      onInvited?.(email.trim());
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus('error');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <p className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Invite Client
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInvite()}
          placeholder="client@email.com"
          className="flex-1 px-3 py-2 rounded border text-[10px] outline-none"
          style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary, fontFamily: FONT.mono }}
        />
        <button
          onClick={handleInvite}
          disabled={status === 'sending'}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50"
          style={{ background: COLORS.gold, color: '#000', fontFamily: FONT.mono }}
        >
          <UserPlus size={11} />
          {status === 'sending' ? '...' : 'INVITE'}
        </button>
      </div>
      {status === 'sent' && <p className="text-[9px]" style={{ color: COLORS.correct, fontFamily: FONT.mono }}>Invite sent successfully.</p>}
      {status === 'error' && <p className="text-[9px]" style={{ color: '#EF4444', fontFamily: FONT.mono }}>Failed to send invite. Check email and try again.</p>}
    </div>
  );
}

function ClientRow({ client, onClick }) {
  const score = client.latestScore ?? null;
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left"
      style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
        <span className="text-[10px] font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
          {(client.full_name || client.email || '?')[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          {client.full_name || client.email}
        </p>
        {client.email && client.full_name && (
          <p className="text-[9px] truncate" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{client.email}</p>
        )}
      </div>
      {score !== null && (
        <span className="text-sm font-bold flex-shrink-0" style={{ color: scoreColor(score), fontFamily: FONT.mono }}>{score}</span>
      )}
      <ChevronRight size={14} style={{ color: COLORS.textTertiary }} />
    </button>
  );
}

function ClientDetail({ client, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesBySession, setNotesBySession] = useState({});
  const [flagged, setFlagged] = useState({});
  const [noteInput, setNoteInput] = useState({});

  useEffect(() => {
    base44.entities.FormSession.filter({ created_by: client.email }, '-started_at', 20)
      .then(data => setSessions(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [client.email]);

  const handleAddNote = (sessionId) => {
    const note = noteInput[sessionId];
    if (!note?.trim()) return;
    setNotesBySession(prev => ({ ...prev, [sessionId]: [...(prev[sessionId] || []), note.trim()] }));
    setNoteInput(prev => ({ ...prev, [sessionId]: '' }));
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-[10px] tracking-[0.1em] uppercase"
        style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        <ArrowLeft size={12} /> BACK TO CLIENTS
      </button>

      <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
        <p className="text-[9px] tracking-[0.15em] uppercase font-bold mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>CLIENT</p>
        <p className="text-sm font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>{client.full_name || client.email}</p>
        <p className="text-[9px] mt-0.5" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{client.email}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-[10px] text-center py-8" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>No sessions found for this client.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const score = Math.round(s.movement_score ?? s.form_score_overall ?? 0);
            const notes = notesBySession[s.id] || [];
            const isFlagged = flagged[s.id];
            return (
              <div key={s.id} className="rounded-lg border p-4 space-y-3" style={{ background: COLORS.surface, borderColor: isFlagged ? '#EF444440' : COLORS.border }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
                      {(s.movement_name || s.exercise_id || '').replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                      {s.started_at ? new Date(s.started_at).toLocaleDateString() : ''} · {s.reps_detected ?? 0} reps
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: scoreColor(score), fontFamily: FONT.mono }}>{score}</span>
                    <button onClick={() => setFlagged(p => ({ ...p, [s.id]: !p[s.id] }))}
                      title="Flag for review"
                      className="p-1.5 rounded"
                      style={{ color: isFlagged ? '#EF4444' : COLORS.textTertiary }}>
                      <Flag size={12} />
                    </button>
                  </div>
                </div>

                {/* Coaching notes */}
                {notes.length > 0 && (
                  <div className="space-y-1">
                    {notes.map((n, i) => (
                      <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded"
                        style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
                        <MessageSquare size={10} style={{ color: COLORS.gold, marginTop: 2, flexShrink: 0 }} />
                        <p className="text-[9px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{n}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={noteInput[s.id] || ''}
                    onChange={e => setNoteInput(p => ({ ...p, [s.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote(s.id)}
                    placeholder="Add coaching note..."
                    className="flex-1 px-2 py-1.5 rounded border text-[9px] outline-none"
                    style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary, fontFamily: FONT.mono }}
                  />
                  <button onClick={() => handleAddNote(s.id)}
                    className="px-2 py-1.5 rounded text-[9px] font-bold tracking-[0.08em]"
                    style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}`, fontFamily: FONT.mono }}>
                    ADD
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function CoachPortal() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [invitedEmails, setInvitedEmails] = useState([]);

  useEffect(() => {
    base44.entities.User.list('-created_date', 50)
      .then(async users => {
        const regular = (users || []).filter(u => u.role === 'user');
        // Fetch latest session for each client
        const enriched = await Promise.all(regular.map(async u => {
          try {
            const sessions = await base44.entities.FormSession.filter({ created_by: u.email }, '-started_at', 1);
            const latest = sessions?.[0];
            return {
              ...u,
              latestScore: latest ? Math.round(latest.movement_score ?? latest.form_score_overall ?? 0) : null,
            };
          } catch { return { ...u, latestScore: null }; }
        }));
        setClients(enriched);
      })
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, []);

  if (user && user.role !== 'admin') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
        <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold }}>
          Coach Portal — Elite Only
        </p>
        <p className="text-[10px]" style={{ color: COLORS.textSecondary }}>
          This feature is available to Elite subscribers.
        </p>
        <button onClick={() => navigate('/Paywall')}
          className="px-6 py-2.5 rounded text-[10px] font-bold tracking-[0.15em] uppercase"
          style={{ background: COLORS.gold, color: '#000' }}>
          UPGRADE TO ELITE
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* Header */}
        <div className="pb-3 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
          <div>
            <h1 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>
              Coach Portal
            </h1>
            <p className="text-[9px] mt-0.5" style={{ color: COLORS.textTertiary }}>ELITE</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border" style={{ borderColor: COLORS.border }}>
            <Users size={11} style={{ color: COLORS.textTertiary }} />
            <span className="text-[10px] font-bold" style={{ color: COLORS.textSecondary }}>
              {clients.length} clients
            </span>
          </div>
        </div>

        {selectedClient ? (
          <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />
        ) : (
          <>
            <InviteForm onInvited={email => setInvitedEmails(p => [...p, email])} />

            {invitedEmails.length > 0 && (
              <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                <p className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: COLORS.textTertiary }}>Pending Invites</p>
                <div className="space-y-1">
                  {invitedEmails.map(e => (
                    <p key={e} className="text-[10px]" style={{ color: COLORS.textSecondary }}>{e}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
                Connected Clients
              </p>
              {loadingClients ? (
                <div className="flex justify-center py-8">
                  <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
                </div>
              ) : clients.length === 0 ? (
                <p className="text-[10px] text-center py-8" style={{ color: COLORS.textTertiary }}>
                  No clients yet. Invite someone to get started.
                </p>
              ) : (
                clients.map(c => (
                  <ClientRow key={c.id} client={c} onClick={() => setSelectedClient(c)} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}