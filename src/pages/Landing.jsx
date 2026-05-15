import React from "react";
import { base44 } from "@/api/base44Client";
import { COLORS, FONT, FONT_LINK } from "@/components/bioneer/ui/DesignTokens";

export default function Landing() {
  const handleLogin = () => {
    base44.auth.redirectToLogin('/');
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="fixed inset-0 flex flex-col items-center justify-center px-6"
        style={{ background: COLORS.bg, fontFamily: FONT.mono }}>

        {/* Logo */}
        <div className="mb-2 flex items-center gap-2">
          <div className="w-px h-8" style={{ background: COLORS.gold }} />
          <span className="text-2xl font-bold tracking-[0.4em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.heading }}>BIONEER</span>
          <div className="w-px h-8" style={{ background: COLORS.gold }} />
        </div>
        <p className="text-[9px] tracking-[0.35em] uppercase mb-10"
          style={{ color: 'rgba(201,168,76,0.45)' }}>FORMWISE</p>

        {/* Auth card */}
        <div className="w-full max-w-sm text-center"
          style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 32, background: COLORS.surface }}>

          <p className="text-xs mb-6" style={{ color: COLORS.textSecondary, lineHeight: 1.6 }}>
            AI-powered biomechanical coaching.<br />
            Sign in to start your training.
          </p>

          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: COLORS.goldDim,
              border: `1px solid ${COLORS.gold}`,
              borderRadius: 4,
              color: COLORS.gold,
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
            SIGN IN / SIGN UP
          </button>
        </div>

        {/* Bottom ornament */}
        <div className="absolute bottom-8 flex items-center gap-4">
          <div className="h-px w-12" style={{ background: COLORS.border }} />
          <span className="text-[8px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary }}>
            BIOMECHANICAL INTELLIGENCE
          </span>
          <div className="h-px w-12" style={{ background: COLORS.border }} />
        </div>
      </div>
    </>
  );
}