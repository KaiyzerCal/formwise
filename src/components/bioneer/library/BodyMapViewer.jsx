/**
 * BodyMapViewer.jsx
 * SVG body diagram with highlighted muscle and danger zones.
 * Two-view: front (left) + back (right).
 * Accepts: highlightMuscles (string[]), dangerZones (string[]), mode ('muscles'|'joints'|'danger')
 */
import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';

const GOLD    = '#C9A84C';
const BLUE    = '#3B82F6';
const GRAY    = '#4B5563';
const RED     = '#EF4444';
const AMBER   = '#F59E0B';
const BODY_DIM = 'rgba(255,255,255,0.07)';
const OUTLINE  = 'rgba(255,255,255,0.12)';

// ── Muscle region definitions ─────────────────────────────────────────────────
// Each region: { id, view:'front'|'back', shape:'ellipse'|'rect', props }
const REGIONS = [
  // ── FRONT ─────────────────────────────────────────────────────────────────
  { id:'pectorals',    view:'front', shape:'ellipse', cx:55,  cy:92,  rx:26, ry:18 },
  { id:'deltoids',     view:'front', shape:'ellipse', cx:28,  cy:74,  rx:13, ry:10 },
  { id:'deltoids',     view:'front', shape:'ellipse', cx:82,  cy:74,  rx:13, ry:10 },
  { id:'biceps',       view:'front', shape:'ellipse', cx:14,  cy:108, rx:8,  ry:22 },
  { id:'biceps',       view:'front', shape:'ellipse', cx:96,  cy:108, rx:8,  ry:22 },
  { id:'core',         view:'front', shape:'rect',    x:36,   y:109,  w:38,  h:42  },
  { id:'hip_flexors',  view:'front', shape:'rect',    x:34,   y:149,  w:42,  h:20  },
  { id:'adductors',    view:'front', shape:'ellipse', cx:47,  cy:194, rx:10, ry:28 },
  { id:'adductors',    view:'front', shape:'ellipse', cx:63,  cy:194, rx:10, ry:28 },
  { id:'quadriceps',   view:'front', shape:'ellipse', cx:38,  cy:198, rx:18, ry:35 },
  { id:'quadriceps',   view:'front', shape:'ellipse', cx:72,  cy:198, rx:18, ry:35 },
  { id:'calves_front', view:'front', shape:'ellipse', cx:35,  cy:272, rx:11, ry:24 },
  { id:'calves_front', view:'front', shape:'ellipse', cx:75,  cy:272, rx:11, ry:24 },
  { id:'tibialis',     view:'front', shape:'ellipse', cx:32,  cy:272, rx:6,  ry:18 },
  { id:'tibialis',     view:'front', shape:'ellipse', cx:78,  cy:272, rx:6,  ry:18 },

  // ── BACK ──────────────────────────────────────────────────────────────────
  { id:'trapezius',     view:'back', shape:'ellipse', cx:55,  cy:78,  rx:28, ry:14 },
  { id:'rhomboids',     view:'back', shape:'rect',    x:37,   y:88,   w:36,  h:18  },
  { id:'rear_deltoids', view:'back', shape:'ellipse', cx:24,  cy:72,  rx:12, ry:9  },
  { id:'rear_deltoids', view:'back', shape:'ellipse', cx:86,  cy:72,  rx:12, ry:9  },
  { id:'lats',          view:'back', shape:'ellipse', cx:18,  cy:113, rx:10, ry:30 },
  { id:'lats',          view:'back', shape:'ellipse', cx:92,  cy:113, rx:10, ry:30 },
  { id:'erector_spinae',view:'back', shape:'rect',    x:46,   y:100,  w:18,  h:55  },
  { id:'triceps',       view:'back', shape:'ellipse', cx:12,  cy:108, rx:8,  ry:22 },
  { id:'triceps',       view:'back', shape:'ellipse', cx:98,  cy:108, rx:8,  ry:22 },
  { id:'glutes',        view:'back', shape:'ellipse', cx:55,  cy:165, rx:32, ry:22 },
  { id:'hamstrings',    view:'back', shape:'ellipse', cx:35,  cy:218, rx:18, ry:33 },
  { id:'hamstrings',    view:'back', shape:'ellipse', cx:75,  cy:218, rx:18, ry:33 },
  { id:'calves',        view:'back', shape:'ellipse', cx:33,  cy:280, rx:13, ry:27 },
  { id:'calves',        view:'back', shape:'ellipse', cx:77,  cy:280, rx:13, ry:27 },
];

// Joints → danger zone regions (simplified overlay)
const DANGER_OVERLAYS = {
  knee:          [{ view:'front', cx:38, cy:235, rx:14, ry:10 }, { view:'front', cx:72, cy:235, rx:14, ry:10 }, { view:'back', cx:35, cy:255, rx:14, ry:10 }, { view:'back', cx:75, cy:255, rx:14, ry:10 }],
  ankle:         [{ view:'front', cx:36, cy:308, rx:12, ry:8 }, { view:'front', cx:74, cy:308, rx:12, ry:8 }, { view:'back', cx:33, cy:308, rx:12, ry:8 }, { view:'back', cx:77, cy:308, rx:12, ry:8 }],
  lumbar_spine:  [{ view:'back', x:44, y:148, w:22, h:22 }],
  hip:           [{ view:'front', cx:38, cy:160, rx:16, ry:12 }, { view:'front', cx:72, cy:160, rx:16, ry:12 }, { view:'back', cx:55, cy:150, rx:28, ry:14 }],
  shoulder:      [{ view:'front', cx:28, cy:74, rx:15, ry:11 }, { view:'front', cx:82, cy:74, rx:15, ry:11 }, { view:'back', cx:24, cy:72, rx:14, ry:10 }, { view:'back', cx:86, cy:72, rx:14, ry:10 }],
  elbow:         [{ view:'front', cx:14, cy:133, rx:9, ry:7 }, { view:'front', cx:96, cy:133, rx:9, ry:7 }],
  thoracic_spine:[{ view:'back', x:44, y:95, w:22, h:40 }],
  wrist:         [{ view:'front', cx:12, cy:148, rx:7, ry:5 }, { view:'front', cx:98, cy:148, rx:7, ry:5 }],
};

// ── Body silhouette paths (simple geometric) ──────────────────────────────────
function Silhouette({ x = 0 }) {
  return (
    <g transform={`translate(${x}, 0)`}>
      {/* Head */}
      <ellipse cx="55" cy="28" rx="19" ry="22" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* Neck */}
      <rect x="49" y="48" width="12" height="12" rx="3" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* Torso */}
      <rect x="24" y="59" width="62" height="100" rx="8" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* L Upper Arm */}
      <rect x="6" y="64" width="20" height="50" rx="8" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* R Upper Arm */}
      <rect x="84" y="64" width="20" height="50" rx="8" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* L Forearm */}
      <rect x="8" y="118" width="16" height="40" rx="7" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* R Forearm */}
      <rect x="86" y="118" width="16" height="40" rx="7" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* L Thigh */}
      <rect x="26" y="158" width="32" height="82" rx="10" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* R Thigh */}
      <rect x="52" y="158" width="32" height="82" rx="10" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* L Shin */}
      <rect x="28" y="244" width="28" height="70" rx="8" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* R Shin */}
      <rect x="54" y="244" width="28" height="70" rx="8" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* L Foot */}
      <ellipse cx="38" cy="318" rx="16" ry="7" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
      {/* R Foot */}
      <ellipse cx="72" cy="318" rx="16" ry="7" fill={BODY_DIM} stroke={OUTLINE} strokeWidth="1" />
    </g>
  );
}

function MusclePatch({ region, color, x = 0 }) {
  const alpha = 0.65;
  const fill = color ? color : 'transparent';
  const stroke = color ? color : 'transparent';

  if (region.shape === 'ellipse') {
    return (
      <ellipse
        cx={region.cx + x} cy={region.cy}
        rx={region.rx} ry={region.ry}
        fill={fill} fillOpacity={alpha}
        stroke={stroke} strokeOpacity={0.9} strokeWidth="1"
      />
    );
  }
  return (
    <rect
      x={region.x + x} y={region.y}
      width={region.w} height={region.h}
      rx="4"
      fill={fill} fillOpacity={alpha}
      stroke={stroke} strokeOpacity={0.9} strokeWidth="1"
    />
  );
}

function DangerPatch({ overlay, x = 0 }) {
  if (overlay.shape === 'rect' || (overlay.x !== undefined)) {
    return (
      <rect x={overlay.x + x} y={overlay.y} width={overlay.w} height={overlay.h} rx="4"
        fill={RED} fillOpacity={0.55} stroke={RED} strokeWidth="1.5" strokeOpacity={0.9} />
    );
  }
  return (
    <ellipse cx={overlay.cx + x} cy={overlay.cy} rx={overlay.rx} ry={overlay.ry}
      fill={RED} fillOpacity={0.55} stroke={RED} strokeWidth="1.5" strokeOpacity={0.9} />
  );
}

export default function BodyMapViewer({ primaryMuscles = [], secondaryMuscles = [], stabilizers = [], dangerZones = [], activeView = 'muscles' }) {

  const getRegionColor = (id) => {
    if (primaryMuscles.includes(id))   return GOLD;
    if (secondaryMuscles.includes(id)) return BLUE;
    if (stabilizers.includes(id))      return GRAY;
    return null;
  };

  const frontRegions = REGIONS.filter(r => r.view === 'front');
  const backRegions  = REGIONS.filter(r => r.view === 'back');

  const frontDangers = dangerZones.flatMap(z => (DANGER_OVERLAYS[z] || []).filter(o => o.view === 'front'));
  const backDangers  = dangerZones.flatMap(z => (DANGER_OVERLAYS[z] || []).filter(o => o.view === 'back'));

  const W = 110; // each body view width
  const GAP = 20;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="100%" viewBox={`0 0 ${W * 2 + GAP} 335`} style={{ maxWidth: 280 }}>
        {/* FRONT */}
        <Silhouette x={0} />
        {frontRegions.map((r, i) => {
          const col = getRegionColor(r.id);
          if (!col && activeView === 'muscles') return null;
          return <MusclePatch key={i} region={r} color={col} x={0} />;
        })}
        {activeView === 'danger' && frontDangers.map((o, i) => <DangerPatch key={i} overlay={o} x={0} />)}

        {/* Divider */}
        <line x1={W + GAP / 2} y1="0" x2={W + GAP / 2} y2="335"
          stroke={OUTLINE} strokeWidth="1" strokeDasharray="4 4" />

        {/* BACK */}
        <Silhouette x={W + GAP} />
        {backRegions.map((r, i) => {
          const col = getRegionColor(r.id);
          if (!col && activeView === 'muscles') return null;
          return <MusclePatch key={i} region={r} color={col} x={W + GAP} />;
        })}
        {activeView === 'danger' && backDangers.map((o, i) => <DangerPatch key={i} overlay={o} x={W + GAP} />)}

        {/* Labels */}
        <text x="55" y="332" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="DM Mono, monospace">FRONT</text>
        <text x={W + GAP + 55} y="332" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="DM Mono, monospace">BACK</text>
      </svg>

      {/* Legend */}
      {activeView === 'muscles' && (
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {[
            { color: GOLD, label: 'Primary' },
            { color: BLUE, label: 'Secondary' },
            { color: GRAY, label: 'Stabilizer' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
      {activeView === 'danger' && dangerZones.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />
          <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Danger zones</span>
        </div>
      )}
    </div>
  );
}