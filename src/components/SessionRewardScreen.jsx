import React, { useEffect, useState } from 'react';
import { Flame, Trophy, Zap, Star } from 'lucide-react';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import confetti from 'canvas-confetti';

export default function SessionRewardScreen({ sessionData, onClose }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardText, setRewardText] = useState('');

  useEffect(() => {
    // Trigger confetti on mount
    setShowConfetti(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Generate motivational text based on performance
    const score = sessionData.form_score_overall || 0;
    if (score >= 85) {
      setRewardText('Excellent form! You\'re crushing it! 🔥');
    } else if (score >= 70) {
      setRewardText('Great work! Keep it up! 💪');
    } else {
      setRewardText('Solid effort! You\'re improving! 📈');
    }
  }, [sessionData]);

  const score = sessionData.form_score_overall || 0;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-4 z-50"
      style={{ background: `${COLORS.bg}ee` }}
    >
      <div
        className="max-w-sm rounded-2xl p-8 space-y-6 text-center"
        style={{ background: COLORS.surface, border: `2px solid ${COLORS.gold}` }}
      >
        {/* Score Display */}
        <div>
          <div
            className="text-6xl font-bold mb-2"
            style={{ color: scoreColor(score), fontFamily: FONT.heading }}
          >
            {Math.round(score)}
          </div>
          <div style={{ color: COLORS.textSecondary }}>Form Score</div>
        </div>

        {/* Motivational Text */}
        <div
          className="text-lg"
          style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}
        >
          {rewardText}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div style={{ background: COLORS.goldDim, padding: '12px', borderRadius: '8px' }}>
            <Flame size={20} style={{ color: COLORS.gold, margin: '0 auto mb-2' }} />
            <div
              className="text-sm font-bold"
              style={{ color: COLORS.gold, fontFamily: FONT.heading }}
            >
              +50 XP
            </div>
          </div>

          <div style={{ background: COLORS.goldDim, padding: '12px', borderRadius: '8px' }}>
            <Zap size={20} style={{ color: COLORS.gold, margin: '0 auto mb-2' }} />
            <div
              className="text-sm font-bold"
              style={{ color: COLORS.gold, fontFamily: FONT.heading }}
            >
              Streak +1
            </div>
          </div>
        </div>

        {/* Key Metric */}
        <div style={{ background: COLORS.border, padding: '12px', borderRadius: '8px' }}>
          <div
            className="text-xs font-bold tracking-wide uppercase"
            style={{ color: COLORS.textSecondary, marginBottom: '4px' }}
          >
            Rep Count
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}
          >
            {sessionData.reps_detected || 0}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg font-bold transition-colors"
          style={{
            background: COLORS.gold,
            color: COLORS.bg,
            fontFamily: FONT.heading,
          }}
          onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.target.style.opacity = '1')}
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}