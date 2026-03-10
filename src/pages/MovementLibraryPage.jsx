import React, { useState, useMemo } from "react";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";
import { MOVEMENT_LIBRARY } from "../components/bioneer/pipeline/MovementLibraryData";
import { FEATURED_MOVEMENTS } from "../components/bioneer/ui/mockData";
import { Search } from "lucide-react";
import MovementCard from "../components/bioneer/ui/MovementCard";
import MovementDetailModal from "../components/bioneer/ui/MovementDetailModal";

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength Training' },
  { key: 'sports', label: 'Sports Performance' },
];

const SPORTS_CATS = ['athletic', 'rotational', 'locomotion'];

export default function MovementLibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const movements = useMemo(() => {
    let list = MOVEMENT_LIBRARY;
    if (category === 'strength') list = list.filter(m => m.category === 'strength' || m.category === 'calisthenics' || m.category === 'rehab');
    else if (category === 'sports') list = list.filter(m => SPORTS_CATS.includes(m.category));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.displayName.toLowerCase().includes(q) || m.id.includes(q) || m.category.includes(q));
    }
    return list;
  }, [search, category]);

  const selectedMovement = MOVEMENT_LIBRARY.find(m => m.id === selectedId);

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono }}>
      {/* Top bar */}
      <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textTertiary }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 100 movements..."
              className="w-full pl-9 pr-3 py-2 rounded-md text-xs border outline-none transition-colors"
              style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary, fontFamily: FONT.mono }}
            />
          </div>
          <div className="flex gap-1">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className="px-3 py-1.5 rounded text-[9px] tracking-[0.1em] uppercase border"
                style={{
                  background: category === c.key ? COLORS.goldDim : 'transparent',
                  borderColor: category === c.key ? COLORS.goldBorder : COLORS.border,
                  color: category === c.key ? COLORS.gold : COLORS.textTertiary,
                }}>
                {c.label}
              </button>
            ))}
          </div>
          <span className="text-[9px] px-2 py-1 rounded-full border" style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}>
            {movements.length} movements
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {movements.map(m => (
            <MovementCard key={m.id} movement={m} onClick={() => setSelectedId(m.id)} />
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selectedMovement && (
        <MovementDetailModal movement={selectedMovement} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}