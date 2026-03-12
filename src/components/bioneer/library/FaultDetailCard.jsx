import React, { useState } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { ChevronDown, ChevronUp, AlertTriangle, Shield } from 'lucide-react';

export default function FaultDetailCard({ fault, onActivateDanger }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border overflow-hidden transition-colors"
      style={{ background: COLORS.bg, borderColor: open ? 'rgba(239,68,68,0.35)' : COLORS.border }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => { setOpen(o => !o); if (!open && onActivateDanger) onActivateDanger(fault.danger_zones || []); }}>
        <AlertTriangle size={13} className="flex-shrink-0" style={{ color: '#EF4444' }} />
        <span className="flex-1 text-[11px] font-medium" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          {fault.name}
        </span>
        {open ? <ChevronUp size={13} style={{ color: COLORS.textTertiary }} /> : <ChevronDown size={13} style={{ color: COLORS.textTertiary }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: COLORS.border }}>
          <p className="text-[10px] leading-relaxed pt-2" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            {fault.description}
          </p>

          {fault.visual && (
            <div className="text-[10px] italic" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Visual: {fault.visual}
            </div>
          )}

          {fault.risk_structures?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield size={10} style={{ color: '#EF4444' }} />
                <span className="text-[9px] tracking-[0.12em] uppercase" style={{ color: '#EF4444', fontFamily: FONT.mono }}>
                  Structures at risk
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {fault.risk_structures.map(s => (
                  <span key={s} className="text-[9px] px-2 py-0.5 rounded-full border"
                    style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444', background: 'rgba(239,68,68,0.08)', fontFamily: FONT.mono }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {fault.cues?.length > 0 && (
            <div>
              <span className="text-[9px] tracking-[0.12em] uppercase block mb-1.5" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
                Correction cues
              </span>
              <div className="space-y-1">
                {fault.cues.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: COLORS.gold }} />
                    <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}