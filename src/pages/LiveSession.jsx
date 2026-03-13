import React, { useState, useEffect, useRef } from "react";
import { getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import CameraView from "../components/bioneer/CameraView";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import SessionSummary from "../components/bioneer/SessionSummary";
import { normalizeSession, sessionSaveMessage } from "../components/bioneer/data/sessionNormalizer";
import { saveSession } from "../components/bioneer/data/sessionStore";
import { saveLiveSessionVideo } from "../components/bioneer/history/sessionStorage";
import { getMovementProfile } from "../components/bioneer/movementProfiles/movementProfiles";
import { COLORS } from "../components/bioneer/ui/DesignTokens";

export default function LiveSession() {
  const [phase, setPhase] = useState("select");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedMovementId, setSelectedMovementId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const sessionStartRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exId = params.get("exercise");
    if (exId) {
      const ex = getExerciseById(exId) || getSportsMovementById(exId);
      if (ex) {
        const profile = getMovementProfile(ex.id);
        setSelectedExercise(ex);
        setSelectedMovementId(profile ? ex.id : null);
        sessionStartRef.current = Date.now();
        setPhase("camera");
      }
    }
  }, []);

  const handleStart = (movement) => {
    setSelectedExercise(movement);
    sessionStartRef.current = Date.now();
    // Auto-resolve movement profile from exercise — no user-facing selection step
    const profile = getMovementProfile(movement.id);
    setSelectedMovementId(profile ? movement.id : null);
    setPhase("camera");
  };

  const handleStop = (rawData) => {
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
    // Keep videoBlob in rawData so handleSave can persist it
    setSessionData({ ...rawData, _canonicalSession: session, movementProfile });
    setPhase("summary");
  };

  const handleSave = async () => {
    if (!savedSession) { handleDiscard(); return; }
    setSaving(true);

    // Persist video blob to IndexedDB (live session store) BEFORE saving metadata
    let videoStorageKey = null;
    let videoSrc = null;
    const rawData = sessionData;
    if (rawData?.videoBlob instanceof Blob && rawData.videoBlob.size > 0) {
      try {
        const persisted = await saveLiveSessionVideo({
          sessionId: savedSession.session_id,
          videoBlob: rawData.videoBlob,
          poseFrames: rawData.poseFrames ?? [],
          angleFrames: rawData.angleFrames ?? [],
        });
        if (persisted) {
          videoStorageKey = savedSession.session_id;
          videoSrc = persisted.videoSrc;
        }
      } catch (err) {
        console.warn('[LiveSession] Video persist failed — saving metadata only:', err);
      }
    } else {
      console.warn('[LiveSession] No video blob available for session', savedSession.session_id);
    }

    // Attach video reference to canonical session record
    const sessionWithVideo = {
      ...savedSession,
      videoStorageKey,
      videoSrc,  // object URL valid for this page session; hydrated from IDB on reload
      hasVideo: !!videoStorageKey,
    };

    saveSession(sessionWithVideo);
    setSaving(false);
    handleDiscard();
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

  // Select phase — movement library only, profile resolved silently on selection
  return (
    <div className="flex flex-col h-screen" style={{ background: COLORS.bg }}>
      <MovementLibrary
        selectedId={selectedExercise?.id}
        onSelect={handleStart}
      />
    </div>
  );
}