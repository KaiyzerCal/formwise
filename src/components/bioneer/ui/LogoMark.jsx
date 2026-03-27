/**
 * Bioneer Logo System
 * Precise SVG-based logo for consistent scaling, animation, and variation
 */

import React from 'react';
import { COLORS } from './DesignTokens';

/**
 * Primary Logo Mark (geometric "B" symbol)
 * Can be used standalone as app icon or with wordmark
 */
export function LogoMark({ size = 64, color = COLORS.gold, opacity = 1, animated = false }) {
  const viewBox = '0 0 64 64';
  const strokeWidth = size > 128 ? 8 : size > 64 ? 6 : 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        opacity,
        filter: animated ? 'drop-shadow(0 0 12px rgba(201,162,39,0.3))' : 'none',
      }}
    >
      {/* Left vertical bar */}
      <rect x="12" y="8" width="8" height="48" fill={color} rx="2" />

      {/* Top right curve */}
      <path
        d="M 28 8 L 44 8 Q 52 8 52 16 L 52 24 Q 52 32 44 32 L 28 32"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom right curve */}
      <path
        d="M 28 32 L 44 32 Q 52 32 52 40 L 52 48 Q 52 56 44 56 L 28 56"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated glow on hover (optional) */}
      {animated && (
        <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="1" fill="none" opacity="0.2" />
      )}
    </svg>
  );
}

/**
 * Logo with Wordmark (Logo + "BIONEER" text)
 * Primary branding element for headers, splash screens
 */
export function LogoWithWordmark({ size = 'medium', color = COLORS.gold, animated = false }) {
  const sizeMap = {
    small: { logo: 32, fontSize: '16px', gap: 8 },
    medium: { logo: 48, fontSize: '20px', gap: 12 },
    large: { logo: 64, fontSize: '28px', gap: 16 },
    hero: { logo: 96, fontSize: '36px', gap: 20 },
  };

  const config = sizeMap[size] || sizeMap.medium;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${config.gap}px`,
      }}
    >
      <LogoMark size={config.logo} color={color} animated={animated} />
      <div
        style={{
          fontSize: config.fontSize,
          fontWeight: '700',
          letterSpacing: '0.15em',
          color,
          fontFamily: "'IBM Plex Mono', 'DM Mono', monospace",
          textTransform: 'uppercase',
        }}
      >
        BIONEER
      </div>
    </div>
  );
}

/**
 * Logo Watermark (subtle, low-opacity version for backgrounds)
 * Used in camera overlays, workout screens, etc.
 */
export function LogoWatermark({ opacity = 0.08, size = 240 }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <LogoMark size={size} color={COLORS.gold} opacity={opacity} />
    </div>
  );
}

/**
 * Animated Logo (loading/splash screen variant)
 * Pulses with energy during loading states
 */
export function AnimatedLogo({ size = 128, color = COLORS.gold }) {
  return (
    <div
      style={{
        animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }
      `}</style>
      <LogoMark size={size} color={color} animated={true} />
    </div>
  );
}

/**
 * Logo with Loading Ring (for splash/loading screens)
 * Minimal, premium loading indicator
 */
export function LogoWithLoadingRing({ size = 128, color = COLORS.gold }) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes rotate-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Rotating ring */}
      <svg
        style={{
          position: 'absolute',
          width: size,
          height: size,
          animation: 'rotate-ring 3s linear infinite',
        }}
        viewBox="0 0 128 128"
      >
        <circle
          cx="64"
          cy="64"
          r="56"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.3"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="35 141"
          opacity="0.8"
        />
      </svg>

      {/* Center logo */}
      <LogoMark size={size * 0.5} color={color} />
    </div>
  );
}