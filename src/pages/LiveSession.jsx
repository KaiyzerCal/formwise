import React, { useState, useEffect, useRef } from "react";
import { getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import CameraView from "../components/bioneer/CameraView";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import SessionSummary from "../components/bioneer/SessionSummary";
import { normalizeSession, sessionSaveMessage } from "../components/bioneer/data/sessionNormalizer";
import { saveSession } from "../components/bioneer/data/sessionStore";
import { getMovementProfile } from "../components/bioneer/movementProfiles/movementProfiles";
import MovementSelector from "../components/bioneer/movementProfiles/MovementSelector";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";

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
      if (ex) { setSelectedExercise(ex); setPhase("camera"); }
    }
  }, []);

  const handleStart = (movement) => {
    setSelectedExercise(movement);
    sessionStartRef.current = Date.now();
    setPhase("camera");
  };

  const handleStop = (rawData) => {
    // Normalize into canonical schema
    const session = normalizeSession(rawData, {
      movementName: selectedExercise?.name,
      category: selectedExercise?.category,
      startedAt: sessionStartRef.current ?? Date.now(),
    });
    setSavedSession(session);
    // Pass raw data to summary for existing UI (joint_data, exercise_def, etc.)
    setSessionData({ ...rawData, _canonicalSession: session });
    setPhase("summary");
  };

  const handleSave = () => {
    if (!savedSession) { handleDiscard(); return; }
    setSaving(true);
    // Save to store (sync, instant)
    saveSession(savedSession);
    setSaving(false);
    handleDiscard();
  };

  const handleDiscard = () => {
    setSessionData(null);
    setSavedSession(null);
    setSelectedExercise(null);
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

  return (
    <MovementLibrary
      selectedId={selectedExercise?.id}
      onSelect={handleStart}
    />
  );
}