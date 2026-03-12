/**
 * FreestyleReplay — displays recorded freestyle session with video + skeleton overlay
 * Includes timeline scrubber and playback controls
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, X } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { drawSkeleton } from '../canvasRenderer';
import { computeJointAngles } from '../poseEngine';

export default function FreestyleReplay({ session, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAngles, setCurrentAngles] = useState({});
  const [videoUrl, setVideoUrl] = useState(null);

  if (!session) return null;

  const poseFrames = session.poseFrames || [];
  const shouldDrawOverlay = !session.compositedVideo;
  const isMirroredPreview = session.isMirroredPreview === true;

  // Create blob URL once on mount
  useEffect(() => {
    if (session.videoBlob instanceof Blob) {
      const url = URL.createObjectURL(session.videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [session.videoBlob]);

  // Find pose frame closest to video time
  const getFrameAtTime = (time) => {
    const ms = time * 1000;
    let closest = null;
    let minDiff = Infinity;

    for (const frame of poseFrames) {
      const diff = Math.abs(frame.timestamp - ms);
      if (diff < minDiff) {
        minDiff = diff;
        closest = frame;
      }
    }

    return closest;
  };

  // Render skeleton overlay for current video time (works whether playing or paused)
  const renderOverlayAtTime = useCallback((time) => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;

    if (!video || !overlay) return;

    const frame = getFrameAtTime(time);
    if (!frame || !frame.landmarks) {
      setCurrentAngles({});
      return;
    }

    // Copy video dimensions to overlay canvas
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw skeleton (mirror landmarks if recorded with front camera)
      if (frame.landmarks && frame.landmarks.length > 0) {
        let landmarksToRender = frame.landmarks;
        if (isMirroredPreview) {
          landmarksToRender = frame.landmarks.map(lm => ({
            ...lm,
            x: 1 - lm.x, // Mirror horizontally
          }));
        }
        drawSkeleton(ctx, landmarksToRender, [], overlay.width, overlay.height);

        // Extract angles from frame
        const angles = frame.angles || {};
        setCurrentAngles(angles);
      }
  }, [poseFrames, getFrameAtTime]);

  // When playing, continuously render (only if not composited)
  const renderOverlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused || !shouldDrawOverlay) return;

    renderOverlayAtTime(video.currentTime);
    animationFrameRef.current = requestAnimationFrame(renderOverlay);
  }, [renderOverlayAtTime, shouldDrawOverlay]);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      // Render overlay for current frame when paused (only if not composited)
      if (shouldDrawOverlay) {
        renderOverlayAtTime(videoRef.current.currentTime);
      }
    }
  }, [renderOverlayAtTime, shouldDrawOverlay]);

  const handleLoadedMetadata = useCallback(() => {
    const duration = videoRef.current?.duration || 0;
    setDuration(duration);
    // Render first frame immediately (only if not composited)
    if (videoRef.current && shouldDrawOverlay) {
      renderOverlayAtTime(0);
    }
  }, [renderOverlayAtTime, shouldDrawOverlay]);

  const handleTimeUpdate = useCallback(() => {
    const currentTime = videoRef.current?.currentTime || 0;
    setCurrentTime(currentTime);
  }, []);

  const handleSeek = useCallback((e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Render overlay at new time immediately (only if not composited)
      if (shouldDrawOverlay) {
        renderOverlayAtTime(newTime);
      }
    }
  }, [renderOverlayAtTime, shouldDrawOverlay]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(renderOverlay);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, poseFrames]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ fontFamily: FONT.mono }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
        <h2 className="text-sm font-bold tracking-[0.1em] uppercase" style={{ color: COLORS.gold }}>
          Freestyle Replay
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
        </button>
      </div>

      {/* Video + Overlay Container */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          style={isMirroredPreview ? { transform: 'scaleX(-1)' } : {}}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {shouldDrawOverlay && (
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!isPlaying && (
            <button
              onClick={handlePlay}
              className="p-4 rounded-full bg-black/50 hover:bg-black/70 transition pointer-events-auto"
            >
              <Play className="w-8 h-8" style={{ color: COLORS.gold }} fill={COLORS.gold} />
            </button>
          )}
        </div>
      </div>

      {/* Controls & Info */}
      <div className="border-t space-y-3 px-4 py-4" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        {/* Timeline scrubber */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 rounded-lg bg-gray-700 cursor-pointer"
            style={{ accentColor: COLORS.gold }}
          />
          <div className="flex justify-between text-xs" style={{ color: COLORS.textTertiary }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-3">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Pause className="w-5 h-5" style={{ color: COLORS.gold }} />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Play className="w-5 h-5" style={{ color: COLORS.gold }} fill={COLORS.gold} />
            </button>
          )}

          {/* Current angles */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px]" style={{ color: COLORS.textSecondary }}>
            {currentAngles.kneeLeft !== undefined && (
              <div>
                <span style={{ color: COLORS.textTertiary }}>KNEE L:</span>
                <span className="ml-1" style={{ color: COLORS.gold }}>{Math.round(currentAngles.kneeLeft)}°</span>
              </div>
            )}
            {currentAngles.kneeRight !== undefined && (
              <div>
                <span style={{ color: COLORS.textTertiary }}>KNEE R:</span>
                <span className="ml-1" style={{ color: COLORS.gold }}>{Math.round(currentAngles.kneeRight)}°</span>
              </div>
            )}
            {currentAngles.hipLeft !== undefined && (
              <div>
                <span style={{ color: COLORS.textTertiary }}>HIP L:</span>
                <span className="ml-1" style={{ color: COLORS.gold }}>{Math.round(currentAngles.hipLeft)}°</span>
              </div>
            )}
            {currentAngles.hipRight !== undefined && (
              <div>
                <span style={{ color: COLORS.textTertiary }}>HIP R:</span>
                <span className="ml-1" style={{ color: COLORS.gold }}>{Math.round(currentAngles.hipRight)}°</span>
              </div>
            )}
            {currentAngles.elbowLeft !== undefined && (
              <div>
                <span style={{ color: COLORS.textTertiary }}>ELBOW L:</span>
                <span className="ml-1" style={{ color: COLORS.gold }}>{Math.round(currentAngles.elbowLeft)}°</span>
              </div>
            )}
            {currentAngles.elbowRight !== undefined && (
              <div>
                <span style={{ color: COLORS.textTertiary }}>ELBOW R:</span>
                <span className="ml-1" style={{ color: COLORS.gold }}>{Math.round(currentAngles.elbowRight)}°</span>
              </div>
            )}
          </div>
        </div>

        {/* Session metadata */}
        <div className="flex items-center justify-between text-xs" style={{ color: COLORS.textTertiary }}>
          <span>{session.category || 'unknown'}</span>
          <span>Recorded: {new Date(session.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}