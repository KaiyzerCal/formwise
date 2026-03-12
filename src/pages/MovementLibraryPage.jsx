import React, { useState, useMemo } from "react";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";
import { MOVEMENT_LIBRARY } from "../components/bioneer/pipeline/MovementLibraryData";
import { getAnatomyData } from "../components/bioneer/library/anatomyData";
import { Search, SlidersHorizontal, X } from "lucide-react";
import MovementCard from "../components/bioneer/ui/MovementCard";
import MovementDetailPanel from "../components/bioneer/library/MovementDetailPanel";

// ── Filter options ─────────────────────────────────────────────────────────────
const CATEGORY_FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'strength',     label: 'Strength' },
  { key: 'calisthenics', label: 'Bodyweight' },
  { key: 'athletic',     label: 'Athletic' },
  { key: 'rotational',   label: 'Rotational' },
  { key: 'locomotion',   label: 'Locomotion' },
  { key: 'rehab',        label: 'Rehab' },
];

const MUSCLE_FILTERS = [
  { key: 'all',         label: 'All Muscles' },
  { key: 'quadriceps',  label: 'Quads' },
  { key: 'glutes',      label: 'Glutes' },
  { key: 'hamstrings',  label: 'Hamstrings' },
  { key: 'lats',        label: 'Lats / Back' },
  { key: 'pectorals',   label: 'Chest' },
  { key: 'deltoids',    label: 'Shoulders' },
  { key: 'core',        label: 'Core' },
  { key: 'hip_flexors', label: 'Hips' },
];

const DIFFICULTY_FILTERS = [
  { key: 'all',         label: 'Any Level' },
  { key: 'beginner',    label: 'Beginner' },
  { key: 'intermediate',label: 'Intermediate' },
  { key: 'advanced',    label: 'Advanced' },
];

function FilterPill({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded text-[9px] tracking-[0.1em] uppercase border whitespace-nowrap"
      style={{
        background:   active ? COLORS.goldDim    : 'transparent',
        borderColor:  active ? COLORS.goldBorder : COLORS.border,
        color:        active ? COLORS.gold       : COLORS.textTertiary,
        fontFamily: FONT.mono,
      }}>
      {label}
    </button>
  );
}

export default function MovementLibraryPage() {
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [difficulty,   setDifficulty]   = useState('all');
  const [showFilters,  setShowFilters]  = useState(false);
  const [selectedId,   setSelectedId]   = useState(null);

  const filtered = useMemo(() => {
    return MOVEMENT_LIBRARY.filter(m => {
      // Category
      if (category !== 'all' && m.category !== category) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const anatomy = getAnatomyData(m);
        const muscles = [
          ...(anatomy?.primary_muscles || []),
          ...(anatomy?.secondary_muscles || []),
          ...(anatomy?.stabilizers || []),
        ].join(' ');
        if (
          !m.displayName.toLowerCase().includes(q) &&
          !m.movementFamily?.toLowerCase().includes(q) &&
          !m.category.includes(q) &&
          !muscles.includes(q)
        ) return false;
      }

      // Muscle group
      if (muscleFilter !== 'all') {
        const anatomy = getAnatomyData(m);
        const allMuscles = [
          ...(anatomy?.primary_muscles || []),
          ...(anatomy?.secondary_muscles || []),
          ...(anatomy?.stabilizers || []),
        ];
        if (!allMuscles.includes(muscleFilter)) return false;
      }

      // Difficulty
      if (difficulty !== 'all') {
        const anatomy = getAnatomyData(m);
        if (anatomy?.difficulty !== difficulty) return false;
      }

      return true;
    });
  }, [search, category, muscleFilter, difficulty]);

  const selectedMovement = MOVEMENT_LIBRARY.find(m => m.id === selectedId);

  const hasActiveFilters = category !== 'all' || muscleFilter !== 'all' || difficulty !== 'all';

  const resetFilters = () => { setCategory('all'); setMuscleFilter('all'); setDifficulty('all'); setSearch(''); };

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b space-y-3 flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textTertiary }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search movements, muscles, patterns…"
              className="w-full pl-9 pr-8 py-2 rounded-md text-xs border outline-none"
              style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary, fontFamily: FONT.mono }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={12} style={{ color: COLORS.textTertiary }} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-[9px] tracking-[0.1em] uppercase"
            style={{
              background:  showFilters ? COLORS.goldDim    : 'transparent',
              borderColor: showFilters ? COLORS.goldBorder : COLORS.border,
              color:       showFilters ? COLORS.gold       : COLORS.textTertiary,
            }}>
            <SlidersHorizontal size={12} />
            <span>Filter</span>
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.gold }} />}
          </button>
          <span className="text-[9px] px-2 py-1 rounded-full border flex-shrink-0" style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}>
            {filtered.length}
          </span>
        </div>

        {/* Category row (always visible) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_FILTERS.map(c => (
            <FilterPill key={c.key} label={c.label} active={category === c.key} onClick={() => setCategory(c.key)} />
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="space-y-2 pt-1">
            <div>
              <span className="text-[8px] tracking-[0.15em] uppercase block mb-1.5" style={{ color: COLORS.textTertiary }}>Muscle Group</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {MUSCLE_FILTERS.map(m => (
                  <FilterPill key={m.key} label={m.label} active={muscleFilter === m.key} onClick={() => setMuscleFilter(m.key)} />
                ))}
              </div>
            </div>
            <div>
              <span className="text-[8px] tracking-[0.15em] uppercase block mb-1.5" style={{ color: COLORS.textTertiary }}>Difficulty</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {DIFFICULTY_FILTERS.map(d => (
                  <FilterPill key={d.key} label={d.label} active={difficulty === d.key} onClick={() => setDifficulty(d.key)} />
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="text-[9px] tracking-[0.1em] uppercase px-3 py-1 rounded border"
                style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-[11px]" style={{ color: COLORS.textTertiary }}>No movements match your filters.</p>
            <button onClick={resetFilters} className="text-[9px] tracking-widest uppercase" style={{ color: COLORS.gold }}>Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(m => (
              <MovementCard key={m.id} movement={m} onClick={() => setSelectedId(m.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail panel ───────────────────────────────────────────────────── */}
      {selectedMovement && (
        <MovementDetailPanel movement={selectedMovement} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}