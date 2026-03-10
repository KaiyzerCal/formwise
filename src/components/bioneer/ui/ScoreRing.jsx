import React from "react";
import { scoreColor } from "./DesignTokens";

export default function ScoreRing({ score, size = 80, strokeWidth = 4, label, fontSize = 24 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold" style={{ fontSize, color }}>{score}</span>
        </div>
      </div>
      {label && <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>}
    </div>
  );
}