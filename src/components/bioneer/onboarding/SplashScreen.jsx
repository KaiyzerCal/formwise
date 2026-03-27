/**
 * Bioneer Splash Screen
 * Premium onboarding with animated logo as hero element
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import { SPACING, MOTION } from '@/lib/spacingSystem';
import { LogoWithLoadingRing, LogoWithWordmark } from '../ui/LogoMark';

export default function SplashScreen({ onReady, progress = 0 }) {
  const [isLoading, setIsLoading] = useState(progress < 100);

  useEffect(() => {
    if (progress >= 100) {
      setIsLoading(false);
    }
  }, [progress]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.4 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        position: 'fixed',
        inset: 0,
        background: COLORS.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: FONT.mono,
      }}
    >
      {/* Hero Logo with Loading Ring */}
      <motion.div variants={itemVariants} style={{ marginBottom: SPACING.xl }}>
        {isLoading ? (
          <LogoWithLoadingRing size={160} color={COLORS.gold} />
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <LogoWithWordmark size="hero" color={COLORS.gold} />
          </motion.div>
        )}
      </motion.div>

      {/* Status Text */}
      {isLoading && (
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: SPACING.md,
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: COLORS.textSecondary,
              margin: 0,
              letterSpacing: '0.05em',
              fontWeight: '500',
            }}
          >
            Initializing Performance System
          </p>

          {/* Progress indicator */}
          <div
            style={{
              width: '200px',
              height: '2px',
              background: COLORS.border,
              borderRadius: '1px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: COLORS.gold,
                borderRadius: '1px',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>

          <p
            style={{
              fontSize: '10px',
              color: COLORS.textTertiary,
              margin: 0,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {progress}%
          </p>
        </motion.div>
      )}

      {/* Ready CTA */}
      {!isLoading && onReady && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: SPACING.md,
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: COLORS.textSecondary,
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            Ready to start
          </p>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: `0 8px 24px rgba(201,162,39,0.2)` }}
            whileTap={{ scale: 0.98 }}
            onClick={onReady}
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              background: COLORS.gold,
              color: COLORS.bg,
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: FONT.mono,
            }}
          >
            Begin Session
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}