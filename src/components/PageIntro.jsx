import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function PageIntro({ title, subtitle, actions = null }) {
  return (
    <div className="px-6 py-6 border-b" style={{ borderColor: COLORS.border }}>
      <h1 className="text-xl font-bold tracking-[0.05em] mb-2" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
          {subtitle}
        </p>
      )}
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}