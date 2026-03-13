/**
 * useAnnotationEditor Hook
 * Full interactive annotation lifecycle: drawing, selection, move, undo/redo
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

function createAnnotationId() {
  return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

// ── Hit testing ─────────────────────────────────────────────────────────────

function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function hitTest(annotation, point, threshold = 10) {
  const { type } = annotation;
  const { x, y } = point;

  switch (type) {
    case ANNOTATION_TYPES.LINE:
    case ANNOTATION_TYPES.ARROW: {
      const { startPoint: s, endPoint: e } = annotation;
      if (!s || !e) return false;
      return distPointToSegment(x, y, s.x, s.y, e.x, e.y) <= threshold;
    }
    case ANNOTATION_TYPES.RECTANGLE: {
      const { topLeft: tl, bottomRight: br } = annotation;
      if (!tl || !br) return false;
      const inside = x >= tl.x && x <= br.x && y >= tl.y && y <= br.y;
      if (inside) return true;
      // edges
      return (
        distPointToSegment(x, y, tl.x, tl.y, br.x, tl.y) <= threshold ||
        distPointToSegment(x, y, br.x, tl.y, br.x, br.y) <= threshold ||
        distPointToSegment(x, y, br.x, br.y, tl.x, br.y) <= threshold ||
        distPointToSegment(x, y, tl.x, br.y, tl.x, tl.y) <= threshold
      );
    }
    case ANNOTATION_TYPES.CIRCLE:
    case ANNOTATION_TYPES.SPOTLIGHT: {
      const { center, radius } = annotation;
      if (!center || radius == null) return false;
      const dist = Math.hypot(x - center.x, y - center.y);
      return Math.abs(dist - radius) <= threshold || dist <= threshold;
    }
    case ANNOTATION_TYPES.FREEHAND: {
      const { points } = annotation;
      if (!Array.isArray(points) || points.length < 2) return false;
      for (let i = 0; i < points.length - 1; i++) {
        if (distPointToSegment(x, y, points[i].x, points[i].y, points[i+1].x, points[i+1].y) <= threshold) return true;
      }
      return false;
    }
    case ANNOTATION_TYPES.TEXT_LABEL: {
      const { position } = annotation;
      if (!position) return false;
      return Math.hypot(x - position.x, y - position.y) <= 40;
    }
    case ANNOTATION_TYPES.ANGLE_MARKER: {
      const { points: pts } = annotation;
      if (!pts) return false;
      return (
        distPointToSegment(x, y, pts.p1.x, pts.p1.y, pts.p2.x, pts.p2.y) <= threshold ||
        distPointToSegment(x, y, pts.p2.x, pts.p2.y, pts.p3.x, pts.p3.y) <= threshold
      );
    }
    default:
      return false;
  }
}

// ── Calculate angle ──────────────────────────────────────────────────────────

function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  return Math.round((Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180) / Math.PI);
}

// ── Move annotation by delta ─────────────────────────────────────────────────

function translateAnnotation(ann, dx, dy) {
  switch (ann.type) {
    case ANNOTATION_TYPES.LINE:
    case ANNOTATION_TYPES.ARROW:
      return {
        ...ann,
        startPoint: { x: ann.startPoint.x + dx, y: ann.startPoint.y + dy },
        endPoint:   { x: ann.endPoint.x + dx,   y: ann.endPoint.y + dy },
      };
    case ANNOTATION_TYPES.RECTANGLE:
      return {
        ...ann,
        topLeft:     { x: ann.topLeft.x + dx,     y: ann.topLeft.y + dy },
        bottomRight: { x: ann.bottomRight.x + dx, y: ann.bottomRight.y + dy },
      };
    case ANNOTATION_TYPES.CIRCLE:
    case ANNOTATION_TYPES.SPOTLIGHT:
      return { ...ann, center: { x: ann.center.x + dx, y: ann.center.y + dy } };
    case ANNOTATION_TYPES.FREEHAND:
      return { ...ann, points: ann.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
    case ANNOTATION_TYPES.TEXT_LABEL:
      return { ...ann, position: { x: ann.position.x + dx, y: ann.position.y + dy } };
    case ANNOTATION_TYPES.ANGLE_MARKER:
      return {
        ...ann,
        points: {
          p1: { x: ann.points.p1.x + dx, y: ann.points.p1.y + dy },
          p2: { x: ann.points.p2.x + dx, y: ann.points.p2.y + dy },
          p3: { x: ann.points.p3.x + dx, y: ann.points.p3.y + dy },
        },
      };
    default:
      return ann;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAnnotationEditor() {
  const [activeTool, setActiveTool] = useState(TOOLS.POINTER);
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [currentAnnotationDraft, setCurrentAnnotationDraft] = useState(null);

  // Angle tool: 3-point collection
  const anglePointsRef = useRef([]);
  const [anglePoints, setAnglePoints] = useState([]);

  // Drag state for pointer tool
  const dragRef = useRef(null); // { annotationId, startX, startY, origAnnotation }

  // Interaction drawing state
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef(null);
  const freehandPointsRef = useRef([]);

  // Undo/redo
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  // ── Commit helpers ─────────────────────────────────────────────────────────

  const pushToUndo = useCallback((prevAnnotations) => {
    undoStackRef.current.push(prevAnnotations);
    redoStackRef.current = [];
  }, []);

  const commitAnnotation = useCallback((annotation) => {
    const newAnn = { id: createAnnotationId(), createdAt: new Date().toISOString(), ...annotation };
    setAnnotations(prev => {
      pushToUndo(prev);
      return [...prev, newAnn];
    });
    return newAnn;
  }, [pushToUndo]);

  // ── Load annotations from draft/history ────────────────────────────────────

  const loadAnnotations = useCallback((initial) => {
    let flat = [];
    if (Array.isArray(initial)) {
      flat = initial;
    } else if (initial && Array.isArray(initial.frames)) {
      flat = initial.frames.flat();
    }
    setAnnotations(flat);
    undoStackRef.current = [];
    redoStackRef.current = [];
  }, []);

  // ── Interaction lifecycle ──────────────────────────────────────────────────

  const beginInteraction = useCallback((tool, frameIndex, point) => {
    if (tool === TOOLS.POINTER) {
      // Hit test for selection or drag start
      return; // handled in selectAnnotation / drag logic
    }

    if (tool === TOOLS.TEXT) return; // handled via click

    if (tool === TOOLS.ANGLE) {
      const newPts = [...anglePointsRef.current, point];
      anglePointsRef.current = newPts;
      setAnglePoints([...newPts]);
      if (newPts.length === 3) {
        commitAnnotation({
          type: ANNOTATION_TYPES.ANGLE_MARKER,
          frameIndex,
          points: { p1: newPts[0], p2: newPts[1], p3: newPts[2] },
          angle: calculateAngle(newPts[0], newPts[1], newPts[2]),
          style: { color: '#C9A84C', thickness: 2 },
        });
        anglePointsRef.current = [];
        setAnglePoints([]);
      }
      return;
    }

    isDrawingRef.current = true;
    drawStartRef.current = point;

    if (tool === TOOLS.FREEHAND) {
      freehandPointsRef.current = [point];
      setCurrentAnnotationDraft({
        type: ANNOTATION_TYPES.FREEHAND,
        frameIndex,
        points: [point],
        style: { color: '#C9A84C', thickness: 2 },
      });
    } else {
      setCurrentAnnotationDraft(null);
    }
  }, [commitAnnotation]);

  const updateInteraction = useCallback((tool, frameIndex, point) => {
    if (!isDrawingRef.current) return;
    const start = drawStartRef.current;
    if (!start) return;

    switch (tool) {
      case TOOLS.LINE:
        setCurrentAnnotationDraft({
          type: ANNOTATION_TYPES.LINE,
          frameIndex,
          startPoint: start,
          endPoint: point,
          style: { color: '#C9A84C', thickness: 2 },
        });
        break;
      case TOOLS.ARROW:
        setCurrentAnnotationDraft({
          type: ANNOTATION_TYPES.ARROW,
          frameIndex,
          startPoint: start,
          endPoint: point,
          style: { color: '#C9A84C', thickness: 2 },
        });
        break;
      case TOOLS.RECTANGLE:
        setCurrentAnnotationDraft({
          type: ANNOTATION_TYPES.RECTANGLE,
          frameIndex,
          topLeft:     { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y) },
          bottomRight: { x: Math.max(start.x, point.x), y: Math.max(start.y, point.y) },
          style: { color: '#C9A84C', thickness: 2, filled: false },
        });
        break;
      case TOOLS.CIRCLE:
      case TOOLS.SPOTLIGHT: {
        const radius = Math.hypot(point.x - start.x, point.y - start.y);
        setCurrentAnnotationDraft({
          type: tool === TOOLS.SPOTLIGHT ? ANNOTATION_TYPES.SPOTLIGHT : ANNOTATION_TYPES.CIRCLE,
          frameIndex,
          center: start,
          radius,
          style: { color: '#C9A84C', thickness: 2 },
        });
        break;
      }
      case TOOLS.FREEHAND: {
        const pts = [...freehandPointsRef.current, point];
        freehandPointsRef.current = pts;
        setCurrentAnnotationDraft({
          type: ANNOTATION_TYPES.FREEHAND,
          frameIndex,
          points: pts,
          style: { color: '#C9A84C', thickness: 2 },
        });
        break;
      }
      default:
        break;
    }
  }, []);

  const finishInteraction = useCallback((tool, frameIndex, point) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const start = drawStartRef.current;
    drawStartRef.current = null;

    const minDist = 4;

    switch (tool) {
      case TOOLS.LINE:
        if (start && Math.hypot(point.x - start.x, point.y - start.y) >= minDist) {
          commitAnnotation({ type: ANNOTATION_TYPES.LINE, frameIndex, startPoint: start, endPoint: point, style: { color: '#C9A84C', thickness: 2 } });
        }
        break;
      case TOOLS.ARROW:
        if (start && Math.hypot(point.x - start.x, point.y - start.y) >= minDist) {
          commitAnnotation({ type: ANNOTATION_TYPES.ARROW, frameIndex, startPoint: start, endPoint: point, style: { color: '#C9A84C', thickness: 2 } });
        }
        break;
      case TOOLS.RECTANGLE:
        if (start && Math.abs(point.x - start.x) >= minDist && Math.abs(point.y - start.y) >= minDist) {
          commitAnnotation({
            type: ANNOTATION_TYPES.RECTANGLE, frameIndex,
            topLeft: { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y) },
            bottomRight: { x: Math.max(start.x, point.x), y: Math.max(start.y, point.y) },
            style: { color: '#C9A84C', thickness: 2, filled: false },
          });
        }
        break;
      case TOOLS.CIRCLE: {
        const r = start ? Math.hypot(point.x - start.x, point.y - start.y) : 0;
        if (r >= minDist) commitAnnotation({ type: ANNOTATION_TYPES.CIRCLE, frameIndex, center: start, radius: r, style: { color: '#C9A84C', thickness: 2 } });
        break;
      }
      case TOOLS.SPOTLIGHT: {
        const r2 = start ? Math.hypot(point.x - start.x, point.y - start.y) : 0;
        if (r2 >= minDist) commitAnnotation({ type: ANNOTATION_TYPES.SPOTLIGHT, frameIndex, center: start, radius: r2, style: { color: '#C9A84C', thickness: 2 } });
        break;
      }
      case TOOLS.FREEHAND: {
        const pts = freehandPointsRef.current;
        if (pts.length >= 2) {
          commitAnnotation({ type: ANNOTATION_TYPES.FREEHAND, frameIndex, points: pts, style: { color: '#C9A84C', thickness: 2 } });
        }
        freehandPointsRef.current = [];
        break;
      }
      default:
        break;
    }
    setCurrentAnnotationDraft(null);
  }, [commitAnnotation]);

  const cancelInteraction = useCallback(() => {
    isDrawingRef.current = false;
    drawStartRef.current = null;
    freehandPointsRef.current = [];
    anglePointsRef.current = [];
    setAnglePoints([]);
    setCurrentAnnotationDraft(null);
  }, []);

  // ── Selection and move ─────────────────────────────────────────────────────

  const hitTestAnnotation = useCallback((frameIndex, point) => {
    const frameAnns = annotations.filter(a => a.frameIndex === frameIndex);
    // Test in reverse order (topmost first)
    for (let i = frameAnns.length - 1; i >= 0; i--) {
      if (hitTest(frameAnns[i], point)) return frameAnns[i].id;
    }
    return null;
  }, [annotations]);

  const selectAnnotation = useCallback((id) => {
    setSelectedAnnotationId(id);
  }, []);

  const beginDrag = useCallback((annotationId, point) => {
    const ann = annotations.find(a => a.id === annotationId);
    if (!ann) return;
    dragRef.current = { annotationId, startX: point.x, startY: point.y, origAnnotation: ann };
  }, [annotations]);

  const updateDrag = useCallback((point) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const moved = translateAnnotation(drag.origAnnotation, dx, dy);
    setAnnotations(prev => prev.map(a => a.id === drag.annotationId ? moved : a));
  }, []);

  const finishDrag = useCallback(() => {
    if (!dragRef.current) return;
    const { origAnnotation } = dragRef.current;
    // Push original to undo before drag
    setAnnotations(prev => {
      pushToUndo(prev.map(a => a.id === origAnnotation.id ? origAnnotation : a));
      return prev; // keep current (already updated by updateDrag)
    });
    dragRef.current = null;
  }, [pushToUndo]);

  const deleteSelectedAnnotation = useCallback(() => {
    if (!selectedAnnotationId) return;
    setAnnotations(prev => {
      pushToUndo(prev);
      return prev.filter(a => a.id !== selectedAnnotationId);
    });
    setSelectedAnnotationId(null);
  }, [selectedAnnotationId, pushToUndo]);

  // ── Text placement ─────────────────────────────────────────────────────────

  const placeText = useCallback((frameIndex, point) => {
    const text = window.prompt('Enter coaching note:');
    if (text && text.trim()) {
      commitAnnotation({
        type: ANNOTATION_TYPES.TEXT_LABEL,
        frameIndex,
        text: text.trim(),
        position: point,
        style: { color: '#C9A84C', fontSize: 14 },
      });
    }
  }, [commitAnnotation]);

  // ── Batch operations ───────────────────────────────────────────────────────

  const clearFrameAnnotations = useCallback((frameIndex) => {
    setAnnotations(prev => {
      pushToUndo(prev);
      return prev.filter(a => a.frameIndex !== frameIndex);
    });
  }, [pushToUndo]);

  const clearAllAnnotations = useCallback(() => {
    setAnnotations(prev => {
      pushToUndo(prev);
      return [];
    });
  }, [pushToUndo]);

  const deleteAnnotation = useCallback((id) => {
    setAnnotations(prev => {
      pushToUndo(prev);
      return prev.filter(a => a.id !== id);
    });
  }, [pushToUndo]);

  const updateAnnotation = useCallback((id, updates) => {
    setAnnotations(prev => {
      pushToUndo(prev);
      return prev.map(a => a.id === id ? { ...a, ...updates } : a);
    });
  }, [pushToUndo]);

  // ── Undo/redo ──────────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    setAnnotations(prev => {
      redoStackRef.current.push(prev);
      return undoStackRef.current.pop() || [];
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    setAnnotations(prev => {
      undoStackRef.current.push(prev);
      return redoStackRef.current.pop() || [];
    });
  }, []);

  return {
    // State
    activeTool,
    setActiveTool,
    annotations,
    selectedAnnotationId,
    setSelectedAnnotationId,
    currentAnnotationDraft,
    anglePoints,
    isDrawing: isDrawingRef.current,

    // Interaction lifecycle
    beginInteraction,
    updateInteraction,
    finishInteraction,
    cancelInteraction,

    // Hit test & selection
    hitTestAnnotation,
    selectAnnotation,
    beginDrag,
    updateDrag,
    finishDrag,

    // Text
    placeText,

    // Batch ops
    loadAnnotations,
    clearFrameAnnotations,
    clearAllAnnotations,
    deleteAnnotation,
    deleteSelectedAnnotation,
    updateAnnotation,

    // Undo/redo
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
  };
}

// ── Render annotation on canvas ──────────────────────────────────────────────

export function renderAnnotation(ctx, annotation, canvasWidth, canvasHeight, selected = false) {
  if (!annotation) return;
  const { type, style = {} } = annotation;
  const color = style.color || '#C9A84C';
  const thickness = style.thickness || 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Selection glow
  if (selected) {
    ctx.shadowColor = '#C9A84C';
    ctx.shadowBlur = 8;
  }

  switch (type) {
    case ANNOTATION_TYPES.LINE:
      _drawLine(ctx, annotation.startPoint, annotation.endPoint);
      break;
    case ANNOTATION_TYPES.ARROW:
      _drawArrow(ctx, annotation.startPoint, annotation.endPoint, thickness);
      break;
    case ANNOTATION_TYPES.RECTANGLE:
      _drawRectangle(ctx, annotation.topLeft, annotation.bottomRight, style.filled);
      break;
    case ANNOTATION_TYPES.CIRCLE:
      _drawCircle(ctx, annotation.center, annotation.radius, style.filled);
      break;
    case ANNOTATION_TYPES.FREEHAND:
      _drawFreehand(ctx, annotation.points);
      break;
    case ANNOTATION_TYPES.TEXT_LABEL:
      _drawText(ctx, annotation.text, annotation.position, style.fontSize || 14);
      break;
    case ANNOTATION_TYPES.ANGLE_MARKER:
      _drawAngleMarker(ctx, annotation.points, annotation.angle);
      break;
    case ANNOTATION_TYPES.SPOTLIGHT:
      _drawSpotlight(ctx, annotation.center, annotation.radius, canvasWidth, canvasHeight);
      break;
    default:
      break;
  }

  // Selection handles
  if (selected) {
    ctx.shadowBlur = 0;
    _drawSelectionHandles(ctx, annotation);
  }

  ctx.restore();
}

function _drawLine(ctx, p1, p2) {
  if (!p1 || !p2) return;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function _drawArrow(ctx, p1, p2, thickness) {
  if (!p1 || !p2) return;
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

function _drawRectangle(ctx, tl, br, filled) {
  if (!tl || !br) return;
  const w = br.x - tl.x, h = br.y - tl.y;
  if (filled) ctx.fillRect(tl.x, tl.y, w, h);
  else ctx.strokeRect(tl.x, tl.y, w, h);
}

function _drawCircle(ctx, center, radius, filled) {
  if (!center || radius == null) return;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  if (filled) ctx.fill(); else ctx.stroke();
}

function _drawFreehand(ctx, points) {
  if (!Array.isArray(points) || points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function _drawText(ctx, text, position, fontSize) {
  if (!position || !text) return;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.fillStyle = '#C9A84C';
  // Background
  const metrics = ctx.measureText(text);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(position.x - 2, position.y - fontSize, metrics.width + 4, fontSize + 4);
  ctx.fillStyle = '#C9A84C';
  ctx.fillText(text, position.x, position.y);
}

function _drawAngleMarker(ctx, points, angle) {
  if (!points) return;
  const { p1, p2, p3 } = points;
  ctx.strokeStyle = 'rgba(201,168,76,0.85)';
  _drawLine(ctx, p1, p2);
  _drawLine(ctx, p2, p3);
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  const a1 = Math.atan2(v1.y, v1.x), a2 = Math.atan2(v2.y, v2.x);
  ctx.beginPath();
  ctx.arc(p2.x, p2.y, 28, a1, a2);
  ctx.stroke();
  const mid = (a1 + a2) / 2;
  const tx = p2.x + Math.cos(mid) * 45, ty = p2.y + Math.sin(mid) * 45;
  ctx.font = '12px monospace';
  ctx.fillStyle = '#C9A84C';
  ctx.fillText(`${angle}°`, tx, ty);
}

function _drawSpotlight(ctx, center, radius, cw, ch) {
  if (!center || radius == null) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function _drawSelectionHandles(ctx, annotation) {
  const R = 5;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 1.5;
  const drawHandle = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  switch (annotation.type) {
    case ANNOTATION_TYPES.LINE:
    case ANNOTATION_TYPES.ARROW: {
      if (annotation.startPoint) drawHandle(annotation.startPoint.x, annotation.startPoint.y);
      if (annotation.endPoint) drawHandle(annotation.endPoint.x, annotation.endPoint.y);
      break;
    }
    case ANNOTATION_TYPES.RECTANGLE: {
      const { topLeft: tl, bottomRight: br } = annotation;
      if (tl && br) {
        [tl, { x: br.x, y: tl.y }, br, { x: tl.x, y: br.y }].forEach(p => drawHandle(p.x, p.y));
      }
      break;
    }
    case ANNOTATION_TYPES.CIRCLE:
    case ANNOTATION_TYPES.SPOTLIGHT: {
      if (annotation.center) drawHandle(annotation.center.x, annotation.center.y);
      break;
    }
    case ANNOTATION_TYPES.TEXT_LABEL: {
      if (annotation.position) drawHandle(annotation.position.x, annotation.position.y);
      break;
    }
    default:
      break;
  }
}