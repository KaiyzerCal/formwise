import React, { useState, useEffect } from "react";
import { getExerciseById, EXERCISES } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import CameraView from "../components/bioneer/CameraView";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import SessionSummary from "../components/bioneer/SessionSummary";

export default function LiveSession() {
  const [phase, setPhase] = useState("select");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exId = params.get("exercise");
    if (exId) {
      const ex = getExerciseById(exId) || getSportsMovementById(exId);
      if (ex) {
        setSelectedExercise(ex);
        setPhase("camera");
      }
    }
  }, []);

  const handleStart = (movement) => {
    setSelectedExercise(movement);
    setPhase("camera");
  };

  const handleStop = (data) => {
    setSessionData(data);
    setPhase("summary");
  };

  const handleDiscard = () => {
    setSessionData(null);
    setSelectedExercise(null);
    setPhase("select");
  };

  if (phase === "camera" && selectedExercise) {
    return <CameraView exercise={selectedExercise} onStop={handleStop} />;
  }

  if (phase === "summary" && sessionData) {
    return (
      <SessionSummary
        sessionData={sessionData}
        onSave={handleDiscard}
        onDiscard={handleDiscard}
        saving={false}
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