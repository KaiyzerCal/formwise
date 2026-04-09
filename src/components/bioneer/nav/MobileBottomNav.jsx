/**
 * MobileBottomNav — 5-tab navigation matching product structure
 * Dashboard, Analyze, Train, Progress, Profile
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Camera, Dumbbell, TrendingUp, User, MoreHorizontal, X, Clock, BookOpen, Settings, Users, Zap } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

const PRIMARY_TABS = [
  { label: 'Home',     icon: LayoutDashboard, path: '/' },
  { label: 'Analyze',  icon: Camera,          path: '/analyze' },
  { label: 'Train',    icon: Dumbbell,        path: '/train' },
  { label: 'Progress', icon: TrendingUp,      path: '/progress' },
  { label: 'Profile',  icon: User,            path: '/profile' },
];

const SECONDARY_ITEMS = [
  { label: 'Session History',  icon: Clock,    path: '/SessionHistory' },
  { label: 'Movement Library', icon: BookOpen, path: '/MovementLibraryPage' },
  { label: 'Workout Plans',    icon: Zap,      path: '/WorkoutPlans' },
  { label: 'Coach Portal',     icon: Users,    path: '/CoachPortal' },
  { label: 'Settings',         icon: Settings, path: '/Settings' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.toLowerCase().startsWith(path.toLowerCase());
  };

  return (
    <>
      {/* More drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl py-4 px-4"
            style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>More</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1"><X size={16} style={{ color: COLORS.textSecondary }} /></button>
            </div>
            <div className="space-y-1">
              {SECONDARY_ITEMS.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                    style={{ color: active ? COLORS.gold : COLORS.textSecondary, background: active ? COLORS.goldDim : 'transparent', fontFamily: FONT.mono }}>
                    <Icon size={18} strokeWidth={1.5} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
        style={{ background: COLORS.surface, borderColor: COLORS.border, height: 56, paddingBottom: 'env(safe-area-inset-bottom, 0px)', fontFamily: FONT.mono }}
        aria-label="Main navigation">
        {PRIMARY_TABS.map(tab => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <Link key={tab.label} to={tab.path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all relative"
              style={{ color: active ? COLORS.gold : COLORS.textTertiary }}>
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[7px] font-semibold tracking-[0.06em] uppercase leading-none">{tab.label}</span>
              {active && <span className="absolute bottom-0 w-5 h-0.5 rounded-full" style={{ background: COLORS.gold }} />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}