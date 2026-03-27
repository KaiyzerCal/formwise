import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, GitCompare, BarChart3, BookOpen, Clock, Settings, Menu, X, Medal, TrendingUp, Zap } from "lucide-react";
import { FONT_LINK, COLORS, FONT } from "@/components/bioneer/ui/DesignTokens";
import SyncStatusIndicator from "@/components/bioneer/ui/SyncStatusIndicator";
import StreakWidget from "@/components/bioneer/ui/StreakWidget";
import { useT } from "@/lib/i18n";

const NAV_ITEMS = [
  { name: 'LiveSession',        labelKey: 'LIVE SESSION',  icon: Camera,     ariaLabel: 'Live Session — start form analysis' },
  { name: 'TechniqueCompare',   labelKey: 'TECHNIQUE',     icon: GitCompare,  ariaLabel: 'Technique — compare your form to reference' },
  { name: 'Analytics',          labelKey: 'ANALYTICS',     icon: BarChart3,   ariaLabel: 'Analytics — view performance trends' },
  { name: 'Progress',           labelKey: 'PROGRESS',      icon: TrendingUp,  ariaLabel: 'Progress — long-term trends and milestones' },
  { name: 'MovementLibraryPage',labelKey: 'LIBRARY',       icon: BookOpen,    ariaLabel: 'Library — browse movement exercises' },
  { name: 'SessionHistory',     labelKey: 'HISTORY',       icon: Clock,       ariaLabel: 'History — past session records' },
  { name: 'WorkoutPlans',       labelKey: 'PLANS',         icon: Zap,  ariaLabel: 'Plans — personalized workout programs' },
  { name: 'Achievements',       labelKey: 'ACHIEVEMENTS',  icon: Medal,       ariaLabel: 'Achievements — earned milestones' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        body { background: ${COLORS.bg}; margin: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
      `}</style>

      <div className="flex h-screen w-screen overflow-hidden" style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}>
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[200px] flex-shrink-0 border-r" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <div className="px-4 py-4 border-b" style={{ borderColor: COLORS.border }}>
            <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading, letterSpacing: '0.1em' }}>
              BIONEER
            </span>
          </div>
          <nav className="flex-1 py-2" aria-label="Main navigation">
            {NAV_ITEMS.map(item => {
              const active = currentPageName === item.name;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  aria-label={item.ariaLabel}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-3 px-4 py-2 text-[9px] tracking-[0.12em] uppercase transition-colors relative"
                  style={{
                    color: active ? COLORS.gold : COLORS.textSecondary,
                    background: active ? COLORS.goldDim : 'transparent',
                  }}
                >
                  {active && <div className="absolute left-0 top-1 bottom-1 w-px" style={{ background: COLORS.gold }} />}
                  <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
                  <span className="flex-1 font-medium">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-4 py-3" style={{ borderColor: COLORS.border }}>
            <StreakWidget />
          </div>
          <div className="border-t" style={{ borderColor: COLORS.border }}>
            <SyncStatusIndicator />
          </div>
          <div className="px-5 py-4 border-t" style={{ borderColor: COLORS.border }}>
            <Link
              to="/Settings"
              aria-label="Settings — preferences and configuration"
              aria-current={currentPageName === 'Settings' ? 'page' : undefined}
              className="flex items-center gap-3 text-[10px] tracking-[0.15em] uppercase"
              style={{ color: currentPageName === 'Settings' ? COLORS.gold : COLORS.textSecondary }}
            >
              <Settings size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>{t('SETTINGS')}</span>
            </Link>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>BIONEER</span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X size={18} style={{ color: COLORS.textSecondary }} aria-hidden="true" /> : <Menu size={18} style={{ color: COLORS.textSecondary }} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div id="mobile-nav" className="md:hidden fixed inset-0 z-40 pt-12" style={{ background: COLORS.surface }}>
            <nav className="py-4" aria-label="Main navigation">
              {NAV_ITEMS.map(item => {
                const active = currentPageName === item.name;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    onClick={() => setMobileOpen(false)}
                    aria-label={item.ariaLabel}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-3 px-6 py-3.5 text-xs tracking-[0.15em] uppercase"
                    style={{ color: active ? COLORS.gold : COLORS.textSecondary, background: active ? COLORS.goldDim : 'transparent' }}
                  >
                    <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
              <Link
                to="/Settings"
                onClick={() => setMobileOpen(false)}
                aria-label="Settings — preferences and configuration"
                aria-current={currentPageName === 'Settings' ? 'page' : undefined}
                className="flex items-center gap-3 px-6 py-3.5 text-xs tracking-[0.15em] uppercase"
                style={{ color: currentPageName === 'Settings' ? COLORS.gold : COLORS.textSecondary }}
              >
                <Settings size={16} strokeWidth={1.5} aria-hidden="true" />
                <span>{t('SETTINGS')}</span>
              </Link>
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden md:pt-0 pt-12" style={{ background: COLORS.bg }}>
          {children}
        </main>
      </div>
    </>
  );
}