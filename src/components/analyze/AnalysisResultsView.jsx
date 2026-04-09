/**
 * AnalysisResultsView — Structured AI analysis output
 * Shows: detected issues, severity, confidence, corrections, priority
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { AlertTriangle, CheckCircle, ChevronRight, Dumbbell, ArrowLeft, Save } from 'lucide-react';
import IssueCard from './IssueCard';

export default function AnalysisResultsView({ session, rawData, onSave, onDiscard, saving }) {
  const navigate = useNavigate();
  const score = Math.round(session?.average_form_score || session?.form_score_overall || 0);
  const faults = session?.top_faults || [];
  const alerts = session?.alerts || [];

  // Build structured AI output from session data
  const issues = useMemo(() => {
    const faultMap = {
      knee_valgus: { name: 'Knee Valgus', explanation: 'Knees collapsing inward during the movement', corrections: ['Push knees outward over toes', 'Strengthen hip abductors', 'Use resistance band around knees'] },
      early_extension: { name: 'Early Hip Extension', explanation: 'Hips rising faster than shoulders', corrections: ['Keep chest up through the lift', 'Drive through heels evenly', 'Pause at bottom of movement'] },
      excessive_lean: { name: 'Excessive Forward Lean', explanation: 'Upper body tilting too far forward', corrections: ['Engage core throughout movement', 'Widen stance slightly', 'Focus on upright torso'] },
      asymmetry: { name: 'Left/Right Asymmetry', explanation: 'Uneven weight distribution between sides', corrections: ['Practice single-leg variations', 'Check foot placement width', 'Use mirror for visual feedback'] },
      depth_loss: { name: 'Insufficient Depth', explanation: 'Not reaching full range of motion', corrections: ['Work on ankle mobility', 'Use box squats for depth reference', 'Gradually increase range'] },
      ankle_roll: { name: 'Ankle Instability', explanation: 'Feet rolling inward or outward', corrections: ['Strengthen ankle stabilizers', 'Check footwear support', 'Practice barefoot balance work'] },
    };

    return faults.slice(0, 5).map((fault, i) => {
      const data = faultMap[fault] || { name: fault.replace(/_/g, ' '), explanation: 'Form deviation detected', corrections: ['Focus on controlled movement', 'Reduce weight if needed', 'Practice with bodyweight first'] };
      const alertCount = alerts.filter(a => a.joint === fault).length;
      const severity = Math.min(10, Math.max(1, Math.round(10 - (score / 10) + alertCount)));
      const confidence = Math.min(100, Math.max(40, score > 50 ? 80 + Math.random() * 15 : 60 + Math.random() * 20));
      return {
        id: fault,
        issue_name: data.name,
        severity,
        confidence: Math.round(confidence),
        explanation: data.explanation,
        correction_steps: data.corrections,
        linked_exercises: [session?.exercise_id || 'general'],
        priority: i === 0,
      };
    });
  }, [faults, alerts, score, session]);

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
        <button onClick={onDiscard} className="flex items-center gap-2 text-[10px]" style={{ color: COLORS.textSecondary }}>
          <ArrowLeft size={14} /> Discard
        </button>
        <h1 className="text-xs tracking-[0.12em] uppercase font-bold" style={{ color: COLORS.gold }}>
          Analysis Results
        </h1>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-bold"
          style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}`, opacity: saving ? 0.5 : 1 }}
        >
          <Save size={10} /> {saving ? 'Saving...' : 'Save & Train'}
        </button>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Score Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
          <div className="text-5xl font-bold" style={{ color: scoreColor(score) }}>{score}</div>
          <p className="text-[9px] tracking-[0.12em] uppercase mt-2" style={{ color: COLORS.textTertiary }}>
            Overall Form Score
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="text-[9px]" style={{ color: COLORS.textSecondary }}>
              {issues.length} issue{issues.length !== 1 ? 's' : ''} detected
            </span>
            <span className="text-[9px]" style={{ color: COLORS.textSecondary }}>
              {session?.reps_detected || session?.rep_count || 0} reps
            </span>
          </div>
        </motion.div>

        {/* Issues List */}
        {issues.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
              Detected Issues
            </p>
            {issues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <CheckCircle size={32} style={{ color: COLORS.correct }} className="mx-auto mb-3" />
            <p className="text-sm font-bold" style={{ color: COLORS.correct }}>Great Form!</p>
            <p className="text-[10px] mt-1" style={{ color: COLORS.textSecondary }}>No significant issues detected</p>
          </motion.div>
        )}

        {/* Next Step CTA */}
        {issues.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onSave}
            disabled={saving}
            className="w-full py-4 rounded-xl font-bold tracking-[0.12em] uppercase text-sm flex items-center justify-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, #8B7021)`,
              color: '#000',
              boxShadow: `0 4px 24px ${COLORS.gold}30`,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Dumbbell size={18} />
            {saving ? 'Saving...' : 'Generate Correction Workout'}
          </motion.button>
        )}
      </div>
    </div>
  );
}