import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

/**
 * Secondary nav drawer — slide-up on mobile, dropdown on desktop.
 */
export default function NavDrawer({ items, currentPageName, open, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, positioned dropdown on desktop */}
      <div
        className="fixed z-[61] md:absolute md:bottom-auto md:right-4 md:left-auto md:top-auto
                   bottom-0 left-0 right-0 md:w-56
                   rounded-t-xl md:rounded-lg border p-3 space-y-1"
        style={{
          background: COLORS.surface,
          borderColor: COLORS.border,
          fontFamily: FONT.mono,
        }}
      >
        {/* Mobile close handle */}
        <div className="flex items-center justify-between md:hidden pb-2 border-b mb-1" style={{ borderColor: COLORS.border }}>
          <span className="text-[9px] tracking-[0.12em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
            More
          </span>
          <button onClick={onClose} className="p-1">
            <X size={14} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>

        {items.map(item => {
          const active = currentPageName === item.name;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2.5 text-[9px] tracking-[0.1em] uppercase rounded-md transition-all"
              style={{
                color: active ? COLORS.gold : COLORS.textSecondary,
                background: active ? COLORS.goldDim : 'transparent',
              }}
            >
              <Icon size={13} strokeWidth={1.5} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}