/**
 * TechniqueVideoPlayer
 * Video + synchronized pose overlay + interactive coach annotation canvas
 * Supports pointer events for draw/select on desktop, tablet, and mobile
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  // Interaction props
  activeTool,
  selectedAnnotationId,
  currentAnnotationDraft,
  anglePoints,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasClick,
}) {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const overlayCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  // Detect non-pointer tools so we can enable interaction
  const isInteractive = activeTool && activeTool !== 'pointer_none';

  const getCurrentPoseFrame = useCallback(() => {
    if (!Array.isArray(poseFrames) || currentFrameIndex >= poseFrames.length) return null;
    return poseFrames[currentFrameIndex];
  }, [poseFrames, currentFrameIndex]);

  const getFrameAnnotations = useCallback(() => {
    if (!Array.isArray(annotations)) return [];
    return annotations.filter(a => a.frameIndex === currentFrameIndex);
  }, [annotations, currentFrameIndex]);

  const renderOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || video.offsetWidth;
    canvas.height = video.videoHeight || video.offsetHeight;
    setVideoSize({ width: canvas.width, height: canvas.height });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Skeleton
    if (showSkeleton) {
      const poseFrame = getCurrentPoseFrame();
      if (poseFrame?.landmarks?.length > 0) {
        drawSkeleton(ctx, poseFrame.landmarks, [], canvas.width, canvas.height);
        if (showAngleLabels && poseFrame.angles) {
          drawAngleLabels(ctx, poseFrame.angles, poseFrame.landmarks);
        }
      }
    }

    // 2. Saved annotations for this frame
    if (showAnnotations) {
      const frameAnnotations = getFrameAnnotations();
      frameAnnotations.forEach(ann => {
        renderAnnotation(ctx, ann, canvas.width, canvas.height, ann.id === selectedAnnotationId);
      });
    }

    // 3. Live draft preview while drawing
    if (currentAnnotationDraft) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.setLineDash([6, 3]);
      renderAnnotation(ctx, currentAnnotationDraft, canvas.width, canvas.height, false);
      ctx.restore();
    }

    // 4. Angle tool pending points
    if (anglePoints?.length > 0) {
      ctx.save();
      ctx.fillStyle = '#C9A84C';
      ctx.strokeStyle = '#C9A84C';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      anglePoints.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(anglePoints[i - 1].x, anglePoints[i - 1].y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // 5. Frame counter
    const totalFrames = Array.isArray(poseFrames) ? poseFrames.length : 0;
    drawFrameInfo(ctx, currentFrameIndex, totalFrames, canvas.width);
  }, [
    showSkeleton, showAngleLabels, showAnnotations,
    currentFrameIndex, poseFrames,
    getCurrentPoseFrame, getFrameAnnotations,
    currentAnnotationDraft, selectedAnnotationId, anglePoints,
  ]);

  // Render loop
  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        renderOverlay();
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      renderOverlay();
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, renderOverlay]);

  // Also re-render when draft changes (outside of RAF loop when paused)
  useEffect(() => {
    if (!isPlaying) renderOverlay();
  }, [currentAnnotationDraft, selectedAnnotationId, anglePoints]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) setVideoSize({ width: video.videoWidth, height: video.videoHeight });
    onLoadedMetadata?.();
  }, [onLoadedMetadata]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) onTimeUpdate?.(video.currentTime);
  }, [onTimeUpdate]);

  // ── Canvas coordinate helper ─────────────────────────────────────────────

  const getCanvasPoint = useCallback((e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Use canvas intrinsic size to normalize coords
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
    const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // ── Pointer event handlers ───────────────────────────────────────────────

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    overlayCanvasRef.current?.setPointerCapture?.(e.pointerId);
    const point = getCanvasPoint(e);
    onCanvasPointerDown?.(point, e);
  }, [getCanvasPoint, onCanvasPointerDown]);

  const handlePointerMove = useCallback((e) => {
    if (e.buttons === 0 && e.pressure === 0) return; // not pressing
    const point = getCanvasPoint(e);
    onCanvasPointerMove?.(point, e);
  }, [getCanvasPoint, onCanvasPointerMove]);

  const handlePointerUp = useCallback((e) => {
    const point = getCanvasPoint(e);
    onCanvasPointerUp?.(point, e);
  }, [getCanvasPoint, onCanvasPointerUp]);

  const handlePointerLeave = useCallback((e) => {
    // Treat leave as pointer up to avoid stuck drawing
    const point = getCanvasPoint(e);
    onCanvasPointerUp?.(point, e);
  }, [getCanvasPoint, onCanvasPointerUp]);

  const handleClick = useCallback((e) => {
    const point = getCanvasPoint(e);
    onCanvasClick?.(point, e);
  }, [getCanvasPoint, onCanvasClick]);

  // Cursor style by tool
  const cursorMap = {
    pointer: 'default',
    line: 'crosshair',
    arrow: 'crosshair',
    rectangle: 'crosshair',
    circle: 'crosshair',
    freehand: 'crosshair',
    text: 'text',
    spotlight: 'crosshair',
    angle: 'crosshair',
    erase: 'cell',
  };
  const cursor = cursorMap[activeTool] || 'default';

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
          <p className="text-sm font-medium" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>No video available</p>
          <p className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Session may not have video data</p>
        </div>
      )}

      {/* Interactive Overlay Canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ cursor, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />
    </div>
  );
}

function drawAngleLabels(ctx, angles, landmarks) {
  ctx.font = '10px monospace';
  ctx.fillStyle = '#C9A84C';
  const labels = [
    { name: 'L.Knee', value: angles.kneeLeft,    idx: 26 },
    { name: 'R.Knee', value: angles.kneeRight,   idx: 25 },
    { name: 'L.Hip',  value: angles.hipLeft,     idx: 24 },
    { name: 'R.Hip',  value: angles.hipRight,    idx: 23 },
    { name: 'L.Elbow',value: angles.elbowLeft,   idx: 14 },
    { name: 'R.Elbow',value: angles.elbowRight,  idx: 13 },
  ];
  labels.forEach(({ name, value, idx }) => {
    if (value !== undefined && idx < landmarks.length) {
      const lm = landmarks[idx];
      if (lm?.x !== undefined) ctx.fillText(`${name}: ${Math.round(value)}°`, lm.x + 5, lm.y - 5);
    }
  });
}

function drawFrameInfo(ctx, frameIndex, totalFrames, canvasWidth) {
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(201,168,76,0.8)';
  ctx.fillText(`Frame: ${frameIndex + 1}/${totalFrames}`, 10, canvasWidth > 640 ? 25 : 15);
}