import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { EXERCISES, getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import CameraView from "../components/bioneer/CameraView";
import SessionSummary from "../components/bioneer/SessionSummary";
import Disclaimer from "../components/bioneer/Disclaimer";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useSessionLearning } from "../components/bioneer/learning/useSessionLearning";
import FirstLaunchWizard, { hasCompletedOnboarding } from "../components/bioneer/onboarding/FirstLaunchWizard";
import { useSubscription, incrementWeeklySession } from "../lib/subscriptionGate";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";

const DISCLAIMER_KEY = "bioneer_disclaimer_accepted";

export default function FormCheck() {
  const [phase, setPhase] = useState("select"); // select | camera | summary
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const { processSessionLearning } = useSessionLearning();
  const { tier, weeklySessionsRemaining } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!accepted) setShowDisclaimer(true);
    else if (!hasCompletedOnboarding()) setShowWizard(true);

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
    if (!hasCompletedOnboarding()) setShowWizard(true);
  };

  const handleStartAnalysis = (movement) => {
    const ex = movement || selectedExercise;
    if (!ex) return;
    // Free tier session gate
    if (tier === 'free' && weeklySessionsRemaining === 0) {
      navigate('/Paywall');
      return;
    }
    if (tier === 'free') incrementWeeklySession();
    // Prevent double-start by ensuring clean state
    setSessionData(null);
    setSelectedExercise(ex);
    setPhase("camera");
  };

  const handleStopSession = (data) => {
    setSessionData(data);
    setPhase("summary");
  };

  const handleSave = async () => {
    setSaving(true);
    const { exercise_def, joint_data, reps, ...saveable } = sessionData;
    
    // Enrich session data with analytics fields for storage
    const exercise = selectedExercise || exercise_def || {};
    const enrichedData = {
      ...saveable,
      // Map exercise ID to normalized movement name
      movement_id: saveable.exercise_id || exercise.id,
      movement_name: exercise.displayName || exercise.name || saveable.exercise_id,
      // Core analytics fields (for selectors)
      rep_count: saveable.reps_detected || 0,
      average_form_score: Math.max(0, Math.min(100, saveable.form_score_overall || saveable.movement_score || 0)),
      highest_form_score: Math.max(0, Math.min(100, saveable.form_score_peak || saveable.form_score_overall || 0)),
      lowest_form_score: Math.max(0, Math.min(100, saveable.form_score_lowest || 0)),
      // Mastery-derived
      mastery_avg: reps?.length
        ? Math.round(
            reps
              .map(r => r.score)
              .filter(s => s != null && !isNaN(s))
              .reduce((a, b) => a + b, 0) / reps.length
          )
        : Math.max(0, Math.min(100, saveable.form_score_overall || 0)),
      // Tracking and fault data
      top_faults: (saveable.alerts || [])
        .map(a => a.joint)
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .slice(0, 3),
      risk_flags: [],
      body_side_bias: 'balanced',
      tracking_confidence: 75,
      // Session metadata
      session_status: 'complete',
      started_at: new Date().toISOString(),
    };

    try {
      await base44.entities.FormSession.create(enrichedData);
      // Non-blocking: run adaptive learning pipeline after save
      processSessionLearning({
        movement: enrichedData.movement_id,
        reps: reps ?? [],
        formScore: enrichedData.average_form_score,
        faults: enrichedData.top_faults,
        duration: enrichedData.duration_seconds,
        repSummaries: sessionData?.rep_summaries ?? [],
      }).catch(err => console.warn('[FormCheck] Learning pipeline error:', err));
    } catch (err) {
      console.warn('[FormCheck] Save error:', err);
    } finally {
      setSaving(false);
      setPhase("select");
      setSessionData(null);
    }
  };

  const handleDiscard = () => {
    setPhase("select");
    setSessionData(null);
    // Clear any stale refs
    setSelectedExercise(null);
  };

  if (showDisclaimer) {
    return <Disclaimer onAccept={handleAcceptDisclaimer} />;
  }

  if (showWizard) {
    return <FirstLaunchWizard onComplete={() => setShowWizard(false)} />;
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

  // Movement library selection screen — with free tier banner
  return (
    <div className="flex flex-col h-full">
      {tier === 'free' && (
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-b"
          style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.2)', fontFamily: FONT.mono }}>
          <span className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ color: '#f59e0b' }}>
            {weeklySessionsRemaining} OF {3} FREE SESSIONS THIS WEEK
          </span>
          <button onClick={() => navigate('/Paywall')}
            className="text-[9px] font-bold tracking-[0.12em] uppercase underline"
            style={{ color: COLORS.gold }}>
            UPGRADE
          </button>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <MovementLibrary
          selectedId={selectedExercise?.id}
          onSelect={handleStartAnalysis}
        />
      </div>
    </div>
  );
}