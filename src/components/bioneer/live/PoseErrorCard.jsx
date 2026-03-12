/**
 * PoseErrorCard.jsx
 * Shown when pose runtime fails. Provides retry without page reload.
 */
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const GOLD = '#C9A84C';
const RED  = '#EF4444';

export default function PoseErrorCard({ errorMsg, onRetry }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-80 rounded-2xl border p-6 space-y-4 text-center"
        style={{ background: 'rgba(0,0,0,0.9)', borderColor: `${RED}40` }}>

        <div className="flex justify-center">
          <AlertCircle size={32} style={{ color: RED }} />
        </div>

        <div>
          <p className="text-sm font-bold tracking-wide mb-1" style={{ color: RED, fontFamily: "'DM Mono', monospace" }}>
            Pose Engine Failed
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace" }}>
            {errorMsg || 'Pose runtime could not initialize.'}
          </p>
        </div>

        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono', monospace" }}>
          Camera remains active — you can still record without analysis.
        </p>

        <button onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold tracking-wider"
          style={{
            background: `${GOLD}15`, borderColor: `${GOLD}50`,
            color: GOLD, fontFamily: "'DM Mono', monospace",
          }}>
          <RefreshCw size={14} />
          Retry Pose Engine
        </button>
      </div>
    </div>
  );
}