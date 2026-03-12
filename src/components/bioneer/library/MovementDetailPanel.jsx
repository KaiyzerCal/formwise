/**
 * MovementDetailPanel.jsx
 * Full anatomical detail panel for a selected movement.
 * Tabs: Overview | Muscles | Faults | Progressions
 */
import React, { useState } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { X, ChevronRight, TrendingUp, TrendingDown, Info, Activity, AlertTriangle, Layers } from 'lucide-react';
import { getAnatomyData, DIFFICULTY_LABEL, RISK_LABEL, DANGER_ZONE_LABELS } from './anatomyData';
import BodyMapViewer from './BodyMapViewer';
import FaultDetailCard from './FaultDetailCard';
import PhasePill from '../ui/PhasePill';

const TABS = [
  { id: 'overview',      label: 'Overview',   Icon: Info        },
  { id: 'muscles',       label: 'Muscles',    Icon: Activity    },
  { id: 'faults',        label: 'Faults',     Icon: AlertTriangle },
  { id: 'progressions',  label: 'Progress',   Icon: Layers      },
];

function MuscleTag({ name, color }) {
  return (
    <span className="text-[9px] px-2.5 py-1 rounded-full border capitalize"
      style={{ borderColor: `${color}40`, color, background: `${color}12`, fontFamily: FONT.mono }}>
      {name.replace(/_/g, ' ')}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <span className="text-[9px] tracking-[0.15em] uppercase block mb-2"
      style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
      {children}
    </span>
  );
}

export default function MovementDetailPanel({ movement, onClose }) {
  const [tab, setTab]       = useState('overview');
  const [mapView, setMapView] = useState('muscles');
  const [activeDangerZones, setActiveDangerZones] = useState([]);

  const anatomy = getAnatomyData(movement);
  const phases  = movement.phaseTemplate || [];
  const faults  = anatomy?.common_faults || [];

  const diffMeta  = DIFFICULTY_LABEL[anatomy?.difficulty]  || DIFFICULTY_LABEL.intermediate;
  const riskMeta  = RISK_LABEL[anatomy?.risk_level]         || RISK_LABEL.low;

  const allDangerZones = tab === 'faults' ? activeDangerZones : (anatomy?.danger_zones || []);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-end md:justify-center p-0 md:p-4"
      onClick={onClose}>
      <div
        className="relative w-full md:w-[640px] max-h-screen md:max-h-[90vh] flex flex-col rounded-none md:rounded-xl border overflow-hidden"
        style={{ background: '#0e0e0e', borderColor: COLORS.border }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: COLORS.border }}>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
              {movement.displayName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[9px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border"
                style={{ borderColor: `${diffMeta.color}40`, color: diffMeta.color, background: `${diffMeta.color}12`, fontFamily: FONT.mono }}>
                {diffMeta.label}
              </span>
              <span className="text-[9px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border"
                style={{ borderColor: `${riskMeta.color}40`, color: riskMeta.color, background: `${riskMeta.color}12`, fontFamily: FONT.mono }}>
                {riskMeta.label}
              </span>
              <span className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                {movement.category}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 flex-shrink-0 ml-2"
            style={{ border: `1px solid ${COLORS.border}` }}>
            <X size={15} style={{ color: COLORS.textTertiary }} />
          </button>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: COLORS.border }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 relative text-[9px] tracking-[0.12em] uppercase"
                style={{ color: active ? COLORS.gold : COLORS.textTertiary, fontFamily: FONT.mono }}>
                <t.Icon size={12} strokeWidth={1.5} />
                <span className="hidden sm:inline">{t.label}</span>
                {active && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: COLORS.gold }} />}
              </button>
            );
          })}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <>
              {anatomy?.description && (
                <div>
                  <SectionLabel>Movement Description</SectionLabel>
                  <p className="text-[11px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                    {anatomy.description}
                  </p>
                </div>
              )}

              {phases.length > 0 && (
                <div>
                  <SectionLabel>Movement Phases</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {phases.map((p, i) => <PhasePill key={p} phase={p.replace(/_/g, ' ')} active={i === 0} />)}
                  </div>
                </div>
              )}

              {anatomy?.key_cues?.length > 0 && (
                <div>
                  <SectionLabel>Key Technique Cues</SectionLabel>
                  <div className="grid grid-cols-1 gap-2">
                    {anatomy.key_cues.map((cue, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg"
                        style={{ background: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}20` }}>
                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: COLORS.gold }} />
                        <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{cue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {anatomy?.joints?.length > 0 && (
                <div>
                  <SectionLabel>Joints Loaded</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {anatomy.joints.map(j => (
                      <span key={j} className="text-[9px] px-2.5 py-1 rounded-full border capitalize"
                        style={{ borderColor: `${COLORS.gold}30`, color: COLORS.gold, background: `${COLORS.gold}08`, fontFamily: FONT.mono }}>
                        {DANGER_ZONE_LABELS[j] || j.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anatomy?.sport_transfer?.length > 0 && (
                <div>
                  <SectionLabel>Sport Transfer</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {anatomy.sport_transfer.map(s => (
                      <span key={s} className="text-[9px] px-2.5 py-1 rounded-full border"
                        style={{ borderColor: COLORS.border, color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anatomy?.contraindications?.length > 0 && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
                  <SectionLabel>Contraindications / Caution</SectionLabel>
                  <div className="space-y-1">
                    {anatomy.contraindications.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                        <span className="text-[10px]" style={{ color: 'rgba(239,68,68,0.8)', fontFamily: FONT.mono }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] mt-2 italic" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                    Movement-risk guidance only — not medical diagnosis.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── MUSCLES ───────────────────────────────────────────────── */}
          {tab === 'muscles' && anatomy && (
            <>
              {/* View toggle */}
              <div className="flex gap-1">
                {[['muscles', 'Muscle Map'], ['danger', 'Danger Zones']].map(([v, l]) => (
                  <button key={v} onClick={() => setMapView(v)}
                    className="px-3 py-1.5 rounded text-[9px] tracking-[0.1em] uppercase border"
                    style={{
                      background: mapView === v ? COLORS.goldDim : 'transparent',
                      borderColor: mapView === v ? COLORS.goldBorder : COLORS.border,
                      color: mapView === v ? COLORS.gold : COLORS.textTertiary,
                      fontFamily: FONT.mono,
                    }}>
                    {l}
                  </button>
                ))}
              </div>

              <BodyMapViewer
                primaryMuscles={anatomy.primary_muscles}
                secondaryMuscles={anatomy.secondary_muscles}
                stabilizers={anatomy.stabilizers}
                dangerZones={anatomy.danger_zones}
                activeView={mapView}
              />

              <div className="grid grid-cols-1 gap-4">
                {anatomy.primary_muscles?.length > 0 && (
                  <div>
                    <SectionLabel>Primary Muscles</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {anatomy.primary_muscles.map(m => <MuscleTag key={m} name={m} color="#C9A84C" />)}
                    </div>
                  </div>
                )}
                {anatomy.secondary_muscles?.length > 0 && (
                  <div>
                    <SectionLabel>Secondary Muscles</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {anatomy.secondary_muscles.map(m => <MuscleTag key={m} name={m} color="#3B82F6" />)}
                    </div>
                  </div>
                )}
                {anatomy.stabilizers?.length > 0 && (
                  <div>
                    <SectionLabel>Stabilizers</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {anatomy.stabilizers.map(m => <MuscleTag key={m} name={m} color="#6B7280" />)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── FAULTS ────────────────────────────────────────────────── */}
          {tab === 'faults' && (
            <>
              {faults.length === 0 ? (
                <p className="text-[11px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  No detailed fault data for this movement yet.
                </p>
              ) : (
                <>
                  <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                    Tap a fault to see what structures it stresses and how to correct it. Danger zones will highlight on the body map.
                  </p>

                  {/* Inline danger zone body map */}
                  <BodyMapViewer
                    primaryMuscles={[]}
                    secondaryMuscles={[]}
                    stabilizers={[]}
                    dangerZones={activeDangerZones.length ? activeDangerZones : anatomy?.danger_zones || []}
                    activeView="danger"
                  />

                  <div className="space-y-2">
                    {faults.map((f, i) => (
                      <FaultDetailCard
                        key={i}
                        fault={f}
                        onActivateDanger={zones => setActiveDangerZones(zones)}
                      />
                    ))}
                  </div>

                  {/* Danger zone legend */}
                  {anatomy?.danger_zones?.length > 0 && (
                    <div className="rounded-lg border p-3 mt-2" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                      <SectionLabel>Overall Risk Zones</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {anatomy.danger_zones.map(z => (
                          <span key={z} className="text-[9px] px-2.5 py-1 rounded-full border"
                            style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444', background: 'rgba(239,68,68,0.08)', fontFamily: FONT.mono }}>
                            {DANGER_ZONE_LABELS[z] || z}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── PROGRESSIONS ──────────────────────────────────────────── */}
          {tab === 'progressions' && anatomy && (
            <>
              {anatomy.regressions?.length > 0 && (
                <div>
                  <SectionLabel>Regressions (easier)</SectionLabel>
                  <div className="space-y-1.5">
                    {anatomy.regressions.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                        style={{ background: COLORS.bg, borderColor: COLORS.border }}>
                        <TrendingDown size={11} style={{ color: '#22C55E' }} />
                        <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {anatomy.progressions?.length > 0 && (
                <div>
                  <SectionLabel>Progressions (harder)</SectionLabel>
                  <div className="space-y-1.5">
                    {anatomy.progressions.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                        style={{ background: COLORS.bg, borderColor: COLORS.border }}>
                        <TrendingUp size={11} style={{ color: '#EAB308' }} />
                        <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!anatomy.regressions && !anatomy.progressions && (
                <p className="text-[11px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  Progression data not yet available for this movement.
                </p>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}