import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { EXERCISES, getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import CameraView from "../components/bioneer/CameraView";
import SessionSummary from "../components/bioneer/SessionSummary";
import GhostReplay from "../components/bioneer/GhostReplay";
import Disclaimer from "../components/bioneer/Disclaimer";

const DISCLAIMER_KEY = "bioneer_disclaimer_accepted";

export default function FormCheck() {
  const [phase, setPhase] = useState("select"); // select | camera | summary | replay
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [replayData, setReplayData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!accepted) setShowDisclaimer(true);

    // Check URL params for exercise pre-selection
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
    setPhase("camera");
  };

  const handleStopSession = (data) => {
    setSessionData(data);
    setPhase("summary");
  };

  const handleSave = async () => {
    setSaving(true);
    const { exercise_def, joint_data, _replay, ...saveable } = sessionData;
    await base44.entities.FormSession.create(saveable);
    setSaving(false);
    setPhase("select");
    setSessionData(null);
    setReplayData(null);
  };

  const handleDiscard = () => {
    setPhase("select");
    setSessionData(null);
    setReplayData(null);
  };

  const handleOpenReplay = () => {
    if (sessionData?._replay) {
      setReplayData(sessionData._replay);
      setPhase("replay");
    }
  };

  const handleReplaySave = async () => {
    await handleSave();
  };

  const handleReplayDone = () => {
    setPhase("select");
    setSessionData(null);
    setReplayData(null);
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