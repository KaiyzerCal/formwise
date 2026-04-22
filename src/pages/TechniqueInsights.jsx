/**
 * TechniqueInsights — The value screen
 * 
 * PHILOSOPHY: Make coaching actionable, not technical
 * - Video player (70% of height)
 * - Timeline with severity markers
 * - Insight cards (short title + simple fix)
 * - Controls: Replay Coaching, Focus Mode
 * - Metrics hidden by default (expand only)
 * 
 * GOAL: User feels like they're getting a coaching session, not analyzing data
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { getTechniqueDraft } from '@/components/bioneer/technique/techniqueStorage';
import { normalizeToTechniqueSession } from '@/components/bioneer/technique/studio/techniqueSessionNormalizer';
import { useFrameSync } from '@/components/bioneer/technique/studio/useFrameSync';
import TechniqueVideoPlayer from '@/components/bioneer/technique/studio/TechniqueVideoPlayer';
import { ChevronDown, Play, Maximize2, X } from 'lucide-react';

export default function TechniqueInsights() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Session state
  const [techniqueSession, setTechniqueSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // UI
  const [focusMode, setFocusMode] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  // Derived
  const safeVideoUrl = techniqueSession?.video?.url || null;
  const safePoseFrames = Array.isArray(techniqueSession?.pose?.frames)
    ? techniqueSession.pose.frames
    : [];
  const safeFps = techniqueSession?.video?.fps || 30;

  const frameSync = useFrameSync(safePoseFrames, videoRef, safeFps);

  const currentFrameIndex = useMemo(() => {
    if (frameSync && typeof frameSync.getFrameIndexAtTime === 'function') {
      return frameSync.getFrameIndexAtTime(currentTime);
    }
    return 0;
  }, [currentTime, frameSync]);

  // Load session
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const draftId = searchParams.get('draft');
        if (!draftId) {
          setLoadError('No session provided');
          setLoading(false);
          return;
        }
        const draft = await getTechniqueDraft(draftId);
        if (!draft) {
          setLoadError('Session not found');
          setLoading(false);
          return;
        }
        const normalized = normalizeToTechniqueSession(draft);
        setTechniqueSession(normalized);
      } catch (err) {
        setLoadError(err?.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  // Extract insight cards from session faults
  const insightCards = useMemo(() => {
    if (!techniqueSession?.top_faults) return [];
    
    // Map faults to human-readable coaching insights
    const faultTips = {
      knee_valgus: { title: 'Knee Alignment', tip: 'Drive knees out, do not let them collapse inward' },
      early_extension: { title: 'Hip Extension', tip: 'Keep hips loaded longer, extend powerfully at end' },
      excessive_lean: { title: 'Torso Position', tip: 'Maintain upright chest, minimize forward lean' },
      asymmetry: { title: 'Balance', tip: 'Check weight distribution between both sides' },
      depth_loss: { title: 'Range of Motion', tip: 'Achieve full range of motion on each rep' },
      ankle_roll: { title: 'Foot Position', tip: 'Keep feet stable, weight in heels' },
    };

    return techniqueSession.top_faults
      .slice(0, focusMode ? 2 : 3)
      .map(fault => ({
        id: fault,
        ...faultTips[fault] || {
          title: fault.replace(/_/g, ' '),
          tip: 'Work on improving this area',
        },
      }));
  }, [techniqueSession, focusMode]);

  // Timeline markers (severity)
  const timelineMarkers = useMemo(() => {
    if (!techniqueSession?.alerts) return [];
    
    // Group alerts by time, determine severity
    const markers = [];
    techniqueSession.alerts.forEach(alert => {
      const time = alert.timestamp || 0;
      const existing = markers.find(m => Math.abs(m.time - time) < 0.5);
      if (!existing) {
        markers.push({
          time,
          severity: 'medium', // Could be enhanced with actual severity data
        });
      }
    });
    return markers;
  }, [techniqueSession]);

  // Playback handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimeUpdate = (time) => setCurrentTime(time);
  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-slate-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            Loading technique insights
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !techniqueSession) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
        <div className="max-w-sm text-center">
          <p className="text-sm font-bold mb-2" style={{ color: COLORS.fault, fontFamily: FONT.mono }}>
            {loadError || 'Session not found'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 rounded text-xs font-bold"
            style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}` }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden"
      style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <div>
          <h1 className="text-xs tracking-[0.18em] uppercase font-bold" style={{ color: COLORS.gold }}>
            Technique Review
          </h1>
          <p className="text-[8px] tracking-[0.1em] mt-0.5" style={{ color: COLORS.textTertiary }}>
            Coaching insights
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded hover:bg-white/10 transition"
        >
          <X size={18} style={{ color: COLORS.textSecondary }} />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Video player (70% of viewport) */}
        {safeVideoUrl && (
          <div className="flex-shrink-0 h-[70vh] bg-black border-b" style={{ borderColor: COLORS.border }}>
            <TechniqueVideoPlayer
              videoRef={videoRef}
              videoUrl={safeVideoUrl}
              poseFrames={safePoseFrames}
              annotations={[]}
              currentFrameIndex={currentFrameIndex}
              isPlaying={isPlaying}
              showSkeleton={true}
              showJointLabels={false}
              showAngleLabels={false}
              showAnnotations={false}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              activeTool="pointer"
              selectedAnnotationId={null}
              currentAnnotationDraft={null}
              anglePoints={[]}
              onCanvasPointerDown={() => {}}
              onCanvasPointerMove={() => {}}
              onCanvasPointerUp={() => {}}
              onCanvasClick={() => {}}
            />
          </div>
        )}

        {/* Timeline with markers */}
        {timelineMarkers.length > 0 && duration > 0 && (
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: COLORS.border }}>
            <div className="flex-1 h-6 relative rounded bg-black/30">
              {timelineMarkers.map((marker, i) => {
                const pct = (marker.time / duration) * 100;
                return (
                  <button
                    key={i}
                    onClick={() => handleSeek(marker.time)}
                    className="absolute w-2 h-2 top-2 transform -translate-x-1/2 rounded-full hover:scale-150 transition"
                    style={{
                      left: `${pct}%`,
                      background: marker.severity === 'high' ? COLORS.fault : COLORS.warning,
                    }}
                    title={`Issue at ${Math.round(marker.time)}s`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Playback controls */}
        <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: COLORS.border }}>
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="p-2 rounded bg-white/10 hover:bg-white/20 transition"
          >
            <Play
              size={16}
              style={{ color: COLORS.gold }}
              fill={COLORS.gold}
            />
          </button>
          <div className="flex-1 text-[9px]" style={{ color: COLORS.textSecondary }}>
            {Math.round(currentTime)}s / {Math.round(duration)}s
          </div>
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="px-2 py-1 rounded text-[9px] font-bold border transition"
            style={{
              background: focusMode ? COLORS.goldDim : 'transparent',
              borderColor: focusMode ? COLORS.goldBorder : COLORS.border,
              color: focusMode ? COLORS.gold : COLORS.textSecondary,
            }}
          >
            Focus Mode
          </button>
        </div>

        {/* Insight cards */}
        <div className="px-5 py-4 space-y-3 flex-1">
          {insightCards.length > 0 ? (
            <>
              <p className="text-[9px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
                Key Areas to Improve
              </p>
              {insightCards.map(card => (
                <div
                  key={card.id}
                  className="px-4 py-3 rounded border"
                  style={{ background: COLORS.surface, borderColor: COLORS.borderLight }}
                >
                  <h3 className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>
                    {card.title}
                  </h3>
                  <p className="text-[9px] mt-1 leading-relaxed" style={{ color: COLORS.textSecondary }}>
                    {card.tip}
                  </p>
                </div>
              ))}
              {!focusMode && insightCards.length > 2 && (
                <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                  Showing top 3. Enable Focus Mode to highlight top 2.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-20">
              <p className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                Great form! No major issues detected.
              </p>
            </div>
          )}
        </div>

        {/* Metrics section (collapsed) */}
        <div className="border-t px-5 py-0" style={{ borderColor: COLORS.border }}>
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="w-full py-3 flex items-center justify-between hover:bg-white/5 transition"
          >
            <span className="text-[9px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
              Technical Details
            </span>
            <ChevronDown
              size={14}
              style={{
                color: COLORS.textTertiary,
                transform: showMetrics ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {showMetrics && (
            <div className="px-0 py-3 space-y-2 border-t" style={{ borderColor: COLORS.border }}>
              <div className="flex justify-between text-[9px]">
                <span style={{ color: COLORS.textSecondary }}>Form Score</span>
                <span style={{ color: COLORS.gold }}>
                  {Math.round(techniqueSession.form_score_overall || 0)}%
                </span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span style={{ color: COLORS.textSecondary }}>Reps Detected</span>
                <span style={{ color: COLORS.gold }}>
                  {techniqueSession.reps_detected || 0}
                </span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span style={{ color: COLORS.textSecondary }}>Tracking Quality</span>
                <span style={{ color: COLORS.gold }}>
                  {Math.round(techniqueSession.tracking_confidence || 0)}%
                </span>
              </div>
              {techniqueSession.body_side_bias && (
                <div className="flex justify-between text-[9px]">
                  <span style={{ color: COLORS.textSecondary }}>Balance</span>
                  <span style={{ color: COLORS.gold }}>
                    {techniqueSession.body_side_bias}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}