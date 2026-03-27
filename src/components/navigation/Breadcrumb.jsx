import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b text-xs tracking-[0.1em]" style={{ borderColor: COLORS.border, fontFamily: FONT.mono }}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight size={14} style={{ color: COLORS.textTertiary }} />}
          {item.href ? (
            <Link
              to={item.href}
              className="transition-colors hover:text-gold"
              style={{ color: item.active ? COLORS.gold : COLORS.textSecondary }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: item.active ? COLORS.gold : COLORS.textSecondary }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}