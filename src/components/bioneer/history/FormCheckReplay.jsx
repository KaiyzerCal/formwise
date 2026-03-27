/**
 * FormCheckReplay — display saved FormCheck session data with visual summary
 * Shows form scores, alerts, reps, and timeline
 */
import React, { useState } from 'react';
import { X, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';

export default function FormCheckReplay({ session, onClose, onDelete, onExport }) {
  const [exporting, setExporting] = useState(false);

  if (!session) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport?.(session);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this session?')) return;
    onDelete?.(session.id);
  };

  const formScore = Math.round(session.form_score_overall || 0);
  const reps = session.reps_detected || 0;
  const duration = session.duration_seconds || 0;
  const durationMins = Math.floor(duration / 60);
  const durationSecs = Math.floor(duration % 60);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ fontFamily: FONT.mono }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: COLORS.border }}>
        <div>
          <h2 className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: COLORS.gold }}>
            {session.movement_name || session.exercise_id || 'Session'}
          </h2>
          <p className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>
            {new Date(session.created_date || session.started_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded border text-[9px] font-semibold transition"
            style={{
              borderColor: COLORS.goldBorder,
              color: COLORS.gold,
              background: COLORS.goldDim,
              opacity: exporting ? 0.5 : 1,
            }}
            title="Export to Technique"
          >
            <Download size={12} />
            {exporting ? 'EXPORTING…' : 'EXPORT'}
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded hover:bg-red-500/10 transition"
            title="Delete"
          >
            <Trash2 size={16} style={{ color: COLORS.fault }} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition"
            title="Close"
          >
            <X size={16} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          {/* Form Score */}
          <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <p className="text-[8px] font-semibold tracking-[0.08em] uppercase" style={{ color: COLORS.textTertiary }}>
              Form Score
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: scoreColor(formScore) }}>
              {formScore}
            </p>
            <p className="text-[7px] mt-1" style={{ color: COLORS.textMuted }}>
              Overall
            </p>
          </div>

          {/* Reps */}
          <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <p className="text-[8px] font-semibold tracking-[0.08em] uppercase" style={{ color: COLORS.textTertiary }}>
              Reps
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: COLORS.gold }}>
              {reps}
            </p>
            <p className="text-[7px] mt-1" style={{ color: COLORS.textMuted }}>
              Detected
            </p>
          </div>

          {/* Duration */}
          <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <p className="text-[8px] font-semibold tracking-[0.08em] uppercase" style={{ color: COLORS.textTertiary }}>
              Duration
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: COLORS.gold }}>
              {durationMins}:{durationSecs.toString().padStart(2, '0')}
            </p>
            <p className="text-[7px] mt-1" style={{ color: COLORS.textMuted }}>
              mm:ss
            </p>
          </div>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border p-4 space-y-3"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}
        >
          <h3 className="text-[8px] font-semibold tracking-[0.08em] uppercase" style={{ color: COLORS.gold }}>
            Score Breakdown
          </h3>

          <div className="space-y-2">
            {/* Peak */}
            <div className="flex items-center justify-between">
              <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                Peak Score
              </p>
              <p className="text-sm font-bold" style={{ color: scoreColor(session.form_score_peak || 0) }}>
                {Math.round(session.form_score_peak || 0)}
              </p>
            </div>

            {/* Lowest */}
            <div className="flex items-center justify-between">
              <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                Lowest Score
              </p>
              <p className="text-sm font-bold" style={{ color: scoreColor(session.form_score_lowest || 0) }}>
                {Math.round(session.form_score_lowest || 0)}
              </p>
            </div>

            {/* Movement */}
            <div className="flex items-center justify-between">
              <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                Movement Score
              </p>
              <p className="text-sm font-bold" style={{ color: scoreColor(session.movement_score || 0) }}>
                {Math.round(session.movement_score || 0)}
              </p>
            </div>

            {/* Mastery */}
            {session.mastery_avg !== undefined && (
              <div className="flex items-center justify-between">
                <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                  Mastery Average
                </p>
                <p className="text-sm font-bold" style={{ color: scoreColor(session.mastery_avg || 0) }}>
                  {Math.round(session.mastery_avg || 0)}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Faults */}
        {session.top_faults && session.top_faults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border p-4 space-y-3"
            style={{ background: COLORS.surface, borderColor: COLORS.border }}
          >
            <h3 className="text-[8px] font-semibold tracking-[0.08em] uppercase" style={{ color: COLORS.fault }}>
              Top Faults
            </h3>
            <div className="flex flex-wrap gap-2">
              {session.top_faults.map((fault, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1.5 rounded text-[7px] font-semibold tracking-[0.08em] uppercase"
                  style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    borderColor: 'rgba(255, 68, 68, 0.3)',
                    border: '1px solid',
                    color: COLORS.fault,
                  }}
                >
                  {fault}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tracking Confidence */}
        {session.tracking_confidence !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border p-4"
            style={{ background: COLORS.surface, borderColor: COLORS.border }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[8px] font-semibold tracking-[0.08em] uppercase" style={{ color: COLORS.textTertiary }}>
                Tracking Confidence
              </p>
              <p className="text-sm font-bold" style={{ color: COLORS.gold }}>
                {Math.round(session.tracking_confidence)}%
              </p>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: COLORS.gold }}
                initial={{ width: 0 }}
                animate={{ width: `${session.tracking_confidence}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 80) return '#00e5a0'; // correct
  if (score >= 60) return '#f59e0b'; // warning
  return '#ff4444'; // fault
}