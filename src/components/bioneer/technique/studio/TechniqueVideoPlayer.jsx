/**
 * TechniqueVideoPlayer
 * Displays video + synchronized pose overlay + coach annotations
 * Responsive canvas overlay for both playback and annotation
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { drawSkeleton } from '../../canvasRenderer';
import { renderAnnotation } from './useAnnotationEditor';
import { COLORS, FONT } from '../../ui/DesignTokens';

export default function TechniqueVideoPlayer({
  videoUrl,
  poseFrames,
  annotations,
  currentFrameIndex,
  isPlaying,
  showSkeleton,
  showJointLabels,
  showAngleLabels,
  showAnnotations,
  onTimeUpdate,
  onLoadedMetadata,
  videoRef: externalVideoRef,
  activeTool,
  onAnnotationCreate,
}) {
  const internalVideoRef = useRef(null);
  // Use external ref if provided, otherwise use internal
  const videoRef = externalVideoRef || internalVideoRef;
  const overlayCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);

  /**
   * Get pose frame closest to current frame index
   */
  const getCurrentPoseFrame = useCallback(() => {
    if (!Array.isArray(poseFrames) || currentFrameIndex >= poseFrames.length) {
      return null;
    }
    return poseFrames[currentFrameIndex];
  }, [poseFrames, currentFrameIndex]);

  /**
   * Get annotations for current frame
   */
  const getFrameAnnotations = useCallback(() => {
    if (!Array.isArray(annotations)) return [];
    return annotations.filter(a => a.frameIndex === currentFrameIndex);
  }, [annotations, currentFrameIndex]);

  /**
   * Render overlay: skeleton + annotations (with null guards)
   */
  const renderOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    if (!video || !canvas) return;

    // Update canvas size to match video
    canvas.width = video.videoWidth || video.offsetWidth;
    canvas.height = video.videoHeight || video.offsetHeight;

    setVideoSize({ width: canvas.width, height: canvas.height });

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Guard against getContext failure

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw skeleton if enabled (with safe frame access)
    if (showSkeleton) {
      const poseFrame = getCurrentPoseFrame();
      if (poseFrame && poseFrame.landmarks && Array.isArray(poseFrame.landmarks) && poseFrame.landmarks.length > 0) {
        drawSkeleton(ctx, poseFrame.landmarks, [], canvas.width, canvas.height);

        // Draw angle labels if enabled (guard against missing angles)
        if (showAngleLabels && poseFrame.angles) {
          drawAngleLabels(ctx, poseFrame.angles, poseFrame.landmarks);
        }
      }
    }

    // Draw annotations if enabled (with safe array access)
    if (showAnnotations) {
      const frameAnnotations = getFrameAnnotations();
      if (Array.isArray(frameAnnotations)) {
        frameAnnotations.forEach(ann => {
          renderAnnotation(ctx, ann, canvas.width, canvas.height);
        });
      }
    }

    // Draw frame counter (safe totalFrames access)
    const totalFrames = Array.isArray(poseFrames) ? poseFrames.length : 0;
    drawFrameInfo(ctx, currentFrameIndex, totalFrames, canvas.width);
  }, [
    showSkeleton,
    showAngleLabels,
    showAnnotations,
    currentFrameIndex,
    poseFrames,
    getCurrentPoseFrame,
    getFrameAnnotations,
  ]);

  /**
   * Render on every frame update
   */
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(renderOverlay);
    } else {
      // Render once when paused
      renderOverlay();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, renderOverlay]);

  /**
   * Handle video metadata loaded
   */
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });
    }
    onLoadedMetadata?.();
  }, [onLoadedMetadata]);

  /**
   * Handle time update
   */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      onTimeUpdate?.(video.currentTime);
    }
  }, [onTimeUpdate]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3" style={{ background: '#1a1a1a' }}>
          <p className="text-sm font-medium" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            No video available
          </p>
          <p className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Session may not have video data
          </p>
        </div>
      )}

      {/* Overlay Canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}

/**
 * Draw angle labels on the canvas
 */
function drawAngleLabels(ctx, angles, landmarks) {
  ctx.font = '10px monospace';
  ctx.fillStyle = '#C9A84C';

  // Map common angle names to joint indices (simplified example)
  const angleLabels = [
    { name: 'L.Knee', value: angles.kneeLeft, idx: 26 },
    { name: 'R.Knee', value: angles.kneeRight, idx: 25 },
    { name: 'L.Hip', value: angles.hipLeft, idx: 24 },
    { name: 'R.Hip', value: angles.hipRight, idx: 23 },
    { name: 'L.Elbow', value: angles.elbowLeft, idx: 14 },
    { name: 'R.Elbow', value: angles.elbowRight, idx: 13 },
  ];

  angleLabels.forEach(({ name, value, idx }) => {
    if (value !== undefined && idx < landmarks.length) {
      const lm = landmarks[idx];
      if (lm && lm.x !== undefined && lm.y !== undefined) {
        ctx.fillText(`${name}: ${Math.round(value)}°`, lm.x + 5, lm.y - 5);
      }
    }
  });
}

/**
 * Draw frame info (counter + timestamp)
 */
function drawFrameInfo(ctx, frameIndex, totalFrames, canvasWidth) {
  const text = `Frame: ${frameIndex + 1}/${totalFrames}`;
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(201, 168, 76, 0.8)';
  ctx.fillText(text, 10, canvasWidth > 640 ? 25 : 15);
}