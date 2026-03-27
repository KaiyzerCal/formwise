import React, { useState, useEffect } from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { getAllSessions, clearAllSessions } from '@/components/bioneer/data/sessionStore';

function Section({ title, children }) {
  return (
    <div className="rounded-lg border p-5 space-y-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h2 className="text-[9px] tracking-[0.2em] uppercase font-bold" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function ToggleRow({ label, sublabel, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] tracking-[0.08em]" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>{label}</p>
        {sublabel && <p className="text-[9px] mt-0.5" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{sublabel}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? COLORS.gold : COLORS.border }}
        aria-checked={checked}
        role="switch"
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: checked ? '#000' : COLORS.textTertiary,
            left: checked ? '1.25rem' : '0.125rem',
            transition: 'left 0.15s',
          }}
        />
      </button>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[11px] tracking-[0.08em]" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>{label}</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-[10px] px-2 py-1.5 rounded border outline-none"
        style={{
          background: COLORS.bg,
          borderColor: COLORS.border,
          color: COLORS.textSecondary,
          fontFamily: FONT.mono,
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function Settings() {
  const [aiEnabled, setAiEnabled] = useState(() => localStorage.getItem('formwise_ai_enabled') !== 'false');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('formwise_gemini_key') || '');
  const [aiAudio, setAiAudio] = useState(() => localStorage.getItem('formwise_ai_audio') === 'true');
  const [coachTone, setCoachTone] = useState(() => localStorage.getItem('formwise_coach_tone') || 'Direct');
  const [frontCamera, setFrontCamera] = useState(() => localStorage.getItem('bioneer_camera_facing') === 'user');
  const [trackingSensitivity, setTrackingSensitivity] = useState(() => localStorage.getItem('formwise_tracking_sensitivity') || 'Medium');
  const [sessionCount, setSessionCount] = useState(0);
  const [keySaved, setKeySaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setSessionCount(getAllSessions().length);
  }, []);

  // Persist all toggles immediately
  useEffect(() => { localStorage.setItem('formwise_ai_enabled', aiEnabled ? 'true' : 'false'); }, [aiEnabled]);
  useEffect(() => { localStorage.setItem('formwise_ai_audio', aiAudio ? 'true' : 'false'); }, [aiAudio]);
  useEffect(() => { localStorage.setItem('formwise_coach_tone', coachTone); }, [coachTone]);
  useEffect(() => { localStorage.setItem('bioneer_camera_facing', frontCamera ? 'user' : 'environment'); }, [frontCamera]);
  useEffect(() => { localStorage.setItem('formwise_tracking_sensitivity', trackingSensitivity); }, [trackingSensitivity]);

  const handleSaveKey = () => {
    localStorage.setItem('formwise_gemini_key', geminiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleExport = () => {
    const sessions = getAllSessions();
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formwise_sessions_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearSessions = () => {
    clearAllSessions();
    setSessionCount(0);
    setShowClearConfirm(false);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: COLORS.bg }}>
      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {/* Header */}
        <div className="pb-2 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className="text-xs tracking-[0.2em] uppercase font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            Settings
          </h1>
          <p className="text-[9px] mt-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Preferences & configuration
          </p>
        </div>

        {/* AI Coach */}
        <Section title="AI Coach">
          <ToggleRow
            label="AI Coaching Enabled"
            sublabel="Enables Gemini-powered rep feedback and session analysis"
            checked={aiEnabled}
            onChange={setAiEnabled}
          />

          <div className="space-y-2">
            <p className="text-[10px] tracking-[0.08em]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              Gemini API Key
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="flex-1 px-3 py-2 rounded border text-[10px] outline-none"
                style={{
                  background: COLORS.bg,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                  fontFamily: FONT.mono,
                }}
              />
              <button
                onClick={handleSaveKey}
                className="px-3 py-2 rounded border text-[10px] font-bold"
                style={{
                  borderColor: COLORS.goldBorder,
                  color: keySaved ? COLORS.gold : COLORS.textSecondary,
                  background: keySaved ? `${COLORS.gold}15` : 'transparent',
                  fontFamily: FONT.mono,
                }}
              >
                {keySaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] underline"
              style={{ color: COLORS.gold, fontFamily: FONT.mono }}
            >
              Get your free key at aistudio.google.com
            </a>
          </div>

          <ToggleRow
            label="AI Audio Cues"
            sublabel="Speaks Gemini coaching cues aloud via browser speech synthesis"
            checked={aiAudio}
            onChange={setAiAudio}
          />

          <SelectRow
            label="Coach Personality"
            value={coachTone}
            options={['Direct', 'Encouraging', 'Technical']}
            onChange={setCoachTone}
          />
        </Section>

        {/* Tracking */}
        <Section title="Tracking">
          <ToggleRow
            label="Front Camera Default"
            sublabel="Use selfie camera when starting sessions"
            checked={frontCamera}
            onChange={setFrontCamera}
          />

          <SelectRow
            label="Tracking Sensitivity"
            value={trackingSensitivity}
            options={['Low', 'Medium', 'High']}
            onChange={setTrackingSensitivity}
          />
          <p className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Low = smoother response · High = faster, more reactive
          </p>
        </Section>

        {/* Data */}
        <Section title="Data">
          <div className="flex items-center justify-between">
            <p className="text-[11px] tracking-[0.08em]" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
              Sessions saved
            </p>
            <span className="text-[11px] font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
              {sessionCount}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex-1 py-2.5 rounded border text-[10px] font-bold"
              style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, fontFamily: FONT.mono }}
            >
              Export All Sessions
            </button>

            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex-1 py-2.5 rounded border text-[10px] font-bold"
                style={{ borderColor: COLORS.border, color: COLORS.textTertiary, fontFamily: FONT.mono }}
              >
                Clear All Sessions
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                <button
                  onClick={handleClearSessions}
                  className="flex-1 py-2.5 rounded border text-[10px] font-bold"
                  style={{ borderColor: '#EF4444', color: '#EF4444', fontFamily: FONT.mono }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded border text-[10px] font-bold"
                  style={{ borderColor: COLORS.border, color: COLORS.textTertiary, fontFamily: FONT.mono }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}