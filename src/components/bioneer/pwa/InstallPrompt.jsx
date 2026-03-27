import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

const DISMISS_KEY = 'bioneer_install_dismissed';
const SESSION_COUNT_KEY = 'bioneer_session_count_pwa';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissedRecently() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts) < WEEK_MS;
  } catch { return false; }
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function getIOSSessionCount() {
  try { return parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0'); } catch { return 0; }
}

function incrementIOSSessionCount() {
  try { localStorage.setItem(SESSION_COUNT_KEY, String(getIOSSessionCount() + 1)); } catch { /* */ }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode() || isDismissedRecently()) return;

    if (isIOS()) {
      incrementIOSSessionCount();
      if (getIOSSessionCount() >= 3) setShowIOS(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* */ }
    setShowAndroid(false);
    setShowIOS(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    else dismiss();
  };

  if (!showAndroid && !showIOS) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-between gap-3 px-4 py-3 border-t"
      style={{ background: COLORS.surface, borderColor: COLORS.borderLight, fontFamily: FONT.mono }}
    >
      <p className="text-[9px] tracking-[0.1em] uppercase flex-1 leading-relaxed" style={{ color: COLORS.textSecondary }}>
        {showIOS
          ? 'TAP SHARE → ADD TO HOME SCREEN FOR FULL APP EXPERIENCE'
          : 'ADD BIONEER TO HOME SCREEN FOR THE BEST EXPERIENCE'}
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {showAndroid && (
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase"
            style={{ background: COLORS.gold, color: '#000' }}
          >
            INSTALL
          </button>
        )}
        <button onClick={dismiss} className="p-1" style={{ color: COLORS.textTertiary }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}