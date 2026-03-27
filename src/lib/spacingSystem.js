/**
 * Bioneer Spacing System
 * Precise, scalable spacing based on 4px grid
 * Maintains visual hierarchy and premium feel
 */

export const SPACING = {
  // Base unit
  xs: '4px',    // 4px - tight spacing
  sm: '8px',    // 8px - compact
  md: '16px',   // 16px - standard
  lg: '24px',   // 24px - generous
  xl: '32px',   // 32px - expansive
  xxl: '48px',  // 48px - dramatic

  // Gap utilities (for flex/grid)
  gapTight: '8px',
  gapStandard: '16px',
  gapGenerous: '24px',
  gapLarge: '32px',

  // Padding utilities (for cards/modules)
  padSmall: '12px',
  padStandard: '16px',
  padGenerous: '20px',
  padLarge: '24px',
  padXL: '32px',

  // Margin utilities
  marginTight: '8px',
  marginStandard: '16px',
  marginGenerous: '24px',
  marginLarge: '32px',

  // Border radius (premium, subtle)
  radiusSmall: '4px',
  radiusStandard: '8px',
  radiusLarge: '12px',

  // Negative space (reduces cognitive load)
  breathingRoom: '32px',
};

/**
 * Motion system — fast, controlled, never bouncy
 */
export const MOTION = {
  // Durations (milliseconds)
  instant: '100ms',    // Loading states, quick feedback
  fast: '150ms',       // Count-ups, transitions
  standard: '200ms',   // Screen changes, fade-ins
  smooth: '300ms',     // Complex animations

  // Easing functions
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',   // Material Design standard
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',     // For entrances
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',        // For exits
  linear: 'linear',                            // Progress indicators
};

/**
 * Typography scale — minimal text, strong emphasis
 */
export const TYPOGRAPHY = {
  // Hero text
  h1: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.5px',
  },

  // Section header
  h2: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.3',
    letterSpacing: '-0.3px',
  },

  // Subsection header
  h3: {
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.4',
    letterSpacing: '0px',
  },

  // Body text
  body: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0px',
  },

  // Small secondary text
  caption: {
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '1.4',
    letterSpacing: '0.5px',
  },

  // Micro text / labels
  micro: {
    fontSize: '10px',
    fontWeight: '500',
    lineHeight: '1.3',
    letterSpacing: '0.8px',
  },
};

/**
 * Elevation system — depth through contrast not shadow
 */
export const ELEVATION = {
  // Surface levels (no drop shadows — use contrast instead)
  surface0: 'rgba(255, 255, 255, 0.02)',      // Very subtle lift
  surface1: 'rgba(255, 255, 255, 0.05)',      // Subtle
  surface2: 'rgba(255, 255, 255, 0.08)',      // Standard
  focus: 'rgba(201, 162, 39, 0.2)',           // Gold highlight

  // Border definitions
  borderThin: '1px',
  borderStandard: '1px',
  borderStrong: '2px',
};