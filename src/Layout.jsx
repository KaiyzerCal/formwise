import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, BarChart3, Clock, Settings, TrendingUp, Zap, MoreHorizontal, BookOpen, GitCompare, Medal, Users } from "lucide-react";
import { FONT_LINK, COLORS, FONT } from "@/components/bioneer/ui/DesignTokens";
import SyncStatusIndicator from "@/components/bioneer/ui/SyncStatusIndicator";
import StreakWidget from "@/components/bioneer/ui/StreakWidget";
import { useT } from "@/lib/i18n";
import WorkoutReminderBanner from "@/components/bioneer/notifications/WorkoutReminderBanner";
import { useWorkoutNotifier } from "@/components/bioneer/notifications/useWorkoutNotifier";
import NavDrawer from "@/components/bioneer/nav/NavDrawer";

// PRIMARY TABS — 3 groups
const PRIMARY_TABS = [
  {
    name: 'TRAIN',
    pages: ['LiveSession', 'FormCheck'],
    icon: Camera,
    path: '/LiveSession',
    ariaLabel: 'Train',
  },
  {
    name: 'REVIEW',
    pages: ['SessionHistory', 'TechniqueCompare', 'TechniqueInsights'],
    icon: Clock,
    path: '/SessionHistory',
    ariaLabel: 'Review',
  },
  {
    name: 'GROW',
    pages: ['Progress', 'Achievements', 'Analytics'],
    icon: TrendingUp,
    path: '/Progress',
    ariaLabel: 'Grow',
  },
];

// SECONDARY items — accessible via drawer
const SECONDARY_ITEMS = [
  { name: 'MovementLibraryPage', label: 'Movement Library', icon: BookOpen, path: '/MovementLibraryPage' },
  { name: 'WorkoutPlans',        label: 'Workout Plans',    icon: Zap,      path: '/WorkoutPlans' },
  { name: 'CoachPortal',         label: 'Coach Portal',     icon: Users,    path: '/CoachPortal' },
  { name: 'Settings',            label: 'Settings',         icon: Settings, path: '/Settings' },
];

function isTabActive(tab, currentPageName) {
  return tab.pages.includes(currentPageName);
}

export default function Layout({ children, currentPageName }) {
  const t = useT();
  useWorkoutNotifier();
  const [drawerOpen, setDrawerOpen] = useState(false);

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

          {/* Primary tabs */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto" aria-label="Main navigation">
            {PRIMARY_TABS.map(tab => {
              const active = isTabActive(tab, currentPageName);
              const Icon = tab.icon;
              return (
                <Link key={tab.name} to={tab.path}
                  aria-label={tab.ariaLabel} aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-2.5 px-3 py-2 text-[8.5px] tracking-[0.12em] uppercase rounded-md transition-all duration-120"
                  style={{ color: active ? COLORS.gold : COLORS.textSecondary, background: active ? COLORS.goldDim : 'transparent', ...(active && { borderLeft: `2px solid ${COLORS.gold}` }) }}>
                  <Icon size={12} strokeWidth={1.5} aria-hidden="true" />
                  <span className="flex-1 font-medium">{tab.name}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-2 border-t" style={{ borderColor: COLORS.border }} />

            {/* Secondary items */}
            {SECONDARY_ITEMS.map(item => {
              const active = currentPageName === item.name;
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.path}
                  aria-label={item.label} aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-2.5 px-3 py-2 text-[8.5px] tracking-[0.12em] uppercase rounded-md transition-all duration-120"
                  style={{ color: active ? COLORS.gold : COLORS.textTertiary, background: active ? COLORS.goldDim : 'transparent' }}>
                  <Icon size={12} strokeWidth={1.5} aria-hidden="true" />
                  <span className="flex-1 font-medium">{item.label}</span>
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
        </aside>

        {/* ── Main content area ────────────────────────────────────────────── */}
        {/* On mobile: leave room for bottom tab bar (56px) */}
        <main className="flex-1 min-h-screen md:pb-0 pb-[72px] overflow-y-auto" style={{ background: COLORS.bg }}>
          {children}
        </main>

        {/* ── Mobile Bottom Tab Bar ────────────────────────────────────────── */}
        <nav className="bottom-tab-bar md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
          style={{ background: COLORS.surface, borderColor: COLORS.border, height: 56, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          aria-label="Main navigation">

          {PRIMARY_TABS.map(tab => {
            const active = isTabActive(tab, currentPageName);
            const Icon = tab.icon;
            return (
              <Link key={tab.name} to={tab.path}
                aria-label={tab.ariaLabel} aria-current={active ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all relative"
                style={{ color: active ? COLORS.gold : COLORS.textTertiary }}>
                <Icon size={18} strokeWidth={active ? 2 : 1.5} aria-hidden="true" />
                <span className="text-[8px] font-semibold tracking-[0.08em] uppercase leading-none">
                  {tab.name}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-6 h-0.5 rounded-full" style={{ background: COLORS.gold }} />
                )}
              </Link>
            );
          })}

          {/* More (⋯) button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all relative"
            style={{ color: SECONDARY_ITEMS.some(i => i.name === currentPageName) ? COLORS.gold : COLORS.textTertiary }}
            aria-label="More options"
          >
            <MoreHorizontal size={18} strokeWidth={1.5} />
            <span className="text-[8px] font-semibold tracking-[0.08em] uppercase leading-none">
              MORE
            </span>
          </button>
        </nav>

        {/* Secondary drawer */}
        <NavDrawer
          items={SECONDARY_ITEMS}
          currentPageName={currentPageName}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </>
  );
}