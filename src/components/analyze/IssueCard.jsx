/**
 * IssueCard — Single detected issue with severity, confidence, corrections
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { AlertTriangle, ChevronDown, ChevronUp, Star } from 'lucide-react';

function severityColor(sev) {
  if (sev >= 7) return COLORS.fault;
  if (sev >= 4) return COLORS.warning;
  return COLORS.correct;
}

export default function IssueCard({ issue, index }) {
  const [expanded, setExpanded] = useState(issue.priority);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-lg border overflow-hidden"
      style={{ background: COLORS.surface, borderColor: issue.priority ? COLORS.goldBorder : COLORS.border }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        {/* Priority badge */}
        {issue.priority && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${COLORS.gold}20` }}>
            <Star size={10} style={{ color: COLORS.gold }} fill={COLORS.gold} />
          </div>
        )}
        {!issue.priority && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${severityColor(issue.severity)}15` }}>
            <AlertTriangle size={10} style={{ color: severityColor(issue.severity) }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold capitalize" style={{ color: COLORS.textPrimary }}>
              {issue.issue_name}
            </p>
            {issue.priority && (
              <span className="text-[7px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded" style={{ background: COLORS.goldDim, color: COLORS.gold }}>
                Fix First
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[8px]" style={{ color: severityColor(issue.severity) }}>
              Severity: {issue.severity}/10
            </span>
            <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>
              Confidence: {issue.confidence}%
            </span>
          </div>
        </div>

        {expanded ? <ChevronUp size={12} style={{ color: COLORS.textTertiary }} /> : <ChevronDown size={12} style={{ color: COLORS.textTertiary }} />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 border-t"
          style={{ borderColor: COLORS.border }}
        >
          <p className="text-[9px] leading-relaxed mt-3" style={{ color: COLORS.textSecondary }}>
            {issue.explanation}
          </p>

          <div className="mt-3 space-y-2">
            <p className="text-[7px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
              Correction Steps
            </p>
            {issue.correction_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[8px] font-bold"
                  style={{ background: COLORS.goldDim, color: COLORS.gold }}
                >
                  {i + 1}
                </div>
                <p className="text-[9px] leading-relaxed" style={{ color: COLORS.textPrimary }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}