/**
 * TechniqueExportPanel
 * Export options: JSON metadata, snapshot, session package, or fallback for future MP4
 */

import React, { useState } from 'react';
import { Download, X, AlertCircle } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { TechniqueExportRenderer } from './techniqueExportRenderer';

/**
 * Create a simple PNG snapshot from session metadata and overlay data
 */
async function createSnapshotPNG(session) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid pattern
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Draw current pose frame skeleton if available
  if (session.pose?.frames?.length > 0) {
    const frame = session.pose.frames[0];
    if (frame?.landmarks && Array.isArray(frame.landmarks)) {
      drawSkeletonOnCanvas(ctx, frame.landmarks, canvas.width, canvas.height);
    }
  }

  // Draw metadata text
  ctx.fillStyle = '#C9A84C';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`Movement: ${session.derived?.movementName || 'Unknown'}`, 20, 40);
  
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(201, 168, 76, 0.8)';
  ctx.fillText(`Frames: ${session.pose?.frames?.length || 0}`, 20, 70);
  ctx.fillText(`FPS: ${session.video?.fps || 30}`, 20, 95);
  ctx.fillText(`Exported: ${new Date().toLocaleString()}`, 20, 120);

  // Convert to PNG blob and download
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `snapshot-${session.id || Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      },
      'image/png',
      0.95
    );
  });
}

/**
 * Draw skeleton on canvas from landmarks
 */
function drawSkeletonOnCanvas(ctx, landmarks, canvasWidth, canvasHeight) {
  if (!landmarks || landmarks.length === 0) return;

  // Scale landmarks to canvas
  const scale = Math.min(canvasWidth, canvasHeight) / 2;
  const offsetX = canvasWidth / 2;
  const offsetY = canvasHeight / 2;

  // Draw joints
  ctx.fillStyle = '#C9A84C';
  landmarks.forEach((lm) => {
    if (lm && typeof lm.x === 'number' && typeof lm.y === 'number') {
      const x = lm.x * scale + offsetX;
      const y = lm.y * scale + offsetY;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Simple skeleton connections (basic limbs)
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.6)';
  ctx.lineWidth = 2;
  const connections = [
    [0, 1], [1, 2], [2, 3],  // right arm
    [0, 4], [4, 5], [5, 6],  // left arm
    [9, 10],                  // torso
    [11, 12],                 // legs
    [12, 14], [14, 16],       // right leg
    [11, 13], [13, 15],       // left leg
  ];

  connections.forEach(([i, j]) => {
    if (landmarks[i] && landmarks[j]) {
      const x1 = landmarks[i].x * scale + offsetX;
      const y1 = landmarks[i].y * scale + offsetY;
      const x2 = landmarks[j].x * scale + offsetX;
      const y2 = landmarks[j].y * scale + offsetY;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  });
}

const EXPORT_FORMATS = [
  {
    id: 'json',
    label: 'JSON Metadata',
    description: 'Session data, annotations, and metadata for archival',
    icon: '{ }',
  },
  {
    id: 'snapshot',
    label: 'PNG Snapshot',
    description: 'Skeleton overlay and metadata as image',
    icon: '📷',
  },
  {
    id: 'package',
    label: 'Session Package',
    description: 'Complete dataset for reconstruction or backend rendering',
    icon: '📦',
  },
];

export default function TechniqueExportPanel({ session, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState('package');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Handle export with real actions
   */
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const renderer = new TechniqueExportRenderer(session);

      switch (selectedFormat) {
        case 'json':
          await renderer.exportAsJSON();
          setSuccess('JSON metadata exported');
          break;

        case 'snapshot':
          // Create a simple PNG snapshot from session data
          await createSnapshotPNG(session);
          setSuccess('PNG snapshot exported');
          break;

        case 'package':
          await renderer.exportAsPackage();
          setSuccess('Session package exported');
          break;

        default:
          throw new Error('Unknown export format');
      }

      // Auto-close on success after delay
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-md rounded-lg border overflow-hidden flex flex-col max-h-96"
        style={{ background: COLORS.surface, borderColor: COLORS.border, fontFamily: FONT.mono }}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border }}>
          <h2 className="text-sm tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>
            Export Session
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X size={16} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Info banner */}
          <div
            className="px-3 py-2 rounded border flex items-start gap-2 text-[9px]"
            style={{ background: 'rgba(201,168,76,0.05)', borderColor: COLORS.goldBorder, color: COLORS.textTertiary }}
          >
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.gold }} />
            <p>
              MP4 video export with rendered annotations is coming soon. For now, export the session package and annotations will be preserved.
            </p>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <p className="text-[9px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
              Export Format
            </p>

            {EXPORT_FORMATS.map(format => (
              <label
                key={format.id}
                className="flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors"
                style={{
                  background: selectedFormat === format.id ? COLORS.goldDim : 'transparent',
                  borderColor: selectedFormat === format.id ? COLORS.goldBorder : COLORS.border,
                }}
              >
                <input
                  type="radio"
                  name="format"
                  value={format.id}
                  checked={selectedFormat === format.id}
                  onChange={e => setSelectedFormat(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-[9px] font-bold" style={{ color: COLORS.textPrimary }}>
                    {format.label}
                  </p>
                  <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary }}>
                    {format.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Filename customization */}
          <div className="space-y-1 pt-2 border-t" style={{ borderColor: COLORS.border }}>
            <p className="text-[9px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
              File Name
            </p>
            <div className="text-[8px]" style={{ color: COLORS.textTertiary }}>
              <p>technique-{session.id.substring(0, 8)}...{selectedFormat === 'json' ? '.json' : selectedFormat === 'snapshot' ? '.png' : '.json'}</p>
            </div>
          </div>

          {/* Status messages */}
          {error && (
            <div
              className="px-3 py-2 rounded border text-[9px]"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: '#EF4444', color: '#EF4444' }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="px-3 py-2 rounded border text-[9px]"
              style={{ background: 'rgba(74,222,128,0.1)', borderColor: '#4ade80', color: '#4ade80' }}
            >
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex-shrink-0 flex gap-2" style={{ borderColor: COLORS.border }}>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded border text-[9px] font-bold"
            style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded font-bold text-[9px]"
            style={{
              background: COLORS.goldDim,
              color: COLORS.gold,
              border: `1px solid ${COLORS.goldBorder}`,
              opacity: exporting ? 0.6 : 1,
            }}
          >
            <Download size={12} />
            {exporting ? 'EXPORTING...' : 'EXPORT'}
          </button>
        </div>
      </div>
    </div>
  );
}