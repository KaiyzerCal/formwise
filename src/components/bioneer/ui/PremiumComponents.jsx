/**
 * PremiumComponents — World-class UI components with smooth animations
 * Consistent spacing (4, 8, 16, 24, 32px), visual hierarchy, and engagement
 */
import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from './DesignTokens';

/* ==================== CARD COMPONENT ==================== */
export function PremiumCard({ children, onClick, className = '' }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`rounded-2xl border transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ==================== PRIMARY BUTTON ==================== */
export function PrimaryButton({ children, onClick, disabled = false, loading = false, icon: Icon }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-[0.1em] uppercase transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: COLORS.gold,
        color: COLORS.bg,
        fontFamily: FONT.mono,
      }}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-transparent border-t-current rounded-full"
        />
      )}
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  );
}

/* ==================== SECONDARY BUTTON ==================== */
export function SecondaryButton({ children, onClick, disabled = false, icon: Icon }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-[0.1em] uppercase border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'transparent',
        borderColor: COLORS.border,
        color: COLORS.textSecondary,
        fontFamily: FONT.mono,
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  );
}

/* ==================== STAT CARD ==================== */
export function StatCard({ label, value, color = COLORS.gold, icon: Icon, trend }) {
  return (
    <PremiumCard className="p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            {label}
          </span>
          {Icon && <Icon size={18} style={{ color }} />}
        </div>
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-bold"
            style={{ color, fontFamily: FONT.heading }}
          >
            {value}
          </motion.div>
          {trend && (
            <span className="text-[9px]" style={{ color: trend.positive ? COLORS.correct : COLORS.fault }}>
              {trend.positive ? '↑' : '↓'} {trend.text}
            </span>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}

/* ==================== SCORE RING ==================== */
export function ScoreRing({ score, size = 120 }) {
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 8} fill="none" stroke={COLORS.border} strokeWidth="6" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke={score >= 80 ? COLORS.correct : score >= 60 ? COLORS.warning : COLORS.fault}
          strokeWidth="6"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-4xl font-bold"
          style={{ color: COLORS.gold, fontFamily: FONT.heading }}
        >
          {Math.round(score)}
        </motion.div>
      </div>
    </div>
  );
}

/* ==================== PROGRESS BAR ==================== */
export function ProgressBar({ value, label, color = COLORS.gold, animated = true }) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[9px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
            {label}
          </span>
          <span className="text-[9px] font-bold" style={{ color: COLORS.textSecondary }}>
            {Math.round(value)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={animated ? { duration: 0.6, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
}

/* ==================== FEEDBACK MESSAGE ==================== */
export function FeedbackMessage({ message, type = 'info' }) {
  const bgColor = {
    success: 'rgba(34, 197, 94, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
    info: 'rgba(201, 168, 76, 0.1)',
  }[type];

  const textColor = {
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: COLORS.gold,
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg px-4 py-3 text-[10px] font-bold tracking-[0.1em] uppercase"
      style={{ background: bgColor, color: textColor, fontFamily: FONT.mono }}
    >
      {message}
    </motion.div>
  );
}

/* ==================== LOADING SKELETON ==================== */
export function SkeletonLoader({ count = 3, height = 80 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-xl"
          style={{
            background: COLORS.border,
            height: `${height}px`,
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ==================== BADGE ==================== */
export function Badge({ label, color = COLORS.gold, icon: Icon }) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-bold tracking-[0.1em] uppercase"
      style={{
        background: `${color}20`,
        borderColor: `${color}40`,
        border: '1px solid',
        color,
        fontFamily: FONT.mono,
      }}
    >
      {Icon && <Icon size={12} />}
      {label}
    </motion.span>
  );
}

/* ==================== EMPTY STATE ==================== */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: COLORS.goldDim, border: `2px solid ${COLORS.goldBorder}` }}
      >
        {Icon && <Icon size={40} style={{ color: COLORS.gold }} />}
      </motion.div>
      <div className="text-center space-y-3 max-w-sm">
        <h3 className="text-sm font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
          {title}
        </h3>
        <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {description}
        </p>
      </div>
      {action && action}
    </div>
  );
}