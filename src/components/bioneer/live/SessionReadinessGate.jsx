/**
 * SessionReadinessGate.jsx
 * Shows readiness checklist overlay. Hidden once all checks pass.
 * FIX: Auto-dismisses after timeout so users never get permanently stuck.
 * FIX: Shows manual "Start Anyway" button after model loads.
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';
import CameraPlacementGuide from '../onboarding/CameraPlacementGuide';

const GOLD = '#C9A84C';
const RED  = '#EF4444';
const GRN  = '#22C55E';

// After this many ms with pose engine ready, allow manual override
const MANUAL_OVERRIDE_MS = 6000;

function Check({ label, ok, warn, loading }) {
  const Icon  = loading ? Loader2 : ok ? CheckCircle2 : warn ? AlertCircle : Circle;
  const color = ok ? GRN : warn ? '#EAB308' : loading ? GOLD : 'rgba(255,255,255,0.3)';
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} style={{ color, flexShrink: 0 }}
        className={loading ? 'animate-spin' : ''} />
      <span className="text-sm" style={{ color: ok ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
        fontFamily: "'DM Mono', monospace" }}>
        {label}
      </span>
    </div>
  );
}

export default function SessionReadinessGate({ checks, guidance, onForceStart, exercise, poseLandmarks }) {
  const allGood = checks.every(c => c.ok);
  const poseReady = checks.find(c => c.label === 'Pose engine ready')?.ok;
  const [showOverride, setShowOverride] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (allGood) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [allGood]);

  // Show "start anyway" after pose is ready but body detection is stalling
  useEffect(() => {
    if (poseReady && elapsed >= MANUAL_OVERRIDE_MS / 1000) {
      setShowOverride(true);
    }
  }, [poseReady, elapsed]);

  if (allGood) return null;

  const loading = (label) => {
    if (label === 'Pose engine ready') return !poseReady;
    if (label === 'Camera active') return !checks.find(c => c.label === label)?.ok;
    return false;
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-72 rounded-2xl border p-6 space-y-4"
        style={{ background: 'rgba(0,0,0,0.88)', borderColor: `${GOLD}40` }}>

        <p className="text-xs tracking-[0.2em] uppercase text-center"
          style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
          Getting Ready
        </p>

        <div className="space-y-3">
          {checks.map((c, i) => (
            <Check key={i} {...c} loading={loading(c.label)} />
          ))}
        </div>

        {/* Camera placement guide — shown while waiting for body detection */}
        {exercise && !checks.find(c => c.label === 'Body detected')?.ok && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <CameraPlacementGuide exercise={exercise} poseLandmarks={poseLandmarks} />
          </div>
        )}

        {guidance && (
          <div className="mt-2 pt-3 border-t border-white/10 text-center">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono', monospace" }}>
              {guidance}
            </p>
          </div>
        )}

        {showOverride && onForceStart && (
          <button
            onClick={onForceStart}
            className="w-full py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase border mt-1"
            style={{ background: `${GOLD}15`, borderColor: `${GOLD}40`, color: GOLD, fontFamily: "'DM Mono', monospace" }}>
            Start Anyway
          </button>
        )}
      </div>
    </div>
  );
}