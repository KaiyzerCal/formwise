import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import CameraView from "../components/bioneer/CameraView";
import SessionSummary from "../components/bioneer/SessionSummary";
import Disclaimer from "../components/bioneer/Disclaimer";
import { normalizeSession, sessionSaveMessage } from "../components/bioneer/data/sessionNormalizer";
import { saveSession } from "../components/bioneer/data/sessionStore";

const DISCLAIMER_KEY = "bioneer_disclaimer_accepted";

export default function FormCheck() {
  const [phase, setPhase] = useState("select");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const sessionStartRef = useRef(null);

  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!accepted) setShowDisclaimer(true);

    const params = new URLSearchParams(window.location.search);
    const exId = params.get("exercise");
    if (exId) {
      const ex = getExerciseById(exId) || getSportsMovementById(exId);
      if (ex) setSelectedExercise(ex);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setShowDisclaimer(false);
  };

  const handleStartAnalysis = (movement) => {
    const ex = movement || selectedExercise;
    if (!ex) return;
    setSelectedExercise(ex);
    sessionStartRef.current = Date.now();
    setPhase("camera");
  };

  const handleStopSession = (rawData) => {
    const session = normalizeSession(rawData, {
      movementName: selectedExercise?.name,
      category: selectedExercise?.category,
      startedAt: sessionStartRef.current ?? Date.now(),
    });
    setSavedSession(session);
    setSessionData({ ...rawData, _canonicalSession: session });
    setPhase("summary");
  };

  const handleSave = async () => {
    if (!savedSession) { handleDiscard(); return; }
    setSaving(true);
    // Save to localStorage analytics store
    saveSession(savedSession);
    // Also persist to backend entity (strip non-serializable fields)
    const { exercise_def, joint_data, ...saveable } = sessionData;
    try { await base44.entities.FormSession.create(saveable); } catch (_) {}
    setSaving(false);
    handleDiscard();
  };

  const handleDiscard = () => {
    setPhase("select");
    setSessionData(null);
    setSavedSession(null);
    sessionStartRef.current = null;
  };

  if (showDisclaimer) {
    return <Disclaimer onAccept={handleAcceptDisclaimer} />;
  }

  if (phase === "camera" && selectedExercise) {
    return <CameraView exercise={selectedExercise} onStop={handleStopSession} />;
  }

  if (phase === "summary" && sessionData) {
    return (
      <SessionSummary
        sessionData={sessionData}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
      />
    );
  }

  // Movement library selection screen
  return (
    <MovementLibrary
      selectedId={selectedExercise?.id}
      onSelect={handleStartAnalysis}
    />
  );
}