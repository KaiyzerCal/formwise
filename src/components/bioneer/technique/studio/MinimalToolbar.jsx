/**
 * MinimalToolbar.jsx
 * 
 * Final Cut Pro aesthetic — minimal, gesture-based
 * Hide complexity. Show only what you need.
 * 
 * Tools appear inline, no separate palette
 */

import React, { useState } from 'react';
import {
  MousePointer,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Pencil,
  Type,
  Lightbulb,
  Undo,
  Redo,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { TOOLS } from './useAnnotationEditor';

const TOOLS_ICONS = {
  [TOOLS.POINTER]: { icon: MousePointer, label: 'Select', shortcut: 'V' },
  [TOOLS.LINE]: { icon: Minus, label: 'Line', shortcut: 'L' },
  [TOOLS.ARROW]: { icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  [TOOLS.RECTANGLE]: { icon: Square, label: 'Box', shortcut: 'R' },
  [TOOLS.CIRCLE]: { icon: Circle, label: 'Circle', shortcut: 'C' },
  [TOOLS.FREEHAND]: { icon: Pencil, label: 'Draw', shortcut: 'P' },
  [TOOLS.TEXT]: { icon: Type, label: 'Text', shortcut: 'T' },
  [TOOLS.ANGLE]: { icon: null, label: 'Angle', shortcut: 'G' },
  [TOOLS.SPOTLIGHT]: { icon: Lightbulb, label: 'Highlight', shortcut: 'S' },
};

export default function MinimalToolbar({
  activeTool,
  onToolChange,
  onClearFrame,
  onClearAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showSkeleton,
  onToggleSkeleton,
  showAnnotations,
  onToggleAnnotations,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const primaryTools = [TOOLS.POINTER, TOOLS.LINE, TOOLS.ARROW, TOOLS.RECTANGLE, TOOLS.TEXT];

  return (
    <div
      className="flex flex-col items-center gap-1 p-4 border-r flex-shrink-0"
      style={{
        borderColor: COLORS.border,
        background: COLORS.surface,
        width: '64px',
      }}
    >
      {/* Logo / Brand mark */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
        style={{
          background: COLORS.goldDim,
          color: COLORS.gold,
          fontWeight: 'bold',
          fontSize: '12px',
          fontFamily: FONT.heading,
        }}
      >
        T
      </div>

      {/* Primary Tools — always visible */}
      <div className="space-y-1 w-full">
        {primaryTools.map((tool) => {
          const { icon: Icon, label } = TOOLS_ICONS[tool];
          const isActive = activeTool === tool;
          return (
            <button
              key={tool}
              onClick={() => onToolChange(tool)}
              className="w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110"
              style={{
                background: isActive ? COLORS.goldDim : 'transparent',
                borderColor: isActive ? COLORS.gold : COLORS.border,
                color: isActive ? COLORS.gold : COLORS.textSecondary,
              }}
              title={label}
            >
              {Icon ? (
                <Icon size={16} strokeWidth={1.5} />
              ) : (
                <span className="text-xs font-bold">⦝</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div
        className="w-full h-px my-1"
        style={{ background: COLORS.border }}
      />

      {/* View Toggles */}
      <div className="space-y-1 w-full">
        <button
          onClick={onToggleSkeleton}
          className="w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110"
          style={{
            background: showSkeleton ? COLORS.goldDim : 'transparent',
            borderColor: showSkeleton ? COLORS.gold : COLORS.border,
            color: showSkeleton ? COLORS.gold : COLORS.textSecondary,
          }}
          title="Skeleton"
        >
          {showSkeleton ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
        </button>

        <button
          onClick={onToggleAnnotations}
          className="w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110"
          style={{
            background: showAnnotations ? COLORS.goldDim : 'transparent',
            borderColor: showAnnotations ? COLORS.gold : COLORS.border,
            color: showAnnotations ? COLORS.gold : COLORS.textSecondary,
          }}
          title="Annotations"
        >
          {showAnnotations ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Divider */}
      <div
        className="w-full h-px my-1"
        style={{ background: COLORS.border }}
      />

      {/* Edit Actions */}
      <div className="space-y-1 w-full">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110"
          style={{
            borderColor: COLORS.border,
            color: canUndo ? COLORS.textSecondary : COLORS.textTertiary,
            opacity: canUndo ? 1 : 0.3,
          }}
          title="Undo"
        >
          <Undo size={16} strokeWidth={1.5} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110"
          style={{
            borderColor: COLORS.border,
            color: canRedo ? COLORS.textSecondary : COLORS.textTertiary,
            opacity: canRedo ? 1 : 0.3,
          }}
          title="Redo"
        >
          <Redo size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Divider */}
      <div
        className="w-full h-px my-1"
        style={{ background: COLORS.border }}
      />

      {/* Advanced Menu */}
      <div className="relative w-full">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110"
          style={{
            background: showAdvanced ? COLORS.goldDim : 'transparent',
            borderColor: showAdvanced ? COLORS.gold : COLORS.border,
            color: showAdvanced ? COLORS.gold : COLORS.textSecondary,
          }}
          title="More tools"
        >
          <ChevronDown size={16} strokeWidth={1.5} />
        </button>

        {showAdvanced && (
          <div
            className="absolute left-full ml-2 top-0 p-2 rounded-lg border space-y-1 min-w-[200px]"
            style={{
              background: COLORS.surface,
              borderColor: COLORS.border,
              boxShadow: `0 10px 25px rgba(0,0,0,0.1)`,
            }}
          >
            {Object.entries(TOOLS_ICONS)
              .filter(([tool]) => !primaryTools.includes(tool))
              .map(([tool, { icon: Icon, label, shortcut }]) => {
                const isActive = activeTool === tool;
                return (
                  <button
                    key={tool}
                    onClick={() => {
                      onToolChange(tool);
                      setShowAdvanced(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded border text-[9px] font-bold transition-all"
                    style={{
                      background: isActive ? COLORS.goldDim : 'transparent',
                      borderColor: isActive ? COLORS.gold : COLORS.border,
                      color: isActive ? COLORS.gold : COLORS.textSecondary,
                    }}
                  >
                    {Icon ? <Icon size={12} /> : <span>⦝</span>}
                    <span className="flex-1">{label}</span>
                    <span
                      className="text-[8px]"
                      style={{ color: COLORS.textTertiary }}
                    >
                      {shortcut}
                    </span>
                  </button>
                );
              })}

            {/* Danger zone */}
            <div
              className="w-full h-px my-1"
              style={{ background: COLORS.border }}
            />

            <button
              onClick={onClearFrame}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded border text-[9px] font-bold transition-all"
              style={{
                background: 'transparent',
                borderColor: COLORS.border,
                color: COLORS.fault,
              }}
            >
              <Trash2 size={12} />
              <span>Clear Frame</span>
            </button>

            <button
              onClick={onClearAll}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded border text-[9px] font-bold transition-all"
              style={{
                background: 'transparent',
                borderColor: COLORS.fault,
                color: COLORS.fault,
              }}
            >
              <Trash2 size={12} />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help hint */}
      <div
        className="text-[8px] text-center px-1 py-2"
        style={{
          color: COLORS.textTertiary,
          fontFamily: FONT.mono,
          letterSpacing: '0.05em',
        }}
      >
        Press keys<br />V L A R
      </div>
    </div>
  );
}