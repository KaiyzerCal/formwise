import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, GitCompare, BarChart3, BookOpen, Clock, Settings, Menu, Medal, TrendingUp, Zap, Home } from "lucide-react";
import { FONT_LINK, COLORS, FONT } from "@/components/bioneer/ui/DesignTokens";
import SyncStatusIndicator from "@/components/bioneer/ui/SyncStatusIndicator";
import StreakWidget from "@/components/bioneer/ui/StreakWidget";
import Breadcrumb from "@/components/navigation/Breadcrumb";
import BottomSheet from "@/components/navigation/BottomSheet";
import { useT } from "@/lib/i18n";

const NAV_ITEMS = [
  // 🎥 Record & Analyze Hat
  { name: 'LiveSession',        labelKey: 'RECORD',        icon: Camera,     ariaLabel: 'Record — capture and analyze movement' },
  { name: 'SessionHistory',     labelKey: 'REVIEW',        icon: Clock,       ariaLabel: 'Review — replay past sessions' },
  
  // 🏆 Coach Hat
  { name: 'TechniqueCompare',   labelKey: 'FORM CHECK',    icon: GitCompare,  ariaLabel: 'Form Check — compare to ideal movement' },
  { name: 'WorkoutPlans',       labelKey: 'PLANS',         icon: Zap,         ariaLabel: 'Plans — personalized training programs' },
  
  // 📊 Insights Hat
  { name: 'Analytics',          labelKey: 'ANALYTICS',     icon: BarChart3,   ariaLabel: 'Analytics — performance trends' },
  { name: 'Progress',           labelKey: 'PROGRESS',      icon: TrendingUp,  ariaLabel: 'Progress — improvement timeline' },
  
  // 🎮 Optional
  { name: 'MovementLibraryPage',labelKey: 'LIBRARY',       icon: BookOpen,    ariaLabel: 'Library — exercise reference' },
  { name: 'Achievements',       labelKey: 'ACHIEVEMENTS',  icon: Medal,       ariaLabel: 'Achievements — earned rewards' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/', active: currentPageName === 'Home' || !currentPageName },
  ];
  
  const currentNav = NAV_ITEMS.find(item => item.name === currentPageName);
  if (currentNav) {
    breadcrumbItems.push({
      label: currentNav.labelKey,
      active: true,
    });
  }

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

      <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}>
        {/* Header with Breadcrumb (Desktop) + Mobile Menu */}
        <div className="flex items-center justify-between border-b" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          {/* Breadcrumb (desktop) */}
          <div className="hidden md:flex flex-1">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between w-full px-4 py-3">
            <Link to="/" className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>
              BIONEER
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              <Menu size={18} style={{ color: COLORS.textSecondary }} />
            </button>
          </div>

          {/* Desktop icons (sync + settings) */}
          <div className="hidden md:flex items-center gap-2 px-4 py-3 border-l" style={{ borderColor: COLORS.border }}>
            <div className="w-px h-5" style={{ background: COLORS.border }} />
            <Link to="/Settings" className="p-1 hover:opacity-70">
              <Settings size={14} style={{ color: currentPageName === 'Settings' ? COLORS.gold : COLORS.textSecondary }} />
            </Link>
          </div>
        </div>

        {/* Mobile Bottom Sheet Navigation */}
        <BottomSheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
          <nav className="space-y-1" aria-label="Main navigation">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-xs tracking-[0.1em] uppercase rounded"
              style={{
                color: !currentPageName ? COLORS.gold : COLORS.textSecondary,
                background: !currentPageName ? COLORS.goldDim : 'transparent',
              }}
            >
              <Home size={16} />
              <span>Home</span>
            </Link>
            {NAV_ITEMS.map(item => {
              const active = currentPageName === item.name;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-xs tracking-[0.1em] uppercase rounded"
                  style={{
                    color: active ? COLORS.gold : COLORS.textSecondary,
                    background: active ? COLORS.goldDim : 'transparent',
                  }}
                >
                  <Icon size={16} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
            <hr style={{ borderColor: COLORS.border, margin: '12px 0' }} />
            <Link
              to="/Settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-xs tracking-[0.1em] uppercase rounded"
              style={{
                color: currentPageName === 'Settings' ? COLORS.gold : COLORS.textSecondary,
                background: currentPageName === 'Settings' ? COLORS.goldDim : 'transparent',
              }}
            >
              <Settings size={16} />
              <span>{t('SETTINGS')}</span>
            </Link>
          </nav>
        </BottomSheet>

        {/* Main content */}
        <main className="flex-1 overflow-hidden" style={{ background: COLORS.bg }}>
          {children}
        </main>
      </div>
    </>
  );
}