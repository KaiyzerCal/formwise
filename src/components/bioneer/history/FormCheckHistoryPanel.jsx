/**
 * FormCheckHistoryPanel — lists saved FormCheck sessions with replay/export/delete actions
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Download, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';

export default function FormCheckHistoryPanel({ onSelectSession, loading = false }) {
  const [sessions, setSessions] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await base44.entities.FormSession.list('-created_date', 50);
      setSessions(data || []);
    } catch (err) {
      console.warn('[FormCheckHistoryPanel] Fetch error:', err);
      setSessions([]);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Delete this session?')) return;
    setDeleting(sessionId);
    try {
      await base44.entities.FormSession.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('[FormCheckHistoryPanel] Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 rounded-full border-gold/30 border-t-gold animate-spin"
          style={{ borderColor: COLORS.border, borderTopColor: COLORS.gold }} />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[8px] font-semibold tracking-[0.08em] uppercase" style={{ color: COLORS.textTertiary }}>
          No sessions saved yet
        </p>
        <p className="text-[7px] mt-2" style={{ color: COLORS.textMuted }}>
          Complete a form check and save to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session, idx) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="rounded-lg border p-4 hover:border-gold/30 transition-colors cursor-pointer group"
          style={{
            background: COLORS.surface,
            borderColor: COLORS.border,
          }}
          onClick={() => onSelectSession(session)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold truncate" style={{ color: COLORS.textPrimary }}>
                {session.movement_name || session.exercise_id || 'Session'}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                  {new Date(session.created_date || session.started_at).toLocaleDateString()}
                </p>
                <span style={{ color: COLORS.textMuted }}>•</span>
                <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                  {session.form_score_overall ? Math.round(session.form_score_overall) : '-'} Form Score
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSession(session, 'replay');
                }}
                className="p-2 rounded hover:bg-white/5 transition"
                title="Replay"
              >
                <Play size={14} style={{ color: COLORS.gold }} fill={COLORS.gold} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(session.id);
                }}
                disabled={deleting === session.id}
                className="p-2 rounded hover:bg-red-500/10 transition"
                title="Delete"
                style={{ opacity: deleting === session.id ? 0.5 : 1 }}
              >
                <Trash2 size={14} style={{ color: COLORS.fault }} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}