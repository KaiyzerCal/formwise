/**
 * OnboardingFlow — 3-screen intro for first-time users
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONT, FONT_LINK } from '../ui/DesignTokens';
import { Check } from 'lucide-react';

const SCREENS = ['problem', 'magic', 'commitment'];

function SkeletonDiagram() {
  // Simple SVG skeleton doing a squat
  return (
    <svg viewBox="0 0 200 260" width="160" height="208" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="100" cy="30" r="14" stroke={COLORS.gold} strokeWidth="2" />
      {/* Spine */}
      <line x1="100" y1="44" x2="100" y2="120" stroke={COLORS.gold} strokeWidth="2" />
      {/* Arms */}
      <line x1="100" y1="60" x2="65" y2="95" stroke={COLORS.gold} strokeWidth="2" />
      <line x1="65" y1="95" x2="55" y2="130" stroke={COLORS.gold} strokeWidth="2" />
      <line x1="100" y1="60" x2="135" y2="95" stroke={COLORS.gold} strokeWidth="2" />
      <line x1="135" y1="95" x2="145" y2="130" stroke={COLORS.gold} strokeWidth="2" />
      {/* Hips */}
      <line x1="100" y1="120" x2="75" y2="125" stroke={COLORS.gold} strokeWidth="2" />
      <line x1="100" y1="120" x2="125" y2="125" stroke={COLORS.gold} strokeWidth="2" />
      {/* Legs (squat pose) */}
      <line x1="75" y1="125" x2="60" y2="175" stroke={COLORS.gold} strokeWidth="2" />
      <line x1="60" y1="175" x2="70" y2="225" stroke={COLORS.gold} strokeWidth="2" />
      <line x1="125" y1="125" x2="140" y2="175" stroke={COLORS.gold} strokeWidth="2" />
      <line x1="140" y1="175" x2="130" y2="225" stroke={COLORS.gold} strokeWidth="2" />
      {/* Joints */}
      {[[100,30],[100,60],[65,95],[55,130],[135,95],[145,130],[75,125],[125,125],[60,175],[70,225],[140,175],[130,225]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={COLORS.gold} opacity="0.6" />
      ))}
      {/* 33 landmarks text */}
      <text x="100" y="252" textAnchor="middle" fill={COLORS.gold} fontSize="9" fontFamily="DM Mono, monospace" opacity="0.5">33 LANDMARKS</text>
    </svg>
  );
}

export default function OnboardingFlow() {
  const [screen, setScreen] = useState(0);
  const navigate = useNavigate();

  const finish = () => {
    localStorage.setItem('bioneer_onboarded', 'true');
    navigate('/');
  };

  const next = () => {
    if (screen < 2) setScreen(screen + 1);
    else finish();
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between px-6 py-12"
        style={{ background: COLORS.bg, fontFamily: FONT.mono }}>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-px h-6" style={{ background: COLORS.gold }} />
          <span className="text-lg font-bold tracking-[0.3em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>BIONEER</span>
          <div className="w-px h-6" style={{ background: COLORS.gold }} />
        </div>

        {/* Screen content */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm text-center">
          {screen === 0 && (
            <>
              <p className="text-sm leading-relaxed font-bold mb-6" style={{ color: COLORS.textPrimary }}>
                Most people train their entire lives without knowing if their form is actually working.
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
                AXIS sees every rep. Tracks every fault. Tells you exactly what to fix.
              </p>
            </>
          )}

          {screen === 1 && (
            <>
              <div className="mb-6">
                <SkeletonDiagram />
              </div>
              <p className="text-xs font-bold mb-3" style={{ color: COLORS.textPrimary }}>
                33 landmarks. Real-time analysis. Zero guesswork.
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
                AXIS watches your movement and speaks to you during every rep.
              </p>
            </>
          )}

          {screen === 2 && (
            <div className="space-y-5 w-full">
              {[
                "Your first session analyzes your form in real time.",
                "AXIS identifies your top fault and tells you exactly how to fix it.",
                "Takes 4 minutes. Stays with you for every session after.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 text-left">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
                    <Check size={10} style={{ color: COLORS.gold }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: COLORS.textPrimary }}>{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button onClick={next}
          className="w-full max-w-sm py-4 rounded-lg font-bold tracking-[0.15em] uppercase text-sm transition-all active:scale-95"
          style={{ background: COLORS.gold, color: COLORS.bg }}>
          {screen === 0 ? 'Show Me How' : screen === 1 ? 'What Do I Get?' : 'Start Training'}
        </button>

        {/* Dots */}
        <div className="flex gap-2 mt-4">
          {SCREENS.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === screen ? COLORS.gold : COLORS.border }} />
          ))}
        </div>
      </div>
    </>
  );
}