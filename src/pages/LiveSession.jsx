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
import { updateFaultHistory, checkForImprovements } from "@/lib/adaptiveFeedbackEngine";
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

      // Save session metadata to cloud IMMEDIATELY (no waiting for video upload)
      const sessionToSave = {
        ...savedSession,
        video_storage_key: savedSession.session_id,
      };
      const saved = await saveSession(sessionToSave);

      // Show reward screen right away — video uploads in background
      setShowReward(true);
      setSaving(false);

      // ── Background tasks (fire-and-forget) ──────────────────────────

      // Upload video in background, then patch session with video_url
      persistRecordedSessionVideo({
        videoBlob: rawData.videoBlob || null,
        recordedChunks: rawData.recordedChunks || [],
        mimeType: rawData.recordingMimeType || 'video/webm',
        sessionId: saved?.session_id || savedSession.session_id,
      }).then(persistedVideo => {
        if (persistedVideo?.fileUrl) {
          updateSession(saved?.session_id || savedSession.session_id, {
            video_url: persistedVideo.fileUrl,
          }).catch(() => {});
        }
      }).catch(() => {});

      // Enrich with learning data
      processSessionLearning({
        ...sessionToSave,
        reps: rawData.reps ?? [],
      }).then(enriched => {
        if (enriched?.learning && saved?._cloud_id) {
          updateSession(saved.session_id, { learning: enriched.learning }).catch(() => {});
        }
      }).catch(() => {});

      // Achievements, points, faults, streak — all fire-and-forget
      checkAndAwardAchievements().catch(() => {});
      awardSessionPoints(sessionToSave).catch(() => {});
      const faults = (sessionToSave.top_faults || []).map(f => ({ id: f, name: f }));
      updateFaultHistory(sessionToSave.exercise_id, faults).catch(() => {});
      checkForImprovements(sessionToSave.exercise_id, faults.map(f => f.id)).catch(() => {});
      recordSession().catch(() => {});

      // AI narrative
      getSessionNarrative(sessionToSave).then(narrative => {
        if (narrative) updateSession(saved?.session_id || savedSession.session_id, { ai_narrative: narrative });
      }).catch(() => {});

    } catch (err) {
      console.error('[LiveSession] handleSave error:', err);
      saveSession(savedSession).catch(() => {});
      setShowReward(true);
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