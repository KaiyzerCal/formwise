/**
 * FirstLaunchWizard.jsx
 * Full-screen onboarding overlay — shown once on first visit.
 * localStorage key: 'bioneer_onboarded'
 */
import React, { useState, useEffect } from 'react';
import { Camera, BarChart3, Brain, ChevronRight, Zap } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ONBOARDED_KEY = 'bioneer_onboarded';

export function hasCompletedOnboarding() {
  return !!localStorage.getItem(ONBOARDED_KEY);
}

function markOnboarded() {
  localStorage.setItem(ONBOARDED_KEY, '1');
}

// ─── Step 1: What is Bioneer ────────────────────────────────────────────────
function StepIntro({ onNext }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center space-y-10">
      <div className="space-y-2">
        <div className="text-2xl font-bold tracking-[0.3em] uppercase"
          style={{ color: COLORS.gold, fontFamily: FONT.heading }}>BIONEER</div>
        <div className="text-[10px] tracking-[0.2em] uppercase"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>AI Movement Coach</div>
      </div>

      <div className="space-y-5 w-full max-w-xs">
        {[
          { Icon: Camera,   text: 'Real-time form analysis using your phone camera' },
          { Icon: BarChart3, text: 'Per-rep scoring and fault detection' },
          { Icon: Brain,    text: 'AI coaching cues spoken aloud during your set' },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-start gap-4 text-left">
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
              <Icon size={14} style={{ color: COLORS.gold }} />
            </div>
            <p className="text-xs leading-relaxed pt-1"
              style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{text}</p>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="flex items-center gap-2 px-6 py-3 rounded border font-bold text-xs tracking-[0.15em] uppercase"
        style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold, fontFamily: FONT.mono }}>
        HOW IT WORKS <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Step 2: Camera placement ───────────────────────────────────────────────
function StepCameraPlacement({ onNext }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center space-y-8">
      <div className="space-y-1">
        <div className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}>STEP 2 OF 4</div>
        <h2 className="text-sm font-bold tracking-[0.15em] uppercase"
          style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>Camera Placement</h2>
      </div>

      {/* Side placement diagram */}
      <div className="w-full max-w-xs space-y-4">
        <div className="rounded-lg border p-5 space-y-3"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <div className="text-[9px] tracking-[0.15em] uppercase font-bold mb-2"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>SQUATS / DEADLIFTS — SIDE VIEW</div>
          {/* CSS phone diagram */}
          <div className="relative flex items-end justify-between h-28 px-4">
            {/* Person silhouette */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: COLORS.correct }} />
              <div className="w-1 h-8 rounded" style={{ background: COLORS.correct }} />
              <div className="flex gap-0.5">
                <div className="w-1 h-6 rounded" style={{ background: COLORS.correct }} />
                <div className="w-1 h-6 rounded" style={{ background: COLORS.correct }} />
              </div>
            </div>
            {/* Distance arrow */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-1">
                <div className="h-px flex-1" style={{ background: COLORS.goldBorder }} />
                <span className="text-[8px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>2–4m</span>
                <div className="h-px flex-1" style={{ background: COLORS.goldBorder }} />
              </div>
            </div>
            {/* Phone icon */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-8 rounded border-2 flex items-center justify-center"
                style={{ borderColor: COLORS.gold }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.gold}` }} />
              </div>
              <span className="text-[7px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>HIP HEIGHT</span>
            </div>
          </div>
          <p className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            Set phone sideways, 2–4 metres away, at hip height
          </p>
        </div>

        <div className="rounded-lg border p-5 space-y-3"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <div className="text-[9px] tracking-[0.15em] uppercase font-bold mb-2"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>BENCH / OHP — FRONT VIEW</div>
          <div className="relative flex items-end justify-between h-20 px-4">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: COLORS.correct }} />
              <div className="w-6 h-5 rounded" style={{ background: COLORS.correct, opacity: 0.6 }} />
              <div className="flex gap-2">
                <div className="w-1 h-5 rounded" style={{ background: COLORS.correct }} />
                <div className="w-1 h-5 rounded" style={{ background: COLORS.correct }} />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-lg" style={{ color: COLORS.textTertiary }}>→</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-5 rounded border-2 flex items-center justify-center"
                style={{ borderColor: COLORS.gold }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.gold}` }} />
              </div>
              <span className="text-[7px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>FACING YOU</span>
            </div>
          </div>
          <p className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            Camera facing you directly, chest height
          </p>
        </div>
      </div>

      <button onClick={onNext} className="flex items-center gap-2 px-6 py-3 rounded border font-bold text-xs tracking-[0.15em] uppercase"
        style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold, fontFamily: FONT.mono }}>
        GOT IT <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Step 3: Score explanation ──────────────────────────────────────────────
function StepScoreExplainer({ onNext }) {
  const [displayed, setDisplayed] = useState(45);

  React.useEffect(() => {
    const seq = [45, 72, 89];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % seq.length;
      setDisplayed(seq[i]);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const scoreColor = displayed >= 80 ? COLORS.correct : displayed >= 65 ? COLORS.warning : COLORS.fault;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center space-y-8">
      <div className="space-y-1">
        <div className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}>STEP 3 OF 4</div>
        <h2 className="text-sm font-bold tracking-[0.15em] uppercase"
          style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>Your Form Score</h2>
      </div>

      {/* Animated score display */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-28 h-28 rounded-full border-4 flex items-center justify-center"
          style={{ borderColor: scoreColor, transition: 'border-color 0.5s' }}>
          <div>
            <span className="text-4xl font-bold transition-all duration-500"
              style={{ color: scoreColor, fontFamily: FONT.heading }}>{displayed}</span>
            <span className="text-sm" style={{ color: COLORS.textTertiary }}>/100</span>
          </div>
        </div>
        <p className="text-[10px] tracking-[0.1em] uppercase"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Updates every rep</p>
      </div>

      {/* Score tiers */}
      <div className="w-full max-w-xs space-y-2">
        {[
          { range: '90–100', label: 'ELITE',      color: COLORS.gold,    desc: 'Competition ready' },
          { range: '80–89',  label: 'STRONG',     color: COLORS.correct, desc: 'Minor refinements' },
          { range: '70–79',  label: 'DEVELOPING', color: COLORS.warning, desc: 'Focus on flagged joints' },
          { range: '<70',    label: 'NEEDS WORK', color: COLORS.fault,   desc: 'Review before adding load' },
        ].map(({ range, label, color, desc }) => (
          <div key={range} className="flex items-center gap-3 px-3 py-2 rounded border"
            style={{ background: `${color}08`, borderColor: `${color}25` }}>
            <span className="text-[10px] font-bold w-12 flex-shrink-0"
              style={{ color, fontFamily: FONT.mono }}>{range}</span>
            <span className="text-[9px] font-bold tracking-[0.1em] uppercase"
              style={{ color, fontFamily: FONT.mono }}>{label}</span>
            <span className="text-[9px] ml-auto"
              style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{desc}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] tracking-[0.08em]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        AIM FOR 80+ ON EVERY REP
      </p>

      <button onClick={onNext} className="flex items-center gap-2 px-6 py-3 rounded border font-bold text-xs tracking-[0.15em] uppercase"
        style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold, fontFamily: FONT.mono }}>
        START MY FIRST SESSION <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Step 4: Pick first exercise ────────────────────────────────────────────
const STARTER_EXERCISES = [
  { id: 'squat',     label: 'Goblet Squat',  difficulty: 'BEGINNER', icon: '🏋️', desc: 'Full body compound' },
  { id: 'pushup',    label: 'Push-Up',        difficulty: 'BEGINNER', icon: '💪', desc: 'Upper body strength' },
  { id: 'deadlift',  label: 'Deadlift',       difficulty: 'MODERATE', icon: '⚡', desc: 'Posterior chain' },
];

function StepChooseExercise({ onChoose }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-6">
      <div className="space-y-1">
        <div className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}>STEP 4 OF 4</div>
        <h2 className="text-sm font-bold tracking-[0.15em] uppercase"
          style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>Choose Your First Exercise</h2>
        <p className="text-[10px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          Recommended for first session
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {STARTER_EXERCISES.map(ex => (
          <button key={ex.id} onClick={() => onChoose(ex.id)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-lg border text-left transition-colors"
            style={{ background: COLORS.surface, borderColor: COLORS.border }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.goldBorder; e.currentTarget.style.background = COLORS.goldDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface; }}>
            <span className="text-2xl">{ex.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold tracking-[0.1em]"
                  style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>{ex.label}</span>
                <span className="text-[7px] font-bold tracking-[0.1em] px-1.5 py-0.5 rounded border"
                  style={{ color: ex.difficulty === 'BEGINNER' ? COLORS.correct : COLORS.warning,
                    borderColor: ex.difficulty === 'BEGINNER' ? `${COLORS.correct}40` : `${COLORS.warning}40`,
                    background: ex.difficulty === 'BEGINNER' ? `${COLORS.correct}10` : `${COLORS.warning}10`,
                    fontFamily: FONT.mono }}>
                  {ex.difficulty}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{ex.desc}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="text-[7px] font-bold tracking-[0.1em] px-1.5 py-1 rounded"
                style={{ background: COLORS.goldDim, color: COLORS.gold, fontFamily: FONT.mono }}>
                GOOD FIRST
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main wizard ────────────────────────────────────────────────────────────
export default function FirstLaunchWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const next = () => setStep(s => s + 1);

  const handleChooseExercise = (exerciseId) => {
    markOnboarded();
    onComplete?.();
    navigate(createPageUrl('FormCheck') + `?exercise=${exerciseId}`);
  };

  const steps = [
    <StepIntro onNext={next} />,
    <StepCameraPlacement onNext={next} />,
    <StepScoreExplainer onNext={next} />,
    <StepChooseExercise onChoose={handleChooseExercise} />,
  ];

  // Progress dots
  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: COLORS.bg, fontFamily: FONT.mono }}>

      {/* Dot progress */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-2">
        {steps.map((_, i) => (
          <div key={i} className="rounded-full transition-all"
            style={{
              width: i === step ? 16 : 6,
              height: 6,
              background: i === step ? COLORS.gold : COLORS.border,
            }} />
        ))}
      </div>

      {/* Skip on first 3 steps */}
      {step < 3 && (
        <div className="flex justify-end px-6">
          <button onClick={() => setStep(3)}
            className="text-[9px] tracking-[0.15em] uppercase"
            style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            SKIP
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {steps[step]}
      </div>
    </div>
  );
}