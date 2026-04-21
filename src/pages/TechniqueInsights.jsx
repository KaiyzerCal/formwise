/**
 * AXIS Replay — Technique review surface
 * Three zones: Video (62vh), AXIS Strip, Timeline+Controls
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Eye, EyeOff, ChevronLeft, FileText, GitCompare } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { getTechniqueDraft } from '@/components/bioneer/technique/techniqueStorage';
import { normalizeToTechniqueSession } from '@/components/bioneer/technique/studio/techniqueSessionNormalizer';
import { useFrameSync } from '@/components/bioneer/technique/studio/useFrameSync';
import TechniqueVideoPlayer from '@/components/bioneer/technique/studio/TechniqueVideoPlayer';
import AxisStrip from '@/components/bioneer/technique/replay/AxisStrip';
import AxisTimeline from '@/components/bioneer/technique/replay/AxisTimeline';
import DetailsSheet from '@/components/bioneer/technique/replay/DetailsSheet';

const SPEEDS = [0.25, 0.5, 1, 2];

export default function TechniqueInsights() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [techniqueSession, setTechniqueSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [focusMode, setFocusMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const safeVideoUrl = techniqueSession?.video?.url || null;
  const safePoseFrames = Array.isArray(techniqueSession?.pose?.frames) ? techniqueSession.pose.frames : [];
  const safeFps = techniqueSession?.video?.fps || 30;

  const frameSync = useFrameSync(safePoseFrames, videoRef, safeFps);
  const currentFrameIndex = useMemo(() => {
    if (frameSync && typeof frameSync.getFrameIndexAtTime === 'function') return frameSync.getFrameIndexAtTime(currentTime);
    return 0;
  }, [currentTime, frameSync]);

  // Load session
  useEffect(() => {
    (async () => {
      setLoading(true); setLoadError(null);
      const draftId = searchParams.get('draft');
      if (!draftId) { setLoadError('No session provided'); setLoading(false); return; }
      const draft = await getTechniqueDraft(draftId);
      if (!draft) { setLoadError('Session not found'); setLoading(false); return; }
      const normalized = normalizeToTechniqueSession(draft);
      normalized.draftId = draftId;
      setTechniqueSession(normalized);
      setLoading(false);
    })();
  }, [searchParams]);

  // Timeline markers
  const timelineMarkers = useMemo(() => {
    if (!techniqueSession?.alerts) return [];
    const markers = [];
    (techniqueSession.alerts || []).forEach(alert => {
      const time = alert.timestamp || 0;
      if (!markers.find(m => Math.abs(m.time - time) < 0.5)) {
        markers.push({ time, severity: 'medium', fault: alert.joint || 'form issue' });
      }
    });
    return markers;
  }, [techniqueSession]);

  // Fault active at current time
  const faultActive = useMemo(() => {
    return timelineMarkers.some(m => Math.abs(m.time - currentTime) < 1);
  }, [timelineMarkers, currentTime]);

  const handlePlay = () => { videoRef.current?.play(); setIsPlaying(true); };
  const handlePause = () => { videoRef.current?.pause(); setIsPlaying(false); };
  const handleSeek = (t) => { if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); } };
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (loadError || !techniqueSession) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
        <p style={{ fontSize: 12, color: COLORS.fault }}>{loadError || 'Session not found'}</p>
        <button onClick={() => navigate(-1)} style={{ fontSize: 10, color: COLORS.gold, background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 6, padding: '8px 16px' }}>
          Go Back
        </button>
      </div>
    );
  }

  const exerciseId = techniqueSession.exercise_id || '';
  const exerciseName = techniqueSession.movement_name || exerciseId.replace(/_/g, ' ');
  const formScore = Math.round(techniqueSession.form_score_overall || 0);
  const topFault = (techniqueSession.top_faults || [])[0] || null;

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}>

      {/* Zone 1 — Video (62vh) */}
      <div style={{ flex: 'none', height: '62vh', background: '#000', position: 'relative' }}>
        {safeVideoUrl ? (
          <TechniqueVideoPlayer
            videoRef={videoRef} videoUrl={safeVideoUrl} poseFrames={safePoseFrames}
            annotations={[]} currentFrameIndex={currentFrameIndex} isPlaying={isPlaying}
            showSkeleton={true} showJointLabels={false} showAngleLabels={false} showAnnotations={false}
            onTimeUpdate={(t) => setCurrentTime(t)}
            onLoadedMetadata={() => { if (videoRef.current) { setDuration(videoRef.current.duration); videoRef.current.playbackRate = speed; } }}
            activeTool="pointer" selectedAnnotationId={null} currentAnnotationDraft={null} anglePoints={[]}
            onCanvasPointerDown={() => {}} onCanvasPointerMove={() => {}} onCanvasPointerUp={() => {}} onCanvasClick={() => {}}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 10, color: COLORS.textTertiary }}>No video available</p>
          </div>
        )}
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', border: 'none',
          borderRadius: 8, padding: 8, cursor: 'pointer', zIndex: 10,
        }}>
          <ChevronLeft size={16} style={{ color: COLORS.textPrimary }} />
        </button>
        {/* Fault pulse dot */}
        {faultActive && (
          <div style={{
            position: 'absolute', top: 16, right: 16, width: 10, height: 10, borderRadius: '50%',
            background: '#F59E0B', animation: 'faultPulse 1s infinite', zIndex: 10,
          }} />
        )}
        {/* Focus mode dim */}
        {focusMode && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 5 }} />
        )}
      </div>

      {/* Zone 2 — AXIS Strip */}
      <AxisStrip
        sessionId={techniqueSession.draftId || 'unknown'}
        exerciseId={exerciseId}
        exerciseName={exerciseName}
        formScore={formScore}
        topFault={topFault}
      />

      {/* Zone 3 — Timeline + Controls */}
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', minHeight: 0 }}>
        {/* Timeline */}
        <AxisTimeline
          markers={timelineMarkers} duration={duration} currentTime={currentTime}
          onSeek={handleSeek} focusMode={focusMode}
        />

        {/* Playback controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button onClick={isPlaying ? handlePause : handlePlay} style={{
            background: COLORS.gold, color: '#000', border: 'none', borderRadius: 6,
            padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {isPlaying ? <Pause size={12} /> : <Play size={12} fill="#000" />}
          </button>
          <button onClick={cycleSpeed} style={{
            background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6,
            padding: '6px 12px', cursor: 'pointer', fontSize: 9, color: COLORS.textSecondary, fontFamily: FONT.mono,
          }}>
            {speed}×
          </button>
          <button onClick={() => setFocusMode(!focusMode)} style={{
            background: focusMode ? COLORS.goldDim : 'transparent',
            border: `1px solid ${focusMode ? COLORS.goldBorder : COLORS.border}`,
            borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 9, color: focusMode ? COLORS.gold : COLORS.textSecondary, fontFamily: FONT.mono,
          }}>
            {focusMode ? <EyeOff size={10} /> : <Eye size={10} />}
            <span>Focus</span>
          </button>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => setShowDetails(true)} style={{
            flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.borderLight}`, borderRadius: 8,
            padding: '10px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
            color: COLORS.textSecondary, fontFamily: FONT.mono,
          }}>
            <FileText size={11} /> DETAILS
          </button>
          <button onClick={() => navigate(`/TechniqueCompare?exercise=${exerciseId}`)} style={{
            flex: 1, background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 8,
            padding: '10px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
            color: COLORS.gold, fontFamily: FONT.mono,
          }}>
            <GitCompare size={11} /> COMPARE
          </button>
        </div>
      </div>

      {/* Details sheet */}
      {showDetails && <DetailsSheet session={techniqueSession} onClose={() => setShowDetails(false)} />}

      <style>{`
        @keyframes faultPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}