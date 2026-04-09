/**
 * MobileBottomNav — 3-tab primary navigation + More drawer
 * Tabs: TRAIN, REVIEW, GROW
 * More: Movement Library, Workout Plans, Coach Portal, Settings
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, ClipboardList, TrendingUp, MoreHorizontal, X, BookOpen, Zap, Users, Settings } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

const PRIMARY_TABS = [
  { label: 'TRAIN',  icon: Dumbbell,      path: '/LiveSession' },
  { label: 'REVIEW', icon: ClipboardList,  path: '/SessionHistory' },
  { label: 'GROW',   icon: TrendingUp,     path: '/Progress' },
];

const SECONDARY_ITEMS = [
  { label: 'Movement Library', icon: BookOpen, path: '/MovementLibraryPage' },
  { label: 'Workout Plans',   icon: Zap,      path: '/WorkoutPlans' },
  { label: 'Coach Portal',    icon: Users,    path: '/CoachPortal' },
  { label: 'Settings',        icon: Settings, path: '/Settings' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/LiveSession') return location.pathname === '/LiveSession' || location.pathname === '/FormCheck';
    if (path === '/Review') return location.pathname === '/SessionHistory' || location.pathname === '/TechniqueCompare';
    return location.pathname === path;
  };

  // Map REVIEW tab to also match sub-pages
  const isReviewActive = location.pathname === '/SessionHistory' || location.pathname === '/TechniqueCompare';
  const isGrowActive = location.pathname === '/Progress' || location.pathname === '/Achievements';

  return (
    <>
      {/* Backdrop + Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl py-4 px-4"
            style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                More
              </span>
              <button onClick={() => setDrawerOpen(false)} className="p-1">
                <X size={16} style={{ color: COLORS.textSecondary }} />
              </button>
            </div>
            <div className="space-y-1">
              {SECONDARY_ITEMS.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                    style={{
                      color: active ? COLORS.gold : COLORS.textSecondary,
                      background: active ? COLORS.goldDim : 'transparent',
                      fontFamily: FONT.mono,
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar — 4 icons: TRAIN, REVIEW, GROW, MORE */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
        style={{
          background: COLORS.surface,
          borderColor: COLORS.border,
          height: 56,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          fontFamily: FONT.mono,
        }}
        aria-label="Main navigation"
      >
        {PRIMARY_TABS.map(tab => {
          const Icon = tab.icon;
          let active = false;
          if (tab.label === 'REVIEW') active = isReviewActive;
          else if (tab.label === 'GROW') active = isGrowActive;
          else active = isActive(tab.path);

          return (
            <Link
              key={tab.label}
              to={tab.path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all relative"
              style={{ color: active ? COLORS.gold : COLORS.textTertiary }}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[8px] font-semibold tracking-[0.08em] uppercase leading-none">
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full" style={{ background: COLORS.gold }} />
              )}
            </Link>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
          style={{ color: drawerOpen ? COLORS.gold : COLORS.textTertiary }}
        >
          <MoreHorizontal size={18} strokeWidth={1.5} />
          <span className="text-[8px] font-semibold tracking-[0.08em] uppercase leading-none">
            MORE
          </span>
        </button>
      </nav>
    </>
  );
}