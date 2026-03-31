import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
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

import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";
import { useSessionLearning } from "../components/bioneer/learning/useSessionLearning";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { recordSession } from "@/lib/retentionEngine";
import SessionRewardScreen from "@/components/SessionRewardScreen";
import { updateFaultHistory, checkForImprovements, getAdaptiveCue } from "@/lib/adaptiveFeedbackEngine";
import { awardSessionPoints } from "@/lib/gamificationEngine";

export default function LiveSession() {
   const navigate = useNavigate();
   const [phase, setPhase] = useState("select");
   const [selectedExercise, setSelectedExercise] = useState(null);
   const [selectedMovementId, setSelectedMovementId] = useState(null);
   const [sessionData, setSessionData] = useState(null);
   const [savedSession, setSavedSession] = useState(null);
   const [saving, setSaving] = useState(false);
   const [showReward, setShowReward] = useState(false);
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

      // Fire-and-forget: check achievements + award points
      checkAndAwardAchievements().catch(() => {});
      awardSessionPoints(sessionWithVideo).catch(() => {});

      // Record fault history and check for improvements
      const faults = (sessionWithVideo.top_faults || []).map(f => ({ id: f, name: f }));
      updateFaultHistory(sessionWithVideo.exercise_id, faults).catch(() => {});
      checkForImprovements(sessionWithVideo.exercise_id, faults.map(f => f.id)).catch(() => {});

      // Record session for streak/XP tracking
      recordSession().catch(() => {});

      // Show reward screen
      setShowReward(true);

      // Fire-and-forget: fetch AI narrative and patch session async
      const sessionIdForNarrative = sessionWithVideo.session_id;
      getSessionNarrative(sessionWithVideo).then(narrative => {
        if (narrative) updateSession(sessionIdForNarrative, { ai_narrative: narrative });
      });
    } catch (err) {
      console.error('[LiveSession] handleSave error:', err);
      // Still save metadata even if video persistence fails
      saveSession(savedSession);
      setShowReward(true); // Show reward even on error
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSessionData(null);
    setSavedSession(null);
    setSelectedExercise(null);
    setSelectedMovementId(null);
    sessionStartRef.current = null;
    setShowReward(false);
    setPhase("select");
  };

  if (showReward && sessionData) {
    return (
      <SessionRewardScreen
        sessionData={sessionData}
        onClose={handleDiscard}
      />
    );
  }

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
      {/* Back button */}
      <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.border }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[10px] tracking-[0.1em] uppercase transition-colors hover:opacity-80"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      </div>

      <MovementLibrary
        selectedId={selectedExercise?.id}
        onSelect={handleStart}
      />
    </div>
  );
}