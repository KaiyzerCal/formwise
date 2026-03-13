/**
 * TechniqueStudio — PRODUCTION HARDENED + FULLY WIRED ANNOTATION EDITING
 * Complete coaching environment: video playback, frame sync, pose overlay,
 * interactive annotation tools, undo/redo, autosave, keyboard shortcuts
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
import { useAnnotationEditor, TOOLS } from './useAnnotationEditor';
import { getTechniqueDraft } from '../techniqueStorage';
import { saveTechniqueProject } from '../TechniqueProjectStore';
import { X } from 'lucide-react';

export default function TechniqueStudio() {
  // ── Router & session state ───────────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [techniqueSession, setTechniqueSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const annotationsHydratedRef = useRef(false);

  // ── Playback state ───────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  // ── UI toggles ───────────────────────────────────────────────────────────
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showJointLabels, setShowJointLabels] = useState(false);
  const [showAngleLabels, setShowAngleLabels] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showExport, setShowExport] = useState(false);

  // ── Annotation editor ────────────────────────────────────────────────────
  const annotationEditor = useAnnotationEditor();

  // ── Refs ─────────────────────────────────────────────────────────────────
  const autosaveTimeoutRef = useRef(null);
  const videoRef = useRef(null);

  // ── Safe derived values ──────────────────────────────────────────────────
  const safeVideoUrl    = techniqueSession?.video?.url || null;
  const safePoseFrames  = Array.isArray(techniqueSession?.pose?.frames) ? techniqueSession.pose.frames : [];
  const safeFps         = techniqueSession?.video?.fps || 30;
  const safeCategory    = techniqueSession?.derived?.category || 'freestyle';
  const safeCreatedAt   = techniqueSession?.createdAt || new Date().toISOString();

  const frameSync = useFrameSync(safePoseFrames, videoRef, safeFps);

  const currentFrameIndex = useMemo(() => {
    if (frameSync && typeof frameSync.getFrameIndexAtTime === 'function') {
      return frameSync.getFrameIndexAtTime(currentTime);
    }
    return 0;
  }, [currentTime, frameSync]);

  // ── Playback callbacks ───────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); }
  }, []);

  const handleSeek = useCallback((time) => {
    if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time); }
  }, []);

  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  }, []);

  const handleTimeUpdate = useCallback((time) => setCurrentTime(time), []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  }, []);

  const handleStepForward  = useCallback(() => frameSync?.stepForward?.(),  [frameSync]);
  const handleStepBackward = useCallback(() => frameSync?.stepBackward?.(), [frameSync]);
  const handleJumpFrames   = useCallback((n) => frameSync?.jumpFrames?.(n), [frameSync]);

  // ── Annotation batch operations ──────────────────────────────────────────
  const handleClearFrame = useCallback(() => {
    annotationEditor.clearFrameAnnotations(currentFrameIndex);
  }, [annotationEditor, currentFrameIndex]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Clear all annotations? This cannot be undone.')) {
      annotationEditor.clearAllAnnotations();
    }
  }, [annotationEditor]);

  // ── Autosave ─────────────────────────────────────────────────────────────
  const triggerAutosave = useCallback(() => {
    if (!techniqueSession) return;
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveTechniqueProject({
          id: techniqueSession.id,
          videoId: techniqueSession.id,
          videoURL: techniqueSession?.video?.url,
          annotations: annotationEditor.annotations,
          selectedReference: null,
          playbackSpeed: speed,
          coachNotes: techniqueSession.coachNotes || '',
          focusTags: techniqueSession.focusTags || [],
          sourceSessionId: techniqueSession.sourceSessionId || null,
          metadata: {
            category: techniqueSession?.derived?.category || 'unknown',
            movementName: techniqueSession?.derived?.movementName || 'unknown',
          },
        });
      } catch (err) {
        console.error('[TechniqueStudio] Autosave failed:', err);
      }
    }, 1500);
  }, [techniqueSession, annotationEditor.annotations, speed]);

  // ── Canvas pointer event handlers ────────────────────────────────────────

  const pauseIfDrawing = useCallback((tool) => {
    if (tool !== TOOLS.POINTER && isPlaying) handlePause();
  }, [isPlaying, handlePause]);

  const handleCanvasPointerDown = useCallback((point, e) => {
    const tool = annotationEditor.activeTool;
    pauseIfDrawing(tool);

    if (tool === TOOLS.POINTER) {
      // Hit test → select or begin drag
      const hitId = annotationEditor.hitTestAnnotation(currentFrameIndex, point);
      if (hitId) {
        annotationEditor.selectAnnotation(hitId);
        annotationEditor.beginDrag(hitId, point);
      } else {
        annotationEditor.selectAnnotation(null);
      }
      return;
    }

    if (tool === TOOLS.ERASE) {
      const hitId = annotationEditor.hitTestAnnotation(currentFrameIndex, point);
      if (hitId) annotationEditor.deleteAnnotation(hitId);
      return;
    }

    if (tool === TOOLS.TEXT || tool === TOOLS.ANGLE) {
      // These are handled in handleCanvasClick for TEXT; ANGLE uses beginInteraction
      annotationEditor.beginInteraction(tool, currentFrameIndex, point);
      return;
    }

    annotationEditor.beginInteraction(tool, currentFrameIndex, point);
  }, [annotationEditor, currentFrameIndex, pauseIfDrawing]);

  const handleCanvasPointerMove = useCallback((point, e) => {
    const tool = annotationEditor.activeTool;
    if (tool === TOOLS.POINTER) {
      // Drag selected annotation
      if (e.buttons > 0 && annotationEditor.selectedAnnotationId) {
        annotationEditor.updateDrag(point);
      }
      return;
    }
    annotationEditor.updateInteraction(tool, currentFrameIndex, point);
  }, [annotationEditor, currentFrameIndex]);

  const handleCanvasPointerUp = useCallback((point, e) => {
    const tool = annotationEditor.activeTool;
    if (tool === TOOLS.POINTER) {
      annotationEditor.finishDrag();
      return;
    }
    if (tool === TOOLS.TEXT || tool === TOOLS.ANGLE || tool === TOOLS.ERASE) return;
    annotationEditor.finishInteraction(tool, currentFrameIndex, point);
  }, [annotationEditor, currentFrameIndex]);

  const handleCanvasClick = useCallback((point, e) => {
    const tool = annotationEditor.activeTool;
    if (tool === TOOLS.TEXT) {
      annotationEditor.placeText(currentFrameIndex, point);
    }
  }, [annotationEditor, currentFrameIndex]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Load draft
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      annotationsHydratedRef.current = false;

      try {
        const draftId = searchParams.get('draft');
        if (!draftId) { setLoadError('No draft ID provided in URL'); setLoading(false); return; }

        const draft = await getTechniqueDraft(draftId);
        if (!draft) { setLoadError('Session not found. Draft ID: ' + draftId); setLoading(false); return; }

        const normalized = normalizeToTechniqueSession(draft);
        setTechniqueSession(normalized);
      } catch (err) {
        console.error('[TechniqueStudio] Error loading session:', err);
        setLoadError(`Failed to load session: ${err?.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => { if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current); };
  }, [searchParams]);

  // Hydrate annotations once per draft load
  useEffect(() => {
    if (!techniqueSession || annotationsHydratedRef.current) return;
    const savedAnnotations = techniqueSession.annotations;
    if (savedAnnotations && (Array.isArray(savedAnnotations) ? savedAnnotations.length > 0 : false)) {
      annotationEditor.loadAnnotations(savedAnnotations);
    }
    annotationsHydratedRef.current = true;
  }, [techniqueSession]);

  // Autosave on annotation changes
  useEffect(() => {
    triggerAutosave();
  }, [annotationEditor.annotations]);

  // Keyboard shortcuts
  useEffect(() => {
    const toolKeys = {
      v: TOOLS.POINTER, l: TOOLS.LINE, a: TOOLS.ARROW, r: TOOLS.RECTANGLE,
      c: TOOLS.CIRCLE, p: TOOLS.FREEHAND, t: TOOLS.TEXT, s: TOOLS.SPOTLIGHT,
      g: TOOLS.ANGLE, e: TOOLS.ERASE,
    };

    const handleKeyDown = (ev) => {
      // Don't capture when typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes(ev.target.tagName)) return;

      if (ev.key === ' ') {
        ev.preventDefault();
        isPlaying ? handlePause() : handlePlay();
        return;
      }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); handleStepBackward(); return; }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); handleStepForward(); return; }

      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        ev.shiftKey ? annotationEditor.redo() : annotationEditor.undo();
        return;
      }

      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault();
        annotationEditor.deleteSelectedAnnotation();
        return;
      }

      if (ev.key === 'Escape') {
        annotationEditor.cancelInteraction();
        annotationEditor.selectAnnotation(null);
        return;
      }

      const tool = toolKeys[ev.key.toLowerCase()];
      if (tool) annotationEditor.setActiveTool(tool);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handlePlay, handlePause, handleStepBackward, handleStepForward, annotationEditor]);

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>Loading technique session...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
        <div className="max-w-md p-6 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: '#EF4444', fontFamily: FONT.mono }}>Error Loading Session</h2>
          <p className="text-[9px] mb-4 whitespace-pre-wrap" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{loadError}</p>
          <button onClick={() => navigate(-1)} className="w-full py-2 rounded text-[9px] font-bold"
            style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}` }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!techniqueSession) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: COLORS.bg }}>
        <p className="text-sm" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>No session to display</p>
      </div>
    );
  }

  if (!safeVideoUrl && safePoseFrames.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
        <div className="max-w-md p-6 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>Degraded Session</h2>
          <p className="text-[9px] mb-4" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            This session has no video or pose data. It may have been partially recorded or lost.
          </p>
          <div className="space-y-1 mb-4 text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            <div>Category: {safeCategory}</div>
            <div>Created: {new Date(safeCreatedAt).toLocaleDateString()}</div>
          </div>
          <button onClick={() => navigate(-1)} className="w-full py-2 rounded text-[9px] font-bold"
            style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}` }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex flex-col" style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div>
          <h1 className="text-xs tracking-[0.18em] uppercase font-bold" style={{ color: COLORS.gold }}>
            Technique Studio
          </h1>
          <p className="text-[8px] tracking-[0.1em] mt-0.5" style={{ color: COLORS.textTertiary }}>
            {safeCategory} · {new Date(safeCreatedAt).toLocaleDateString()}
            {annotationEditor.annotations.length > 0 && (
              <span style={{ color: COLORS.gold }}> · {annotationEditor.annotations.length} annotation{annotationEditor.annotations.length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExport(true)}
            className="px-3 py-1.5 rounded border text-[9px] font-bold"
            style={{ borderColor: COLORS.goldBorder, color: COLORS.gold }}>
            Export
          </button>
          <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-white/10">
            <X size={18} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>
      </div>

      {/* Main content */}
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

        {/* Video + controls */}
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
            // Interaction
            activeTool={annotationEditor.activeTool}
            selectedAnnotationId={annotationEditor.selectedAnnotationId}
            currentAnnotationDraft={annotationEditor.currentAnnotationDraft}
            anglePoints={annotationEditor.anglePoints}
            onCanvasPointerDown={handleCanvasPointerDown}
            onCanvasPointerMove={handleCanvasPointerMove}
            onCanvasPointerUp={handleCanvasPointerUp}
            onCanvasClick={handleCanvasClick}
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
          videoRef={videoRef}
          overlayCanvasRef={null}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}