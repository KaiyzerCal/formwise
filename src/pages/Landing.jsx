import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { COLORS, FONT, FONT_LINK } from "@/components/bioneer/ui/DesignTokens";

export default function Landing() {
  const { navigateToLogin } = useAuth();

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: COLORS.bg, fontFamily: FONT.mono }}
      >
        {/* Logo mark */}
        <div className="mb-2 flex items-center gap-2">
          <div className="w-px h-8" style={{ background: COLORS.gold }} />
          <span
            className="text-2xl font-bold tracking-[0.4em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.heading }}
          >
            BIONEER
          </span>
          <div className="w-px h-8" style={{ background: COLORS.gold }} />
        </div>

        {/* Sub-brand */}
        <p
          className="text-[9px] tracking-[0.35em] uppercase mb-16"
          style={{ color: 'rgba(201,168,76,0.45)' }}
        >
          FORMWISE
        </p>

        {/* Tagline */}
        <h1
          className="text-center text-2xl md:text-3xl font-bold tracking-[0.12em] uppercase mb-3"
          style={{ color: COLORS.textPrimary, fontFamily: FONT.heading, lineHeight: 1.25 }}
        >
          YOUR FORM.<br />ANALYZED. PERFECTED.
        </h1>

        <p
          className="text-[10px] tracking-[0.15em] uppercase mb-14 text-center max-w-xs"
          style={{ color: COLORS.textTertiary }}
        >
          AI-powered biomechanical coaching.<br />Every rep. Every set.
        </p>

        {/* CTA */}
        <button
          onClick={navigateToLogin}
          className="px-10 py-4 text-xs font-bold tracking-[0.3em] uppercase border transition-all"
          style={{
            background: COLORS.goldDim,
            borderColor: COLORS.gold,
            color: COLORS.gold,
            fontFamily: FONT.mono,
          }}
        >
          START TRAINING
        </button>

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