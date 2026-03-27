/**
 * Premium UI Components for Bioneer
 * Minimal, powerful, performance-driven design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from './DesignTokens';
import { SPACING, MOTION, ELEVATION } from '@/lib/spacingSystem';

/**
 * Premium Card / Module
 * Clean container with subtle elevation, strong alignment
 */
export function PremiumCard({ children, className = '', highlight = false, onClick = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { borderColor: COLORS.gold } : {}}
      onClick={onClick}
      className={`rounded-lg border transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${COLORS.surface} 0%, rgba(201,162,39,0.03) 100%)`
          : COLORS.surface,
        borderColor: highlight ? COLORS.goldBorder : COLORS.border,
        borderWidth: ELEVATION.borderStandard,
        padding: SPACING.padStandard,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stat Card (metric display)
 * Hero number with supporting label, color-coded
 */
export function StatCard({ label, value, color, icon: Icon, trend }) {
  return (
    <PremiumCard highlight={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {/* Icon + Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          {Icon && <Icon size={16} color={color} strokeWidth={1.5} />}
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.08em',
              color: COLORS.textTertiary,
              textTransform: 'uppercase',
              fontFamily: FONT.mono,
            }}
          >
            {label}
          </span>
        </div>

        {/* Hero Value */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color,
            fontFamily: FONT.mono,
            letterSpacing: '-1px',
          }}
        >
          {value}
        </motion.div>

        {/* Trend indicator */}
        {trend && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: '500',
              color: trend.positive ? COLORS.correct : COLORS.warning,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {trend.text}
          </span>
        )}
      </div>
    </PremiumCard>
  );
}

/**
 * Primary Action Button
 * Large, confident, dominates the screen
 */
export function PrimaryButton({ onClick, children, icon: Icon, loading = false, disabled = false }) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, boxShadow: `0 8px 24px rgba(201,162,39,0.2)` } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: `${SPACING.lg} ${SPACING.xl}`,
        background: COLORS.gold,
        color: COLORS.bg,
        border: 'none',
        borderRadius: SPACING.radiusStandard,
        fontSize: '14px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
        fontFamily: FONT.mono,
        transition: `opacity ${MOTION.standard}, transform ${MOTION.fast}`,
      }}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(8,8,8,0.3)',
            borderTop: '2px solid rgba(8,8,8,0.8)',
            borderRadius: '50%',
            animation: `spin 0.8s linear infinite`,
          }}
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {Icon && !loading && <Icon size={16} strokeWidth={2} />}
      {children}
    </motion.button>
  );
}

/**
 * Secondary Button
 * Outline style for secondary actions
 */
export function SecondaryButton({ onClick, children, icon: Icon }) {
  return (
    <motion.button
      whileHover={{ borderColor: COLORS.gold, color: COLORS.gold }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: `${SPACING.md} ${SPACING.lg}`,
        background: 'transparent',
        color: COLORS.textSecondary,
        border: `${ELEVATION.borderStandard} solid ${COLORS.border}`,
        borderRadius: SPACING.radiusStandard,
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        fontFamily: FONT.mono,
        transition: `all ${MOTION.fast}`,
      }}
    >
      {Icon && <Icon size={14} strokeWidth={1.5} />}
      {children}
    </motion.button>
  );
}

/**
 * Empty State
 * Guides user when no data is available
 */
export function EmptyState({ icon: Icon, title, subtitle, action, actionText }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        gap: SPACING.lg,
        textAlign: 'center',
        minHeight: '300px',
      }}
    >
      {Icon && <Icon size={48} color={COLORS.textTertiary} strokeWidth={0.8} opacity={0.4} />}
      <div style={{ space: SPACING.md }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.textPrimary,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: '13px',
              color: COLORS.textTertiary,
              margin: `${SPACING.sm} 0 0 0`,
              lineHeight: '1.5',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && actionText && (
        <PrimaryButton onClick={action}>{actionText}</PrimaryButton>
      )}
    </div>
  );
}

/**
 * Score Ring / Metric Display
 * Circular visualization for form/performance scores
 */
export function ScoreRing({ score = 0, max = 100, size = 120, color = COLORS.gold, label }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / max) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING.md }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={COLORS.border}
            strokeWidth="3"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: MOTION.smooth, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: color,
              fontFamily: FONT.mono,
            }}
          >
            {Math.round(score)}
          </div>
          {label && (
            <div
              style={{
                fontSize: '10px',
                color: COLORS.textTertiary,
                marginTop: SPACING.xs,
              }}
            >
              {label}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Progress Bar (linear metric display)
 * For XP, form consistency, etc.
 */
export function ProgressBar({ value = 0, max = 100, color = COLORS.gold, label, showPercent = true }) {
  const percent = (value / max) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm, width: '100%' }}>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: COLORS.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </span>
          )}
          {showPercent && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color,
              }}
            >
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}

      {/* Progress track */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: COLORS.border,
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        {/* Progress fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: MOTION.smooth, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color,
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  );
}