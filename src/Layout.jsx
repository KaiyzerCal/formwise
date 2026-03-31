import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, GitCompare, BarChart3, BookOpen, Clock, Settings, Medal, TrendingUp, Zap } from "lucide-react";
import { FONT_LINK, COLORS, FONT } from "@/components/bioneer/ui/DesignTokens";
import SyncStatusIndicator from "@/components/bioneer/ui/SyncStatusIndicator";
import StreakWidget from "@/components/bioneer/ui/StreakWidget";
import { useT } from "@/lib/i18n";
import WorkoutReminderBanner from "@/components/bioneer/notifications/WorkoutReminderBanner";
import { useWorkoutNotifier } from "@/components/bioneer/notifications/useWorkoutNotifier";

// Primary nav items — shown in sidebar (desktop) and bottom tab bar (mobile)
const NAV_ITEMS = [
  { name: 'LiveSession',         labelKey: 'LIVE',        icon: Camera,    ariaLabel: 'Live Session' },
  { name: 'Analytics',           labelKey: 'ANALYTICS',   icon: BarChart3, ariaLabel: 'Analytics' },
  { name: 'SessionHistory',      labelKey: 'HISTORY',     icon: Clock,     ariaLabel: 'History' },
  { name: 'WorkoutPlans',        labelKey: 'PLANS',       icon: Zap,       ariaLabel: 'Workout Plans' },
  { name: 'Progress',            labelKey: 'PROGRESS',    icon: TrendingUp,ariaLabel: 'Progress' },
];

// Secondary items — sidebar only on desktop, accessible via Settings on mobile
const SIDEBAR_EXTRA = [
  { name: 'TechniqueCompare',    labelKey: 'TECHNIQUE',   icon: GitCompare, ariaLabel: 'Technique Compare' },
  { name: 'MovementLibraryPage', labelKey: 'LIBRARY',     icon: BookOpen,   ariaLabel: 'Movement Library' },
  { name: 'Achievements',        labelKey: 'ACHIEVEMENTS',icon: Medal,      ariaLabel: 'Achievements' },
];

const ALL_SIDEBAR = [...NAV_ITEMS, ...SIDEBAR_EXTRA];

export default function Layout({ children, currentPageName }) {
  const t = useT();
  useWorkoutNotifier();

  return (
    <>
      <WorkoutReminderBanner />
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; background: ${COLORS.bg}; }
        /* Allow body to scroll — pages control their own overflow */
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
              const active = currentPageName === item.name;
              const Icon   = item.icon;
              return (
                <Link key={item.name} to={createPageUrl(item.name)}
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
              aria-current={currentPageName === 'Settings' ? 'page' : undefined}
              className="flex items-center gap-2.5 px-3 py-2 text-[8.5px] tracking-[0.12em] uppercase rounded-md"
              style={{ color: currentPageName === 'Settings' ? COLORS.gold : COLORS.textSecondary, background: currentPageName === 'Settings' ? COLORS.goldDim : 'transparent' }}>
              <Settings size={12} strokeWidth={1.5} aria-hidden="true" />
              <span>{t('SETTINGS')}</span>
            </Link>
          </div>
        </aside>

        {/* ── Main content area ────────────────────────────────────────────── */}
        {/* On mobile: leave room for bottom tab bar (56px) */}
        <main className="flex-1 min-h-screen md:pb-0 pb-14" style={{ background: COLORS.bg }}>
          {children}
        </main>

        {/* ── Mobile Bottom Tab Bar ────────────────────────────────────────── */}
        {/* Visible on mobile only — replaces the hamburger menu */}
        <nav className="bottom-tab-bar md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
          style={{ background: COLORS.surface, borderColor: COLORS.border, height: 56 }}
          aria-label="Main navigation">

          {NAV_ITEMS.map(item => {
            const active = currentPageName === item.name;
            const Icon   = item.icon;
            return (
              <Link key={item.name} to={createPageUrl(item.name)}
                aria-label={item.ariaLabel} aria-current={active ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
                style={{ color: active ? COLORS.gold : COLORS.textTertiary }}>
                <Icon size={18} strokeWidth={active ? 2 : 1.5} aria-hidden="true" />
                <span className="text-[8px] font-semibold tracking-[0.08em] uppercase leading-none">
                  {item.labelKey}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-6 h-0.5 rounded-full" style={{ background: COLORS.gold }} />
                )}
              </Link>
            );
          })}

          {/* Settings as 6th tab */}
          <Link to="/Settings" aria-label="Settings"
            aria-current={currentPageName === 'Settings' ? 'page' : undefined}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
            style={{ color: currentPageName === 'Settings' ? COLORS.gold : COLORS.textTertiary }}>
            <Settings size={18} strokeWidth={currentPageName === 'Settings' ? 2 : 1.5} aria-hidden="true" />
            <span className="text-[8px] font-semibold tracking-[0.08em] uppercase leading-none">SETTINGS</span>
            {currentPageName === 'Settings' && (
              <span className="absolute bottom-0 w-6 h-0.5 rounded-full" style={{ background: COLORS.gold }} />
            )}
          </Link>
        </nav>
      </div>
    </>
  );
}
