/**
 * CoachConnectionPanel.jsx
 * 
 * The heart of coaching interaction
 * Connect coach feedback to client progress with elegance
 * 
 * Shows: Coach's focus, client name, shared insight, next steps
 */

import React, { useState } from 'react';
import { Send, Lightbulb, Target } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';

const FOCUS_AREAS = [
  { id: 'balance', label: 'Balance', emoji: '⚖️' },
  { id: 'depth', label: 'Depth', emoji: '📉' },
  { id: 'alignment', label: 'Alignment', emoji: '📍' },
  { id: 'tempo', label: 'Tempo', emoji: '⏱️' },
  { id: 'power', label: 'Power', emoji: '⚡' },
  { id: 'stability', label: 'Stability', emoji: '🎯' },
];

export default function CoachConnectionPanel({ session, onSessionUpdate, onClose }) {
  const [clientName, setClientName] = useState(session.athleteName || '');
  const [primaryFocus, setPrimaryFocus] = useState(
    session.selectedTags?.[0] || 'alignment'
  );
  const [insight, setInsight] = useState(session.coachNotes || '');
  const [nextSteps, setNextSteps] = useState(session.nextSteps || '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = {
        ...session,
        athleteName: clientName,
        selectedTags: [primaryFocus],
        coachNotes: insight,
        nextSteps,
      };
      onSessionUpdate(updated);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: COLORS.bg }}>
      {/* Header — minimal, focused */}
      <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{
            color: COLORS.textPrimary,
            fontFamily: FONT.heading,
          }}
        >
          Coach's Notes
        </h2>
        <p
          className="text-xs mt-1"
          style={{
            color: COLORS.textSecondary,
            fontFamily: FONT.mono,
          }}
        >
          What matters. What changed. What's next.
        </p>
      </div>

      {/* Content — breathing space */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Client Name — personal connection */}
        <div>
          <label
            className="text-xs font-semibold tracking-wide uppercase"
            style={{
              color: COLORS.gold,
              fontFamily: FONT.mono,
              letterSpacing: '0.1em',
            }}
          >
            Client
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Athlete's name"
            className="w-full mt-2 px-0 py-2 border-b-2 outline-none text-sm transition-colors"
            style={{
              background: 'transparent',
              borderColor: clientName ? COLORS.gold : COLORS.border,
              color: COLORS.textPrimary,
              fontFamily: FONT.heading,
            }}
          />
        </div>

        {/* Primary Focus — one thing that matters */}
        <div>
          <label
            className="text-xs font-semibold tracking-wide uppercase flex items-center gap-2"
            style={{
              color: COLORS.gold,
              fontFamily: FONT.mono,
              letterSpacing: '0.1em',
            }}
          >
            <Target size={14} />
            Main Focus
          </label>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {FOCUS_AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => setPrimaryFocus(area.id)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  primaryFocus === area.id ? 'scale-105' : ''
                }`}
                style={{
                  background:
                    primaryFocus === area.id ? COLORS.goldDim : 'transparent',
                  borderColor:
                    primaryFocus === area.id ? COLORS.gold : COLORS.border,
                  color:
                    primaryFocus === area.id ? COLORS.gold : COLORS.textSecondary,
                }}
              >
                <span className="mr-1">{area.emoji}</span>
                {area.label}
              </button>
            ))}
          </div>
        </div>

        {/* Insight — coach's key observation */}
        <div>
          <label
            className="text-xs font-semibold tracking-wide uppercase flex items-center gap-2"
            style={{
              color: COLORS.gold,
              fontFamily: FONT.mono,
              letterSpacing: '0.1em',
            }}
          >
            <Lightbulb size={14} />
            Key Insight
          </label>
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            placeholder="What did you notice? What's the breakthrough? Keep it simple."
            className="w-full mt-2 p-3 rounded-lg border-2 outline-none text-sm resize-none transition-colors"
            style={{
              background: COLORS.surface,
              borderColor: insight ? COLORS.gold : COLORS.border,
              color: COLORS.textPrimary,
              fontFamily: FONT.mono,
              minHeight: '80px',
            }}
          />
          <p
            className="text-[11px] mt-1"
            style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}
          >
            {insight.length}/200 characters
          </p>
        </div>

        {/* Next Steps — actionable */}
        <div>
          <label
            className="text-xs font-semibold tracking-wide uppercase"
            style={{
              color: COLORS.gold,
              fontFamily: FONT.mono,
              letterSpacing: '0.1em',
            }}
          >
            Next Session Focus
          </label>
          <textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            placeholder="What should they work on next? Be specific."
            className="w-full mt-2 p-3 rounded-lg border-2 outline-none text-sm resize-none transition-colors"
            style={{
              background: COLORS.surface,
              borderColor: nextSteps ? COLORS.gold : COLORS.border,
              color: COLORS.textPrimary,
              fontFamily: FONT.mono,
              minHeight: '60px',
            }}
          />
        </div>
      </div>

      {/* Save button — call to action */}
      <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all transform ${
            justSaved ? 'scale-95' : 'hover:scale-105'
          }`}
          style={{
            background: justSaved ? COLORS.textSecondary : COLORS.gold,
            color: COLORS.bg,
            fontFamily: FONT.heading,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {justSaved ? '✓ Saved' : saving ? 'Saving...' : 'Share with Client'}
        </button>
        <p
          className="text-[10px] text-center mt-2"
          style={{
            color: COLORS.textTertiary,
            fontFamily: FONT.mono,
          }}
        >
          Automatically backs up your notes
        </p>
      </div>
    </div>
  );
}