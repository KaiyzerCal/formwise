import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { Camera, Dumbbell, ChevronRight } from 'lucide-react';

export default function NextActionCard({ hasSession, todaysFocus, onAnalyze, onTrain }) {
  return (
    <div className="space-y-3">
      {/* Primary CTA */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onAnalyze}
        className="w-full py-4 rounded-xl font-bold tracking-[0.12em] uppercase text-sm flex items-center justify-center gap-3 transition-all"
        style={{
          background: `linear-gradient(135deg, ${COLORS.gold}, #8B7021)`,
          color: '#000',
          boxShadow: `0 4px 24px ${COLORS.gold}30`,
          fontFamily: FONT.mono,
        }}
      >
        <Camera size={18} strokeWidth={2.5} />
        {hasSession ? 'Analyze Movement' : 'Start First Analysis'}
      </motion.button>

      {/* Secondary: Today's workout */}
      {hasSession && (
        <button
          onClick={onTrain}
          className="w-full py-3 rounded-lg border flex items-center justify-between px-4 transition-all hover:bg-white/[0.02]"
          style={{ borderColor: COLORS.borderLight, fontFamily: FONT.mono }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: COLORS.goldDim }}>
              <Dumbbell size={14} style={{ color: COLORS.gold }} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold" style={{ color: COLORS.textPrimary }}>
                {todaysFocus ? `Fix: ${todaysFocus}` : "Today's Workout"}
              </p>
              <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                Personalized correction plan
              </p>
            </div>
          </div>
          <ChevronRight size={14} style={{ color: COLORS.textTertiary }} />
        </button>
      )}
    </div>
  );
}