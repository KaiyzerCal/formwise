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
   * Render overlay: skeleton + annotations + draft annotations (with null guards)
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

    // Draw draft annotation preview while drawing
    if (isDrawing && draftPoints.length > 0) {
      drawDraftAnnotation(ctx, draftPoints, activeTool);
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
    isDrawing,
    draftPoints,
    activeTool,
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

  /**
   * Get normalized coordinates relative to overlay
   */
  const getNormalizedCoords = useCallback((e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    return { x, y };
  }, []);

  /**
   * Handle pointer down (start drawing or place text)
   */
  const handlePointerDown = useCallback((e) => {
    if (activeTool === 'pointer' || !activeTool || isPlaying) return;

    const coords = getNormalizedCoords(e);
    if (!coords) return;

    // Text tool: create annotation immediately
    if (activeTool === 'text') {
      onAnnotationCreate?.({
        type: 'text',
        frameIndex: currentFrameIndex,
        position: coords,
      });
      return;
    }

    setIsDrawing(true);
    setDraftPoints([coords]);
  }, [activeTool, isPlaying, currentFrameIndex, getNormalizedCoords, onAnnotationCreate]);

  /**
   * Handle pointer move (draw)
   */
  const handlePointerMove = useCallback((e) => {
    if (!isDrawing) return;

    const coords = getNormalizedCoords(e);
    if (!coords) return;

    if (activeTool === 'freehand') {
      setDraftPoints(prev => [...prev, coords]);
    }
  }, [isDrawing, activeTool, getNormalizedCoords]);

  /**
   * Handle pointer up (finish drawing)
   */
  const handlePointerUp = useCallback(() => {
    if (!isDrawing || draftPoints.length === 0) {
      setIsDrawing(false);
      setDraftPoints([]);
      return;
    }

    if (activeTool === 'line' && draftPoints.length >= 2) {
      onAnnotationCreate?.({
        type: 'line',
        frameIndex: currentFrameIndex,
        startPoint: draftPoints[0],
        endPoint: draftPoints[draftPoints.length - 1],
      });
    } else if (activeTool === 'arrow' && draftPoints.length >= 2) {
      onAnnotationCreate?.({
        type: 'arrow',
        frameIndex: currentFrameIndex,
        startPoint: draftPoints[0],
        endPoint: draftPoints[draftPoints.length - 1],
      });
    } else if (activeTool === 'circle' && draftPoints.length >= 2) {
      const center = draftPoints[0];
      const end = draftPoints[draftPoints.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2));
      onAnnotationCreate?.({
        type: 'circle',
        frameIndex: currentFrameIndex,
        center,
        radius,
      });
    } else if (activeTool === 'rectangle' && draftPoints.length >= 2) {
      const topLeft = draftPoints[0];
      const bottomRight = draftPoints[draftPoints.length - 1];
      onAnnotationCreate?.({
        type: 'rectangle',
        frameIndex: currentFrameIndex,
        topLeft,
        bottomRight,
      });
    } else if (activeTool === 'freehand' && draftPoints.length > 2) {
      onAnnotationCreate?.({
        type: 'freehand',
        frameIndex: currentFrameIndex,
        points: draftPoints,
      });
    } else if (activeTool === 'angle' && draftPoints.length >= 2) {
      // Store for potential 3-point angle (simplified: use 2 points as angle visualization)
      onAnnotationCreate?.({
        type: 'angle_marker',
        frameIndex: currentFrameIndex,
        points: {
          p1: draftPoints[0],
          p2: draftPoints[Math.floor(draftPoints.length / 2)],
          p3: draftPoints[draftPoints.length - 1],
        },
      });
    }

    setIsDrawing(false);
    setDraftPoints([]);
  }, [isDrawing, draftPoints, activeTool, currentFrameIndex, onAnnotationCreate]);

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
        className={`absolute inset-0 w-full h-full object-contain ${
          activeTool && activeTool !== 'pointer' ? 'cursor-crosshair' : 'pointer-events-none'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
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

/**
 * Draw draft annotation preview while drawing
 */
function drawDraftAnnotation(ctx, points, tool) {
  if (points.length === 0) return;

  ctx.strokeStyle = 'rgba(201, 168, 76, 0.6)';
  ctx.fillStyle = 'rgba(201, 168, 76, 0.1)';
  ctx.lineWidth = 2;

  if (tool === 'freehand') {
    // Draw freehand path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  } else if (tool === 'line') {
    // Draw line preview
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  } else if (tool === 'arrow') {
    // Draw arrow preview (line + head)
    const start = points[0];
    const end = points[points.length - 1];
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headlen = 15;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  } else if (tool === 'circle' && points.length >= 1) {
    // Draw circle preview
    const center = points[0];
    const end = points[points.length - 1];
    const radius = Math.sqrt(Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2));

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === 'rectangle' && points.length >= 1) {
    // Draw rectangle preview
    const topLeft = points[0];
    const end = points[points.length - 1];
    const width = end.x - topLeft.x;
    const height = end.y - topLeft.y;

    ctx.strokeRect(topLeft.x, topLeft.y, width, height);
  } else if (tool === 'angle' && points.length >= 1) {
    // Draw angle preview
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)';
    if (points.length === 1) {
      // Just the vertex point
      ctx.fillRect(points[0].x - 3, points[0].y - 3, 6, 6);
    } else if (points.length === 2) {
      // Draw one leg
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
    }
  }
}