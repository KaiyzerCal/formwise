import React from 'react';
import { X } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function BottomSheet({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        style={{ animation: 'fadeIn 200ms' }}
      />
      
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-lg md:hidden"
        style={{
          background: COLORS.surface,
          borderTop: `1px solid ${COLORS.border}`,
          fontFamily: FONT.mono,
          animation: 'slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: COLORS.gold }}>
            MENU
          </span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X size={18} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}