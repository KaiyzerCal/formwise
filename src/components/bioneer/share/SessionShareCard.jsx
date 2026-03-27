import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { Share2, Download, Link, X } from 'lucide-react';

// Off-screen share card (1200x630)
function ShareCardContent({ sessionData, score, exerciseName, date, repScores, topFault }) {
  const top3 = (repScores || []).slice(0, 3);
  const scoreCol = scoreColor(score);

  return (
    <div style={{
      width: 1200, height: 630, background: '#080808',
      fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '60px 80px',
      border: '1px solid #1a1a1a',
    }}>
      {/* Gold top line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: COLORS.gold }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: COLORS.gold, fontSize: 13, letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
            BIONEER
          </div>
          <div style={{ color: '#fff', fontSize: 36, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
            {exerciseName}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {date}
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: scoreCol, fontSize: 120, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {score}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
            FORM SCORE / 100
          </div>
        </div>
      </div>

      {/* Rep scores + fault */}
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end' }}>
        {top3.length > 0 && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
              TOP REPS
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {top3.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ color: scoreColor(s), fontSize: 42, fontWeight: 700 }}>{s}</div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>
                    REP {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topFault && (
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              FOCUS AREA
            </div>
            <div style={{
              color: COLORS.warning, fontSize: 18, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '10px 20px', border: '1px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.08)', display: 'inline-block',
            }}>
              {topFault.replace(/_/g, ' ')}
            </div>
          </div>
        )}

        {/* Tagline */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Analyzed by BIONEER
          </div>
          <div style={{ color: 'rgba(255,255,255,0.08)', fontSize: 11, letterSpacing: '0.1em', marginTop: 4 }}>
            bioneer.app
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionShareButton({ sessionData }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!sessionData) return null;

  const score = Math.round(sessionData.movement_score ?? sessionData.form_score_overall ?? 0);
  const exerciseName = sessionData.exercise_def?.name || (sessionData.exercise_id || '').replace(/_/g, ' ').toUpperCase();
  const date = sessionData.started_at
    ? new Date(sessionData.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const reps = sessionData.reps ?? [];
  const repScores = reps.map(r => r.score).filter(s => s != null).sort((a, b) => b - a).slice(0, 3);
  const topFault = sessionData.top_faults?.[0] ?? (sessionData.alerts?.[0]?.joint ?? null);

  const captureAndShare = async () => {
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 1, useCORS: true, backgroundColor: '#080808', logging: false,
      });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], `bioneer-session-${score}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My ${exerciseName} — ${score}/100`,
          text: `Analyzed by BIONEER — check out my form score!`,
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bioneer-${exerciseName.toLowerCase().replace(/\s+/g, '-')}-${score}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 1, useCORS: true, backgroundColor: '#080808', logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `bioneer-${score}.png`;
      a.click();
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    const id = sessionData.id;
    if (id) {
      const url = `${window.location.origin}/session/${id}/public`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <>
      {/* Off-screen card for capture */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <div ref={cardRef}>
          <ShareCardContent
            sessionData={sessionData}
            score={score}
            exerciseName={exerciseName}
            date={date}
            repScores={repScores}
            topFault={topFault}
          />
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={captureAndShare}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2.5 rounded border text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50"
          style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: COLORS.goldDim, fontFamily: FONT.mono }}
        >
          <Share2 size={12} />
          {sharing ? 'CAPTURING...' : 'SHARE SESSION'}
        </button>

        <button
          onClick={handleDownload}
          disabled={sharing}
          className="flex items-center gap-2 px-3 py-2.5 rounded border text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50"
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary, fontFamily: FONT.mono }}
        >
          <Download size={12} />
          PNG
        </button>

        {sessionData.id && (
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-2.5 rounded border text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{ borderColor: COLORS.border, color: copied ? COLORS.correct : COLORS.textSecondary, fontFamily: FONT.mono }}
          >
            <Link size={12} />
            {copied ? 'COPIED!' : 'LINK'}
          </button>
        )}
      </div>
    </>
  );
}