/**
 * SessionMovementBadge — displays movement profile info in session history
 */
import React from 'react';
import { getMovementProfile } from './movementProfiles';
import { COLORS, FONT } from '../ui/DesignTokens';

export default function SessionMovementBadge({ movementProfileId }) {
  if (!movementProfileId) return null;

  const profile = getMovementProfile(movementProfileId);
  if (!profile) return null;

  const typeLabel = profile.movementType
    ?.replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <span
      className="text-[8px] tracking-[0.08em] uppercase px-2 py-1 rounded-full border"
      title={profile.name}
      style={{
        borderColor: COLORS.gold,
        color: COLORS.gold,
        background: `${COLORS.gold}10`,
        fontFamily: FONT.mono,
      }}
    >
      {typeLabel}
    </span>
  );
}