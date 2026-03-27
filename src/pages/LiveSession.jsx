import React, { useState, useEffect, useRef } from "react";
import { getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import CameraView from "../components/bioneer/CameraView";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import SessionSummary from "../components/bioneer/SessionSummary";
import { normalizeSession, sessionSaveMessage } from "../components/bioneer/data/sessionNormalizer";
import { saveSession, updateSession } from "../components/bioneer/data/unifiedSessionStore";
import { persistRecordedSessionVideo } from "../components/bioneer/data/persistRecordedSessionVideo";
import { getSessionNarrative } from "../components/bioneer/ai/GeminiCoach";
import { getMovementProfile } from "../components/bioneer/movementProfiles/movementProfiles";
import MovementSelector from "../components/bioneer/movementProfiles/MovementSelector";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";
import { useSessionLearning } from "../components/bioneer/learning/useSessionLearning";
import { checkAndAwardAchievements } from "@/lib/achievements";

export default function LiveSession() {
  const [phase, setPhase] = useState("select");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedMovementId, setSelectedMovementId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const sessionStartRef = useRef(null);
  const rawDataRef = useRef(null); // holds rawData including recordedChunks
  const { processSessionLearning } = useSessionLearning();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exId = params.get("exercise");
    if (exId) {
      const ex = getExerciseById(exId) || getSportsMovementById(exId);
      if (ex) { setSelectedExercise(ex); setPhase("camera"); }
    }
  }, []);

  const handleStart = (movement) => {
    setSelectedExercise(movement);
    sessionStartRef.current = Date.now();
    // Stay in select phase to allow movement profile selection before camera
  };

  const handleStartWithMovement = () => {
    if (!selectedExercise || !selectedMovementId) {
      alert('Please select both an exercise and a movement profile');
      return;
    }
    sessionStartRef.current = Date.now();
    setPhase("camera");
  };

  const handleStop = (rawData) => {
    rawDataRef.current = rawData; // preserve for save (includes recordedChunks)
    // Normalize into canonical schema with movement profile data
    const movementProfile = selectedMovementId ? getMovementProfile(selectedMovementId) : null;
    const session = normalizeSession(rawData, {
      movementName: selectedExercise?.name,
      category: selectedExercise?.category,
      startedAt: sessionStartRef.current ?? Date.now(),
      movementProfileId: selectedMovementId,
      movementProfile: movementProfile,
    });
    setSavedSession(session);
    // Pass raw data to summary for existing UI (joint_data, exercise_def, etc.)
    setSessionData({ ...rawData, _canonicalSession: session, movementProfile });
    setPhase("summary");
  };

  const handleSave = async () => {
    if (!savedSession) { handleDiscard(); return; }
    setSaving(true);
    try {
      const rawData = rawDataRef.current || {};
      const { recordedChunks, recordingMimeType } = rawData;

      // Persist video first (wait for full blob finalization)
      const persistedVideo = await persistRecordedSessionVideo({
        recordedChunks: recordedChunks || [],
        mimeType: recordingMimeType || 'video/webm',
        sessionId: savedSession.session_id,
      });

      // Attach video fields to the canonical session before saving
      const sessionWithVideo = {
        ...savedSession,
        video_storage_key: persistedVideo?.storageKey ?? savedSession.session_id,
        video_src: persistedVideo?.videoSrc ?? null,
      };

      // Run learning pipeline (non-blocking)
      processSessionLearning({
        ...sessionWithVideo,
        reps: rawDataRef.current?.reps ?? [],
      }).then(enriched => {
        saveSession({ ...sessionWithVideo, learning: enriched?.learning ?? null });
      }).catch(() => {
        saveSession(sessionWithVideo);
      });

      // Fire-and-forget: check achievements
      checkAndAwardAchievements().catch(() => {});

      // Fire-and-forget: fetch AI narrative and patch session async
      const sessionIdForNarrative = sessionWithVideo.session_id;
      getSessionNarrative(sessionWithVideo).then(narrative => {
        if (narrative) updateSession(sessionIdForNarrative, { ai_narrative: narrative });
      });
    } catch (err) {
      console.error('[LiveSession] handleSave error:', err);
      // Still save metadata even if video persistence fails
      saveSession(savedSession);
    } finally {
      setSaving(false);
      handleDiscard();
    }
  };

  const handleDiscard = () => {
    setSessionData(null);
    setSavedSession(null);
    setSelectedExercise(null);
    setSelectedMovementId(null);
    sessionStartRef.current = null;
    setPhase("select");
  };

  if (phase === "camera" && selectedExercise) {
    return <CameraView exercise={selectedExercise} onStop={handleStop} />;
  }

  if (phase === "summary" && sessionData) {
    const saveMsg = savedSession ? sessionSaveMessage(savedSession) : null;
    return (
      <SessionSummary
        sessionData={sessionData}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
        saveOutcome={saveMsg}
      />
    );
  }

  // Select phase — movement library + movement profile selector
  return (
    <div className="flex flex-col h-screen" style={{ background: COLORS.bg }}>
      <MovementLibrary
        selectedId={selectedExercise?.id}
        onSelect={handleStart}
      />

      {/* Movement Profile Selector Panel */}
      {selectedExercise && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t p-6 space-y-4"
          style={{
            background: `linear-gradient(to top, ${COLORS.surface}, ${COLORS.surface}EE)`,
            backdropFilter: 'blur(12px)',
            borderColor: COLORS.border,
          }}
        >
          <div>
            <label className="block text-xs font-bold tracking-[0.15em] uppercase mb-3"
              style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Select Movement Profile
            </label>
            <MovementSelector
              value={selectedMovementId}
              onChange={setSelectedMovementId}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedExercise(null);
                setSelectedMovementId(null);
              }}
              className="flex-1 py-3 rounded-lg border font-bold text-sm transition-colors"
              style={{
                background: 'transparent',
                borderColor: COLORS.border,
                color: COLORS.textSecondary,
                fontFamily: FONT.mono,
              }}
            >
              Back
            </button>

            <button
              onClick={handleStartWithMovement}
              disabled={!selectedMovementId}
              className="flex-1 py-3 rounded-lg border font-bold text-sm transition-colors disabled:opacity-50"
              style={{
                background: selectedMovementId ? `${COLORS.gold}20` : 'transparent',
                borderColor: selectedMovementId ? COLORS.gold : COLORS.border,
                color: selectedMovementId ? COLORS.gold : COLORS.textSecondary,
                fontFamily: FONT.mono,
              }}
            >
              Start Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}