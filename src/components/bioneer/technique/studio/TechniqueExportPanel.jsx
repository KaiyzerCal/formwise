/**
 * TechniqueExportPanel
 * Export options: MP4 video with overlays, JSON metadata, session package
 */

import React, { useState } from 'react';
import { Download, X, AlertCircle, Film } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';
import { TechniqueExportRenderer } from './techniqueExportRenderer';
import { exportTechniqueVideo } from './useTechniqueExporter';

const EXPORT_FORMATS = [
  {
    id: 'mp4',
    label: 'Video Export (MP4/WebM)',
    description: 'Video with skeleton + annotations composited — the real coaching file',
    icon: '🎬',
  },
  {
    id: 'json',
    label: 'JSON Metadata',
    description: 'Session data & annotations as JSON for archival',
    icon: '{ }',
  },
  {
    id: 'package',
    label: 'Session Package',
    description: 'Complete data package for reconstruction',
    icon: '📦',
  },
];

export default function TechniqueExportPanel({ session, videoRef, overlayCanvasRef, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      if (selectedFormat === 'mp4') {
        const video = videoRef?.current;
        if (!video || (!video.src && !video.currentSrc)) {
          throw new Error('No video loaded. Please ensure the session has a valid video source.');
        }
        await exportTechniqueVideo({
          videoElement: video,
          overlayCanvas: overlayCanvasRef?.current || null,
          onProgress: setProgress,
          filename: `bioneer-technique-${session.id?.substring(0, 8) || Date.now()}`,
        });
        setSuccess('Video exported and download started!');
        setTimeout(onClose, 2000);
        return;
      }

      const renderer = new TechniqueExportRenderer(session);
      if (selectedFormat === 'json') {
        await renderer.exportAsJSON();
        setSuccess('JSON metadata exported');
      } else if (selectedFormat === 'package') {
        await renderer.exportAsPackage();
        setSuccess('Session package exported');
      }
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('[TechniqueExportPanel] Export error:', err);
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-md rounded-lg border overflow-hidden flex flex-col"
        style={{ background: COLORS.surface, borderColor: COLORS.border, fontFamily: FONT.mono, maxHeight: '90vh' }}
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
                  <p className="text-[9px] font-bold" style={{ color: COLORS.textPrimary }}>{format.label}</p>
                  <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary }}>{format.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* MP4 note */}
          {selectedFormat === 'mp4' && (
            <div className="px-3 py-2 rounded border flex items-start gap-2 text-[9px]"
              style={{ background: 'rgba(201,168,76,0.05)', borderColor: COLORS.goldBorder, color: COLORS.textTertiary }}>
              <Film size={12} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.gold }} />
              <p>Video will play in real-time during export. Annotations and skeleton overlay will be composited directly into the video.</p>
            </div>
          )}

          {/* Progress bar */}
          {exporting && selectedFormat === 'mp4' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[9px]" style={{ color: COLORS.textTertiary }}>
                <span>Exporting…</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%`, background: COLORS.gold }}
                />
              </div>
            </div>
          )}

          {/* Status */}
          {error && (
            <div className="px-3 py-2 rounded border text-[9px]"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: '#EF4444', color: '#EF4444' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2 rounded border text-[9px]"
              style={{ background: 'rgba(74,222,128,0.1)', borderColor: '#4ade80', color: '#4ade80' }}>
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex-shrink-0 flex gap-2" style={{ borderColor: COLORS.border }}>
          <button onClick={onClose} disabled={exporting}
            className="flex-1 py-2 rounded border text-[9px] font-bold"
            style={{ borderColor: COLORS.border, color: COLORS.textSecondary, opacity: exporting ? 0.5 : 1 }}>
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
            {exporting ? 'EXPORTING…' : 'EXPORT'}
          </button>
        </div>
      </div>
    </div>
  );
}