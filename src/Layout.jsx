import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Camera, BarChart3, BookOpen, Clock, Settings, Medal, TrendingUp, Zap, User } from "lucide-react";
import { FONT_LINK, COLORS, FONT } from "@/components/bioneer/ui/DesignTokens";
import SyncStatusIndicator from "@/components/bioneer/ui/SyncStatusIndicator";
import StreakWidget from "@/components/bioneer/ui/StreakWidget";
import { useT } from "@/lib/i18n";
import WorkoutReminderBanner from "@/components/bioneer/notifications/WorkoutReminderBanner";
import { useWorkoutNotifier } from "@/components/bioneer/notifications/useWorkoutNotifier";
import MobileBottomNav from "@/components/bioneer/nav/MobileBottomNav";

// ── Sidebar groups ─────────────────────────────────────────────────
// PRIMARY NAV — 5 core sections
const PRIMARY_ITEMS = [
  { path: '/',          labelKey: 'DASHBOARD', icon: LayoutDashboard, ariaLabel: 'Dashboard' },
  { path: '/analyze',   labelKey: 'ANALYZE',   icon: Camera,          ariaLabel: 'Analyze' },
  { path: '/train',     labelKey: 'TRAIN',     icon: Zap,             ariaLabel: 'Train' },
  { path: '/progress',  labelKey: 'PROGRESS',  icon: TrendingUp,      ariaLabel: 'Progress' },
  { path: '/profile',   labelKey: 'PROFILE',   icon: User,            ariaLabel: 'Profile' },
];
// SECONDARY
const SECONDARY_ITEMS = [
  { path: '/SessionHistory',     labelKey: 'HISTORY',  icon: Clock,     ariaLabel: 'History' },
  { path: '/MovementLibraryPage',labelKey: 'LIBRARY',  icon: BookOpen,  ariaLabel: 'Movement Library' },
  { path: '/WorkoutPlans',       labelKey: 'PLANS',    icon: Zap,       ariaLabel: 'Workout Plans' },
  { path: '/CoachPortal',        labelKey: 'COACH',    icon: BarChart3, ariaLabel: 'Coach Portal' },
];

const ALL_SIDEBAR = [...PRIMARY_ITEMS, ...SECONDARY_ITEMS];

export default function Layout({ children, currentPageName }) {
  const t = useT();
  const location = useLocation();
  useWorkoutNotifier();

  return (
    <>
      <WorkoutReminderBanner />
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        html { height: 100%; }
        body { min-height: 100%; margin: 0; background: ${COLORS.bg}; }
        body { overflow-x: hidden; overflow-y: auto; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        /* Safe area for iPhone home indicator */
        .bottom-tab-bar { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      <div className="flex min-h-screen w-full" style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}>

        {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-[180px] flex-shrink-0 border-r sticky top-0 h-screen"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <div className="px-4 py-4 border-b flex-shrink-0" style={{ borderColor: COLORS.border }}>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>
              BIONEER
            </span>
          </div>

          {/* Scrollable nav list */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto" aria-label="Main navigation">
            {ALL_SIDEBAR.map(item => {
              const active = location.pathname === item.path;
              const Icon   = item.icon;
              return (
                <Link key={item.path} to={item.path}
                  aria-label={item.ariaLabel} aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-2.5 px-3 py-2 text-[8.5px] tracking-[0.12em] uppercase rounded-md transition-all duration-120"
                  style={{ color: active ? COLORS.gold : COLORS.textSecondary, background: active ? COLORS.goldDim : 'transparent', ...(active && { borderLeft: `2px solid ${COLORS.gold}` }) }}>
                  <Icon size={12} strokeWidth={1.5} aria-hidden="true" />
                  <span className="flex-1 font-medium">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t px-3 py-3 flex-shrink-0" style={{ borderColor: COLORS.border }}>
            <StreakWidget />
          </div>
          <div className="border-t px-3 py-2 flex-shrink-0" style={{ borderColor: COLORS.border }}>
            <SyncStatusIndicator />
          </div>
          <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: COLORS.border }}>
            <Link to="/Settings" aria-label="Settings"
              aria-current={location.pathname === '/Settings' ? 'page' : undefined}
              className="flex items-center gap-2.5 px-3 py-2 text-[8.5px] tracking-[0.12em] uppercase rounded-md"
              style={{ color: location.pathname === '/Settings' ? COLORS.gold : COLORS.textSecondary, background: location.pathname === '/Settings' ? COLORS.goldDim : 'transparent' }}>
              <Settings size={12} strokeWidth={1.5} aria-hidden="true" />
              <span>{t('SETTINGS')}</span>
            </Link>
          </div>
        </aside>

        {/* ── Main content area ────────────────────────────────────────────── */}
        {/* On mobile: leave room for bottom tab bar (56px) */}
        <main className="flex-1 min-h-screen md:pb-0 pb-[72px] overflow-y-auto" style={{ background: COLORS.bg }}>
          {children}
        </main>

        {/* ── Mobile Bottom Tab Bar ────────────────────────────────────────── */}
        <MobileBottomNav />
      </div>
    </>
  );
}