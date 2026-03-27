import React, { useEffect, useState } from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[300] flex items-center justify-center gap-2 px-4 py-1.5"
      style={{ background: 'rgba(245,158,11,0.15)', borderBottom: `1px solid rgba(245,158,11,0.3)`, fontFamily: FONT.mono }}
    >
      <WifiOff size={10} style={{ color: '#f59e0b' }} />
      <span className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ color: '#f59e0b' }}>
        OFFLINE — SESSIONS WILL SYNC WHEN RECONNECTED
      </span>
    </div>
  );
}