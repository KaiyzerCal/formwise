import React, { useRef, useEffect, useCallback } from "react";
import {
  MOTION_MODEL_STYLE,
  renderMotionModelFrame,
  renderPathOverlay,
} from "./motionModelData";

export default function MotionModelCanvas({ currentFrame, highlightJoints = [], faultJoints = [], pathOverlays = [], pulseT = 0 }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;
    renderMotionModelFrame(canvas.getContext("2d"), currentFrame, MOTION_MODEL_STYLE, highlightJoints, faultJoints, pulseT);
    if (pathOverlays.length > 0 && faultJoints.length === 0) {
      const ctx = canvas.getContext("2d");
      for (const overlay of pathOverlays) {
        renderPathOverlay(ctx, overlay.points, MOTION_MODEL_STYLE);
      }
    }
  }, [currentFrame, highlightJoints, faultJoints, pathOverlays, pulseT]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Size canvas to match container
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width  = width  || 400;
    canvas.height = height || 300;
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}