/**
 * ReferenceLibrarySelector — browse and select from uploaded reference videos.
 * Falls back to legacy skeleton references when no videos are available.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Film, Loader2, AlertCircle } from 'lucide-react';

export default function ReferenceLibrarySelector({ selectedId, onSelect }) {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ReferenceVideo.filter({ status: 'ready' }, '-created_date', 50)
      .then(refs => {
        setReferences(refs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 size={12} className="animate-spin" style={{ color: COLORS.textTertiary }} />
        <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          Loading references...
        </span>
      </div>
    );
  }

  if (references.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded border"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <AlertCircle size={12} style={{ color: COLORS.textTertiary }} />
        <span className="text-[9px] tracking-[0.1em]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          No reference videos uploaded yet. Use the admin panel to add references.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={selectedId || ''}
        onChange={e => {
          const ref = references.find(r => r.id === e.target.value);
          onSelect(ref);
        }}
        className="w-full px-3 py-2.5 rounded-xl border text-[10px] appearance-none outline-none"
        style={{ background: COLORS.surface, borderColor: COLORS.borderLight, color: COLORS.textPrimary, fontFamily: FONT.mono }}>
        <option value="">Select a reference...</option>
        {references.map(ref => (
          <option key={ref.id} value={ref.id}>
            {ref.exercise_name} ({ref.view})
          </option>
        ))}
      </select>

      {/* Preview cards */}
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {references.map(ref => (
          <button
            key={ref.id}
            onClick={() => onSelect(ref)}
            className="rounded-lg border overflow-hidden text-left transition-all"
            style={{
              borderColor: selectedId === ref.id ? COLORS.goldBorder : COLORS.border,
              background: selectedId === ref.id ? COLORS.goldDim : COLORS.surface,
            }}>
            <div className="aspect-video bg-black flex items-center justify-center">
              {ref.thumbnail_url ? (
                <img src={ref.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Film size={16} style={{ color: COLORS.textMuted }} />
              )}
            </div>
            <div className="p-1.5">
              <span className="text-[8px] font-bold tracking-[0.08em] uppercase block truncate"
                style={{ color: selectedId === ref.id ? COLORS.gold : COLORS.textSecondary, fontFamily: FONT.mono }}>
                {ref.exercise_name}
              </span>
              <span className="text-[7px] tracking-[0.1em] uppercase"
                style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                {ref.view} view
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}