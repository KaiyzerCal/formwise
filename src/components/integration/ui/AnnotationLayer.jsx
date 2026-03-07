import React, { useRef, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { moduleEnabled } from "../moduleRegistry";

function drawArrow(ctx, x1, y1, x2, y2) {
  const angle  = Math.atan2(y2 - y1, x2 - x1);
  const hs     = 12;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(angle - Math.PI / 7), y2 - hs * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(x2 - hs * Math.cos(angle + Math.PI / 7), y2 - hs * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

function renderAnnotation(ctx, ann, w, h) {
  ctx.strokeStyle = ann.color ?? "#C9A84C";
  ctx.fillStyle   = ann.color ?? "#C9A84C";
  ctx.lineWidth   = 2.5;
  ctx.shadowBlur  = 6;
  ctx.shadowColor = ann.color ?? "#C9A84C";

  const pts = ann.points ?? [];
  if (ann.type === "arrow" && pts.length >= 2) {
    drawArrow(ctx, pts[0].x * w, pts[0].y * h, pts[1].x * w, pts[1].y * h);
  } else if (ann.type === "line" && pts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    for (const p of pts.slice(1)) ctx.lineTo(p.x * w, p.y * h);
    ctx.stroke();
  } else if (ann.type === "circle" && pts.length >= 1) {
    const r = pts[1] ? Math.sqrt((pts[1].x - pts[0].x) ** 2 + (pts[1].y - pts[0].y) ** 2) * w : 20;
    ctx.beginPath();
    ctx.arc(pts[0].x * w, pts[0].y * h, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  if (ann.label && pts[0]) {
    ctx.font = "12px monospace";
    ctx.fillText(ann.label, pts[0].x * w + 8, pts[0].y * h - 8);
  }
}

export default function AnnotationLayer({ sessionId, currentTimeMs, editMode = false }) {
  if (!moduleEnabled("videoAnalysis")) return null;

  const canvasRef              = useRef();
  const [annotations, setAnnotations] = useState([]);
  const [drawing, setDrawing]  = useState(null);
  const [tool, setTool]        = useState("arrow");

  useEffect(() => {
    base44.entities.Annotation.filter({ session_id: sessionId }).then(setAnnotations);
  }, [sessionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const visible = annotations.filter(a => Math.abs((a.t_ms ?? 0) - (currentTimeMs ?? 0)) < 1000);
    for (const ann of visible) renderAnnotation(ctx, ann, canvas.width, canvas.height);
  }, [annotations, currentTimeMs]);

  const getPos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top)  / rect.height,
    };
  }, []);

  const onDown = useCallback((e) => {
    if (!editMode) return;
    setDrawing({ type: tool, start: getPos(e), color: "#C9A84C" });
  }, [editMode, tool, getPos]);

  const onUp = useCallback(async (e) => {
    if (!editMode || !drawing) return;
    const end = getPos(e);
    const newAnn = await base44.entities.Annotation.create({
      session_id: sessionId,
      t_ms:       currentTimeMs ?? 0,
      type:       drawing.type,
      points:     [drawing.start, end],
      color:      "#C9A84C",
    });
    setAnnotations(prev => [...prev, newAnn]);
    setDrawing(null);
  }, [editMode, drawing, getPos, sessionId, currentTimeMs]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={onDown}
      onMouseUp={onUp}
      style={{
        position:      "absolute",
        top:           0,
        left:          0,
        width:         "100%",
        height:        "100%",
        zIndex:        4,
        pointerEvents: editMode ? "auto" : "none",
        cursor:        editMode ? "crosshair" : "default",
      }}
    />
  );
}