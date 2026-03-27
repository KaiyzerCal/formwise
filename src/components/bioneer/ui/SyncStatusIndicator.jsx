import React, { useState, useEffect } from "react";
import { subscribeSyncStatus } from "../data/unifiedSessionStore";
import { COLORS, FONT } from "./DesignTokens";

function formatRelative(date) {
  if (!date) return null;
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG = {
  idle:    { dot: COLORS.textTertiary,    label: 'LOCAL' },
  syncing: { dot: '#C9A84C',              label: 'SYNCING' },
  synced:  { dot: '#22C55E',              label: 'SYNCED' },
  offline: { dot: '#EF4444',              label: 'OFFLINE' },
};

export default function SyncStatusIndicator() {
  const [syncState, setSyncState] = useState({ status: 'idle', lastSyncAt: null });

  useEffect(() => subscribeSyncStatus(setSyncState), []);

  const cfg = STATUS_CONFIG[syncState.status] ?? STATUS_CONFIG.idle;
  const timeLabel = formatRelative(syncState.lastSyncAt);

  return (
    <div className="flex flex-col gap-0.5 px-5 py-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: cfg.dot,
            boxShadow: syncState.status === 'syncing' ? `0 0 6px ${cfg.dot}` : 'none',
          }}
        />
        <span
          className="text-[9px] tracking-[0.15em] uppercase"
          style={{ color: cfg.dot, fontFamily: FONT.mono }}
        >
          {cfg.label}
        </span>
      </div>
      {timeLabel && (
        <span
          className="text-[8px] pl-3.5"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}
        >
          {timeLabel}
        </span>
      )}
    </div>
  );
}