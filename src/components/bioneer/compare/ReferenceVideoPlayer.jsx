/**
 * ReferenceVideoPlayer — plays a real reference video with optional
 * lightweight guide overlay (keypoints only, no full skeleton).
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Video } from 'lucide-react';
import GuideOverlayCanvas from './GuideOverlayCanvas';

export default function ReferenceVideoPlayer({
  videoUrl,
  keypoints = null,
  fps = 30,
  phases = [],
  label = 'IDEAL FORM',
  showGuides = false,
  isPlaying = false,
  videoRef: externalVideoRef,
  onTimeUpdate,
  onLoaded,
  onLandmarksChange,
}) {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = useRef(null);
  const [currentPhase, setCurrentPhase] = useState('');
  const [currentKeypoints, setCurrentKeypoints] = useState(null);

  // Sync keypoints to current video time
  const syncKeypoints = useCallback(() => {
    const video = videoRef.current;
    if (!video || !keypoints?.length) return;

    const frameIndex = Math.min(
      Math.floor(video.currentTime * fps),
      keypoints.length - 1
    );
    if (frameIndex >= 0 && keypoints[frameIndex]) {
      setCurrentKeypoints(keypoints[frameIndex]);
      onLandmarksChange?.(keypoints[frameIndex]);
    }

    // Find current phase
    if (phases.length) {
      let active = phases[0];
      for (const p of phases) {
        if (p.frame_index <= frameIndex) active = p;
        else break;
      }
      setCurrentPhase(active?.label || active?.phase || '');
    }
  }, [keypoints, fps, phases, videoRef, onLandmarksChange]);

  // RAF loop for keypoint sync during playback
  useEffect(() => {
    let raf;
    const loop = () => {
      syncKeypoints();
      if (isPlaying) raf = requestAnimationFrame(loop);
    };
    if (isPlaying) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, syncKeypoints]);

  // Sync on seek (when paused)
  useEffect(() => {
    if (!isPlaying) syncKeypoints();
  }, [isPlaying, syncKeypoints]);

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3"
        style={{ background: '#000' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center border"
          style={{ borderColor: COLORS.border, background: COLORS.bg }}>
          <Video size={20} strokeWidth={1.5} style={{ color: COLORS.textTertiary }} />
        </div>
        <p className="text-[10px] tracking-[0.15em] uppercase"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          No reference video
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#000' }}>
      {/* Real video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-contain"
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={() => {
          onLoaded?.();
          syncKeypoints();
        }}
        onTimeUpdate={() => {
          onTimeUpdate?.();
          if (!isPlaying) syncKeypoints();
        }}
        onSeeked={syncKeypoints}
      />

      {/* Guide overlay canvas — minimal keypoints only */}
      {showGuides && currentKeypoints && (
        <GuideOverlayCanvas
          keypoints={currentKeypoints}
          containerRef={containerRef}
        />
      )}

      {/* Label + phase */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.gold }} />
          <span className="text-[9px] tracking-[0.2em] uppercase font-bold"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            {label}
          </span>
        </div>
        {currentPhase && (
          <span className="text-[9px] tracking-[0.1em] px-2 py-1 rounded"
            style={{ background: 'rgba(0,0,0,0.7)', color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            {currentPhase}
          </span>
        )}
      </div>
    </div>
  );
}