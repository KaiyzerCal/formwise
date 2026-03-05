import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { EXERCISES, getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import CameraView from "../components/bioneer/CameraView";
import SessionSummary from "../components/bioneer/SessionSummary";
import Disclaimer from "../components/bioneer/Disclaimer";
import { createPageUrl } from "@/utils";

const DISCLAIMER_KEY = "bioneer_disclaimer_accepted";

export default function FormCheck() {
  const [phase, setPhase] = useState("select"); // select | camera | summary
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
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
    await base44.entities.FormSession.create(sessionData);
    setSaving(false);
    setPhase("select");
    setSessionData(null);
  };

  const handleDiscard = () => {
    setPhase("select");
    setSessionData(null);
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

  // Exercise selection screen
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div className="flex-1">
            <h1
              className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Form Intelligence
            </h1>
            <p className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5"
               style={{ fontFamily: "'DM Mono', monospace" }}>
              Select exercise to analyze
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
            <Scan className="w-4 h-4 text-[#C9A84C]" />
          </div>
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {EXERCISES.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              selected={selectedExercise?.id === ex.id}
              onClick={() => setSelectedExercise(ex)}
            />
          ))}
        </div>

        {/* Selected exercise info */}
        {selectedExercise && (
          <div className="mt-6 rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                Tracking points
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedExercise.joints.map((j) => (
                <span
                  key={j.label}
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/60 font-medium tracking-wider"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {j.label}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-white/25 mt-3 tracking-wide"
               style={{ fontFamily: "'DM Mono', monospace" }}>
              Camera: {selectedExercise.camera} view recommended
            </p>
          </div>
        )}

        {/* Start CTA */}
        <button
          onClick={handleStartAnalysis}
          disabled={!selectedExercise}
          className={`
            w-full mt-6 py-4 rounded-xl font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300
            ${
              selectedExercise
                ? "bg-[#C9A84C] text-black hover:bg-[#b8943f] shadow-[0_0_30px_rgba(201,168,76,0.2)]"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }
          `}
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {selectedExercise ? "START ANALYSIS" : "SELECT EXERCISE"}
        </button>

        {/* Privacy note */}
        <p className="text-center text-[9px] text-white/15 mt-4 tracking-wider"
           style={{ fontFamily: "'DM Mono', monospace" }}>
          Camera data is processed locally. Nothing is recorded or uploaded.
        </p>
      </div>
    </div>
  );
}