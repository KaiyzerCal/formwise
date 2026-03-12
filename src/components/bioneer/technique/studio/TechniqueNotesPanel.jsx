/**
 * TechniqueNotesPanel
 * Coach notes, session metadata, and coaching tags
 */

import React, { useState, useCallback } from 'react';
import { ChevronUp, Save } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';

const COACHING_TAGS = [
  'Balance',
  'Depth',
  'Form',
  'Alignment',
  'Tempo',
  'Power',
  'Stability',
  'Range',
  'Strength',
  'Flexibility',
];

export default function TechniqueNotesPanel({ session, onSessionUpdate, onClose }) {
  const [coachNotes, setCoachNotes] = useState(session.coachNotes || '');
  const [athleteName, setAthleteName] = useState(session.athleteName || '');
  const [selectedTags, setSelectedTags] = useState(session.selectedTags || []);
  const [saving, setSaving] = useState(false);

  /**
   * Toggle coaching tag
   */
  const toggleTag = useCallback((tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  /**
   * Save changes
   */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = {
        ...session,
        coachNotes,
        athleteName,
        selectedTags,
      };
      onSessionUpdate(updated);
      // In a full implementation, persist to IndexedDB here
    } finally {
      setSaving(false);
    }
  }, [session, coachNotes, athleteName, selectedTags, onSessionUpdate]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: COLORS.surface }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <h2 className="text-[10px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>
          Notes
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <ChevronUp size={14} style={{ color: COLORS.textSecondary }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Athlete name */}
        <div className="space-y-1">
          <label className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
            Athlete / Client
          </label>
          <input
            type="text"
            value={athleteName}
            onChange={e => setAthleteName(e.target.value)}
            placeholder="Enter name..."
            className="w-full px-2 py-1.5 rounded border text-[9px] outline-none"
            style={{
              background: COLORS.bg,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          />
        </div>

        {/* Coaching tags */}
        <div className="space-y-1.5">
          <label className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
            Focus Areas
          </label>
          <div className="flex flex-wrap gap-1">
            {COACHING_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="px-2 py-1 rounded border text-[8px] font-bold transition-colors"
                style={{
                  background: selectedTags.includes(tag) ? COLORS.goldDim : 'transparent',
                  borderColor: selectedTags.includes(tag) ? COLORS.goldBorder : COLORS.border,
                  color: selectedTags.includes(tag) ? COLORS.gold : COLORS.textTertiary,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Coach notes */}
        <div className="space-y-1">
          <label className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
            Coach Notes
          </label>
          <textarea
            value={coachNotes}
            onChange={e => setCoachNotes(e.target.value)}
            placeholder="Add coaching observations, feedback, action items..."
            className="w-full h-32 p-2 rounded border text-[9px] outline-none resize-none"
            style={{
              background: COLORS.bg,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          />
        </div>

        {/* Session metadata */}
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <div className="text-[8px]" style={{ color: COLORS.textTertiary }}>
            <div className="flex justify-between mb-1">
              <span>Category</span>
              <span style={{ color: COLORS.textPrimary }}>{session.derived.category}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Duration</span>
              <span style={{ color: COLORS.textPrimary }}>
                {session.video.durationMs ? `${Math.round(session.video.durationMs / 1000)}s` : '—'}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Frames</span>
              <span style={{ color: COLORS.textPrimary }}>{session.pose.frames.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence</span>
              <span style={{ color: COLORS.textPrimary }}>
                {Math.round(session.pose.confidenceSummary.average * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded border font-bold text-[9px]"
          style={{
            background: COLORS.goldDim,
            borderColor: COLORS.goldBorder,
            color: COLORS.gold,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Save size={12} />
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
      </div>
    </div>
  );
}