/**
 * Premium Camera Overlay
 * Minimal, focused UI for live training sessions
 * Includes logo watermark, essential feedback only, alignment grid
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import { SPACING, MOTION } from '@/lib/spacingSystem';
import { LogoWatermark } from '../ui/LogoMark';

/**
 * Feedback message display
 * Shows one message at a time, quick appearance and fade
 */
export function FeedbackMessage({ message, type = 'neutral' }) {
  const typeColors = {
    success: COLORS.correct,
    warning: COLORS.warning,
    fault: COLORS.fault,
    neutral: COLORS.gold,
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: MOTION.fast }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              background: `rgba(0, 0, 0, 0.8)`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${typeColors[type]}`,
              borderRadius: SPACING.radiusStandard,
              color: typeColors[type],
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.05em',
              textAlign: 'center',
              fontFamily: FONT.mono,
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Alignment Grid
 * Subtle grid guides for proper positioning
 */
export function AlignmentGrid({ visible = true, opacity = 0.08 }) {
  if (!visible) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
        zIndex: 40,
      }}
    >
      {/* Vertical thirds */}
      <line x1="33.333%" y1="0" x2="33.333%" y2="100%" stroke={COLORS.gold} strokeWidth="1" />
      <line x1="66.666%" y1="0" x2="66.666%" y2="100%" stroke={COLORS.gold} strokeWidth="1" />

      {/* Horizontal thirds */}
      <line x1="0" y1="33.333%" x2="100%" y2="33.333%" stroke={COLORS.gold} strokeWidth="1" />
      <line x1="0" y1="66.666%" x2="100%" y2="66.666%" stroke={COLORS.gold} strokeWidth="1" />

      {/* Center crosshair */}
      <line x1="48%" y1="50%" x2="52%" y2="50%" stroke={COLORS.gold} strokeWidth="1.5" opacity="0.3" />
      <line x1="50%" y1="48%" x2="50%" y2="52%" stroke={COLORS.gold} strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

/**
 * Session Stats Header
 * Minimal display of reps, form score, session time
 */
export function SessionStatsHeader({ reps = 0, formScore = 0, elapsedSeconds = 0, sessionStatus }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.standard }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: SPACING.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Left: Reps */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.xs }}>
        <span
          style={{
            fontSize: '10px',
            color: COLORS.textTertiary,
            fontWeight: '500',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Reps
        </span>
        <motion.span
          key={reps}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: MOTION.instant }}
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: COLORS.gold,
            fontFamily: FONT.mono,
            minWidth: '24px',
          }}
        >
          {reps}
        </motion.span>
      </div>

      {/* Center: Session Time */}
      <div
        style={{
          fontSize: '12px',
          color: COLORS.textSecondary,
          fontFamily: FONT.mono,
          letterSpacing: '0.05em',
          fontWeight: '600',
        }}
      >
        {formatTime(elapsedSeconds)}
      </div>

      {/* Right: Form Score */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.xs }}>
        <motion.span
          key={formScore}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: MOTION.instant }}
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: formScore >= 80 ? COLORS.correct : formScore >= 60 ? COLORS.warning : COLORS.fault,
            fontFamily: FONT.mono,
            minWidth: '24px',
            textAlign: 'right',
          }}
        >
          {Math.round(formScore)}
        </motion.span>
        <span
          style={{
            fontSize: '10px',
            color: COLORS.textTertiary,
            fontWeight: '500',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Form
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Confidence Indicator Ring
 * Subtle ring around camera showing pose tracking confidence
 */
export function ConfidenceRing({ confidence = 0.5 }) {
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - confidence * circumference;

  const getColor = () => {
    if (confidence > 0.7) return COLORS.correct;
    if (confidence > 0.45) return COLORS.warning;
    return COLORS.fault;
  };

  return (
    <svg
      style={{
        position: 'absolute',
        bottom: SPACING.lg,
        left: SPACING.lg,
        zIndex: 50,
      }}
      width="48"
      height="48"
      viewBox="0 0 48 48"
    >
      {/* Background circle */}
      <circle cx="24" cy="24" r="20" fill="none" stroke={COLORS.border} strokeWidth="1" opacity="0.3" />

      {/* Progress circle */}
      <motion.circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke={getColor()}
        strokeWidth="1.5"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: MOTION.smooth }}
      />

      {/* Center dot */}
      <circle cx="24" cy="24" r="3" fill={getColor()} />
    </svg>
  );
}

/**
 * Wrapping component for full camera overlay
 */
export function PremiumCameraOverlay({ children, showGrid = true, gridOpacity = 0.08 }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: COLORS.bg,
        overflow: 'hidden',
      }}
    >
      {/* Camera feed (children) */}
      {children}

      {/* Alignment Grid */}
      <AlignmentGrid visible={showGrid} opacity={gridOpacity} />

      {/* Logo Watermark */}
      <LogoWatermark opacity={0.06} size={200} />
    </div>
  );
}