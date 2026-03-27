/**
 * PlanGenerator — Create AI-generated workout plans
 * Minimal UI, data-driven from user sessions
 */

import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function PlanGenerator({ onSuccess, onClose }) {
  const [goal, setGoal] = useState('strength');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [duration, setDuration] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Analyze user sessions to get weak areas
  const weakAreas = useMemo(() => {
    const sessions = getAllSessions();
    if (!sessions.length) return [];
    
    const faultCounts = {};
    sessions.forEach(s => {
      (s.top_faults || []).forEach(f => {
        faultCounts[f] = (faultCounts[f] || 0) + 1;
      });
    });

    return Object.entries(faultCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([fault]) => fault);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await base44.functions.invoke('generateWorkoutPlan', {
        goal,
        experience_level: difficulty,
        duration_weeks: parseInt(duration),
        weak_areas: weakAreas,
      });

      if (response.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setError(response.data?.error || 'Failed to generate plan');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: COLORS.textPrimary }}>
          <Zap size={16} style={{ color: COLORS.gold }} />
          Generate Plan
        </h2>
        <p className="text-[9px]" style={{ color: COLORS.textSecondary }}>
          AI creates a plan based on your goals and recent performance
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-2 p-3 rounded border" style={{ background: 'rgba(255,77,77,0.08)', borderColor: 'rgba(255,77,77,0.3)' }}>
          <AlertCircle size={14} style={{ color: COLORS.fault, flexShrink: 0, marginTop: '2px' }} />
          <span className="text-[9px]" style={{ color: COLORS.fault }}>
            {error}
          </span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex gap-2 p-3 rounded border" style={{ background: 'rgba(0,229,160,0.08)', borderColor: 'rgba(0,229,160,0.3)' }}>
          <CheckCircle size={14} style={{ color: COLORS.correct, flexShrink: 0, marginTop: '2px' }} />
          <span className="text-[9px]" style={{ color: COLORS.correct }}>
            Plan created! Check your active plans.
          </span>
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Goal */}
        <div className="space-y-1">
          <label className="text-[8px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
            Goal
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={loading}
            className="w-full px-2 py-1.5 rounded border text-[9px]"
            style={{
              background: COLORS.bg,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          >
            <option value="strength">Strength</option>
            <option value="aesthetics">Aesthetics</option>
            <option value="health">Health</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>

        {/* Difficulty */}
        <div className="space-y-1">
          <label className="text-[8px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={loading}
            className="w-full px-2 py-1.5 rounded border text-[9px]"
            style={{
              background: COLORS.bg,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <label className="text-[8px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
            Duration (weeks)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={loading}
            className="w-full px-2 py-1.5 rounded border text-[9px]"
            style={{
              background: COLORS.bg,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          >
            <option value="2">2 weeks</option>
            <option value="4">4 weeks</option>
            <option value="6">6 weeks</option>
            <option value="8">8 weeks</option>
          </select>
        </div>
      </div>

      {/* Weak areas detected */}
      {weakAreas.length > 0 && (
        <div className="p-2 rounded border text-[8px]" style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder }}>
          <p style={{ color: COLORS.gold, fontWeight: 'bold' }}>Weak areas detected:</p>
          <p className="mt-1" style={{ color: COLORS.gold }}>
            {weakAreas.join(', ')}
          </p>
          <p className="mt-1 opacity-70" style={{ color: COLORS.gold }}>
            Plan will address these areas.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-3 py-2 rounded text-[9px] font-bold tracking-[0.1em] uppercase border transition"
          style={{
            background: 'transparent',
            borderColor: COLORS.border,
            color: COLORS.textSecondary,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex-1 px-3 py-2 rounded text-[9px] font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-95"
          style={{
            background: COLORS.gold,
            color: COLORS.bg,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Generating
            </>
          ) : (
            'Generate'
          )}
        </button>
      </div>
    </div>
  );
}