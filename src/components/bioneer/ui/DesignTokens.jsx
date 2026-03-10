/**
 * Bioneer Design System Tokens
 */

export const COLORS = {
  bg: '#080808',
  surface: '#0c0c0c',
  surfaceHover: '#111111',
  border: '#1a1a1a',
  borderLight: '#252525',
  gold: '#c9a227',
  goldDim: 'rgba(201,162,39,0.15)',
  goldBorder: 'rgba(201,162,39,0.3)',
  correct: '#00e5a0',
  warning: '#f59e0b',
  fault: '#ff4444',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.3)',
  textMuted: 'rgba(255,255,255,0.15)',
};

export const FONT_LINK = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap';

export const FONT = {
  mono: "'DM Mono', 'IBM Plex Mono', monospace",
  heading: "'IBM Plex Mono', 'DM Mono', monospace",
};

export function scoreColor(score) {
  if (score >= 80) return COLORS.correct;
  if (score >= 60) return COLORS.warning;
  return COLORS.fault;
}

export function faultColor(pct) {
  if (pct > 40) return COLORS.fault;
  if (pct > 20) return COLORS.warning;
  return COLORS.correct;
}

export function deviationColor(deg) {
  if (deg > 25) return COLORS.fault;
  if (deg > 10) return COLORS.warning;
  return COLORS.correct;
}