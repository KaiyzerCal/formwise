/**
 * MovementSelector — dropdown component for selecting movement profiles
 */
import React from 'react';
import { listMovementProfiles } from './movementProfiles';
import { COLORS, FONT } from '../ui/DesignTokens';
import { ChevronDown } from 'lucide-react';

export default function MovementSelector({ value, onChange, disabled = false }) {
  const movements = listMovementProfiles();

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-lg border appearance-none cursor-pointer transition-colors"
        style={{
          background: disabled ? `${COLORS.border}20` : COLORS.surface,
          borderColor: COLORS.border,
          color: COLORS.textPrimary,
          fontFamily: FONT.mono,
          fontSize: '13px',
          fontWeight: '600',
        }}
      >
        <option value="">Select a movement...</option>
        {movements.map(m => (
          <option key={m.id} value={m.id}>
            {m.name} • {m.movementType}
          </option>
        ))}
      </select>

      {/* Custom chevron icon */}
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
        style={{ color: COLORS.textSecondary }}
      />
    </div>
  );
}