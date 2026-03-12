/**
 * useAnnotationEditor Hook
 * Manages coach annotations: drawing tools, angle measurement, timeline markers
 * Persists annotations to TechniqueSession
 */

import { useState, useCallback, useRef } from 'react';

export const ANNOTATION_TYPES = {
  LINE: 'line',
  ARROW: 'arrow',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  FREEHAND: 'freehand',
  ANGLE_MARKER: 'angle_marker',
  TEXT_LABEL: 'text_label',
  SPOTLIGHT: 'spotlight',
};

export const TOOLS = {
  POINTER: 'pointer',
  LINE: 'line',
  ARROW: 'arrow',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  FREEHAND: 'freehand',
  ANGLE: 'angle',
  TEXT: 'text',
  SPOTLIGHT: 'spotlight',
  ERASE: 'erase',
};

/**
 * Create a unique annotation ID
 */
function createAnnotationId() {
  return `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * useAnnotationEditor — full annotation lifecycle
 */
export function useAnnotationEditor() {
  const [activeTool, setActiveTool] = useState(TOOLS.POINTER);
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotationDraft, setCurrentAnnotationDraft] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);

  // For angle measurement (3-point selection)
  const [anglePoints, setAnglePoints] = useState([]);

  // Undo/redo stacks
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  /**
   * Add annotation to frame or time range
   */
  const addAnnotation = useCallback((annotation) => {
    const newAnnotation = {
      id: createAnnotationId(),
      createdAt: new Date().toISOString(),
      ...annotation,
    };

    setAnnotations(prev => [...prev, newAnnotation]);

    // Save to undo stack
    undoStackRef.current.push([...annotations, newAnnotation]);
    redoStackRef.current = [];

    return newAnnotation;
  }, [annotations]);

  /**
   * Update existing annotation
   */
  const updateAnnotation = useCallback((annotationId, updates) => {
    setAnnotations(prev => {
      const updated = prev.map(a => a.id === annotationId ? { ...a, ...updates } : a);
      undoStackRef.current.push(updated);
      redoStackRef.current = [];
      return updated;
    });
  }, []);

  /**
   * Delete annotation by ID
   */
  const deleteAnnotation = useCallback((annotationId) => {
    setAnnotations(prev => {
      const filtered = prev.filter(a => a.id !== annotationId);
      undoStackRef.current.push(filtered);
      redoStackRef.current = [];
      return filtered;
    });
  }, []);

  /**
   * Clear all annotations on a frame
   */
  const clearFrameAnnotations = useCallback((frameIndex) => {
    setAnnotations(prev => {
      const filtered = prev.filter(a => a.frameIndex !== frameIndex);
      undoStackRef.current.push(filtered);
      redoStackRef.current = [];
      return filtered;
    });
  }, []);

  /**
   * Clear all annotations globally
   */
  const clearAllAnnotations = useCallback(() => {
    setAnnotations([]);
    undoStackRef.current.push([]);
    redoStackRef.current = [];
  }, []);

  /**
   * Create a line annotation
   */
  const createLine = useCallback((frameIndex, startPoint, endPoint, style = {}) => {
    return addAnnotation({
      type: ANNOTATION_TYPES.LINE,
      frameIndex,
      startPoint,
      endPoint,
      style: { color: '#C9A84C', thickness: 2, ...style },
    });
  }, [addAnnotation]);

  /**
   * Create a rectangle annotation
   */
  const createRectangle = useCallback((frameIndex, topLeft, bottomRight, style = {}) => {
    return addAnnotation({
      type: ANNOTATION_TYPES.RECTANGLE,
      frameIndex,
      topLeft,
      bottomRight,
      style: { color: '#C9A84C', thickness: 2, filled: false, ...style },
    });
  }, [addAnnotation]);

  /**
   * Create a circle annotation
   */
  const createCircle = useCallback((frameIndex, center, radius, style = {}) => {
    return addAnnotation({
      type: ANNOTATION_TYPES.CIRCLE,
      frameIndex,
      center,
      radius,
      style: { color: '#C9A84C', thickness: 2, filled: false, ...style },
    });
  }, [addAnnotation]);

  /**
   * Create a freehand drawing annotation
   */
  const createFreehand = useCallback((frameIndex, points, style = {}) => {
    return addAnnotation({
      type: ANNOTATION_TYPES.FREEHAND,
      frameIndex,
      points,
      style: { color: '#C9A84C', thickness: 2, ...style },
    });
  }, [addAnnotation]);

  /**
   * Create a text label annotation
   */
  const createTextLabel = useCallback((frameIndex, text, position, style = {}) => {
    return addAnnotation({
      type: ANNOTATION_TYPES.TEXT_LABEL,
      frameIndex,
      text,
      position,
      style: { color: '#C9A84C', fontSize: 14, ...style },
    });
  }, [addAnnotation]);

  /**
   * Create angle measurement from three joints
   * Points: { p1: {x, y}, p2: {x, y}, p3: {x, y} }
   * p2 is the vertex (angle apex)
   */
  const createAngleMeasurement = useCallback((frameIndex, points, style = {}) => {
    return addAnnotation({
      type: ANNOTATION_TYPES.ANGLE_MARKER,
      frameIndex,
      points,
      angle: calculateAngle(points.p1, points.p2, points.p3),
      style: { color: '#C9A84C', thickness: 2, ...style },
    });
  }, [addAnnotation]);

  /**
   * Add a point to angle measurement (up to 3)
   */
  const addAnglePoint = useCallback((point) => {
    if (anglePoints.length < 3) {
      setAnglePoints(prev => [...prev, point]);
    }
    return anglePoints.length < 3;
  }, [anglePoints]);

  /**
   * Reset angle measurement
   */
  const resetAngleMeasurement = useCallback(() => {
    setAnglePoints([]);
  }, []);

  /**
   * Undo last annotation change
   */
  const undo = useCallback(() => {
    if (undoStackRef.current.length > 0) {
      redoStackRef.current.push(annotations);
      const prev = undoStackRef.current.pop();
      setAnnotations(prev || []);
    }
  }, [annotations]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      undoStackRef.current.push(annotations);
      const next = redoStackRef.current.pop();
      setAnnotations(next || []);
    }
  }, [annotations]);

  return {
    // State
    activeTool,
    setActiveTool,
    annotations,
    selectedAnnotationId,
    setSelectedAnnotationId,
    anglePoints,

    // Operations
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearFrameAnnotations,
    clearAllAnnotations,

    // Specific annotation types
    createLine,
    createRectangle,
    createCircle,
    createFreehand,
    createTextLabel,
    createAngleMeasurement,
    addAnglePoint,
    resetAngleMeasurement,

    // Undo/redo
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
  };
}

/**
 * Calculate angle from three points (in degrees)
 * p1 → p2 (vertex) ← p3
 */
function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cos = dot / (mag1 * mag2);
  const radians = Math.acos(Math.max(-1, Math.min(1, cos)));
  const degrees = (radians * 180) / Math.PI;

  return Math.round(degrees);
}

/**
 * Render annotation on canvas context
 */
export function renderAnnotation(ctx, annotation, canvasWidth, canvasHeight) {
  if (!annotation) return;

  const { type, style = {} } = annotation;
  const color = style.color || '#C9A84C';
  const thickness = style.thickness || 2;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case ANNOTATION_TYPES.LINE:
      drawLine(ctx, annotation.startPoint, annotation.endPoint);
      break;

    case ANNOTATION_TYPES.ARROW:
      drawArrow(ctx, annotation.startPoint, annotation.endPoint, thickness);
      break;

    case ANNOTATION_TYPES.RECTANGLE:
      drawRectangle(ctx, annotation.topLeft, annotation.bottomRight, style.filled);
      break;

    case ANNOTATION_TYPES.CIRCLE:
      drawCircle(ctx, annotation.center, annotation.radius, style.filled);
      break;

    case ANNOTATION_TYPES.FREEHAND:
      drawFreehand(ctx, annotation.points);
      break;

    case ANNOTATION_TYPES.TEXT_LABEL:
      drawText(ctx, annotation.text, annotation.position, style.fontSize || 14);
      break;

    case ANNOTATION_TYPES.ANGLE_MARKER:
      drawAngleMarker(ctx, annotation.points, annotation.angle);
      break;

    case ANNOTATION_TYPES.SPOTLIGHT:
      drawSpotlight(ctx, annotation.center, annotation.radius, canvasWidth, canvasHeight);
      break;

    default:
      break;
  }
}

function drawLine(ctx, p1, p2) {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function drawArrow(ctx, p1, p2, thickness) {
  const headlen = 15;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawRectangle(ctx, topLeft, bottomRight, filled) {
  const w = bottomRight.x - topLeft.x;
  const h = bottomRight.y - topLeft.y;

  if (filled) {
    ctx.fillRect(topLeft.x, topLeft.y, w, h);
  } else {
    ctx.strokeRect(topLeft.x, topLeft.y, w, h);
  }
}

function drawCircle(ctx, center, radius, filled) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  if (filled) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

function drawFreehand(ctx, points) {
  if (!Array.isArray(points) || points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawText(ctx, text, position, fontSize) {
  ctx.font = `${fontSize}px monospace`;
  ctx.fillText(text, position.x, position.y);
}

function drawAngleMarker(ctx, points, angle) {
  const { p1, p2, p3 } = points;

  // Draw the three lines
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.8)';
  drawLine(ctx, p1, p2);
  drawLine(ctx, p2, p3);

  // Draw angle arc
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const angle1 = Math.atan2(v1.y, v1.x);
  const angle2 = Math.atan2(v2.y, v2.x);

  const arcRadius = 30;
  ctx.beginPath();
  ctx.arc(p2.x, p2.y, arcRadius, angle1, angle2);
  ctx.stroke();

  // Draw angle text
  const midAngle = (angle1 + angle2) / 2;
  const textX = p2.x + Math.cos(midAngle) * (arcRadius + 20);
  const textY = p2.y + Math.sin(midAngle) * (arcRadius + 20);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#C9A84C';
  ctx.fillText(`${angle}°`, textX, textY);
}

function drawSpotlight(ctx, center, radius, canvasWidth, canvasHeight) {
  // Darken everything outside spotlight
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Clear spotlight circle
  ctx.clearRect(center.x - radius, center.y - radius, radius * 2, radius * 2);

  // Draw spotlight border
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}