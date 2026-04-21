import React, { useState } from 'react';
import { ChevronRight, BookOpen, Upload, User } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { REFERENCE_EXERCISE_LIST } from '../../compare/referenceLibrary';
import { getMovementReviewHistory } from '@/lib/retentionEngine';
import { getAllSessions } from '../../data/unifiedSessionStore';

export default function SourceSelection({ exerciseId, exerciseName, onSelectLibrary, onSelectUpload, onSelectPrevBest, onBack }) {
  const [expandedCard, setExpandedCard] = useState(null);
  const history = getMovementReviewHistory(exerciseId);
  const prevBestAvailable = history.reviewCount >= 2;

  const handleLibrarySelect = (refId) => {
    onSelectLibrary(refId);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onSelectUpload(URL.createObjectURL(file));
  };

  const handlePrevBest = () => {
    if (!prevBestAvailable) return;
    const sessions = getAllSessions()
      .filter(s => (s.movement_id || s.exercise_id) === exerciseId)
      .sort((a, b) => (b.average_form_score ?? 0) - (a.average_form_score ?? 0));
    const best = sessions[0];
    if (best?.video_url) {
      onSelectPrevBest(best.video_url, best.average_form_score ?? 0);
    }
  };

  return (
    <div style={{ fontFamily: FONT.mono, color: COLORS.textPrimary }}>
      <p style={{ fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 32, marginBottom: 24 }}>
        Who are you comparing against?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
        {/* Library Card */}
        <SourceCard
          icon={BookOpen} title="Movement Library"
          subtitle="Compare against a reference form from our exercise library"
          onClick={() => setExpandedCard(expandedCard === 'library' ? null : 'library')}
        />
        {expandedCard === 'library' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 8px' }}>
            {REFERENCE_EXERCISE_LIST.map(e => (
              <button key={e.id} onClick={() => handleLibrarySelect(e.id)} style={{
                background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 16,
                padding: '6px 12px', fontSize: 9, color: COLORS.gold, cursor: 'pointer', fontFamily: FONT.mono,
              }}>
                {e.name}
              </button>
            ))}
          </div>
        )}

        {/* Upload Card */}
        <SourceCard
          icon={Upload} title="Upload Reference"
          subtitle="Upload any video to compare against — coach demo, pro athlete, your own reference"
          onClick={() => setExpandedCard(expandedCard === 'upload' ? null : 'upload')}
        />
        {expandedCard === 'upload' && (
          <div style={{ padding: '0 8px' }}>
            <input type="file" accept="video/*" onChange={handleFileSelect}
              style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: FONT.mono }} />
          </div>
        )}

        {/* Previous Best Card */}
        <div
          onClick={prevBestAvailable ? handlePrevBest : undefined}
          style={{
            background: COLORS.surface, border: `1px solid ${COLORS.borderLight}`, borderRadius: 10,
            padding: 20, cursor: prevBestAvailable ? 'pointer' : 'default',
            opacity: prevBestAvailable ? 1 : 0.4,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { if (prevBestAvailable) e.currentTarget.style.borderColor = COLORS.goldBorder; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <User size={16} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>My Previous Best</p>
              <p style={{ fontSize: 9, color: prevBestAvailable ? COLORS.textSecondary : COLORS.textTertiary, margin: '4px 0 0' }}>
                {prevBestAvailable
                  ? `Compare against your best session on ${exerciseName || exerciseId?.replace(/_/g, ' ')} — ${history.reviewCount} sessions recorded`
                  : 'Complete at least 2 sessions of this movement to unlock'
                }
              </p>
            </div>
            {prevBestAvailable && <ChevronRight size={14} style={{ color: COLORS.textTertiary }} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ icon: Icon, title, subtitle, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: COLORS.surface, border: `1px solid ${COLORS.borderLight}`, borderRadius: 10,
      padding: 20, cursor: 'pointer', transition: 'border-color 0.15s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.goldBorder; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={16} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>{title}</p>
          <p style={{ fontSize: 9, color: COLORS.textSecondary, margin: '4px 0 0' }}>{subtitle}</p>
        </div>
        <ChevronRight size={14} style={{ color: COLORS.textTertiary }} />
      </div>
    </div>
  );
}