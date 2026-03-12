/**
 * TechniqueStudio — PRODUCTION HARDENED
 * Complete coaching environment for reviewing, annotating, and exporting session videos
 * Integrates video playback, frame sync, pose overlay, annotation tools, and export
 * 
 * CRITICAL RENDER ORDER: Strict callback ordering prevents ReferenceError crashes
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { COLORS, FONT } from '../../ui/DesignTokens';
import TechniqueVideoPlayer from './TechniqueVideoPlayer';
import TechniqueFrameControls from './TechniqueFrameControls';
import TechniqueToolbar from './TechniqueToolbar';
import TechniqueNotesPanel from './TechniqueNotesPanel';
import TechniqueExportPanel from './TechniqueExportPanel';
import { normalizeToTechniqueSession } from './techniqueSessionNormalizer';
import { useFrameSync } from './useFrameSync';
import { useAnnotationEditor } from './useAnnotationEditor';
import { getTechniqueDraft } from '../techniqueStorage';
import { saveTechniqueProject } from '../TechniqueProjectStore';
import { X } from 'lucide-react';

export default function TechniqueStudio() {
  // ============================================================================
  // SECTION 1: HOOKS & STATE (in order: router, state, refs)
  // ============================================================================
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Session state
  const [techniqueSession, setTechniqueSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  // UI toggles
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showJointLabels, setShowJointLabels] = useState(false);
  const [showAngleLabels, setShowAngleLabels] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showExport, setShowExport] = useState(false);

  // Text tool state
  const [textInputData, setTextInputData] = useState(null);

  // Annotation state
  const annotationEditor = useAnnotationEditor();

  // Refs
  const autosaveTimeoutRef = useRef(null);
  const videoRef = useRef(null);

  // ============================================================================
  // SECTION 2: DERIVED SAFE FALLBACKS (computed early, before effects)
  // ============================================================================
  const safeVideoUrl = techniqueSession?.video?.url || null;
  const safePoseFrames = Array.isArray(techniqueSession?.pose?.frames) ? techniqueSession.pose.frames : [];
  const safeFps = techniqueSession?.video?.fps || 30;
  const safeCategory = techniqueSession?.derived?.category || 'freestyle';
  const safeCreatedAt = techniqueSession?.createdAt || new Date().toISOString();

  // Frame sync with safe values (DO NOT depend on frameSync refs in effects before declaration)
  const frameSync = useFrameSync(safePoseFrames, videoRef, safeFps);

  // ============================================================================
  // SECTION 3: ALL CALLBACKS (defined BEFORE any useEffect)
  // CRITICAL: No effect may reference a callback defined after this section
  // ============================================================================

  /**
   * Playback controls
   */
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSeek = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  }, []);

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  }, []);

  /**
   * Frame navigation (with null guards)
   */
  const handleStepForward = useCallback(() => {
    if (frameSync && typeof frameSync.stepForward === 'function') {
      frameSync.stepForward();
    }
  }, [frameSync]);

  const handleStepBackward = useCallback(() => {
    if (frameSync && typeof frameSync.stepBackward === 'function') {
      frameSync.stepBackward();
    }
  }, [frameSync]);

  const handleJumpFrames = useCallback((count) => {
    if (frameSync && typeof frameSync.jumpFrames === 'function') {
      frameSync.jumpFrames(count);
    }
  }, [frameSync]);

  /**
   * Annotation handlers (with safe frame index)
   */
  const currentFrameIndex = useMemo(() => {
    if (frameSync && typeof frameSync.getFrameIndexAtTime === 'function') {
      return frameSync.getFrameIndexAtTime(currentTime);
    }
    return 0;
  }, [currentTime, frameSync]);

  const handleClearFrame = useCallback(() => {
    annotationEditor.clearFrameAnnotations(currentFrameIndex);
  }, [annotationEditor, currentFrameIndex]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Clear all annotations? This cannot be undone.')) {
      annotationEditor.clearAllAnnotations();
    }
  }, [annotationEditor]);

  /**
   * Handle annotation creation from drawing tools
   */
  const handleAnnotationCreate = useCallback((annotation) => {
    switch (annotation.type) {
      case 'line':
        annotationEditor.createLine(annotation.frameIndex, annotation.startPoint, annotation.endPoint);
        break;
      case 'arrow':
        annotationEditor.createLine(annotation.frameIndex, annotation.startPoint, annotation.endPoint, { arrowhead: true });
        break;
      case 'circle':
        annotationEditor.createCircle(annotation.frameIndex, annotation.center, annotation.radius);
        break;
      case 'rectangle':
        annotationEditor.createRectangle(annotation.frameIndex, annotation.topLeft, annotation.bottomRight);
        break;
      case 'freehand':
        annotationEditor.createFreehand(annotation.frameIndex, annotation.points);
        break;
      case 'angle_marker':
        annotationEditor.createAngleMeasurement(annotation.frameIndex, annotation.points);
        break;
      case 'text':
        // Show text input modal for text annotations
        setTextInputData({
          frameIndex: annotation.frameIndex,
          position: annotation.position,
        });
        break;
      default:
        break;
    }
  }, [annotationEditor]);

  const handleTextSubmit = useCallback((text) => {
    if (textInputData && text.trim()) {
      annotationEditor.createTextLabel(textInputData.frameIndex, text, textInputData.position);
    }
    setTextInputData(null);
  }, [textInputData, annotationEditor]);

  /**
   * Autosave (with null guard on session)
   */
  const triggerAutosave = useCallback(() => {
    if (!techniqueSession) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        const videoUrl = techniqueSession?.video?.url;
        const category = techniqueSession?.derived?.category;
        const movementName = techniqueSession?.derived?.movementName;

        await saveTechniqueProject({
          id: techniqueSession.id,
          videoId: techniqueSession.id,
          videoURL: videoUrl,
          annotations: annotationEditor.annotations,
          selectedReference: null,
          playbackSpeed: speed,
          coachNotes: techniqueSession.coachNotes || '',
          focusTags: techniqueSession.focusTags || [],
          metadata: {
            category: category || 'unknown',
            movementName: movementName || 'unknown',
          },
        });
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 2000);
  }, [techniqueSession, annotationEditor.annotations, speed]);

  // ============================================================================
  // SECTION 4: EFFECTS (now safe to reference all callbacks)
  // ============================================================================

  /**
   * Autosave on annotation changes
   */
  useEffect(() => {
    triggerAutosave();
  }, [annotationEditor.annotations, triggerAutosave]);

  /**
   * Load session from draft ID (only effect that touches loading state)
   */
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const draftId = searchParams.get('draft');
        console.log('[TechniqueStudio] Loading draft ID:', draftId);

        if (!draftId) {
          setLoadError('No draft ID provided in URL');
          console.error('[TechniqueStudio] Missing draft parameter');
          setLoading(false);
          return;
        }

        const draft = await getTechniqueDraft(draftId);
        console.log('[TechniqueStudio] Retrieved draft:', draft ? 'success' : 'null');

        if (!draft) {
          setLoadError('Session not found or was deleted. Draft ID: ' + draftId);
          console.error('[TechniqueStudio] Draft not found for ID:', draftId);
          setLoading(false);
          return;
        }

        // Normalize the draft into a TechniqueSession (always returns valid shape)
        const normalized = normalizeToTechniqueSession(draft);
        console.log('[TechniqueStudio] Session normalized successfully');
        setTechniqueSession(normalized);
      } catch (error) {
        console.error('[TechniqueStudio] Error loading session:', error);
        setLoadError(
          `Failed to load session: ${error?.message || 'Unknown error'}\n\nCheck browser console for details.`
        );
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [searchParams]);

  /**
   * Keyboard support (safe because all handlers are already defined)
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? handlePause() : handlePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleStepBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleStepForward();
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.shiftKey ? annotationEditor.redo() : annotationEditor.undo();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handlePlay, handlePause, handleStepBackward, handleStepForward, annotationEditor]);

  // ============================================================================
  // SECTION 5: RENDER STATES (loading → error → empty → main)
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            Loading technique session...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
        <div className="max-w-md p-6 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: '#EF4444', fontFamily: FONT.mono }}>
            Error Loading Session
          </h2>
          <p className="text-[9px] mb-4 whitespace-pre-wrap" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            {loadError}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2 rounded text-[9px] font-bold"
            style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}` }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No session state
  if (!techniqueSession) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: COLORS.bg }}>
        <p className="text-sm" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          No session to display
        </p>
      </div>
    );
  }

  // No data state (degraded but visible)
  if (!safeVideoUrl && safePoseFrames.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
        <div className="max-w-md p-6 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            Degraded Session
          </h2>
          <p className="text-[9px] mb-4" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            This session has no video or pose data available. Session may have been partially recorded or lost.
          </p>
          <div className="space-y-2 mb-4 text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            <div>Category: {safeCategory}</div>
            <div>Created: {new Date(safeCreatedAt).toLocaleDateString()}</div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2 rounded text-[9px] font-bold"
            style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}` }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SECTION 6: MAIN RENDER (fully stable, all refs and handlers ready)
  // ============================================================================

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div>
          <h1 className="text-xs tracking-[0.18em] uppercase font-bold" style={{ color: COLORS.gold }}>
            Technique Studio
          </h1>
          <p className="text-[8px] tracking-[0.1em] mt-0.5" style={{ color: COLORS.textTertiary }}>
            {safeCategory} • {new Date(safeCreatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="px-3 py-1.5 rounded border text-[9px] font-bold"
            style={{ borderColor: COLORS.goldBorder, color: COLORS.gold }}
          >
            Export
          </button>
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded hover:bg-white/10"
          >
            <X size={18} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>
        {/* Toolbar */}
        <TechniqueToolbar
          activeTool={annotationEditor.activeTool}
          onToolChange={annotationEditor.setActiveTool}
          onClearFrame={handleClearFrame}
          onClearAll={handleClearAll}
          onUndo={annotationEditor.undo}
          onRedo={annotationEditor.redo}
          canUndo={annotationEditor.canUndo}
          canRedo={annotationEditor.canRedo}
          showSkeleton={showSkeleton}
          onToggleSkeleton={() => setShowSkeleton(v => !v)}
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(v => !v)}
          showJointLabels={showJointLabels}
          onToggleJointLabels={() => setShowJointLabels(v => !v)}
          showAngleLabels={showAngleLabels}
          onToggleAngleLabels={() => setShowAngleLabels(v => !v)}
        />

        {/* Video player + controls */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TechniqueVideoPlayer
            videoRef={videoRef}
            videoUrl={safeVideoUrl}
            poseFrames={safePoseFrames}
            annotations={annotationEditor.annotations}
            currentFrameIndex={currentFrameIndex}
            isPlaying={isPlaying}
            showSkeleton={showSkeleton}
            showJointLabels={showJointLabels}
            showAngleLabels={showAngleLabels}
            showAnnotations={showAnnotations}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            activeTool={annotationEditor.activeTool}
            onAnnotationCreate={handleAnnotationCreate}
          />

          <TechniqueFrameControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            currentFrameIndex={currentFrameIndex}
            totalFrames={frameSync?.frameCount || safePoseFrames.length}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onJumpFrames={handleJumpFrames}
            speed={speed}
            onSpeedChange={handleSpeedChange}
            fps={safeFps}
          />
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="w-64 border-l flex flex-col flex-shrink-0 overflow-hidden" style={{ borderColor: COLORS.border }}>
            <TechniqueNotesPanel
              session={techniqueSession}
              onSessionUpdate={setTechniqueSession}
              onClose={() => setShowNotes(false)}
            />
          </div>
        )}
      </div>

      {/* Export modal */}
      {showExport && (
        <TechniqueExportPanel
          session={techniqueSession}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Text input modal */}
      {textInputData && (
        <TextInputModal
          onSubmit={handleTextSubmit}
          onCancel={() => setTextInputData(null)}
        />
      )}
    </div>
  );
}

/**
 * Simple text input modal for placing text annotations
 */
function TextInputModal({ onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    onSubmit(text);
    setText('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
        <p className="text-sm font-bold mb-4">Add text annotation</p>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="Enter text..."
          className="w-full px-3 py-2 border rounded mb-4 text-sm"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}