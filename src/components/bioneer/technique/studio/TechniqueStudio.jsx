/**
 * TechniqueStudio
 * Complete coaching environment for reviewing, annotating, and exporting session videos
 * Integrates video playback, frame sync, pose overlay, annotation tools, and export
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
import { X } from 'lucide-react';

export default function TechniqueStudio() {
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

  // Annotation state
  const annotationEditor = useAnnotationEditor();

  // Video and sync
  const videoRef = useRef(null);
  const frameSync = useFrameSync(techniqueSession?.pose?.frames || [], videoRef);

  /**
   * Load session from draft ID or history
   */
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const draftId = searchParams.get('draft');

        if (!draftId) {
          setLoadError('No session specified');
          return;
        }

        const draft = await getTechniqueDraft(draftId);

        if (!draft) {
          setLoadError('Session not found or was deleted');
          return;
        }

        // Normalize the draft into a TechniqueSession
        const normalized = normalizeToTechniqueSession(draft);
        setTechniqueSession(normalized);
      } catch (error) {
        console.error('Failed to load session:', error);
        setLoadError(error.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [searchParams]);

  /**
   * Keyboard support for studio navigation
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

  /**
   * Get current frame index from time
   */
  const currentFrameIndex = useMemo(() => {
    return frameSync.getFrameIndexAtTime(currentTime);
  }, [currentTime, frameSync]);

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
   * Frame navigation
   */
  const handleStepForward = useCallback(() => {
    frameSync.stepForward();
  }, [frameSync]);

  const handleStepBackward = useCallback(() => {
    frameSync.stepBackward();
  }, [frameSync]);

  const handleJumpFrames = useCallback((count) => {
    frameSync.jumpFrames(count);
  }, [frameSync]);

  /**
   * Annotation handlers
   */
  const handleClearFrame = useCallback(() => {
    annotationEditor.clearFrameAnnotations(currentFrameIndex);
  }, [annotationEditor, currentFrameIndex]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Clear all annotations? This cannot be undone.')) {
      annotationEditor.clearAllAnnotations();
    }
  }, [annotationEditor]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: COLORS.bg }}>
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
      <div className="w-full h-full flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
        <div className="max-w-md p-6 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: '#EF4444', fontFamily: FONT.mono }}>
            Error Loading Session
          </h2>
          <p className="text-[9px] mb-4" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
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

  if (!techniqueSession) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: COLORS.bg }}>
        <p className="text-sm" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          No session to display
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div>
          <h1 className="text-xs tracking-[0.18em] uppercase font-bold" style={{ color: COLORS.gold }}>
            Technique Studio
          </h1>
          <p className="text-[8px] tracking-[0.1em] mt-0.5" style={{ color: COLORS.textTertiary }}>
            {techniqueSession.derived.category} • {new Date(techniqueSession.createdAt).toLocaleDateString()}
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
            videoUrl={techniqueSession.video.url}
            poseFrames={techniqueSession.pose.frames}
            annotations={annotationEditor.annotations}
            currentFrameIndex={currentFrameIndex}
            isPlaying={isPlaying}
            showSkeleton={showSkeleton}
            showJointLabels={showJointLabels}
            showAngleLabels={showAngleLabels}
            showAnnotations={showAnnotations}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />

          <TechniqueFrameControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            currentFrameIndex={currentFrameIndex}
            totalFrames={frameSync.frameCount}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onJumpFrames={handleJumpFrames}
            speed={speed}
            onSpeedChange={handleSpeedChange}
            fps={techniqueSession.video.fps || 30}
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
    </div>
  );
}