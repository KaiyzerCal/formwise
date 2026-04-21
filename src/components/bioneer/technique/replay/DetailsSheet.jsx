import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { Link } from 'react-router-dom';

export default function DetailsSheet({ session, onClose }) {
  const sheetRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);

  const handleTouchStart = (e) => { startYRef.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setDragY(dy);
  };
  const handleTouchEnd = () => {
    if (dragY > 100) onClose();
    else setDragY(0);
  };

  const faults = (session?.top_faults || []).reduce((acc, f) => {
    const key = f.replace(/_/g, ' ');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Also count from alerts
  (session?.alerts || []).forEach(a => {
    const key = (a.joint || 'unknown').replace(/_/g, ' ');
    faults[key] = (faults[key] || 0) + 1;
  });

  const draftId = session?.draftId || '';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '60vh', zIndex: 100,
          background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`,
          borderRadius: '12px 12px 0 0', padding: 20, overflowY: 'auto',
          transform: `translateY(${dragY}px)`, transition: dragY === 0 ? 'transform 0.2s' : 'none',
          fontFamily: FONT.mono,
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 32, height: 4, borderRadius: 2, background: COLORS.borderLight, margin: '0 auto 16px' }} />

        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        }}>
          <X size={16} style={{ color: COLORS.textSecondary }} />
        </button>

        <h3 style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.gold, marginBottom: 16 }}>
          Session Details
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label="Form Score" value={`${Math.round(session?.form_score_overall || 0)}%`} />
          <Row label="Reps Detected" value={session?.reps_detected || 0} />
          <Row label="Tracking Confidence" value={`${Math.round(session?.tracking_confidence || 0)}%`} />
          {session?.body_side_bias && <Row label="Body Side Bias" value={session.body_side_bias} />}
        </div>

        {Object.keys(faults).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.textTertiary, marginBottom: 8 }}>
              Detected Faults
            </p>
            {Object.entries(faults).map(([name, count]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 10, color: COLORS.textSecondary, textTransform: 'capitalize' }}>{name}</span>
                <span style={{ fontSize: 10, color: COLORS.textTertiary }}>×{count}</span>
              </div>
            ))}
          </div>
        )}

        {draftId && (
          <Link to={`/TechniqueStudio?draft=${draftId}`}
            style={{ display: 'block', marginTop: 16, fontSize: 9, color: COLORS.gold, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Open in Studio →
          </Link>
        )}
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
      <span style={{ color: COLORS.textSecondary }}>{label}</span>
      <span style={{ color: COLORS.gold }}>{value}</span>
    </div>
  );
}