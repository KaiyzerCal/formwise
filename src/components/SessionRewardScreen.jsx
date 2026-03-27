import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, Star, ArrowRight } from 'lucide-react';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { PrimaryButton, ScoreRing, Badge } from './bioneer/ui/PremiumComponents';
import confetti from 'canvas-confetti';
import { POINT_VALUES } from '@/lib/gamificationEngine';

export default function SessionRewardScreen({ sessionData, onClose }) {
  const [rewardText, setRewardText] = useState('');
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    // Trigger premium confetti
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      duration: 2000,
    });

    const score = sessionData.form_score_overall || 0;
    if (score >= 85) {
      setRewardText('Excellent form! You\'re crushing it! 🔥');
    } else if (score >= 70) {
      setRewardText('Great work! Keep it up! 💪');
    } else {
      setRewardText('Solid effort! You\'re improving! 📈');
    }

    // Calculate points earned
    let totalPoints = POINT_VALUES.SESSION_COMPLETE;
    
    // Bonus for high score
    if (score >= 85) totalPoints += POINT_VALUES.PERSONAL_BEST;
    
    // Bonus for zero faults
    const reps = sessionData.reps_detected || 0;
    if (reps >= 10 && !sessionData.top_faults?.length) {
      totalPoints += POINT_VALUES.ZERO_FAULT_SET;
    }

    setPointsEarned(totalPoints);
  }, [sessionData]);

  const score = sessionData.form_score_overall || 0;
  const reps = sessionData.reps_detected || 0;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto"
      style={{ background: `${COLORS.bg}ee` }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-full max-w-md rounded-3xl p-8 space-y-8"
        style={{ background: COLORS.surface, border: `2px solid ${COLORS.gold}` }}
      >
        {/* Header with Trophy */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <Trophy size={40} style={{ color: COLORS.gold }} />
          </motion.div>
          <h2 className="text-xl font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            Session Complete
          </h2>
        </motion.div>

        {/* Score Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center"
        >
          <ScoreRing score={score} size={140} />
        </motion.div>

        {/* Motivational Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center"
        >
          <p className="text-sm font-bold leading-relaxed" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
            {rewardText}
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {/* XP Badge */}
          <div className="rounded-2xl p-4 text-center" style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, border: '1px solid' }}>
           <motion.div
             animate={{ scale: [1, 1.2, 1] }}
             transition={{ duration: 0.6, repeat: Infinity, delay: 0.8 }}
           >
             <Flame size={24} style={{ color: COLORS.gold, margin: '0 auto 8px' }} />
           </motion.div>
           <div className="text-xs font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>+{pointsEarned} XP</div>
          </div>

          {/* Reps */}
          <div className="rounded-2xl p-4 text-center" style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, border: '1px solid' }}>
            <Zap size={24} style={{ color: COLORS.gold, margin: '0 auto 8px' }} />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-lg font-bold"
              style={{ color: COLORS.gold, fontFamily: FONT.heading }}
            >
              {reps}
            </motion.div>
            <div className="text-[8px] font-bold uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Reps</div>
          </div>

          {/* Streak */}
          <div className="rounded-2xl p-4 text-center" style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, border: '1px solid' }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 1.2 }}
            >
              <Star size={24} style={{ color: COLORS.gold, margin: '0 auto 8px' }} />
            </motion.div>
            <div className="text-xs font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>+1 Day</div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="pt-2"
        >
          <PrimaryButton onClick={onClose} icon={ArrowRight}>
            Continue
          </PrimaryButton>
        </motion.div>
      </motion.div>
    </div>
  );
}