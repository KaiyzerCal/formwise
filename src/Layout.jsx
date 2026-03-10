import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, GitCompare, BarChart3, BookOpen, Clock, Settings, Menu, X } from "lucide-react";
import { FONT_LINK, COLORS, FONT } from "./components/bioneer/ui/DesignTokens";

const NAV_ITEMS = [
  { name: 'LiveSession', label: 'LIVE SESSION', icon: Camera },
  { name: 'TechniqueCompare', label: 'TECHNIQUE', icon: GitCompare },
  { name: 'Analytics', label: 'ANALYTICS', icon: BarChart3 },
  { name: 'MovementLibraryPage', label: 'LIBRARY', icon: BookOpen },
  { name: 'SessionHistory', label: 'HISTORY', icon: Clock },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="px-5 py-5 border-b" style={{ borderColor: COLORS.border }}>
            <span className="text-sm font-bold tracking-[0.25em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>
              BIONEER
            </span>
          </div>
          <nav className="flex-1 py-3">
            {NAV_ITEMS.map(item => {
              const active = currentPageName === item.name;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className="flex items-center gap-3 px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase transition-colors relative"
                  style={{
                    color: active ? COLORS.gold : COLORS.textSecondary,
                    background: active ? COLORS.goldDim : 'transparent',
                  }}
                >
                  {active && <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: COLORS.gold }} />}
                  <Icon size={14} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="px-5 py-4 border-t" style={{ borderColor: COLORS.border }}>
            <button className="flex items-center gap-3 text-[10px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>
              <Settings size={14} strokeWidth={1.5} />
              <span>SETTINGS</span>
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>BIONEER</span>
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} style={{ color: COLORS.textSecondary }} /> : <Menu size={18} style={{ color: COLORS.textSecondary }} />}
          </button>
        </div>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 pt-12" style={{ background: COLORS.surface }}>
            <nav className="py-4">
              {NAV_ITEMS.map(item => {
                const active = currentPageName === item.name;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-6 py-3.5 text-xs tracking-[0.15em] uppercase"
                    style={{ color: active ? COLORS.gold : COLORS.textSecondary, background: active ? COLORS.goldDim : 'transparent' }}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto md:pt-0 pt-12" style={{ background: COLORS.bg }}>
          {children}
        </main>
      </div>
    </>
  );
}