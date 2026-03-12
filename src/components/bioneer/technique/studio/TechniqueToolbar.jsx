/**
 * TechniqueToolbar
 * Coach annotation tools: line, arrow, rectangle, circle, freehand, angle, text, etc.
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
} from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { TOOLS } from './useAnnotationEditor';

const TOOL_ICONS = {
  [TOOLS.POINTER]: { icon: MousePointer, label: 'Select' },
  [TOOLS.LINE]: { icon: Minus, label: 'Line' },
  [TOOLS.ARROW]: { icon: ArrowRight, label: 'Arrow' },
  [TOOLS.RECTANGLE]: { icon: Square, label: 'Rectangle' },
  [TOOLS.CIRCLE]: { icon: Circle, label: 'Circle' },
  [TOOLS.FREEHAND]: { icon: Pencil, label: 'Draw' },
  [TOOLS.ANGLE]: { icon: null, label: 'Angle' },
  [TOOLS.TEXT]: { icon: Type, label: 'Text' },
  [TOOLS.SPOTLIGHT]: { icon: Lightbulb, label: 'Spotlight' },
};

export default function TechniqueToolbar({
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
  showJointLabels,
  onToggleJointLabels,
  showAngleLabels,
  onToggleAngleLabels,
}) {
  const [showToggleMenu, setShowToggleMenu] = useState(false);

  return (
    <div className="flex flex-col gap-2 p-3 border-r flex-shrink-0" style={{ borderColor: COLORS.border, background: COLORS.surface, width: '80px' }}>
      {/* Drawing Tools */}
      <div className="space-y-1">
        <p className="text-[8px] tracking-[0.15em] uppercase font-bold px-1" style={{ color: COLORS.textTertiary }}>
          Tools
        </p>
        {Object.entries(TOOL_ICONS).map(([tool, { icon: Icon, label }]) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded border text-[9px] font-bold transition-all"
            style={{
              background: activeTool === tool ? COLORS.goldDim : 'transparent',
              borderColor: activeTool === tool ? COLORS.goldBorder : COLORS.border,
              color: activeTool === tool ? COLORS.gold : COLORS.textTertiary,
            }}
            title={label}
          >
            {Icon ? <Icon size={12} /> : <span>⦝</span>}
          </button>
        ))}
      </div>

      <div className="w-full h-px" style={{ background: COLORS.border }} />

      {/* Visibility Toggles */}
      <div className="space-y-1">
        <p className="text-[8px] tracking-[0.15em] uppercase font-bold px-1" style={{ color: COLORS.textTertiary }}>
          View
        </p>

        <button
          onClick={onToggleSkeleton}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded border text-[9px] font-bold"
          style={{
            background: showSkeleton ? COLORS.goldDim : 'transparent',
            borderColor: showSkeleton ? COLORS.goldBorder : COLORS.border,
            color: showSkeleton ? COLORS.gold : COLORS.textTertiary,
          }}
          title="Toggle skeleton overlay"
        >
          {showSkeleton ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        <button
          onClick={onToggleAnnotations}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded border text-[9px] font-bold"
          style={{
            background: showAnnotations ? COLORS.goldDim : 'transparent',
            borderColor: showAnnotations ? COLORS.goldBorder : COLORS.border,
            color: showAnnotations ? COLORS.gold : COLORS.textTertiary,
          }}
          title="Toggle annotations"
        >
          {showAnnotations ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        {showSkeleton && (
          <>
            <button
              onClick={onToggleJointLabels}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded border text-[9px]"
              style={{
                background: showJointLabels ? COLORS.goldDim : 'transparent',
                borderColor: showJointLabels ? COLORS.goldBorder : COLORS.border,
                color: showJointLabels ? COLORS.gold : COLORS.textTertiary,
              }}
              title="Joint names"
            >
              J
            </button>

            <button
              onClick={onToggleAngleLabels}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded border text-[9px]"
              style={{
                background: showAngleLabels ? COLORS.goldDim : 'transparent',
                borderColor: showAngleLabels ? COLORS.goldBorder : COLORS.border,
                color: showAngleLabels ? COLORS.gold : COLORS.textTertiary,
              }}
              title="Angle labels"
            >
              °
            </button>
          </>
        )}
      </div>

      <div className="w-full h-px" style={{ background: COLORS.border }} />

      {/* Editing */}
      <div className="space-y-1">
        <p className="text-[8px] tracking-[0.15em] uppercase font-bold px-1" style={{ color: COLORS.textTertiary }}>
          Edit
        </p>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-full flex items-center justify-center py-1.5 rounded border disabled:opacity-30"
          style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}
          title="Undo"
        >
          <Undo size={12} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-full flex items-center justify-center py-1.5 rounded border disabled:opacity-30"
          style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}
          title="Redo"
        >
          <Redo size={12} />
        </button>

        <button
          onClick={onClearFrame}
          className="w-full flex items-center justify-center py-1.5 rounded border text-[9px]"
          style={{ borderColor: COLORS.border, color: COLORS.fault }}
          title="Clear annotations on this frame"
        >
          <Trash2 size={12} />
        </button>

        <button
          onClick={onClearAll}
          className="w-full flex items-center justify-center py-1.5 rounded border text-[9px] font-bold"
          style={{ borderColor: COLORS.fault, color: COLORS.fault }}
          title="Clear all annotations"
        >
          ALL
        </button>
      </div>
    </div>
  );
}