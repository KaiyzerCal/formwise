import React, { useMemo } from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { Trophy } from 'lucide-react';

const PR_KEY = 'bioneer_prs';

export function loadPRs() {
  try { return JSON.parse(localStorage.getItem(PR_KEY) || '{}'); } catch { return {}; }
}

export function checkAndSavePR(exerciseId, score) {
  const prs = loadPRs();
  const prev = prs[exerciseId] ?? 0;
  if (score > prev) {
    prs[exerciseId] = score;
    try { localStorage.setItem(PR_KEY, JSON.stringify(prs)); } catch { /* ignore */ }
    return true; // is new PR
  }
  return false;
}

export default function PersonalRecordsPanel() {
  const prs = useMemo(() => {
    const raw = loadPRs();
    return Object.entries(raw)
      .map(([id, score]) => ({ id, label: id.replace(/_/g, ' ').toUpperCase(), score }))
      .sort((a, b) => b.score - a.score);
  }, []);

  if (!prs.length) return null;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={12} style={{ color: COLORS.gold }} />
        <h3 className="text-[9px] tracking-[0.15em] uppercase font-bold"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          Personal Records
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {prs.map(pr => (
          <div key={pr.id} className="px-3 py-2.5 rounded border"
            style={{ background: '#0a0a0a', borderColor: COLORS.goldBorder }}>
            <p className="text-[8px] tracking-[0.1em] uppercase truncate"
              style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{pr.label}</p>
            <p className="text-xl font-bold mt-1"
              style={{ color: scoreColor(pr.score), fontFamily: FONT.mono }}>{pr.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}