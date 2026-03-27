/**
 * FormCheckHistoryView — page view for browsing form check history
 */
import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import FormCheckHistoryPanel from './FormCheckHistoryPanel';

export default function FormCheckHistoryView({ onSelectSession, onBack }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold tracking-[0.12em] uppercase"
          style={{ color: COLORS.gold }}
        >
          Form Check History
        </motion.h1>
        <button
          onClick={onBack}
          className="text-[8px] font-semibold tracking-[0.08em] uppercase px-4 py-2 rounded border transition-colors hover:bg-white/5"
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
        >
          Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FormCheckHistoryPanel onSelectSession={onSelectSession} />
        </motion.div>
      </div>
    </div>
  );
}